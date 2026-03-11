import Phaser from "phaser";
import { STORY_EVENTS } from "../story";
import { markStorySeen, normalizeSave, writeSlot } from "../utils/saveData";

export class StoryScene extends Phaser.Scene {
  constructor() {
    super("StoryScene");
  }

  create(data) {
    this.storyId = data?.storyId ?? "intro";
    this.nextScene = data?.nextScene ?? "StageSelectScene";
    this.nextData = data?.nextData ?? {};
    this.story = STORY_EVENTS[this.storyId];

    if (!this.story) {
      this.scene.start(this.nextScene, this.nextData);
      return;
    }

    this.pageIndex = 0;
    this._persistSeenFlag();

    this.cameras.main.setBackgroundColor("#0f172a");

    this.add
      .rectangle(this.scale.width / 2, this.scale.height / 2, 1040, 560, 0x111827, 0.92)
      .setStrokeStyle(4, Phaser.Display.Color.HexStringToColor(this.story.accent).color);

    this.add
      .text(this.scale.width / 2, 150, this.story.title, {
        fontFamily: "monospace",
        fontSize: "40px",
        color: this.story.accent,
      })
      .setOrigin(0.5);

    this.bodyText = this.add
      .text(this.scale.width / 2, 340, "", {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#f8fafc",
        align: "center",
        wordWrap: { width: 820 },
        lineSpacing: 14,
      })
      .setOrigin(0.5);

    this.pageText = this.add
      .text(this.scale.width / 2, 520, "", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#94a3b8",
      })
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, 610, "SPACE / ENTER: つぎへ   ESC: スキップ", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#cbd5e1",
      })
      .setOrigin(0.5);

    this._renderPage();

    this.input.keyboard.addCapture(["SPACE", "ENTER", "ESC"]);
    this.input.keyboard.on("keydown-SPACE", () => this._advance());
    this.input.keyboard.on("keydown-ENTER", () => this._advance());
    this.input.keyboard.on("keydown-ESC", () => this._finish());
    this.input.on("pointerdown", () => this._advance());
  }

  _persistSeenFlag() {
    const slot = this.registry.get("saveSlot");
    const save = normalizeSave(this.registry.get("save"));
    const next = markStorySeen(save, this.storyId);

    next.updatedAt = Date.now();
    this.registry.set("save", next);

    if (slot) {
      writeSlot(slot, next);
    }
  }

  _renderPage() {
    const pages = this.story.pages ?? [];
    const current = pages[this.pageIndex] ?? "";

    this.bodyText.setAlpha(0);
    this.bodyText.setText(current);
    this.pageText.setText(`${this.pageIndex + 1} / ${pages.length}`);

    this.tweens.add({
      targets: this.bodyText,
      alpha: 1,
      duration: 220,
      ease: "Sine.easeOut",
    });
  }

  _advance() {
    const pages = this.story.pages ?? [];

    if (this.pageIndex >= pages.length - 1) {
      this._finish();
      return;
    }

    this.pageIndex += 1;
    this._renderPage();
  }

  _finish() {
    this.scene.start(this.nextScene, this.nextData);
  }
}
