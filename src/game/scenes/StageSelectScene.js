// src/game/scenes/StageSelectScene.js
import Phaser from "phaser";
import { COURSES } from "../courses";

export class StageSelectScene extends Phaser.Scene {
  constructor() {
    super("StageSelectScene");
  }

  preload() {
    // ★ここが重要：StageSelectで使う画像はStageSelectでロードする
    this.load.image("spr_player", "assets/player.png");
  }

  create(data) {
    // フォーカス保険（キー入力が効かない対策）
    if (this.game?.canvas) {
      this.game.canvas.setAttribute("tabindex", "0");
      this.game.canvas.focus();
    }
    this.input.on("pointerdown", () => this.game?.canvas?.focus());

    this.cameras.main.setBackgroundColor(0xffffff);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.addCapture(["UP", "DOWN", "LEFT", "RIGHT", "SPACE"]);

    // 利用可能ステージ（COURSESの並びで表示）
    this.courseKeys = Object.keys(COURSES);
    console.log("COURSES keys:", this.courseKeys); // ★確認用

    // 4ステージ想定の配置
    this.positions = [
      { x: 200, y: 350 },
      { x: 440, y: 420 },
      { x: 720, y: 350 },
      { x: 1040, y: 420 },
    ];

    // コース数 > positions のときは横に並べる簡易配置
    if (this.courseKeys.length > this.positions.length) {
      this.positions = this.courseKeys.map((_, i) => ({
        x: 180 + i * 220,
        y: i % 2 === 0 ? 350 : 420,
      }));
    }

    // 選択中インデックス
    this.selectedIndex = 0;
    if (typeof data?.selectedIndex === "number") this.selectedIndex = data.selectedIndex;

    if (data?.selectedCourseKey) {
      const idx = this.courseKeys.indexOf(data.selectedCourseKey);
      if (idx >= 0) this.selectedIndex = idx;
    }

    // 上部タイトル枠
    this.headerBox = this.add.graphics();
    this.headerBox.lineStyle(3, 0x000000, 1);
    this.headerBox.strokeRect(340, 60, 600, 90);

    this.stageNameText = this.add
      .text(this.scale.width / 2, 105, "", {
        fontSize: "32px",
        color: "#000",
      })
      .setOrigin(0.5);

    // 道（点線）
    this._drawDottedPath();

    // ステージ楕円（courseKeysの数だけ描く）
    this.stageNodes = [];
    for (let i = 0; i < this.courseKeys.length; i++) {
      const pos = this.positions[i];

      const g = this.add.graphics();
      g.fillStyle(0x0b5a78, 1);
      g.lineStyle(3, 0x083647, 1);
      g.fillEllipse(pos.x, pos.y, 140, 95);
      g.strokeEllipse(pos.x, pos.y, 140, 95);

      const num = this.add
        .text(pos.x, pos.y, String(i + 1), { fontSize: "28px", color: "#fff" })
        .setOrigin(0.5);

      this.stageNodes.push({ gfx: g, label: num, x: pos.x, y: pos.y });
    }

    // キャラ（選択カーソル）
    this.cursorChar = this.add.image(0, 0, "spr_player");
    this.cursorChar.setDisplaySize(40, 40);
    this.cursorChar.setDepth(10);

    // 補足
    this.add
      .text(70, 560, "← / → で移動   SPACE でステージ開始\n死亡した場合はこの画面に戻ります", {
        fontSize: "18px",
        color: "#000",
      })
      .setDepth(20);

    // 入力ログ（原因切り分け用：不要なら消してOK）
    this.input.keyboard.on("keydown", (ev) => {
      console.log("keydown:", ev.code);
    });

    // 初期反映
    this._applySelection();

    // 入力（LEFT/RIGHTで移動）
    this.input.keyboard.on("keydown-LEFT", () => this._moveSelection(-1));
    this.input.keyboard.on("keydown-RIGHT", () => this._moveSelection(+1));

    // UP/DOWNも同様に（好みで）
    this.input.keyboard.on("keydown-UP", () => this._moveSelection(-1));
    this.input.keyboard.on("keydown-DOWN", () => this._moveSelection(+1));

    this.input.keyboard.on("keydown-SPACE", () => {
      const courseKey = this.courseKeys[this.selectedIndex];
      this.scene.start("GameScene", {
        courseKey,
        returnTo: "StageSelectScene",
        selectedIndex: this.selectedIndex,
      });
    });
  }

  _moveSelection(dir) {
    const n = this.courseKeys.length;
    if (n <= 1) return; // 1個しかないなら動かない

    this.selectedIndex = (this.selectedIndex + dir + n) % n;
    this._applySelection();
  }

  _applySelection() {
    const courseKey = this.courseKeys[this.selectedIndex];
    const course = COURSES[courseKey];

    this.stageNameText.setText(`ステージ${this.selectedIndex + 1}： ${course?.name ?? courseKey}`);

    const p = this.positions[this.selectedIndex];
    this.cursorChar.setPosition(p.x, p.y - 20);

    // 選択中だけ枠を太く
    for (let i = 0; i < this.stageNodes.length; i++) {
      const node = this.stageNodes[i];
      node.gfx.clear();

      const isSel = i === this.selectedIndex;
      node.gfx.fillStyle(0x0b5a78, 1);
      node.gfx.lineStyle(isSel ? 6 : 3, isSel ? 0xffcc00 : 0x083647, 1);
      node.gfx.fillEllipse(node.x, node.y, 140, 95);
      node.gfx.strokeEllipse(node.x, node.y, 140, 95);
    }
  }

  _drawDottedPath() {
    const g = this.add.graphics();
    g.lineStyle(3, 0x0b5a78, 1);

    const dots = (x1, y1, x2, y2, seg = 10, gap = 8) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1) return;

      const ux = dx / len;
      const uy = dy / len;

      let t = 0;
      while (t < len) {
        const a = t;
        const b = Math.min(t + seg, len);
        g.beginPath();
        g.moveTo(x1 + ux * a, y1 + uy * a);
        g.lineTo(x1 + ux * b, y1 + uy * b);
        g.strokePath();
        t += seg + gap;
      }
    };

    // positions の間をつなぐ
    for (let i = 0; i < this.positions.length - 1; i++) {
      const p1 = this.positions[i];
      const p2 = this.positions[i + 1];

      const midX = (p1.x + p2.x) / 2;
      const midY = Math.min(p1.y, p2.y) - 90;

      dots(p1.x + 80, p1.y, midX, midY);
      dots(midX, midY, p2.x - 80, p2.y);
    }
  }
}
