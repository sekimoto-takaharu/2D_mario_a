import Phaser from "phaser";
import { TitleScene } from "./game/scenes/TitleScene";
import { SaveDataScene } from "./game/scenes/SaveDataScene";
import { StageSelectScene } from "./game/scenes/StageSelectScene";
import { GameScene } from "./game/scenes/GameScene";
import { AudioScene } from "./game/scenes/AudioScene";
import { DeathMenuScene } from "./game/scenes/DeathMenuScene";
import { GameOverScene } from "./game/scenes/GameOverScene";

const config = {
  type: Phaser.AUTO,
  parent: "app",
  width: 1280,
  height: 720,
  physics: { default: "arcade", arcade: { debug: true } },
  scene: [TitleScene, SaveDataScene, StageSelectScene, GameScene, AudioScene,DeathMenuScene, GameOverScene],
};

new Phaser.Game(config);