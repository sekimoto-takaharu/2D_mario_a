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

    // ---- セーブ情報（SaveDataScene で registry に入れてある前提）----
    this.save = this.registry.get("save") || null;
    this.slot = this.registry.get("saveSlot") || null;

    // クリア済みステージ
    this.clearedSet = new Set(this.save?.clearedStages ?? []);

    // ---- 入力 ----
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.addCapture(["UP", "DOWN", "LEFT", "RIGHT", "SPACE"]);

    // ---- ステージ一覧（COURSESの並び＝ステージ順の前提）----
    this.courseKeys = Object.keys(COURSES);
    console.log("COURSES keys:", this.courseKeys);

    // ---- 解放判定：クリア済み + 次の1個だけプレイ可能 ----
    // 例）1-1 クリア済み → unlockedMaxIndex = 1 → 1-2 まで解放
    // 何もクリアしてない → unlockedMaxIndex = 0 → 1-1 だけ解放
    this.unlockedMaxIndex = this._calcUnlockedMaxIndex();

    // ---- 位置 ----
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

    // ---- 選択中インデックス ----
    this.selectedIndex = 0;
    if (typeof data?.selectedIndex === "number") this.selectedIndex = data.selectedIndex;

    if (data?.selectedCourseKey) {
      const idx = this.courseKeys.indexOf(data.selectedCourseKey);
      if (idx >= 0) this.selectedIndex = idx;
    }

    // 念のため：ロック範囲を選択して復帰してきたら、解放済みに寄せる
    if (this.selectedIndex > this.unlockedMaxIndex) {
      this.selectedIndex = this.unlockedMaxIndex;
    }

    // ---- 上部タイトル枠 ----
    this.headerBox = this.add.graphics();
    this.headerBox.lineStyle(3, 0x000000, 1);
    this.headerBox.strokeRect(260, 50, 760, 120);

    // セーブ表示
    this.saveInfoText = this.add
      .text(290, 65, "", { fontSize: "20px", color: "#000" })
      .setDepth(30);

    this._updateSaveInfoText();

    // ステージ名
    this.stageNameText = this.add
      .text(this.scale.width / 2, 130, "", {
        fontSize: "34px",
        color: "#000",
      })
      .setOrigin(0.5);

    // ロック/説明
    this.subText = this.add
      .text(this.scale.width / 2, 165, "", {
        fontSize: "18px",
        color: "#000",
      })
      .setOrigin(0.5);

    // 道（点線）
    this._drawDottedPath();

    // ---- ステージ楕円（courseKeysの数だけ描く）----
    this.stageNodes = [];
    for (let i = 0; i < this.courseKeys.length; i++) {
      const pos = this.positions[i];

      const g = this.add.graphics();

      const num = this.add
        .text(pos.x, pos.y, String(i + 1), { fontSize: "28px", color: "#fff" })
        .setOrigin(0.5);

      const mark = this.add
        .text(pos.x + 55, pos.y - 35, "", { fontSize: "28px", color: "#000" })
        .setOrigin(0.5);

      this.stageNodes.push({
        gfx: g,
        label: num,
        mark,
        x: pos.x,
        y: pos.y,
      });
    }

    // キャラ（選択カーソル）
    this.cursorChar = this.add.image(0, 0, "spr_player");
    this.cursorChar.setDisplaySize(40, 40);
    this.cursorChar.setDepth(10);

    // 補足
    this.add
      .text(
        70,
        560,
        "← / → で移動   SPACE でステージ開始\nロック中のステージは開始できません\n死亡した場合はこの画面に戻ります",
        {
          fontSize: "18px",
          color: "#000",
        }
      )
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

    // ステージ開始
    this.input.keyboard.on("keydown-SPACE", () => {
      const isLocked = this._isLockedIndex(this.selectedIndex);
      if (isLocked) {
        this.cameras.main.shake(120, 0.006);
        return;
      }

      const courseKey = this.courseKeys[this.selectedIndex];
      this.scene.start("GameScene", {
        courseKey,
        returnTo: "StageSelectScene",
        selectedIndex: this.selectedIndex,
      });
    });
  }

  // ---- 解放上限を計算（クリア済み + 次の1つだけ）----
  _calcUnlockedMaxIndex() {
    // 何もクリアしてないなら 0（1番目だけ解放）
    if (!this.courseKeys?.length) return 0;

    let lastClearedIndex = -1;
    for (let i = 0; i < this.courseKeys.length; i++) {
      const key = this.courseKeys[i];
      if (this.clearedSet.has(key)) lastClearedIndex = i;
    }

    // 次の1つまで解放
    const unlocked = Math.min(lastClearedIndex + 1, this.courseKeys.length - 1);

    // lastClearedIndex=-1 なら unlocked=0 になる
    return Math.max(unlocked, 0);
  }

  _isLockedIndex(index) {
    return index > this.unlockedMaxIndex;
  }

  _updateSaveInfoText() {
    const coins = this.save?.coins ?? 0;
    const lives = this.save?.lives ?? 3;
    const clearedCount = (this.save?.clearedStages ?? []).length;

    if (this.slot) {
      this.saveInfoText.setText(`SLOT ${this.slot}   コイン:${coins}   残機:${lives}   クリア:${clearedCount}`);
    } else {
      this.saveInfoText.setText(`セーブ未選択   コイン:${coins}   残機:${lives}   クリア:${clearedCount}`);
    }
  }

  _moveSelection(dir) {
    const n = this.courseKeys.length;
    if (n <= 1) return;

    this.selectedIndex = (this.selectedIndex + dir + n) % n;
    this._applySelection();
  }

  _applySelection() {
    const courseKey = this.courseKeys[this.selectedIndex];
    const course = COURSES[courseKey];

    const isLocked = this._isLockedIndex(this.selectedIndex);
    const isCleared = this.clearedSet.has(courseKey);

    // タイトル表示
    if (isLocked) {
      this.stageNameText.setText(`ステージ${this.selectedIndex + 1}： ？？？`);
      this.subText.setText("前のステージをクリアすると解放されます");
    } else {
      this.stageNameText.setText(`ステージ${this.selectedIndex + 1}： ${course?.name ?? courseKey}`);
      this.subText.setText(isCleared ? "クリア済み（✓）" : "未クリア");
    }

    // キャラ位置
    const p = this.positions[this.selectedIndex];
    this.cursorChar.setPosition(p.x, p.y - 20);

    // ノード描画（ロック/クリア/選択を反映）
    for (let i = 0; i < this.stageNodes.length; i++) {
      const node = this.stageNodes[i];
      const key = this.courseKeys[i];
      const locked = this._isLockedIndex(i);
      const cleared = this.clearedSet.has(key);
      const sel = i === this.selectedIndex;

      node.gfx.clear();

      // ロックなら灰色、解放なら青
      const fill = locked ? 0x9ca3af : 0x0b5a78;
      const stroke = locked ? 0x6b7280 : 0x083647;

      node.gfx.fillStyle(fill, 1);
      node.gfx.lineStyle(sel ? 6 : 3, sel ? 0xffcc00 : stroke, 1);
      node.gfx.fillEllipse(node.x, node.y, 140, 95);
      node.gfx.strokeEllipse(node.x, node.y, 140, 95);

      // 数字の色（ロックは薄く）
      node.label.setColor(locked ? "#e5e7eb" : "#ffffff");

      // クリアマーク
      node.mark.setText(cleared ? "✓" : "");
      node.mark.setColor("#111827");
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