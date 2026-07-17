export class UI {
  constructor() {
    this.dmScreen = document.getElementById('dm-screen');
    this.dmEnterBtn = document.getElementById('dm-enter-btn');
    this.dmStatus = document.getElementById('dm-status');

    this.titleScreen = document.getElementById('title-screen');
    this.startBtn = document.getElementById('start-btn');
    this.ageButtons = Array.from(document.querySelectorAll('.age-btn'));

    this.hud = document.getElementById('hud');
    this.hudHearts = document.getElementById('hud-hearts');
    this.hudLevel = document.getElementById('hud-level');
    this.hudStem = document.getElementById('hud-stem');
    this.hudLoot = document.getElementById('hud-loot');

    this.quizModal = document.getElementById('quiz-modal');
    this.quizCategory = document.getElementById('quiz-category');
    this.quizTries = document.getElementById('quiz-tries');
    this.quizQuestion = document.getElementById('quiz-question');
    this.quizChoices = document.getElementById('quiz-choices');
    this.quizFeedback = document.getElementById('quiz-feedback');

    this.endScreen = document.getElementById('end-screen');
    this.endTitle = document.getElementById('end-title');
    this.endFlavor = document.getElementById('end-flavor');
    this.endStats = document.getElementById('end-stats');
    this.endWinActions = document.getElementById('end-win-actions');
    this.endLoseActions = document.getElementById('end-lose-actions');
    this.endRestartBtn = document.getElementById('end-restart-btn');
    this.endTryAgainBtn = document.getElementById('end-tryagain-btn');
    this.endTownBtn = document.getElementById('end-town-btn');

    this.selectedTier = null;
    this.ageButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.ageButtons.forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedTier = btn.dataset.tier;
        this.startBtn.disabled = false;
      });
    });
  }

  showDM(onEnter) {
    this.dmScreen.classList.remove('hidden');
    this.dmEnterBtn.disabled = true;
    this.dmStatus.textContent = 'The dungeon stirs...';
    this.dmEnterBtn.onclick = () => {
      this.dmScreen.classList.add('hidden');
      onEnter();
    };
  }

  setDMReady() {
    this.dmEnterBtn.disabled = false;
    this.dmStatus.textContent = 'It is ready for you.';
  }

  showTitle(onStart) {
    this.titleScreen.classList.remove('hidden');
    this.hud.classList.add('hidden');
    this.endScreen.classList.add('hidden');
    this.startBtn.disabled = !this.selectedTier;
    this.startBtn.onclick = () => {
      if (!this.selectedTier) return;
      this.titleScreen.classList.add('hidden');
      onStart(this.selectedTier);
    };
  }

  showHud() {
    this.hud.classList.remove('hidden');
  }

  updateHud(player, levelIndex, totalLevels, stemCorrect, stemTotal, loot) {
    this.hudHearts.innerHTML = '';
    for (let i = 0; i < player.maxHp; i++) {
      const heart = document.createElement('span');
      heart.className = 'hud-heart' + (i < player.hp ? '' : ' empty');
      heart.textContent = '◆';
      this.hudHearts.appendChild(heart);
    }
    this.hudLevel.textContent = `LEVEL ${levelIndex + 1} / ${totalLevels}`;
    this.hudStem.textContent = stemTotal > 0 ? `STEM ${stemCorrect}/${stemTotal}` : '';
    this.hudLoot.textContent = `◆ LOOT: ${loot}`;
  }

  /**
   * Renders one riddle attempt. `disabledIndices` marks choices already
   * proven wrong this riddle so they can't be picked again. `triesLeft`
   * drives the countdown display. onChoice(index) fires once per pick.
   */
  showQuizAttempt(question, disabledIndices, triesLeft, maxTries, onChoice) {
    this.quizModal.classList.remove('hidden');
    this.quizCategory.textContent = question.category.toUpperCase();
    this.quizTries.innerHTML = '';
    for (let i = 0; i < maxTries; i++) {
      const pip = document.createElement('span');
      pip.className = 'tries-pip' + (i < triesLeft ? '' : ' spent');
      pip.textContent = '●';
      this.quizTries.appendChild(pip);
    }
    this.quizQuestion.textContent = question.question;
    this.quizFeedback.textContent = '';
    this.quizFeedback.className = 'quiz-feedback';
    this.quizChoices.innerHTML = '';
    question.choices.forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-choice-btn';
      btn.textContent = choice;
      if (disabledIndices.has(i)) {
        btn.disabled = true;
        btn.classList.add('wrong');
      } else {
        btn.onclick = () => onChoice(i);
      }
      this.quizChoices.appendChild(btn);
    });
  }

  showQuizFeedback(correct, revealIndex) {
    if (revealIndex !== null && revealIndex !== undefined) {
      const btn = this.quizChoices.children[revealIndex];
      if (btn) btn.classList.add('correct');
    }
    Array.from(this.quizChoices.children).forEach((c) => (c.disabled = true));
    this.quizFeedback.textContent = correct
      ? 'Correct! The chest unlocks.'
      : 'Wrong. That guess is eliminated.';
    this.quizFeedback.className = 'quiz-feedback ' + (correct ? 'good' : 'bad');
  }

  hideQuiz() {
    this.quizModal.classList.add('hidden');
  }

  showEnd(kind, stats, actions) {
    this.hud.classList.add('hidden');
    this.endScreen.classList.remove('hidden');

    if (kind === 'win') {
      this.endTitle.textContent = 'DUNGEON CLEARED';
      this.endTitle.className = 'end-title win';
      this.endFlavor.textContent = 'You outsmarted the dungeon. It remembers you.';
      this.endWinActions.classList.remove('hidden');
      this.endLoseActions.classList.add('hidden');
      this.endRestartBtn.onclick = actions.onRestart;
    } else {
      const isRiddle = kind === 'riddle-fail';
      this.endTitle.textContent = isRiddle ? 'OUTWITTED' : 'YOU HAVE FALLEN';
      this.endTitle.className = 'end-title lose';
      this.endFlavor.textContent = isRiddle
        ? '"Three guesses, three failures," the dungeon master sighs. "Not smart enough... yet."'
        : '"Strength without wit," the dungeon master says, "is just a slower way to lose."';
      this.endWinActions.classList.add('hidden');
      this.endLoseActions.classList.remove('hidden');
      this.endTryAgainBtn.onclick = actions.onTryAgain;
      this.endTownBtn.onclick = actions.onTown;
    }

    this.endStats.textContent =
      `Reached Level ${stats.levelIndex + 1} of ${stats.totalLevels} — ` +
      `STEM: ${stats.stemCorrect}/${stats.stemTotal} correct — ` +
      `Loot: ${stats.loot}`;
  }
}
