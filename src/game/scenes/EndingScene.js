import Phaser from "phaser";

const CREDIT_LINES = [
  "THE END",
  "",
  "Staff Credits",
  "",
  "Project Members",
  "平松利幸",
  "関本宇春",
  "",
  "Special Thanks",
  "Phaser 3",
  "OpenAI Codex",
  "",
  "Thank you for playing.",
];

export class EndingScene extends Phaser.Scene {
  constructor() {
    super("EndingScene");
  }

  create() {
    const audio = this.scene.get("AudioScene");
    audio?.stopBgm?.();

    this.cameras.main.setBackgroundColor("#050816");

    this.add
      .text(this.scale.width / 2, 70, "ENDING CREDITS", {
        fontFamily: "monospace",
        fontSize: "30px",
        color: "#fde68a",
      })
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, 700, "SPACE / ENTER: タイトルへ", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#cbd5e1",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(20);

    const content = CREDIT_LINES.join("\n");
    this.rollText = this.add
      .text(this.scale.width / 2, this.scale.height + 40, content, {
        fontFamily: "monospace",
        fontSize: "32px",
        color: "#f8fafc",
        align: "center",
        lineSpacing: 18,
      })
      .setOrigin(0.5, 0);

    this.tweens.add({
      targets: this.rollText,
      y: -this.rollText.height - 80,
      duration: 18000,
      ease: "Linear",
      onComplete: () => this.scene.start("TitleScene"),
    });

    this.input.keyboard.addCapture(["SPACE", "ENTER", "ESC"]);
    this.input.keyboard.once("keydown-SPACE", () => this.scene.start("TitleScene"));
    this.input.keyboard.once("keydown-ENTER", () => this.scene.start("TitleScene"));
    this.input.keyboard.once("keydown-ESC", () => this.scene.start("TitleScene"));
  }
}
