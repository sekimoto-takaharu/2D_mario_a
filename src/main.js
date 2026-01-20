// src/main.js
import Phaser from "phaser";
import { TitleScene } from "./game/scenes/TitleScene";
import { StageSelectScene } from "./game/scenes/StageSelectScene";
import { GameScene } from "./game/scenes/GameScene";

const config = {
  type: Phaser.AUTO,
  parent: "app",
  width: 1280,
  height: 720,
  physics: {
    default: "arcade",
    arcade: { debug: true },
  },
  scene: [TitleScene, StageSelectScene, GameScene],
};

new Phaser.Game(config);
