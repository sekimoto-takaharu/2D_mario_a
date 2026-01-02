export const COURSES = {
  ground: {
    name: "地上コース",
    theme: "ground",
    screens: 4,
    worldHeight: 600,
    bg: 0x87ceeb,
    gravityY: 1100,
    player: { accel: 450, maxVX: 180, jumpVY: -520 },
    goal: { x: 0.88 },
    platforms: [
      { x: 0.3, y: 0.75, w: 4 },
      { x: 0.55, y: 0.65, w: 3 },
    ],
    hazards: [],
  },

  underground: {
    name: "地下コース",
    theme: "underground",
    screens: 4,
    worldHeight: 600,
    bg: 0x2b1b14,
    gravityY: 1200,
    player: { accel: 420, maxVX: 170, jumpVY: -500 },
    goal: { x: 0.88 },
    platforms: [
      { x: 0.25, y: 0.72, w: 4 },
      { x: 0.45, y: 0.58, w: 3 },
      { x: 0.7, y: 0.68, w: 3 },
    ],
    overlay: { alpha: 0.3 },
    hazards: [],
  },

  underwater: {
    name: "水中コース",
    theme: "underwater",
    screens: 4,
    worldHeight: 600,
    bg: 0x1e90ff,
    gravityY: 200,
    player: { accel: 260, maxVX: 130, jumpVY: -200 },
    swim: {
      buoyancy: -80,
      upThrust: -700,
      downThrust: 350,
      maxVY: 300,
    },
    goal: { x: 0.88 },
    platforms: [
      { x: 0.3, y: 0.6, w: 3 },
      { x: 0.55, y: 0.5, w: 3 },
    ],
    hazards: [],
  },

  castle: {
    name: "城（マグマ）コース",
    theme: "castle",
    screens: 5,
    worldHeight: 600,
    bg: 0x141414,
    gravityY: 1100,
    player: { accel: 470, maxVX: 185, jumpVY: -520 },
    goal: { x: 0.9 },
    platforms: [
      { x: 0.25, y: 0.65, w: 3 },
      { x: 0.45, y: 0.55, w: 2 },
      { x: 0.65, y: 0.6, w: 3 },
    ],
    hazards: [{ type: "lava", y: 0.96, h: 0.08 }],
  },
};