import Phaser from "phaser";
export class AudioScene extends Phaser.Scene {
  constructor() {
    super("AudioScene");
  }

  preload() {
    // タイトル
    this.load.audio("bgm_title", "audio/bgm/titleScene.mp3");

    // ステージ別（themeに合わせる）
    this.load.audio("bgm_ground", "audio/bgm/ground.mp3");
    this.load.audio("bgm_water", "audio/bgm/water.mp3");
    this.load.audio("bgm_ruin", "audio/bgm/ruin.mp3");
    this.load.audio("bgm_castle", "audio/bgm/castle.mp3");
    this.load.audio("se_gameover", "audio/se/gameover.mp3");
    this.load.audio("se_lose", "audio/se/lose.mp3");

    // デバッグ用
    this.load.on("loaderror", (file) => {
      console.error("[AudioScene] loaderror", file?.key, file?.src);
    });
  }

  create() {
    this.registry.set("bgmKey", null);
    this.registry.set("bgm", null);
  }

  async playBgm(nextKey, { volume = 0.4 } = {}) {
    if (!nextKey) return;

    // 同じ曲なら何もしない
    if (this.registry.get("bgmKey") === nextKey) return;

    // 自動再生制限対策：ユーザー操作後に呼ばれる想定
    await this.sound.context.resume();

    // いま鳴ってるBGMを止める
    const cur = this.registry.get("bgm");
    if (cur) {
      cur.stop();
      cur.destroy();
    }

    const bgm = this.sound.add(nextKey, { loop: true, volume });
    bgm.play();

    this.registry.set("bgm", bgm);
    this.registry.set("bgmKey", nextKey);
  }

  stopBgm() {
  const cur = this.registry.get("bgm");
  if (cur) {
    cur.stop();
    cur.destroy();
  }
  this.registry.set("bgm", null);
  this.registry.set("bgmKey", null);
}

  async playSe(key, { volume = 0.7 } = {}) {
    if (!key) return;
    await this.sound.context.resume();

    // SEは短いので add+play して終わったら破棄
    const se = this.sound.add(key, { loop: false, volume });
    se.once("complete", () => se.destroy());
    se.play();
  }
}