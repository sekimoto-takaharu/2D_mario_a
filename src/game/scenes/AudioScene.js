import Phaser from "phaser";

export class AudioScene extends Phaser.Scene {
  constructor() {
    super({ key: "AudioScene", active: true });
  }

    preload() {
        this.load.audio("bgm_main", "audio/bgm/titleScene.mp3");
    }

  create() {
    this.bgm = this.sound.add("bgm_main", {
      loop: true,
      volume: 0.4,
    });

    this.bgm.play();
  }
}