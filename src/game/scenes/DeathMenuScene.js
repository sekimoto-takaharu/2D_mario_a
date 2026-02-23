import Phaser from "phaser";

export class DeathMenuScene extends Phaser.Scene {
  constructor() {
    super("DeathMenuScene");
  }

create(data) {
  const w = this.scale.width;
  const h = this.scale.height;

  const audio = this.scene.get("AudioScene");

  // ★ここでBGM停止
  audio?.stopBgm?.();

  this.cameras.main.setBackgroundColor("#111827");

  this.courseKey = data?.courseKey;
  this.returnTo = data?.returnTo ?? "StageSelectScene";
  this.selectedIndex = data?.selectedIndex ?? 0;

  this.save = this.registry.get("save") ?? { lives: 0, coins: 0, clearedStages: [] };

  // --- UI ---
  this.add
    .text(w / 2, 150, "ミス！", {
      fontFamily: "monospace",
      fontSize: "56px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  this.livesText = this.add
    .text(w / 2, 235, `残機: ${this.save.lives ?? 0}`, {
      fontFamily: "monospace",
      fontSize: "30px",
      color: "#fbbf24",
    })
    .setOrigin(0.5);

  this.minusText = this.add
    .text(w / 2, 275, "-1", {
      fontFamily: "monospace",
      fontSize: "28px",
      color: "#ff4d4d",
    })
    .setOrigin(0.5)
    .setAlpha(0);

  this.helpText = this.add
    .text(w / 2, 345, "SPACE: つづける（同じコース）\nESC: コースセレクトへ", {
      fontFamily: "monospace",
      fontSize: "22px",
      color: "#d1d5db",
      align: "center",
    })
    .setOrigin(0.5)
    .setAlpha(0);

  // --- SE（任意） ---
  audio?.playSe?.("se_lose", { volume: 0.7 });

  this._playLoseAnim(() => {
    this.helpText.setAlpha(1);

    this.input.keyboard.addCapture(["SPACE", "ESC"]);
    this.input.keyboard.once("keydown-SPACE", () => this._continue());
    this.input.keyboard.once("keydown-ESC", () => this._backToSelect());
  });
}

  _playLoseAnim(onDone) {
    // livesText点滅
    this.tweens.add({
      targets: this.livesText,
      alpha: 0,
      duration: 120,
      yoyo: true,
      repeat: 5,
    });

    // -1 をふわっと出して上に上げる
    this.minusText.setAlpha(1);
    this.tweens.add({
      targets: this.minusText,
      y: this.minusText.y - 30,
      alpha: 0,
      duration: 650,
      ease: "Sine.easeOut",
      onComplete: () => {
        onDone?.();
      },
    });
  }

  _continue() {
    this.scene.start("GameScene", {
      courseKey: this.courseKey,
      returnTo: this.returnTo,
      selectedIndex: this.selectedIndex,
    });
  }

  _backToSelect() {
    this.scene.start(this.returnTo, {
      selectedIndex: this.selectedIndex,
      selectedCourseKey: this.courseKey,
    });
  }
}