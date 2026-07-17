import { TILE, TILE_SIZE, TOTAL_LEVELS, COLORS } from './config.js';
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
    this.chestOpened = false;
    this.quiz = null;
  }

  async boot() {
    await this.assets.loadAll();
    this.ui.showTitle((tier) => this.startRun(tier));
    this.loop.start();
  }

  async startRun(tier) {
    this.ageTier = tier;
    this.levelIndex = 0;
    this.stemCorrect = 0;
    this.stemTotal = 0;
    this.quiz = new QuizManager(tier, BASE_PATH);
    await this.quiz.load();
    this.player = null;
    this.loadLevel(0, { freshPlayer: true });
    this.ui.showHud();
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
    player.startMoveTo(nx, ny);
    if (wasChest) this.triggerQuiz();
  }

  triggerQuiz() {
    this.state = 'quiz';
    const q = this.quiz.next();
    this.ui.showQuiz(q, (correct) => {
      this.stemTotal += 1;
      if (correct) this.stemCorrect += 1;
      this.chestOpened = true;
      this.state = 'playing';
    });
  }

  handleExit() {
    const p = this.player;
    if (p.gridX === this.exitPos.x && p.gridY === this.exitPos.y && this.chestOpened) {
      this.save.save({
        ageTier: this.ageTier,
        levelIndex: this.levelIndex,
        playerHp: this.player.hp,
        playerMaxHp: this.player.maxHp,
        correctAnswers: this.stemCorrect,
        totalQuestions: this.stemTotal,
      });
      if (this.levelIndex + 1 >= TOTAL_LEVELS) {
        this.state = 'win';
        this.ui.showEnd(true, {
          levelIndex: this.levelIndex,
          totalLevels: TOTAL_LEVELS,
          stemCorrect: this.stemCorrect,
          stemTotal: this.stemTotal,
        }, () => this.ui.showTitle((tier) => this.startRun(tier)));
      } else {
        this.loadLevel(this.levelIndex + 1);
        this.ui.showHud();
      }
    }
  }

  update(dt) {
    this.input.endFrame();
    if (this.state !== 'playing') return;

    this.handlePlayerMove(dt);
    this.player.update(dt);
    if (this.state !== 'playing') return;
    this.fov.update(this.tileMap, this.player.gridX, this.player.gridY);

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
      this.state = 'gameover';
      this.save.save({
        ageTier: this.ageTier,
        levelIndex: this.levelIndex,
        playerHp: 0,
        playerMaxHp: this.player.maxHp,
        correctAnswers: this.stemCorrect,
        totalQuestions: this.stemTotal,
      });
      this.ui.showEnd(false, {
        levelIndex: this.levelIndex,
        totalLevels: TOTAL_LEVELS,
        stemCorrect: this.stemCorrect,
        stemTotal: this.stemTotal,
      }, () => this.ui.showTitle((tier) => this.startRun(tier)));
      return;
    }

    this.ui.updateHud(this.player, this.levelIndex, TOTAL_LEVELS, this.stemCorrect, this.stemTotal);
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
      this.renderer.text('QUESTION LOCKED', this.chestPos.x * TILE_SIZE + TILE_SIZE / 2, this.chestPos.y * TILE_SIZE - 8, {
        color: COLORS.yellow, glow: COLORS.yellow, font: '10px "Share Tech Mono", monospace',
      });
    }
  }
}

const game = new Game();
game.boot();
