// Pixel art is authored as arrays of strings: one character per pixel, each mapped
// to a colour in the palette. TRANSPARENT pixels are left empty.
export const TRANSPARENT = '.';

// Checks every row is the same width and only uses palette keys. Pass `width`/`height` to
// require an exact size, or `multipleOf` for art that spans whole tiles.
export function validatePixelArt(name, rows, palette, { width, height, multipleOf } = {}) {
  const rowWidth = rows[0]?.length ?? 0;
  if (height !== undefined && rows.length !== height) {
    throw new Error(`${name}: has ${rows.length} rows, expected ${height}`);
  }
  rows.forEach((row, y) => {
    const expected = width ?? rowWidth;
    if (row.length !== expected) {
      throw new Error(`${name}: row ${y} is ${row.length}px wide, expected ${expected}`);
    }
    for (const char of row) {
      if (char !== TRANSPARENT && !(char in palette)) {
        throw new Error(`${name}: row ${y} uses "${char}", which is not in the palette`);
      }
    }
  });
  if (multipleOf && (rowWidth % multipleOf || rows.length % multipleOf || !rows.length)) {
    throw new Error(`${name}: is ${rowWidth}×${rows.length}px, expected multiples of ${multipleOf}`);
  }
}

export function paintPixelArt(rows, palette, { mirror = false } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = rows[0].length;
  canvas.height = rows.length;
  const ctx = canvas.getContext('2d');
  rows.forEach((row, y) => {
    [...row].forEach((char, x) => {
      if (char === TRANSPARENT) return;
      ctx.fillStyle = palette[char];
      ctx.fillRect(mirror ? canvas.width - 1 - x : x, y, 1, 1);
    });
  });
  return canvas;
}
