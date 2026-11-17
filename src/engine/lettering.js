// Stamps text into pixel-art rows with a bitmap font (the shape of src/art/font.js), so
// lettering on art stays crisp and can be edited as text rather than redrawn.

const glyphOf = (font, char) => font.glyphs[char] ?? font.glyphs[char.toUpperCase()] ?? font.glyphs['?'];

export const textWidth = (text, font) =>
  [...text].reduce((sum, char) => sum + glyphOf(font, char)[0].length + font.spacing, 0) - font.spacing;

// label: { text, x, y, color } where x or y may be 'center'. vertical: the text runs top to
// bottom with the tops of the letters facing right, as on a book's spine.
export function stampText(rows, { text, x, y, color, vertical = false }, font) {
  const grid = rows.map((row) => [...row]);
  const length = textWidth(text, font);
  const across = vertical ? grid[0].length : grid.length; // the axis the letters' height is on
  const along = vertical ? grid.length : grid[0].length;
  const start = (vertical ? y : x) === 'center' ? Math.floor((along - length) / 2) : vertical ? y : x;
  const side = (vertical ? x : y) === 'center' ? Math.floor((across - font.height) / 2) : vertical ? x : y;

  let cursor = start;
  for (const char of text) {
    const glyph = glyphOf(font, char);
    glyph.forEach((line, gy) => {
      [...line].forEach((pixel, gx) => {
        if (pixel !== '#') return;
        const [px, py] = vertical ? [side + font.height - 1 - gy, cursor + gx] : [cursor + gx, side + gy];
        if (grid[py]?.[px] !== undefined) grid[py][px] = color;
      });
    });
    cursor += glyph[0].length + font.spacing;
  }
  return grid.map((row) => row.join(''));
}

// Art whose `labels` are stamped onto its faces: { cover, spine, labels: [{ on: 'cover', font:
// 'tiny', ...label }] } → { cover, spine } with the lettering in. fonts: { tiny: …, main: … }.
export function letterFaces({ labels = [], ...faces }, fonts) {
  const lettered = { ...faces };
  for (const { on, font, ...label } of labels) {
    if (!lettered[on]) throw new Error(`a label is on "${on}", which this art doesn't have`);
    if (!fonts[font]) throw new Error(`a label uses font "${font}"; there are: ${Object.keys(fonts).join(', ')}`);
    lettered[on] = stampText(lettered[on], label, fonts[font]);
  }
  return lettered;
}
