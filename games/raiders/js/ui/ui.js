export class UI {
  constructor() {
    this.titleScreen = document.getElementById('title-screen');
    this.startBtn = document.getElementById('start-btn');
    this.ageButtons = Array.from(document.querySelectorAll('.age-btn'));
    this.hud = document.getElementById('hud');
    this.hudHearts = document.getElementById('hud-hearts');
    this.hudLevel = document.getElementById('hud-level');
    this.hudStem = document.getElementById('hud-stem');
    this.quizModal = document.getElementById('quiz-modal');
    this.quizCategory = document.getElementById('quiz-category');
    this.quizQuestion = document.getElementById('quiz-question');
    this.quizChoices = document.getElementById('quiz-choices');
    this.quizFeedback = document.getElementById('quiz-feedback');
    this.endScreen = document.getElementById('end-screen');
    this.endTitle = document.getElementById('end-title');
    this.endStats = document.getElementById('end-stats');
    this.endRestartBtn = document.getElementById('end-restart-btn');

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

  updateHud(player, levelIndex, totalLevels, stemCorrect, stemTotal) {
    this.hudHearts.innerHTML = '';
    for (let i = 0; i < player.maxHp; i++) {
      const heart = document.createElement('span');
      heart.className = 'hud-heart' + (i < player.hp ? '' : ' empty');
      heart.textContent = '◆';
      this.hudHearts.appendChild(heart);
    }
    this.hudLevel.textContent = `LEVEL ${levelIndex + 1} / ${totalLevels}`;
    this.hudStem.textContent = stemTotal > 0 ? `STEM ${stemCorrect}/${stemTotal}` : '';
  }

  showQuiz(question, onAnswer) {
    this.quizModal.classList.remove('hidden');
    this.quizCategory.textContent = question.category.toUpperCase();
    this.quizQuestion.textContent = question.question;
    this.quizFeedback.textContent = '';
    this.quizFeedback.className = 'quiz-feedback';
    this.quizChoices.innerHTML = '';
    let answered = false;
    question.choices.forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-choice-btn';
      btn.textContent = choice;
      btn.onclick = () => {
        if (answered) return;
        answered = true;
        const correct = i === question.answer;
        btn.classList.add(correct ? 'correct' : 'wrong');
        if (!correct) {
          const correctBtn = this.quizChoices.children[question.answer];
          correctBtn.classList.add('correct');
        }
        this.quizFeedback.textContent = correct
          ? 'Correct! The chest unlocks.'
          : 'Not quite — but knowledge unlocks the chest too. Try the next one!';
        this.quizFeedback.className = 'quiz-feedback ' + (correct ? 'good' : 'bad');
        Array.from(this.quizChoices.children).forEach((c) => (c.disabled = true));
        setTimeout(() => {
          this.quizModal.classList.add('hidden');
          onAnswer(correct);
        }, 1400);
      };
      this.quizChoices.appendChild(btn);
    });
  }

  showEnd(win, stats, onRestart) {
    this.hud.classList.add('hidden');
    this.endScreen.classList.remove('hidden');
    this.endTitle.textContent = win ? 'DUNGEON CLEARED' : 'YOU HAVE FALLEN';
    this.endTitle.className = win ? 'end-title win' : 'end-title lose';
    this.endStats.textContent =
      `Reached Level ${stats.levelIndex + 1} of ${stats.totalLevels} — ` +
      `STEM Questions: ${stats.stemCorrect}/${stats.stemTotal} correct`;
    this.endRestartBtn.onclick = onRestart;
  }
}
