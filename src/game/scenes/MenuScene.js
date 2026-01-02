import { COURSES } from "../courses.js";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("menu");
  }

  create() {
    this.cameras.main.setBackgroundColor("#111827");

    let y = 120;
    for (const key in COURSES) {
      const btn = this.add.text(40, y, `▶ ${COURSES[key].name}`, {
        fontSize: "24px",
        color: "#fff",
        backgroundColor: "rgba(255,255,255,0.2)",
        padding: { x: 16, y: 10 },
      }).setInteractive();

      btn.on("pointerdown", () => this.scene.start("game", { courseKey: key }));
      y += 70;
    }
  }
}