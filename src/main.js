import Phaser from "phaser";
import { MenuScene } from "./game/scenes/MenuScene";
import { GameScene } from "./game/scenes/GameScene";
import { ClearScene } from "./game/scenes/ClearScene";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "app",
  scale: { mode: Phaser.Scale.RESIZE },
  physics: { default: "arcade", arcade: { debug: false } },
  scene: [MenuScene, GameScene, ClearScene],
});