import { TILE, DUNGEON_W, DUNGEON_H, LOOT_PER_LEVEL } from '../config.js';
import { TileMap } from './tile.js';

class Room {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
  get centerX() { return Math.floor(this.x + this.w / 2); }
  get centerY() { return Math.floor(this.y + this.h / 2); }
  intersects(other, pad = 1) {
    return (
      this.x - pad < other.x + other.w &&
      this.x + this.w + pad > other.x &&
      this.y - pad < other.y + other.h &&
      this.y + this.h + pad > other.y
    );
  }
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function carveRoom(map, room) {
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      map.set(x, y, TILE.FLOOR);
    }
  }
}

function carveCorridor(map, x1, y1, x2, y2) {
  let x = x1, y = y1;
  const horizontalFirst = Math.random() < 0.5;
  const stepX = () => { while (x !== x2) { map.set(x, y, TILE.FLOOR); x += x < x2 ? 1 : -1; } };
  const stepY = () => { while (y !== y2) { map.set(x, y, TILE.FLOOR); y += y < y2 ? 1 : -1; } };
  if (horizontalFirst) { stepX(); stepY(); } else { stepY(); stepX(); }
  map.set(x2, y2, TILE.FLOOR);
}

function wallOutline(map) {
  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      if (map.get(x, y) !== TILE.FLOOR) continue;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (!map.inBounds(nx, ny)) continue;
          if (map.get(nx, ny) === TILE.VOID) map.set(nx, ny, TILE.WALL);
        }
      }
    }
  }
}

export function generateDungeon(levelIndex) {
  const map = new TileMap(DUNGEON_W, DUNGEON_H);
  const roomCount = 7 + levelIndex * 2;
  const rooms = [];

  let attempts = 0;
  while (rooms.length < roomCount && attempts < 300) {
    attempts++;
    const w = randInt(5, 9);
    const h = randInt(4, 7);
    const x = randInt(1, DUNGEON_W - w - 2);
    const y = randInt(1, DUNGEON_H - h - 2);
    const room = new Room(x, y, w, h);
    if (rooms.some((r) => room.intersects(r, 2))) continue;
    rooms.push(room);
  }

  rooms.forEach((room, i) => {
    carveRoom(map, room);
    if (i > 0) {
      const prev = rooms[i - 1];
      carveCorridor(map, prev.centerX, prev.centerY, room.centerX, room.centerY);
    }
  });

  wallOutline(map);

  const startRoom = rooms[0];
  let farthest = rooms[1] || rooms[0];
  let bestDist = -1;
  for (const r of rooms) {
    const d = Math.hypot(r.centerX - startRoom.centerX, r.centerY - startRoom.centerY);
    if (d > bestDist) { bestDist = d; farthest = r; }
  }

  map.set(farthest.centerX, farthest.centerY, TILE.CHEST);
  const exitX = Math.min(farthest.x + farthest.w - 1, farthest.centerX + 1);
  map.set(exitX, farthest.centerY, TILE.EXIT);

  const enemyRooms = rooms.filter((r) => r !== startRoom && r !== farthest);
  const enemyCount = Math.min(3 + levelIndex * 2, enemyRooms.length * 2);
  const enemySpawns = [];
  for (let i = 0; i < enemyCount; i++) {
    const room = enemyRooms[randInt(0, enemyRooms.length - 1)];
    if (!room) break;
    enemySpawns.push({
      x: randInt(room.x, room.x + room.w - 1),
      y: randInt(room.y, room.y + room.h - 1),
      type: Math.random() < 0.3 + levelIndex * 0.1 ? 'brute' : 'grunt',
    });
  }

  const lootRooms = rooms.filter((r) => r !== startRoom);
  const lootSpawns = [];
  for (let i = 0; i < LOOT_PER_LEVEL; i++) {
    const room = lootRooms[randInt(0, lootRooms.length - 1)];
    if (!room) break;
    const x = randInt(room.x, room.x + room.w - 1);
    const y = randInt(room.y, room.y + room.h - 1);
    if (map.get(x, y) !== TILE.FLOOR) continue;
    lootSpawns.push({ x, y });
  }

  return {
    map,
    rooms,
    playerStart: { x: startRoom.centerX, y: startRoom.centerY },
    chestPos: { x: farthest.centerX, y: farthest.centerY },
    exitPos: { x: exitX, y: farthest.centerY },
    enemySpawns,
    lootSpawns,
  };
}
