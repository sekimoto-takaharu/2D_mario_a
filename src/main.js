import Phaser from "phaser";

class MainScene extends Phaser.Scene {
  constructor() {
    super("main");
  }

  create() {
    // 背景色
    this.cameras.main.setBackgroundColor("#87CEEB");

    // 四角形テクスチャ生成（画像素材なしでOK）
    this.makeRectTexture("ground", 64, 24, 0x2ecc71);
    this.makeRectTexture("player", 24, 32, 0x2d7ff9);

    // 重力
    this.physics.world.gravity.y = 1100;

    // 地面（静的）
    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(480, 560, "ground").setScale(16, 1).refreshBody(); // 横に長い床

    // プレイヤー
    this.player = this.physics.add.sprite(120, 480, "player");
    this.player.setCollideWorldBounds(true);
    this.player.setDragX(900);         // 慣性を抑える
    this.player.setMaxVelocity(320, 900);

    // 当たり判定
    this.physics.add.collider(this.player, this.platforms);

    // 入力
    this.cursors = this.input.keyboard.createCursorKeys();

    // 画面固定の操作説明
    const hint = this.add.text(12, 12, "← → 移動 / ↑ ジャンプ", {
      fontFamily: "system-ui",
      fontSize: "16px",
      color: "#0b1b2a",
      backgroundColor: "rgba(255,255,255,0.7)",
      padding: { x: 10, y: 6 },
    });
    hint.setScrollFactor(0);
  }

  update() {
    const accel = 1400;

    // 左右移動
    if (this.cursors.left.isDown) {
      this.player.setAccelerationX(-accel);
    } else if (this.cursors.right.isDown) {
      this.player.setAccelerationX(accel);
    } else {
      this.player.setAccelerationX(0);
    }

    // ジャンプ（接地時のみ）
    const onGround =
      this.player.body.blocked.down || this.player.body.touching.down;

    if (onGround && Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.player.setVelocityY(-520);
    }
  }

  makeRectTexture(key, w, h, color) {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillRoundedRect(0, 0, w, h, 6);
    g.generateTexture(key, w, h);
    g.destroy();
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: 960,
  height: 600,
  parent: "app",
  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  scene: [MainScene],
});