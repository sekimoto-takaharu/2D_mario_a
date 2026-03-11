const KEY_PREFIX = "mario2d_save_v1_slot";

export function keyOf(slotNo) {
  return `${KEY_PREFIX}${slotNo}`;
}

export function makeNewSave() {
  const now = Date.now();

  return {
    version: 2,
    createdAt: now,
    updatedAt: now,
    clearedStages: [],
    coins: 0,
    lives: 3,
    player: { hp: 3 },
    story: {
      introSeen: false,
      interludes: {},
      endingSeen: false,
    },
  };
}

export function normalizeSave(data) {
  const base = makeNewSave();
  const save = data && typeof data === "object" ? data : {};

  return {
    ...base,
    ...save,
    clearedStages: Array.isArray(save.clearedStages) ? [...save.clearedStages] : [],
    player: {
      ...base.player,
      ...(save.player ?? {}),
    },
    story: {
      ...base.story,
      ...(save.story ?? {}),
      interludes: {
        ...(save.story?.interludes ?? {}),
      },
    },
  };
}

export function loadSlot(slotNo) {
  try {
    const raw = localStorage.getItem(keyOf(slotNo));
    return raw ? normalizeSave(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function writeSlot(slotNo, data) {
  localStorage.setItem(keyOf(slotNo), JSON.stringify(normalizeSave(data)));
}

export function markStorySeen(save, storyId) {
  const next = normalizeSave(save);

  if (storyId === "intro") {
    next.story.introSeen = true;
    return next;
  }

  if (storyId === "ending") {
    next.story.endingSeen = true;
    return next;
  }

  if (storyId.startsWith("clear_")) {
    const courseKey = storyId.replace("clear_", "");
    next.story.interludes[courseKey] = true;
  }

  return next;
}
