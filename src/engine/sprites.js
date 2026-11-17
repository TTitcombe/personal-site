import { paintPixelArt } from './pixel-art.js';

// Turns a character definition ({ down, up, left } each with { stand, step? }) into
// four-frame walk cycles per direction. Characters without `step` frames just stand.
// Uses the Game Boy conventions:
// - up/down alternate feet by mirroring the step frame
// - side views can't mirror (that turns them around), so they repeat the step
// - right is the left-facing art mirrored
export function buildWalkCycles(character, palette) {
  const paint = (rows, mirror = false) => paintPixelArt(rows, palette, { mirror });
  const vertical = ({ stand, step = stand }) => {
    const standing = paint(stand);
    return [standing, paint(step), standing, paint(step, true)];
  };
  const side = ({ stand, step = stand }, mirror) => {
    const standing = paint(stand, mirror);
    const stepping = paint(step, mirror);
    return [standing, stepping, standing, stepping];
  };
  return {
    down: vertical(character.down),
    up: vertical(character.up),
    left: side(character.left, false),
    right: side(character.left, true),
  };
}
