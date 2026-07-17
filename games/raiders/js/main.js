import { TILE, TILE_SIZE, TOTAL_LEVELS, MAX_QUIZ_TRIES, SPELL_COOLDOWN, SPELL_DAMAGE, SPELL_RANGE, SHOP_ITEMS, COLORS } from './config.js';
import { GameLoop } from './engine/loop.js';
import { Input } from './engine/input.js';
import { Renderer } from './engine/renderer.js';
import { AssetLoader } from './engine/assets.js';
import { generateDungeon } from './world/dungeon.js';
import { Player } from './entities/player.js';
import { Enemy } from './entities/enemy.js';
import { FogOfWar } from './systems/fov.js';
import { ParticleSystem } from './systems/particles.js';
import { resolvePlayerAttack, resolveEnemyAttack, enemyAt, drawHealthBar } from './systems/combat.js';
import { QuizManager } from './systems/quiz.js';
import { SaveManager } from './save/saveManager.js';
import { UI } from './ui/ui.js';

const BASE_PATH = '/games/raiders/';

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new Renderer(this.canvas);
    this.input = new Input();
    this.assets = new AssetLoader(`${BASE_PATH}assets/`);
    this.ui = new UI();
    this.save = new SaveManager();
    this.loop = new GameLoop(this.update.bind(this), this.render.bind(this));

    this.state = 'boot';
    this.ageTier = null;
    this.levelIndex = 0;
    this.stemCorrect = 0;
    this.stemTotal = 0;
    this.loot = 0;
    this.chestOpened = false;
    this.quiz = null;
    this.lootPickups = [];
    this.shopPos = null;

    this.currentQuestion = null;
    this.quizDisabled = new Set();
    this.quizTriesLeft = MAX_QUIZ_TRIES;
  }

  async boot() {
    this.ui.showDM(() => this.ui.showTitle((tier) => this.startRun(tier)));
    await this.assets.loadAll();
    this.ui.setDMReady();
    this.loop.start();
  }

  async startRun(tier, { carryLoot = 0 } = {}) {
    this.ageTier = tier;
    this.levelIndex = 0;
    this.stemCorrect = 0;
    this.stemTotal = 0;
    this.loot = carryLoot;
    this.quiz = new QuizManager(tier, BASE_PATH);
    await this.quiz.load();
    this.player = null;
    this.loadLevel(0, { freshPlayer: true });
    this.ui.showHud();
  }

  tryAgain() {
    this.startRun(this.ageTier, { carryLoot: this.loot });
  }

  goToTown() {
    this.loot = 0;
    this.ui.showTitle((tier) => this.startRun(tier));
  }

  loadLevel(index, { freshPlayer = false } = {}) {
    const carriedHp = this.player ? this.player.hp : null;
    const carriedMax = this.player ? this.player.maxHp : null;
    const level = generateDungeon(index);
    this.tileMap = level.map;
    this.chestPos = level.chestPos;
    this.exitPos = level.exitPos;
    this.chestOpened = false;

    this.player = new Player(level.playerStart.x, level.playerStart.y);
    if (!freshPlayer && carriedHp !== null) {
      this.player.maxHp = carriedMax;
      this.player.hp = Math.min(carriedMax, carriedHp + 1);
    }

    this.enemies = level.enemySpawns.map((s) => new Enemy(s.x, s.y, s.type));
    this.lootPickups = level.lootSpawns.map((p) => ({ x: p.x, y: p.y, collected: false }));
    this.shopPos = level.shopPos;
    this.fov = new FogOfWar(7);
    this.fov.update(this.tileMap, this.player.gridX, this.player.gridY);
    this.particles = new ParticleSystem();
    this.levelIndex = index;
    this.state = 'playing';
  }

  canWalk(gx, gy) {
    const t = this.tileMap.get(gx, gy);
    if (t === TILE.EXIT) return this.chestOpened;
    return this.tileMap.isWalkable(gx, gy);
  }

  handlePlayerMove(dt) {
    const player = this.player;
    if (player.attackCooldown > 0) player.attackCooldown -= dt;
    if (player.moving) return;

    const v = this.input.moveVector;
    let dx = 0, dy = 0;
    if (v.x !== 0) dx = v.x;
    else if (v.y !== 0) dy = v.y;
    if (dx === 0 && dy === 0) return;

    const nx = player.gridX + dx;
    const ny = player.gridY + dy;

    const target = enemyAt(this.enemies, nx, ny);
    if (target) {
      if (player.attackCooldown > 0) return;
      player.attackCooldown = 0.32;
      if (nx < player.gridX) player.facingLeft = true;
      if (nx > player.gridX) player.facingLeft = false;
      resolvePlayerAttack(player, target, this.particles);
      return;
    }

    if (!this.canWalk(nx, ny)) return;

    const wasChest = this.tileMap.get(nx, ny) === TILE.CHEST && !this.chestOpened;
    const enteringShop = this.shopPos && nx === this.shopPos.x && ny === this.shopPos.y;
    player.startMoveTo(nx, ny);
    if (wasChest) this.triggerQuiz();
    else if (enteringShop) this.openShop();
  }

  handlePlayerSpell(dt, spellKeyPressed) {
    const player = this.player;
    if (player.spellCooldown > 0) player.spellCooldown = Math.max(0, player.spellCooldown - dt);
    if (!spellKeyPressed || player.spellCooldown > 0) return;
    player.spellCooldown = SPELL_COOLDOWN;

    let target = null;
    let bestDist = Infinity;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (this.fov.stateAt(e.gridX, e.gridY) !== 'visible') continue;
      const d = Math.hypot(e.gridX - player.gridX, e.gridY - player.gridY);
      if (d <= SPELL_RANGE && d < bestDist) { bestDist = d; target = e; }
    }

    const start = player.centerPx;
    if (target) {
      const end = target.centerPx;
      for (let i = 1; i <= 4; i++) {
        const t = i / 5;
        this.particles.burst(
          start.x + (end.x - start.x) * t,
          start.y + (end.y - start.y) * t,
          COLORS.purple, 3, { life: 0.25, speed: 15 }
        );
      }
      this.particles.burst(end.x, end.y, COLORS.cyan, 16, { life: 0.5, speed: 100 });
      target.takeDamage(SPELL_DAMAGE);
    } else {
      const fx = start.x + (player.facingLeft ? -22 : 22);
      this.particles.burst(fx, start.y, COLORS.purple, 6, { life: 0.3, speed: 40 });
    }
  }

  openShop() {
    this.state = 'shop';
    this.refreshShop();
  }

  refreshShop() {
    this.ui.showShop(this.loot, SHOP_ITEMS, (id) => this.handleShopBuy(id), () => this.closeShop());
  }

  handleShopBuy(id) {
    const item = SHOP_ITEMS.find((i) => i.id === id);
    if (!item || this.loot < item.cost) return;
    this.loot -= item.cost;
    if (item.id === 'heal') {
      this.player.hp = this.player.maxHp;
    } else if (item.id === 'maxhp') {
      this.player.maxHp += 1;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
    } else if (item.id === 'attack') {
      this.player.attack += 1;
    }
    this.refreshShop();
  }

  closeShop() {
    this.ui.hideShop();
    this.state = 'playing';
  }

  collectLoot() {
    const p = this.player;
    for (const pickup of this.lootPickups) {
      if (pickup.collected || pickup.x !== p.gridX || pickup.y !== p.gridY) continue;
      pickup.collected = true;
      this.loot += 1;
      const wx = pickup.x * TILE_SIZE + TILE_SIZE / 2;
      const wy = pickup.y * TILE_SIZE + TILE_SIZE / 2;
      this.particles.burst(wx, wy, COLORS.yellow, 8, { life: 0.4, speed: 70 });
    }
  }

  triggerQuiz() {
    this.state = 'quiz';
    this.currentQuestion = this.quiz.next();
    this.quizDisabled = new Set();
    this.quizTriesLeft = MAX_QUIZ_TRIES;
    this.renderQuizAttempt();
  }

  renderQuizAttempt() {
    this.ui.showQuizAttempt(
      this.currentQuestion,
      this.quizDisabled,
      this.quizTriesLeft,
      MAX_QUIZ_TRIES,
      (idx) => this.handleQuizChoice(idx)
    );
  }

  handleQuizChoice(idx) {
    const correct = idx === this.currentQuestion.answer;

    if (correct) {
      this.stemTotal += 1;
      this.stemCorrect += 1;
      this.chestOpened = true;
      this.ui.showQuizFeedback(true, null);
      setTimeout(() => {
        this.ui.hideQuiz();
        this.state = 'playing';
      }, 1200);
      return;
    }

    this.quizDisabled.add(idx);
    this.quizTriesLeft -= 1;

    if (this.quizTriesLeft > 0) {
      this.ui.showQuizFeedback(false, null);
      setTimeout(() => this.renderQuizAttempt(), 900);
    } else {
      this.stemTotal += 1;
      this.ui.showQuizFeedback(false, this.currentQuestion.answer);
      setTimeout(() => {
        this.ui.hideQuiz();
        this.gameOver('riddle-fail');
      }, 1600);
    }
  }

  handleExit() {
    const p = this.player;
    if (p.gridX === this.exitPos.x && p.gridY === this.exitPos.y && this.chestOpened) {
      this.checkpoint();
      if (this.levelIndex + 1 >= TOTAL_LEVELS) {
        this.state = 'win';
        this.ui.showEnd('win', {
          levelIndex: this.levelIndex,
          totalLevels: TOTAL_LEVELS,
          stemCorrect: this.stemCorrect,
          stemTotal: this.stemTotal,
          loot: this.loot,
        }, { onRestart: () => this.ui.showTitle((tier) => this.startRun(tier)) });
      } else {
        this.loadLevel(this.levelIndex + 1);
        this.ui.showHud();
      }
    }
  }

  checkpoint() {
    this.save.save({
      ageTier: this.ageTier,
      levelIndex: this.levelIndex,
      playerHp: this.player.hp,
      playerMaxHp: this.player.maxHp,
      correctAnswers: this.stemCorrect,
      totalQuestions: this.stemTotal,
    });
  }

  gameOver(reason) {
    this.state = 'gameover';
    this.checkpoint();
    this.ui.showEnd(reason, {
      levelIndex: this.levelIndex,
      totalLevels: TOTAL_LEVELS,
      stemCorrect: this.stemCorrect,
      stemTotal: this.stemTotal,
      loot: this.loot,
    }, {
      onTryAgain: () => this.tryAgain(),
      onTown: () => this.goToTown(),
    });
  }

  update(dt) {
    const spellKeyPressed = this.input.wasPressed('Space');
    this.input.endFrame();
    if (this.state !== 'playing') return;

    this.handlePlayerMove(dt);
    this.player.update(dt);
    if (this.state !== 'playing') return;
    this.handlePlayerSpell(dt, spellKeyPressed);
    this.fov.update(this.tileMap, this.player.gridX, this.player.gridY);
    this.collectLoot();

    const occupied = new Set();
    for (const e of this.enemies) if (e.alive) occupied.add(`${e.gridX},${e.gridY}`);

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      occupied.delete(`${enemy.gridX},${enemy.gridY}`);
      const result = enemy.aiTick(dt, this.tileMap, this.player, occupied);
      occupied.add(`${enemy.gridX},${enemy.gridY}`);
      if (result === 'attack') resolveEnemyAttack(enemy, this.player, this.particles);
      enemy.update(dt);
    }

    this.particles.update(dt);
    this.handleExit();

    if (!this.player.alive) {
      this.gameOver('death');
      return;
    }

    this.ui.updateHud(this.player, this.levelIndex, TOTAL_LEVELS, this.stemCorrect, this.stemTotal, this.loot);
    this.ui.updateSpellHud(this.player.spellCooldown);
  }

  renderTiles() {
    const cam = this.renderer.camera;
    const startX = Math.max(0, Math.floor(cam.x / TILE_SIZE) - 1);
    const startY = Math.max(0, Math.floor(cam.y / TILE_SIZE) - 1);
    const endX = Math.min(this.tileMap.w, startX + Math.ceil(this.canvas.width / TILE_SIZE) + 2);
    const endY = Math.min(this.tileMap.h, startY + Math.ceil(this.canvas.height / TILE_SIZE) + 2);

    const floorImg = this.assets.get('tile_floor');
    const wallImg = this.assets.get('tile_wall');
    const chestClosed = this.assets.get('chest_closed');
    const chestOpen = this.assets.get('chest_open');
    const exitImg = this.assets.get('exit_portal');

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const t = this.tileMap.get(x, y);
        if (t === TILE.VOID) continue;
        const vis = this.fov.stateAt(x, y);
        if (vis === 'hidden') continue;
        const wx = x * TILE_SIZE, wy = y * TILE_SIZE;

        if (t === TILE.WALL) this.renderer.drawSprite(wallImg, wx, wy);
        else {
          this.renderer.drawSprite(floorImg, wx, wy);
          if (t === TILE.CHEST) this.renderer.drawSprite(this.chestOpened ? chestOpen : chestClosed, wx, wy);
          if (t === TILE.EXIT) this.renderer.drawSprite(exitImg, wx, wy, { alpha: this.chestOpened ? 1 : 0.35 });
        }

        if (vis === 'discovered') this.renderer.fillTile(wx, wy, '#000', 0.55);
      }
    }

    const gemImg = this.assets.get('loot_gem');
    for (const pickup of this.lootPickups) {
      if (pickup.collected) continue;
      if (this.fov.stateAt(pickup.x, pickup.y) !== 'visible') continue;
      this.renderer.drawSprite(gemImg, pickup.x * TILE_SIZE, pickup.y * TILE_SIZE);
    }

    if (this.shopPos && this.fov.stateAt(this.shopPos.x, this.shopPos.y) !== 'hidden') {
      this.renderer.drawSprite(this.assets.get('shopkeeper'), this.shopPos.x * TILE_SIZE, this.shopPos.y * TILE_SIZE);
    }
  }

  render() {
    this.renderer.clear();
    if (this.state === 'boot') return;

    this.renderer.followCamera(
      this.player.centerPx,
      this.tileMap.w * TILE_SIZE,
      this.tileMap.h * TILE_SIZE
    );

    this.renderTiles();

    const visibleEnemies = this.enemies.filter(
      (e) => e.alive && this.fov.stateAt(e.gridX, e.gridY) === 'visible'
    );
    const drawables = [...visibleEnemies, this.player].sort((a, b) => a.pixelY - b.pixelY);
    for (const d of drawables) {
      d.render(this.renderer, this.assets);
      drawHealthBar(this.renderer, d);
    }

    this.particles.render(this.renderer);

    if (!this.chestOpened) {
      this.renderer.text('RIDDLE LOCKED', this.chestPos.x * TILE_SIZE + TILE_SIZE / 2, this.chestPos.y * TILE_SIZE - 8, {
        color: COLORS.yellow, glow: COLORS.yellow, font: '10px "Share Tech Mono", monospace',
      });
    }
  }
}

const game = new Game();
game.boot();
