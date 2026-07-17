export class QuizManager {
  constructor(tier, basePath) {
    this.tier = tier;
    this.basePath = basePath;
    this.bank = [];
    this.usedIndices = new Set();
  }

  async load() {
    const file = this.tier === 'highschool' ? 'questions-highschool.json' : 'questions-grade5.json';
    const res = await fetch(`${this.basePath}js/data/${file}`);
    this.bank = await res.json();
  }

  next() {
    if (this.bank.length === 0) return null;
    if (this.usedIndices.size >= this.bank.length) this.usedIndices.clear();
    let idx;
    do {
      idx = Math.floor(Math.random() * this.bank.length);
    } while (this.usedIndices.has(idx));
    this.usedIndices.add(idx);
    return this.bank[idx];
  }
}
