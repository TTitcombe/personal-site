// Share images (og:image): the card LinkedIn, X and friends show when a link is posted.
// Drawn in the game's style: the office floor, a text box with the title in the pixel font,
// and Tom. 1200×630, built from a 240×126 grid of 5px "game pixels".
import { characters, palette, tiles } from '../src/art/index.js';
import { font } from '../src/art/font.js';
import { createBitmap, encodePng } from './png.js';

const UNIT = 5;
const WIDTH = 240;
const HEIGHT = 126;
const BOX = { x: 8, y: 8, width: 224, height: 80 };
const PADDING = 8;

const glyph = (char) => font.glyphs[char] ?? font.glyphs['?'];
const textWidth = (text) =>
  [...text].reduce((sum, char) => sum + glyph(char)[0].length + font.spacing, 0) - font.spacing;

// Greedy word wrap to `maxWidth` game pixels at `scale`.
function wrap(text, maxWidth, scale) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && textWidth(candidate) * scale > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawText(bitmap, text, x, y, scale, colour) {
  let cursor = x;
  for (const char of text) {
    const rows = glyph(char);
    rows.forEach((row, ry) => {
      [...row].forEach((pixel, rx) => {
        if (pixel === '#') {
          bitmap.fill((cursor + rx * scale) * UNIT, (y + ry * scale) * UNIT, scale * UNIT, scale * UNIT, colour);
        }
      });
    });
    cursor += (rows[0].length + font.spacing) * scale;
  }
}

// The biggest text size at which `text` fits in the box.
function layoutTitle(text) {
  const maxWidth = BOX.width - PADDING * 2;
  const maxHeight = BOX.height - PADDING * 2;
  for (const scale of [3, 2, 1]) {
    const lines = wrap(text, maxWidth, scale);
    const lineHeight = (font.height + 2) * scale;
    if (lines.length * lineHeight - 2 * scale <= maxHeight && lines.every((l) => textWidth(l) * scale <= maxWidth)) {
      return { lines, scale, lineHeight };
    }
  }
  const lines = wrap(text, maxWidth, 1);
  return { lines: lines.slice(0, 6), scale: 1, lineHeight: font.height + 2 };
}

export function shareImage({ title, footer, subtitle }) {
  const bitmap = createBitmap(WIDTH * UNIT, HEIGHT * UNIT, palette.f);
  for (let y = 0; y < HEIGHT; y += 16) {
    for (let x = 0; x < WIDTH; x += 16) bitmap.drawArt(tiles.floor, palette, x * UNIT, y * UNIT, UNIT);
  }

  // The text box: paper inside a double outline, like the game's dialogue box.
  const box = (inset, colour) =>
    bitmap.fill((BOX.x + inset) * UNIT, (BOX.y + inset) * UNIT, (BOX.width - inset * 2) * UNIT, (BOX.height - inset * 2) * UNIT, colour);
  box(0, palette.k);
  box(1, palette.w);
  box(2, palette.k);
  box(3, palette.w);

  const { lines, scale, lineHeight } = layoutTitle(title);
  const textHeight = lines.length * lineHeight - 2 * scale;
  let y = BOX.y + Math.round((BOX.height - textHeight) / 2);
  for (const line of lines) {
    drawText(bitmap, line, BOX.x + PADDING, y, scale, palette.k);
    y += lineHeight;
  }

  // Tom standing on the floor below the box, with the site's name beside him.
  const tom = characters.tom.down.stand;
  bitmap.drawArt(tom, palette, 14 * UNIT, 92 * UNIT, UNIT * 2);
  drawText(bitmap, footer, 52, 98, 1, palette.k);
  if (subtitle) drawText(bitmap, subtitle, 52, 110, 1, palette.d);
  return encodePng(bitmap);
}
