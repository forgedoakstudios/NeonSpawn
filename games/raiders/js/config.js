export const TILE_SIZE = 48;
export const VIEW_TILES_X = 25;
export const VIEW_TILES_Y = 18;
export const VIEW_W = TILE_SIZE * VIEW_TILES_X;
export const VIEW_H = TILE_SIZE * VIEW_TILES_Y;

export const DUNGEON_W = 44;
export const DUNGEON_H = 34;

export const TOTAL_LEVELS = 3;
export const MAX_QUIZ_TRIES = 3;
export const LOOT_PER_LEVEL = 4;

export const SPELL_COOLDOWN = 1.6;
export const SPELL_DAMAGE = 2;
export const SPELL_RANGE = 5;

export const SHOP_ITEMS = [
  { id: 'heal', name: 'Healing Draught', desc: 'Restore to full HP', cost: 3 },
  { id: 'maxhp', name: 'Vitality Charm', desc: '+1 Max HP (and heal 1)', cost: 5 },
  { id: 'attack', name: 'Sharpening Stone', desc: '+1 Attack', cost: 6 },
];

export const COLORS = {
  pink:   '#FF2D78',
  cyan:   '#00FFD1',
  purple: '#9B30FF',
  yellow: '#FFE600',
  dark:   '#06060F',
  panel:  '#0D0D1F',
  edge:   '#1A1A35',
  text:   '#E8E0F0',
  muted:  '#6A6080',
  red:    '#FF3355',
  green:  '#3CFF8A',
};

export const TILE = {
  VOID: 0,
  FLOOR: 1,
  WALL: 2,
  DOOR: 3,
  CHEST: 4,
  EXIT: 5,
};

export const STORAGE_KEY = 'raiders-of-the-lost-dungeon:save';
