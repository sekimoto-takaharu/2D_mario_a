// src/game/scenes/TitleScene.js
import Phaser from "phaser";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create() {
    // 背景
    this.cameras.main.setBackgroundColor(0xffffff);

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.add
      .text(cx, cy - 60, "kamakura brother's", {
        fontSize: "64px",
        color: "#000",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy + 40, "PRESS SPACE TO START", {
        fontSize: "24px",
        color: "#000",
      })
      .setOrigin(0.5);

    // キー
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.addCapture(["UP", "DOWN", "LEFT", "RIGHT", "SPACE"]);

    // SPACEでステージセレクトへ
    this.input.keyboard.on("keydown-SPACE", () => {
      this.scene.start("StageSelectScene", { selectedIndex: 0 });
    });
  }
}
