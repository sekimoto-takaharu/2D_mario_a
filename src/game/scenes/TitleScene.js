import Phaser from "phaser";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  preload() {
    this.load.audio("bgm_title", "audio/bgm/titleScene.mp3");
  }

  create() {
    const w = this.scale.width;

    this.cameras.main.setBackgroundColor("#0b1020");

    this.add
      .text(w / 2, 220, "MARIO 2D", {
        fontFamily: "monospace",
        fontSize: "72px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(w / 2, 330, "SPACE でスタート", {
        fontFamily: "monospace",
        fontSize: "26px",
        color: "#fbbf24",
      })
      .setOrigin(0.5);

    this.add
      .text(w / 2, 380, "（セーブデータ選択へ）", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#9ca3af",
      })
      .setOrigin(0.5);

    this.input.keyboard.addCapture(["SPACE"]);

    this.input.keyboard.once("keydown-SPACE", () => {
      // BGM再生（ループ）
      const bgm = this.sound.add("bgm_title", {
        loop: true,
        volume: 0.4,
      });
      bgm.play();

      this.scene.start("SaveDataScene");
    });
  }
}