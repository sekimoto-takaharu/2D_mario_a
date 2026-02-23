import Phaser from "phaser";

const KEY_PREFIX = "mario2d_save_v1_slot";

function keyOf(slotNo) {
  return `${KEY_PREFIX}${slotNo}`;
}

function loadSlot(slotNo) {
  try {
    const raw = localStorage.getItem(keyOf(slotNo));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSlot(slotNo, data) {
  localStorage.setItem(keyOf(slotNo), JSON.stringify(data));
}

function deleteSlot(slotNo) {
  localStorage.removeItem(keyOf(slotNo));
}

function makeNewSave() {
  const now = Date.now();
  return {
    version: 1,
    createdAt: now,
    updatedAt: now,
    clearedStages: [],
    coins: 0,
    lives: 3,
    player: { hp: 3 },
  };
}

export class SaveDataScene extends Phaser.Scene {
  constructor() {
    super("SaveDataScene");
  }

  create() {
    const w = this.scale.width;

    this.cameras.main.setBackgroundColor("#111827");

    this.add
      .text(w / 2, 90, "セーブデータを選択", {
        fontFamily: "monospace",
        fontSize: "38px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(w / 2, 140, "クリック or 1/2/3 で選択 / D で削除", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#9ca3af",
      })
      .setOrigin(0.5);

    this.selectedSlot = 1;

    this.slotTexts = [];
    this.slotData = [null, loadSlot(1), loadSlot(2), loadSlot(3)];

    const startY = 240;
    const gapY = 120;

    for (let i = 1; i <= 3; i++) {
      const y = startY + (i - 1) * gapY;
      const line = this.renderSlotLine(i, y);
      this.slotTexts[i] = line;
    }

    this.updateHighlight();

    // クリックで選択/開始
    for (let i = 1; i <= 3; i++) {
      this.slotTexts[i].container.setInteractive(
        new Phaser.Geom.Rectangle(-450, -40, 900, 80),
        Phaser.Geom.Rectangle.Contains
      );
      this.slotTexts[i].container.on("pointerdown", () => {
        this.selectedSlot = i;
        this.updateHighlight();
        this.startSelectedSlot();
      });
    }

    // キー操作
    this.input.keyboard.on("keydown-ONE", () => this.selectSlot(1));
    this.input.keyboard.on("keydown-TWO", () => this.selectSlot(2));
    this.input.keyboard.on("keydown-THREE", () => this.selectSlot(3));
    this.input.keyboard.on("keydown-ENTER", () => this.startSelectedSlot());
    this.input.keyboard.on("keydown-D", () => this.deleteSelectedSlot());
    this.input.keyboard.on("keydown-ESC", () => this.scene.start("TitleScene"));

    this.add
      .text(w / 2, 660, "Enter: 決定 / Esc: タイトルへ", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#9ca3af",
      })
      .setOrigin(0.5);
  }

  renderSlotLine(slotNo, y) {
    const w = this.scale.width;

    const container = this.add.container(w / 2, y);

    const bg = this.add
      .rectangle(0, 0, 900, 80, 0x1f2937)
      .setStrokeStyle(3, 0x374151);
    container.add(bg);

    const data = this.slotData[slotNo];

    const left = this.add.text(-420, -18, `SLOT ${slotNo}`, {
      fontFamily: "monospace",
      fontSize: "22px",
      color: "#ffffff",
    });

    const rightText = data
      ? `コイン ${data.coins ?? 0} / 残機 ${data.lives ?? 3} / クリア ${(data.clearedStages ?? []).length}`
      : "データなし（新規作成）";

    const right = this.add.text(-420, 12, rightText, {
      fontFamily: "monospace",
      fontSize: "16px",
      color: data ? "#d1d5db" : "#fbbf24",
    });

    const updated =
      data?.updatedAt ? `最終更新: ${new Date(data.updatedAt).toLocaleString()}` : "";

    const time = this.add
      .text(420, 12, updated, {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#9ca3af",
      })
      .setOrigin(1, 0);

    container.add([left, right, time]);

    return { container, bg, left, right, time, rightTextObj: right };
  }

  refreshSlotLine(slotNo) {
    const data = this.slotData[slotNo];
    const line = this.slotTexts[slotNo];

    const rightText = data
      ? `コイン ${data.coins ?? 0} / 残機 ${data.lives ?? 3} / クリア ${(data.clearedStages ?? []).length}`
      : "データなし（新規作成）";

    line.right.setText(rightText);
    line.right.setColor(data ? "#d1d5db" : "#fbbf24");

    const updated =
      data?.updatedAt ? `最終更新: ${new Date(data.updatedAt).toLocaleString()}` : "";
    line.time.setText(updated);
  }

  selectSlot(n) {
    this.selectedSlot = n;
    this.updateHighlight();
  }

  updateHighlight() {
    for (let i = 1; i <= 3; i++) {
      const isSel = i === this.selectedSlot;
      this.slotTexts[i].bg
        .setFillStyle(isSel ? 0x111827 : 0x1f2937)
        .setStrokeStyle(3, isSel ? 0xfbbf24 : 0x374151);
    }
  }

  startSelectedSlot() {
    const slotNo = this.selectedSlot;
    let data = this.slotData[slotNo];

    if (!data) {
      data = makeNewSave();
    } else {
      data.updatedAt = Date.now();
    }

    writeSlot(slotNo, data);
    this.slotData[slotNo] = data;
    this.refreshSlotLine(slotNo);

    this.registry.set("saveSlot", slotNo);
    this.registry.set("save", data);

    this.scene.start("StageSelectScene");
  }

  deleteSelectedSlot() {
    const slotNo = this.selectedSlot;
    const data = this.slotData[slotNo];
    if (!data) return;

    deleteSlot(slotNo);
    this.slotData[slotNo] = null;
    this.refreshSlotLine(slotNo);
    this.updateHighlight();
  }
}