export function makeRectTexture(scene, key, w, h, color) {
  const g = scene.add.graphics();
  g.fillStyle(color, 1);
  g.fillRoundedRect(0, 0, w, h, 6);
  g.generateTexture(key, w, h);
  g.destroy();
}