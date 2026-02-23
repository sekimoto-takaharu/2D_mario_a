import Phaser from "phaser";

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  create(data) {
    const w = this.scale.width;

    // --- BGM停止 + SE ---
    const audio = this.scene.get("AudioScene");
    audio?.stopBgm?.();
    audio?.playSe?.("se_gameover", { volume: 0.8 });

    // --- ★残機リセット（3に戻す） ---
    const save = this.registry.get("save");
    const slot = this.registry.get("saveSlot");

    if (save) {
      save.lives = 3;
      save.updatedAt = Date.now();

      // スロット保存（3スロット版）
      if (slot) {
        localStorage.setItem(`mario2d_save_v1_slot${slot}`, JSON.stringify(save));
      }

      // registry更新（次画面ですぐ反映）
      this.registry.set("save", save);
    }

    // --- UI ---
    this.cameras.main.setBackgroundColor("#000000");

    this.add
      .text(w / 2, 210, "GAME OVER", {
        fontFamily: "monospace",
        fontSize: "72px",
        color: "#ff4d4d",
      })
      .setOrigin(0.5);

    this.add
      .text(w / 2, 330, "SPACE: タイトルへ\nESC: コースセレクトへ", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#e5e7eb",
        align: "center",
      })
      .setOrigin(0.5);

    const returnTo = data?.returnTo ?? "StageSelectScene";

    this.input.keyboard.addCapture(["SPACE", "ESC"]);
    this.input.keyboard.once("keydown-SPACE", () => this.scene.start("TitleScene"));
    this.input.keyboard.once("keydown-ESC", () => this.scene.start(returnTo));
  }
}