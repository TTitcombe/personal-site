// A mug you can turn, like a book (book.js): from flat art it draws a cylinder with a handle,
// seen a little from above, with the `print` (a company's logo) wrapped round it. Every frame
// is sampled texel by texel from the art, so it stays pixel art in the palette. At 0° the
// print faces you and the handle points right.
import { outlined } from './book.js';

const TRANSPARENT = '.';
// One shape for every mug, so they line up on a shelf.
export const MUG = { width: 34, height: 34, rim: 7, handle: 9 };

// The handle, from the mug's side outwards (columns) and from its top down (rows).
const HANDLE = [
  'xxxxxx...',
  'xxxxxxxx.',
  '.....xxxx',
  '......xxx',
  '......xxx',
  '......xxx',
  '......xxx',
  '......xxx',
  '......xxx',
  '.....xxxx',
  'xxxxxxxx.',
  'xxxxxx...',
];
const HANDLE_TOP = 7; // rows below the top of the body

// The frame that fits the mug at every angle (the handle swings to either side).
export function mugFrameSize() {
  return { width: MUG.width + MUG.handle * 2 + 2, height: MUG.height + MUG.rim + 2 };
}

// mug: { body, rim, inside, print: rows } in palette keys; shade: colour → darker colour.
export function turnMug(mug, angle = 0, { shade = null } = {}) {
  const { width, height, rim, handle } = MUG;
  const frame = mugFrameSize();
  const grid = Array.from({ length: frame.height - 2 }, () => Array(frame.width - 2).fill(TRANSPARENT));
  const radius = width / 2;
  const left = handle; // where the body starts
  const turn = (angle * Math.PI) / 180;
  const darker = (texel) => shade?.[texel] ?? texel;

  // The print wrapped round the body: its middle column at the front when the angle is 0.
  const around = Math.round(Math.PI * width);
  const print = mug.print ?? [];
  const printWidth = print[0]?.length ?? 0;
  const printTop = Math.floor((height - print.length) / 2) + 1;
  const texel = (column, row) => {
    const p = column - Math.floor((around - printWidth) / 2);
    const pixel = print[row - printTop]?.[p];
    return pixel && pixel !== TRANSPARENT ? pixel : mug.body;
  };

  // The handle, where it is on the mug at this angle: behind the body or in front of it.
  const side = Math.PI / 2 - turn; // its direction round the mug, from facing you
  const drawHandle = () => {
    const [sin, cos] = [Math.sin(side), Math.cos(side)];
    const behind = cos < -0.2;
    const drawn = new Set();
    HANDLE.forEach((row, y) => {
      const at = Math.floor(rim / 2) + HANDLE_TOP + y;
      [...row].forEach((pixel, out) => {
        if (pixel === TRANSPARENT) return;
        // Its corners, out from the side and across the handle's thickness (3px).
        const xs = [radius - 1 + out, radius + out].flatMap((r) => [-1.5, 1.5].map((t) => left + radius + r * sin + t * cos));
        // In shade behind the mug, and on its outer edge when it's on the right (away from the light).
        const colour = behind || (sin > 0.5 && out >= HANDLE[0].length - 2) ? darker(mug.body) : mug.body;
        for (let x = Math.round(Math.min(...xs)); x < Math.round(Math.max(...xs)); x++) {
          if (grid[at]?.[x] === undefined) continue;
          grid[at][x] = colour;
          drawn.add(`${x},${at}`);
        }
      });
    });
    // In front of the mug it needs its own outline, or it's lost against the mug's colour.
    if (behind) return;
    for (const key of drawn) {
      const [x, y] = key.split(',').map(Number);
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (!drawn.has(`${nx},${ny}`) && grid[ny]?.[nx] !== undefined && grid[ny][nx] !== TRANSPARENT) grid[ny][nx] = 'k';
      }
    }
  };
  const handleBehind = Math.cos(side) < 0;
  if (handleBehind) drawHandle();

  for (let x = 0; x < width; x++) {
    const across = (x + 0.5 - radius) / radius; // -1 at the left edge, 1 at the right
    const arc = Math.sqrt(1 - across * across) * (rim / 2); // how far the ellipses bulge here
    const angleHere = Math.asin(across) + turn;
    const column = Math.floor((((angleHere / (2 * Math.PI) + 0.5) % 1) + 1) % 1 * around);
    // Light from the left: the right of the mug is in shade, dithered where it turns.
    const lit = across < 0.35 ? 'lit' : across < 0.6 ? 'half' : 'shade';
    const top = Math.round(rim / 2 + arc);
    const bottom = Math.round(rim / 2 + height + arc);
    for (let y = top; y < bottom; y++) {
      let pixel = texel(column, y - top);
      if (lit === 'shade' || (lit === 'half' && (x + y) % 2)) pixel = darker(pixel);
      if (across > -0.75 && across < -0.62 && pixel === mug.body && mug.shine) pixel = mug.shine;
      grid[y][left + x] = pixel;
    }
    // The open top: the rim's ring, and inside it the far wall and the drink.
    const back = Math.round(rim / 2 - arc);
    for (let y = back; y < top; y++) {
      const edge = y === back || y === top - 1 || x === 0 || x === width - 1;
      grid[y][left + x] = edge ? mug.rim : y < back + 3 ? darker(mug.inside) : mug.inside;
    }
  }

  if (!handleBehind) drawHandle();
  return outlined(grid.map((row) => row.join('')));
}

// The same mug a few pixels big, for the shelf in the office: its colour, the print's main
// colour as a dot, and the handle.
export function tinyMug(mug, { shade = null } = {}) {
  const counts = {};
  for (const row of mug.print ?? []) for (const pixel of row) if (pixel !== TRANSPARENT) counts[pixel] = (counts[pixel] ?? 0) + 1;
  const accent = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? mug.body;
  const b = mug.body;
  const s = shade?.[b] ?? b;
  return ['kkkkk..', `k${mug.inside}${mug.inside}${mug.inside}k..`, `k${b}${b}${s}kk.`, `k${accent}${b}${s}k.k`, `k${b}${b}${s}k.k`, `k${b}${b}${s}kk.`, 'kkkkk..'];
}

// Art with its fully transparent columns either side cut off (a mug on a shelf, standing close
// to the next one).
export function trimmed(rows) {
  const used = (x) => rows.some((row) => row[x] !== TRANSPARENT);
  let start = 0;
  let end = rows[0].length;
  while (start < end && !used(start)) start++;
  while (end > start && !used(end - 1)) end--;
  return rows.map((row) => row.slice(start, end));
}
