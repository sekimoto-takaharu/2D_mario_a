export class TitleScene extends Phaser.Scene {
  constructor() {
    super("title");
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.cameras.main.setBackgroundColor("#0b1220");

    // タイトル
    const title = this.add.text(w / 2, h * 0.28, "Kamashin Brothers", {
      fontFamily: "system-ui",
      fontSize: "40px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    title.setOrigin(0.5);

    // 操作案内
    const hint = this.add.text(w / 2, h * 0.62, "クリック or Enter でスタート", {
      fontFamily: "system-ui",
      fontSize: "22px",
      color: "#ffffff",
      backgroundColor: "rgba(255,255,255,0.12)",
      padding: { x: 16, y: 10 },
    });
    hint.setOrigin(0.5);

    // ちょい演出（点滅）
    this.tweens.add({
      targets: hint,
      alpha: 0.25,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    // 入力でメニューへ
    this.input.once("pointerdown", () => this.scene.start("menu"));
    this.input.keyboard.once("keydown-ENTER", () => this.scene.start("menu"));
    this.input.keyboard.once("keydown-SPACE", () => this.scene.start("menu"));
  }
}