import { STORAGE_KEY } from '../config.js';

/**
 * Persistence framework for Raiders of the Lost Dungeon.
 *
 * Not wired to any UI yet ("Continue" is intentionally absent from the
 * title screen) — this exists so progress-saving can be turned on later
 * without redesigning the data model. save() is currently called at
 * level-complete and game-over checkpoints in main.js so the schema
 * stays exercised and correct as the game grows.
 */
export class SaveManager {
  save(state) {
    try {
      const payload = {
        version: 1,
        savedAt: Date.now(),
        ageTier: state.ageTier,
        levelIndex: state.levelIndex,
        playerHp: state.playerHp,
        playerMaxHp: state.playerMaxHp,
        correctAnswers: state.correctAnswers,
        totalQuestions: state.totalQuestions,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch (err) {
      return false;
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      /* ignore */
    }
  }

  hasSave() {
    return this.load() !== null;
  }
}
