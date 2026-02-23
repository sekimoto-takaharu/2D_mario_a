import Phaser from "phaser";
import { TitleScene } from "./game/scenes/TitleScene";
import { SaveDataScene } from "./game/scenes/SaveDataScene";
import { StageSelectScene } from "./game/scenes/StageSelectScene";
import { GameScene } from "./game/scenes/GameScene";
import { AudioScene } from "./game/scenes/AudioScene";

const config = {
  type: Phaser.AUTO,
  parent: "app",
  width: 1280,
  height: 720,
  physics: { default: "arcade", arcade: { debug: true } },
  scene: [AudioScene, TitleScene, SaveDataScene, StageSelectScene, GameScene],
};

new Phaser.Game(config);