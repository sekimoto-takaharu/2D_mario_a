import Phaser from "phaser";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create() {
    const w = this.scale.width;

    if (!this.scene.isActive("AudioScene")) {
      this.scene.launch("AudioScene");
    }

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

  this.input.keyboard.once("keydown-SPACE", async () => {
    const audio = this.scene.get("AudioScene");
    await audio.playBgm("bgm_title", { volume: 0.4 });

    this.scene.start("SaveDataScene");
  });
  }
}