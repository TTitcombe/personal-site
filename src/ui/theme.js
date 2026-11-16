import { paintPixelArt } from '../engine/pixel-art.js';

// Applies the UI art (art/ui.js) to the HTML over the game: the frame becomes a border
// image and the colours become CSS variables, all set on `element` for its children to use.
// Also starts loading the pixel font, so it's ready before the first text box.
export function applyTheme(element, ui, palette) {
  document.fonts?.load(`9px ${getComputedStyle(element).fontFamily}`);
  const frame = paintPixelArt(ui.frame, palette).toDataURL();
  element.style.setProperty('--frame', `url(${frame})`);
  element.style.setProperty('--frame-slice', ui.slice);
  for (const [name, key] of Object.entries(ui.colors)) {
    element.style.setProperty(`--ui-${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`, palette[key]);
  }
}
