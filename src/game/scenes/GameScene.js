// src/game/scenes/GameScene.js
import Phaser from "phaser";
import { COURSES } from "../courses";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this._colliders = [];
  }

  preload() {
    this.load.image("tile_ground", "assets/ground.png");
    this.load.image("tile_brick", "assets/brick.png");
    this.load.image("tile_question", "assets/question.png");
    this.load.image("tile_mushroom_block", "assets/mushroom_block.png");

    this.load.image("spr_coin", "assets/coin.png");
    this.load.image("spr_player", "assets/player.png");
    this.load.image("spr_enemy", "assets/enemy.png");
    this.load.image("spr_goal", "assets/goal.png");

    this.load.on("loaderror", (file) => {
      console.error("LOAD ERROR:", file?.key, file?.src);
    });
  }

  create(data) {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.addCapture(["UP", "DOWN", "LEFT", "RIGHT", "SPACE"]);

    if (this.game?.canvas) {
      this.game.canvas.setAttribute("tabindex", "0");
      this.game.canvas.focus();
    }
    this.input.on("pointerdown", () => this.game?.canvas?.focus());

    // 遷移直後のキー持ち越しを切る
    this.input.keyboard.resetKeys();

    // ステージセレクトから受け取る
    this.returnTo = data?.returnTo ?? "StageSelectScene";
    this.selectedIndex = data?.selectedIndex ?? 0;

    const keys = Object.keys(COURSES);
    const courseKey = data?.courseKey ?? keys[0];
    this._loadCourse(courseKey);
  }

  _destroyAllColliders() {
    for (const c of this._colliders) c.destroy();
    this._colliders = [];
  }

  // トゲテクスチャ（アセット不要）
  _ensureSpikeTexture() {
    if (this.textures.exists("tile_spike")) return;

    const w = 48;
    const h = 48;
    const g = this.add.graphics();
    g.clear();

    // 台座
    g.fillStyle(0x555555, 1);
    g.fillRect(0, h - 10, w, 10);

    // トゲ（三角）
    g.fillStyle(0x222222, 1);
    g.beginPath();
    g.moveTo(w * 0.12, h - 10);
    g.lineTo(w * 0.5, h * 0.12);
    g.lineTo(w * 0.88, h - 10);
    g.closePath();
    g.fillPath();

    g.generateTexture("tile_spike", w, h);
    g.destroy();
  }

  _loadCourse(courseKey) {
    this._destroyAllColliders();
    this.children.removeAll(true);

    // state
    this.score = 0;
    this.isClearing = false;
    this.isBig = false;
    this._blockHitLock = false;

    this.courseKey = courseKey;
    this.course = COURSES[this.courseKey];

    // 水中判定
    this.isWater = this.course.theme === "water";

    // コースロードでもキー持ち越し切り
    this.input.keyboard.resetKeys();

    // 水中：遷移直後の押しっぱなし暴発を抑える
    this._swimInputIgnoreUntil = this.time.now + 250;

    this.tile = this.course.tileSize ?? 48;
    const map = this.course.map;
    if (!Array.isArray(map) || map.length === 0) throw new Error("courses.js の course.map が空です");

    this.rows = map.length;
    this.cols = Math.max(...map.map((r) => r.length));
    this.worldW = this.cols * this.tile;
    this.worldH = this.rows * this.tile;

    this.cameras.main.setBackgroundColor(this.course.bg ?? 0x87ceeb);

    // ★水中は重力を切る（泳ぎ挙動を自前で安定制御）
    this.physics.world.gravity.y = this.isWater ? 0 : this.course.gravityY ?? 1100;

    // 下端だけ衝突OFF（穴落ちOK）
    this.physics.world.setBounds(0, 0, this.worldW, this.worldH);
    this.physics.world.setBoundsCollision(true, true, true, false);
    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);

    // groups
    this.solids = this.physics.add.staticGroup();
    this.blocks = this.physics.add.staticGroup();
    this.coins = this.physics.add.staticGroup();
    this.goal = this.physics.add.staticGroup();

    this.enemies = this.physics.add.group({ allowGravity: true, immovable: false });
    this.items = this.physics.add.group({ allowGravity: true, immovable: false });

    this.movers = this.physics.add.staticGroup();

    // hazards（トゲ）
    this.hazards = this.physics.add.staticGroup();

    // UI
    this.scoreText = this.add
      .text(16, 12, `SCORE: ${this.score}`, { fontSize: "20px", color: "#000" })
      .setScrollFactor(0)
      .setDepth(1000);

    this.courseText = this.add
      .text(16, 36, `STAGE: ${this.course.name ?? this.courseKey}`, { fontSize: "16px", color: "#000" })
      .setScrollFactor(0)
      .setDepth(1000);

    // map build
    const { playerX, playerY } = this._buildFromTextMap(map);

    // player
    const pl = this.course.player ?? { accel: 450, maxVX: 180, jumpVY: -520 };
    this.playerConf = pl;

    this.player = this.physics.add.sprite(playerX, playerY, "spr_player");

    // 地上の基本設定
    this.player.setDragX(900);
    this.player.setCollideWorldBounds(true);

    // 水中の場合は重力オフ
    if (this.isWater) {
      this.player.body.setAllowGravity(false);
      // 水中は上下の速度も暴れないように少し制限
      this.player.body.setMaxVelocity(pl.maxVX ?? 180, 260);
    } else {
      this.player.body.setAllowGravity(true);
      this.player.body.setMaxVelocity(pl.maxVX ?? 180, 1600);
    }

    this.player.setDisplaySize(this.tile * 0.55, this.tile * 0.75);
    this.player.body.setSize(this.player.displayWidth, this.player.displayHeight, true);
    this.player.setDepth(500);

    // 安定化
    this.player.body.setVelocity(0, 0);
    this.player.body.setAcceleration(0, 0);

    // camera
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    // --- colliders ---
    this._colliders.push(this.physics.add.collider(this.player, this.solids));
    this._colliders.push(this.physics.add.collider(this.player, this.blocks, (p, b) => this._onHitBlock(p, b)));
    this._colliders.push(this.physics.add.collider(this.player, this.movers));

    this._colliders.push(this.physics.add.collider(this.enemies, this.solids));
    this._colliders.push(this.physics.add.collider(this.enemies, this.blocks));
    this._colliders.push(this.physics.add.collider(this.enemies, this.movers));

    // 敵に当たったら死亡
    this._colliders.push(this.physics.add.collider(this.player, this.enemies, () => this._die()));

    this._colliders.push(this.physics.add.collider(this.items, this.solids));
    this._colliders.push(this.physics.add.collider(this.items, this.blocks));
    this._colliders.push(this.physics.add.collider(this.items, this.movers));

    // トゲ：触れたら死亡（overlap）
    this.physics.add.overlap(this.player, this.hazards, () => this._die());

    // overlaps
    this.physics.add.overlap(this.player, this.coins, (p, c) => {
      const v = c.getData("value") ?? 100;
      c.destroy();
      this._addScore(v);
    });

    this.physics.add.overlap(this.player, this.goal, () => this._clearCourse());

    this.physics.add.overlap(this.player, this.items, (p, it) => {
      if (it.getData("type") === "mushroom") {
        it.destroy();
        this._setBig(true);
        this._addScore(100);
      }
    });
  }

  update() {
    if (this.isClearing) return;

    const body = this.player.body;

    // 左右（地上は加速度、今回は水中でも同じでOK）
    const accel = this.playerConf.accel ?? 450;
    if (this.cursors.left.isDown) body.setAccelerationX(-accel);
    else if (this.cursors.right.isDown) body.setAccelerationX(accel);
    else body.setAccelerationX(0);

    // UP or SPACE
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.cursors.space);
    const jumpHeld = this.cursors.up.isDown || this.cursors.space.isDown;

    if (this.isWater) {
      const canSwim = this.time.now >= (this._swimInputIgnoreUntil ?? 0);

      // 水中：ふわっと泳ぐ（押し続けで上昇）
      if (canSwim && jumpHeld) {
        body.setVelocityY(-180);
      } else if (canSwim && this.cursors.down.isDown) {
        body.setVelocityY(160);
      } else if (canSwim) {
        // 何も押してないと少し沈む
        body.setVelocityY(40);
      }
    } else {
      // 地上：UP/SPACEでジャンプ
      if (jumpPressed && body.blocked.down) {
        body.setVelocityY(this.playerConf.jumpVY ?? -520);
      }
    }

    // 穴落ち＝死亡
    if (this.player.y > this.worldH + this.tile * 2) this._die();

    // enemies update（左右移動＆上下移動）
    for (const enemy of this.enemies.getChildren()) {
      const kind = enemy.getData("kind");

      if (kind === "h") {
        let speed = enemy.getData("speed") ?? 60;
        enemy.body.setVelocityX(speed);

        if (enemy.body.blocked.left || enemy.body.blocked.right) {
          speed = -speed;
          enemy.setData("speed", speed);
        }
      }

      if (kind === "v") {
        const vSpeed = enemy.getData("vSpeed") ?? 70;
        const minY = enemy.getData("minY");
        const maxY = enemy.getData("maxY");

        enemy.body.setVelocityY(vSpeed);
        if (enemy.y <= minY) enemy.setData("vSpeed", Math.abs(vSpeed));
        if (enemy.y >= maxY) enemy.setData("vSpeed", -Math.abs(vSpeed));
      }

      if (enemy.y > this.worldH + this.tile * 4) enemy.destroy();
    }

    // movers update（上下往復）：static を動かす → refreshBody
    for (const plat of this.movers.getChildren()) {
      let v = plat.getData("vSpeed") ?? 60;
      const minY = plat.getData("minY");
      const maxY = plat.getData("maxY");

      const dt = this.game.loop.delta / 1000;
      plat.y += v * dt;

      if (plat.y <= minY) {
        plat.y = minY;
        v = Math.abs(v);
      }
      if (plat.y >= maxY) {
        plat.y = maxY;
        v = -Math.abs(v);
      }

      plat.setData("vSpeed", v);
      plat.refreshBody();
    }
  }

  // ----------------------------
  // MAP生成
  // ----------------------------
  _buildFromTextMap(map) {
    let playerX = this.tile * 2;
    let playerY = this.worldH - this.tile * 2;

    // トゲ準備
    this._ensureSpikeTexture();

    for (let row = 0; row < this.rows; row++) {
      const line = map[row] ?? "";
      for (let col = 0; col < this.cols; col++) {
        const ch = line[col] ?? ".";
        const x = col * this.tile + this.tile / 2;
        const y = row * this.tile + this.tile / 2;

        switch (ch) {
          case "#": {
            const g = this._addStaticSprite(this.solids, "tile_ground", x, y, this.tile, this.tile);
            g.setDepth(100);
            break;
          }
          case "B": {
            const b = this._addStaticSprite(this.blocks, "tile_brick", x, y, this.tile, this.tile);
            b.setData("type", "brick");
            b.setData("used", false);
            b.setDepth(200);
            break;
          }
          case "?": {
            const b = this._addStaticSprite(this.blocks, "tile_question", x, y, this.tile, this.tile);
            b.setData("type", "question");
            b.setData("used", false);
            b.setDepth(200);
            break;
          }
          case "!": {
            const b = this._addStaticSprite(this.blocks, "tile_mushroom_block", x, y, this.tile, this.tile);
            b.setData("type", "mushroom");
            b.setData("used", false);
            b.setDepth(200);
            break;
          }
          case "C": {
            const c = this._addStaticSprite(this.coins, "spr_coin", x, y, this.tile * 0.5, this.tile * 0.5);
            c.setData("value", 100);
            c.setDepth(350);
            break;
          }
          case "G": {
            const g = this._addStaticSprite(this.goal, "spr_goal", x, y, this.tile * 0.7, this.tile * 1.4);
            g.setDepth(450);
            break;
          }
          case "^": {
            const s = this._addStaticSprite(this.hazards, "tile_spike", x, y, this.tile, this.tile);
            s.setDepth(210);
            s.setData("type", "spike");
            break;
          }

          case "E":
            this._spawnEnemyH(x, y, +60);
            break;
          case "R":
            this._spawnEnemyH(x, y, -60);
            break;
          case "V":
            this._spawnEnemyV(x, y, +70);
            break;
          case "U":
            this._spawnEnemyV(x, y, -70);
            break;

          case "M":
            this._spawnMover(x, y, +60);
            break;
          case "W":
            this._spawnMover(x, y, -60);
            break;

          case "P":
            playerX = x;
            playerY = y;
            break;

          default:
            break;
        }
      }
    }

    return { playerX, playerY };
  }

  _addStaticSprite(group, key, x, y, w, h) {
    const s = group.create(x, y, key);
    s.setOrigin(0.5);
    s.setDisplaySize(w, h);
    s.refreshBody();
    return s;
  }

  // ----------------------------
  // ブロック（下から叩き）
  // ----------------------------
  _onHitBlock(player, block) {
    const pb = player.body;
    const bb = block.body;

    if (!pb.blocked.up) return;

    const wasBelow = pb.prev.y >= bb.y + bb.height - 2;
    if (!wasBelow) return;

    if (this._blockHitLock) return;
    this._blockHitLock = true;
    this.time.delayedCall(120, () => (this._blockHitLock = false));

    pb.setVelocityY(80);

    const type = block.getData("type");
    const used = block.getData("used");

    if (type === "brick") {
      block.destroy();
      return;
    }

    if (type === "question" && !used) {
      block.setData("used", true);
      block.setTint(0xaaaaaa);
      this._spawnCoinPop(block.x, block.y - this.tile * 0.9);
      this._addScore(100);
      return;
    }

    if (type === "mushroom" && !used) {
      block.setData("used", true);
      block.setTint(0xaaaaaa);
      this._spawnMushroom(block.x, block.y - this.tile * 0.9);
      return;
    }
  }

  // ----------------------------
  // 生成系
  // ----------------------------
  _spawnEnemyH(x, y, speed) {
    const e = this.physics.add.sprite(x, y, "spr_enemy");
    e.setDisplaySize(this.tile * 0.65, this.tile * 0.55);
    e.body.setSize(e.displayWidth, e.displayHeight, true);
    e.setData("kind", "h");
    e.setData("speed", speed);
    e.setDepth(400);
    this.enemies.add(e);
  }

  _spawnEnemyV(x, y, startSpeed) {
    const e = this.physics.add.sprite(x, y, "spr_enemy");
    e.setDisplaySize(this.tile * 0.65, this.tile * 0.55);
    e.body.setSize(e.displayWidth, e.displayHeight, true);
    e.body.setAllowGravity(false);
    e.setData("kind", "v");
    e.setData("vSpeed", startSpeed);
    e.setData("minY", y - this.tile * 3);
    e.setData("maxY", y + this.tile * 3);
    e.setDepth(400);
    this.enemies.add(e);
  }

  _spawnMover(x, y, startSpeed) {
    const key = this.textures.exists("spr_platform") ? "spr_platform" : "tile_ground";
    const p = this.movers.create(x, y, key);

    p.setOrigin(0.5);
    p.setDisplaySize(this.tile * 1.6, this.tile * 0.5);
    p.refreshBody();

    p.setDepth(300);
    p.setData("vSpeed", startSpeed);
    p.setData("minY", y - this.tile * 3);
    p.setData("maxY", y + this.tile * 3);

    return p;
  }

  _spawnCoinPop(x, y) {
    const c = this.add.image(x, y, "spr_coin").setDisplaySize(this.tile * 0.45, this.tile * 0.45);
    c.setDepth(600);
    this.tweens.add({
      targets: c,
      y: y - this.tile * 1.2,
      alpha: 0,
      duration: 400,
      onComplete: () => c.destroy(),
    });
  }

  _spawnMushroom(x, y) {
    const key = this.textures.exists("spr_mushroom") ? "spr_mushroom" : "spr_enemy";
    const m = this.physics.add.sprite(x, y, key);

    m.setDisplaySize(this.tile * 0.6, this.tile * 0.6);
    m.body.setSize(m.displayWidth, m.displayHeight, true);
    m.body.setVelocityX(80);

    m.setData("type", "mushroom");
    m.setDepth(450);
    this.items.add(m);
  }

  // ----------------------------
  // ゴール
  // ----------------------------
  _clearCourse() {
    if (this.isClearing) return;
    this.isClearing = true;

    // ★ここで「クリア済み」を保存
    this._saveClearToSlot(this.courseKey);

    const msg = this.add
      .text(this.cameras.main.scrollX + this.scale.width / 2, 140, "CLEAR!", {
        fontSize: "64px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(2000);

    this.time.delayedCall(900, () => {
      msg.destroy();
      this.scene.start(this.returnTo, {
        selectedIndex: this.selectedIndex,
        selectedCourseKey: this.courseKey,
      });
    });
  }

  _setBig(isBig) {
    if (this.isBig === isBig) return;
    this.isBig = isBig;

    if (isBig) {
      this.player.setDisplaySize(this.tile * 0.75, this.tile * 1.2);
      this.player.setTint(0x66ffcc);
    } else {
      this.player.setDisplaySize(this.tile * 0.55, this.tile * 0.75);
      this.player.clearTint();
    }

    this.player.body.setSize(this.player.displayWidth, this.player.displayHeight, true);
  }

  _addScore(v) {
    this.score += v;
    this.scoreText.setText(`SCORE: ${this.score}`);
  }

  _die() {
    this.scene.start(this.returnTo, { selectedIndex: this.selectedIndex, selectedCourseKey: this.courseKey });
  }

  _saveClearToSlot(courseKey) {
  const save = this.registry.get("save");
  const slot = this.registry.get("saveSlot");

  if (!save || !slot) {
    console.warn("save/slot missing. clear not saved.", { save, slot });
    return;
  }

  save.clearedStages = save.clearedStages ?? [];
  if (!save.clearedStages.includes(courseKey)) {
    save.clearedStages.push(courseKey);
  }

  save.updatedAt = Date.now();

  // ★ 3スロット版と同じキー
  localStorage.setItem(`mario2d_save_v1_slot${slot}`, JSON.stringify(save));

  // registryも更新して、戻った直後に反映されるようにする
  this.registry.set("save", save);
}
}
