import Phaser from "phaser";
import { COURSES } from "../courses.js";
import { makeRectTexture } from "../utils/textures.js";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("game");
  }

  init(data) {
    this.courseKey = data.courseKey ?? "ground";
    this.course = COURSES[this.courseKey];
  }

  create() {
    const screenW = this.scale.width;
    this.worldW = screenW * this.course.screens;
    this.worldH = this.course.worldHeight;

    this.physics.world.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.setBackgroundColor(this.course.bg);

    makeRectTexture(this, "ground", 64, 24, this.pickGroundColor());
    makeRectTexture(this, "player", 24, 32, this.pickPlayerColor());
    makeRectTexture(this, "goal", 28, 60, 0xf59e0b);
    makeRectTexture(this, "lava", 64, 64, 0xff3300);

    this.physics.world.gravity.y = this.course.gravityY;

    this.platforms = this.physics.add.staticGroup();

    const groundY = this.worldH - 40;
    this.platforms.create(this.worldW / 2, groundY, "ground")
      .setScale(this.worldW / 64, 1)
      .refreshBody();

    for (const p of this.course.platforms ?? []) {
      this.platforms.create(
        p.x * this.worldW,
        p.y * this.worldH,
        "ground"
      ).setScale(p.w, 1).refreshBody();
    }

    const ps = this.course.player;
    this.accel = ps.accel;
    this.jumpVY = ps.jumpVY;

    const startY = groundY - 80;
    this.player = this.physics.add.sprite(120, startY, "player");
    this.player.setCollideWorldBounds(true);
    this.player.setMaxVelocity(ps.maxVX, 900);

    this.physics.add.collider(this.player, this.platforms);

    this.cameras.main.startFollow(this.player, true, 1, 1);
    this.cameras.main.roundPixels = true;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on("keydown-ESC", () => this.scene.start("menu"));

    const goalX = (this.course.goal?.x ?? 0.88) * this.worldW;
    this.goal = this.physics.add.staticImage(goalX, this.worldH - 70, "goal");
    this.physics.add.overlap(this.player, this.goal, () => {
      this.scene.start("clear", { courseKey: this.courseKey });
    });

    this.hazards = this.physics.add.staticGroup();
    for (const h of this.course.hazards ?? []) {
      if (h.type === "lava") {
        const y = h.y * this.worldH;
        const hgt = h.h * this.worldH;

        this.add.rectangle(this.worldW / 2, y, this.worldW, hgt, 0xff3300);

        const lava = this.hazards.create(this.worldW / 2, y, "lava");
        lava.setVisible(false);
        lava.setScale(this.worldW / 64, hgt / 64).refreshBody();
      }
    }

    let safety = 0;
    while (this.physics.overlap(this.player, this.hazards) && safety < 10) {
      this.player.y -= 40;
      this.player.body.updateFromGameObject();
      safety++;
    }

    this.physics.add.overlap(this.player, this.hazards, () => {
      this.scene.restart({ courseKey: this.courseKey });
    });
  }

  update() {
    const isUnderwater = this.course.theme === "underwater";

    if (this.cursors.left.isDown) {
      this.player.setDragX(0);
      this.player.setAccelerationX(-this.accel);
    } else if (this.cursors.right.isDown) {
      this.player.setDragX(0);
      this.player.setAccelerationX(this.accel);
    } else {
      this.player.setAccelerationX(0);
      this.player.setDragX(isUnderwater ? 600 : 1400);
    }

    if (isUnderwater && this.course.swim) {
      const s = this.course.swim;
      this.player.setMaxVelocity(this.course.player.maxVX, s.maxVY);

      if (this.cursors.up.isDown) {
        this.player.setAccelerationY(s.upThrust);
      } else if (this.cursors.down.isDown) {
        this.player.setAccelerationY(s.downThrust);
      } else {
        this.player.setAccelerationY(s.buoyancy);
      }
      return;
    }

    this.player.setAccelerationY(0);
    const onGround = this.player.body.blocked.down || this.player.body.touching.down;
    if (onGround && Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.player.setVelocityY(this.jumpVY);
    }
  }

  pickGroundColor() {
    switch (this.course.theme) {
      case "underground": return 0x6b4a2f;
      case "underwater": return 0x1fb6ff;
      case "castle": return 0x3f3f46;
      default: return 0x2ecc71;
    }
  }

  pickPlayerColor() {
    switch (this.course.theme) {
      case "underground": return 0xa78bfa;
      case "underwater": return 0x22c55e;
      case "castle": return 0xf43f5e;
      default: return 0x2d7ff9;
    }
  }
}