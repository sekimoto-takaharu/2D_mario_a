export class ClearScene extends Phaser.Scene {
  constructor() {
    super("clear");
  }

  create() {
    this.cameras.main.setBackgroundColor("#065f46");

    this.add.text(40, 120, "CLEAR!!", {
      fontSize: "48px",
      color: "#fff",
    });

    this.add.text(40, 220, "クリックでメニューへ", {
      fontSize: "20px",
      color: "#fff",
    }).setInteractive().on("pointerdown", () => {
      this.scene.start("menu");
    });
  }
}