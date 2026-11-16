// A book you can turn in your hands. From its spine and cover art (pixel rows of the same
// height) it draws the book as a box seen at an angle: 0° shows the spine, 90° the cover,
// in between both, in perspective. It renders at the art's own resolution by sampling the
// nearest texel, so every frame is still pixel art in the palette, never smoothed.
const TRANSPARENT = '.';

// The frame size that fits the book at every angle, so frames of a turn line up.
export function bookFrameSize({ spine, cover }, { focal = 240 } = {}) {
  const width = cover[0].length;
  const depth = spine[0].length;
  const radius = Math.hypot(width, depth) / 2;
  const nearest = focal / (focal - radius); // the most a point can grow, coming closest
  return {
    width: Math.ceil(radius * 2 * nearest) + 2, // + 2 for the outline
    height: Math.ceil(cover.length * nearest) + 2,
  };
}

// shade: colour → darker colour (palette.js), for whichever face is turned further away.
export function turnBook(book, angle, { focal = 240, outline = 'k', shade = null } = {}) {
  const { spine, cover } = book;
  const height = cover.length;
  const halfWidth = cover[0].length / 2;
  const halfDepth = spine[0].length / 2;
  const size = bookFrameSize(book, { focal });
  const grid = Array.from({ length: size.height }, () => Array(size.width).fill(TRANSPARENT));
  // Whole pixels either side of the front face, so its texels map one to one.
  const frontWidth = angle >= 45 ? cover[0].length : spine[0].length;
  const centre = {
    x: Math.floor(size.width / 2) + (frontWidth % 2) / 2,
    y: Math.floor(size.height / 2) + (height % 2) / 2,
  };

  // Turning by `yaw` from facing the viewer (z points away from them).
  const yaw = ((90 - angle) * Math.PI) / 180;
  const turn = ([x, z]) => [x * Math.cos(yaw) - z * Math.sin(yaw), x * Math.sin(yaw) + z * Math.cos(yaw)];

  // Each face: its texture, and where its left and right edges are on the book (as seen
  // facing it). The spine's right edge joins the front cover.
  const faces = [
    { texture: cover, left: [-halfWidth, -halfDepth], right: [halfWidth, -halfDepth] },
    { texture: spine, left: [-halfWidth, halfDepth], right: [-halfWidth, -halfDepth] },
  ];
  // The camera keeps the frontmost face at its true size, so the spine (at 0°) and the
  // cover (at 90°) come out pixel for pixel as drawn.
  const front = Math.max(...faces.map(({ left, right }) => -(turn(left)[1] + turn(right)[1]) / 2));
  // The face turned further away is in shade: dithered while it's half turned, then solid.
  const shaded = angle >= 45 ? spine : cover;
  const shadeAmount = Math.abs(Math.cos(((angle >= 45 ? angle : 90 - angle) * Math.PI) / 180));
  for (const { texture, left, right } of faces) {
    const [ax, az] = turn(left);
    const [bx, bz] = turn(right);
    if (bx - ax < 0.5) continue; // facing away, or edge on
    const depthA = focal + az + front;
    const depthB = focal + bz + front;
    const inShade = shade && texture === shaded;
    const solid = shadeAmount < 0.5; // turned well away: all of it is darker
    const screenA = centre.x + (ax * focal) / depthA;
    const screenB = centre.x + (bx * focal) / depthB;
    const columns = texture[0].length;

    for (let px = Math.floor(screenA); px < Math.ceil(screenB); px++) {
      const t = (px + 0.5 - screenA) / (screenB - screenA);
      if (t < 0 || t >= 1) continue;
      // Perspective-correct: interpolate 1/depth across the screen, not depth.
      const inverse = (1 - t) / depthA + t / depthB;
      const u = t / depthB / inverse;
      const scale = focal * inverse;
      const top = centre.y - (height / 2) * scale;
      const bottom = centre.y + (height / 2) * scale;
      const column = Math.min(columns - 1, Math.floor(u * columns));
      for (let py = Math.max(0, Math.floor(top)); py < Math.min(size.height, Math.ceil(bottom)); py++) {
        const v = (py + 0.5 - top) / (bottom - top);
        if (v < 0 || v >= 1) continue;
        const texel = texture[Math.floor(v * height)][column];
        if (texel === TRANSPARENT) continue;
        grid[py][px] = inShade && (solid || (px + py) % 2) ? (shade[texel] ?? texel) : texel;
      }
    }
  }

  if (outline) outlineShape(grid, outline);
  return grid.map((row) => row.join(''));
}

// Art with a one-pixel outline around it, like everything else in the game (a spine on the shelf).
export function outlined(rows, colour = 'k') {
  const grid = [Array(rows[0].length + 2).fill(TRANSPARENT)];
  for (const row of rows) grid.push([TRANSPARENT, ...row, TRANSPARENT]);
  grid.push(Array(rows[0].length + 2).fill(TRANSPARENT));
  outlineShape(grid, colour);
  return grid.map((row) => row.join(''));
}

function outlineShape(grid, colour) {
  const inked = (x, y) => grid[y]?.[x] !== undefined && grid[y][x] !== TRANSPARENT;
  const edges = [];
  grid.forEach((row, y) =>
    row.forEach((pixel, x) => {
      if (pixel === TRANSPARENT && (inked(x - 1, y) || inked(x + 1, y) || inked(x, y - 1) || inked(x, y + 1))) {
        edges.push([x, y]);
      }
    }),
  );
  for (const [x, y] of edges) grid[y][x] = colour;
}

// The book held at an angle, the way pixel art draws boxes: the cover exactly as drawn, the
// spine and the top edge of the pages as slanted strips going back up and to the left.
// `depth` is how many pixels deep the book looks; the slant rises one pixel in every two.
export function restingBook({ spine, cover }, { depth = 6, pages = 'l', outline = 'k', shade = null } = {}) {
  const height = cover.length;
  const width = cover[0].length;
  const rise = Math.ceil(depth / 2);
  const left = depth + 1; // where the cover starts, after the outline and the spine
  const top = rise + 1;
  const grid = Array.from({ length: height + rise + 2 }, () => Array(width + depth + 2).fill(TRANSPARENT));
  const darker = (texel) => (shade?.[texel] ?? texel);

  // The top of the pages, behind everything else.
  for (let i = 1; i <= depth; i++) {
    const y = top - Math.ceil(i / 2);
    for (let x = left - i; x < left + width - i; x++) grid[y][x] = pages;
  }
  // The spine, squeezed into `depth` columns and in shade.
  for (let i = 1; i <= depth; i++) {
    const column = Math.floor(((depth - i + 0.5) / depth) * spine[0].length);
    for (let y = 0; y < height; y++) {
      const texel = spine[y][column];
      if (texel !== TRANSPARENT) grid[top - Math.ceil(i / 2) + y][left - i] = darker(texel);
    }
  }
  // The cover, pixel for pixel.
  cover.forEach((row, y) => [...row].forEach((texel, x) => texel !== TRANSPARENT && (grid[top + y][left + x] = texel)));

  if (outline) outlineShape(grid, outline);
  return grid.map((row) => row.join(''));
}

// A book as it stands on the shelf, from its spine: outlined, with a bookmark sticking out of
// the top while it's being read and a sticker over the foot if it's a must-read. Books given
// up on lie flat, the spine's lettering reading left to right. marks: art/books/marks.js.
export function shelfView(spine, { marks, reading = false, sticker = false, flat = false }) {
  let rows = spine;
  if (sticker) {
    const { length: height } = marks.sticker;
    rows = overlay(rows, marks.sticker, Math.floor((rows[0].length - marks.sticker[0].length) / 2), rows.length - height - 1);
  }
  rows = outlined(rows);
  if (reading) {
    const blank = '.'.repeat(rows[0].length);
    rows = [...marks.bookmark.map(() => blank), ...rows];
    rows = overlay(rows, marks.bookmark, rows[0].length - marks.bookmark[0].length - 2, 0);
  }
  if (flat) rows = [...rows[0]].map((_, i) => rows.map((row) => row[row.length - 1 - i]).join(''));
  return rows;
}

// `art` drawn over `rows` at (x, y); its transparent pixels leave what's underneath.
function overlay(rows, art, x, y) {
  return rows.map((row, ry) => {
    const line = art[ry - y];
    if (!line) return row;
    return [...row].map((pixel, rx) => (line[rx - x] && line[rx - x] !== TRANSPARENT ? line[rx - x] : pixel)).join('');
  });
}

// The same book a few pixels big, for the bookcase in the office: 2×4 in its main colour (and
// that colour's shade), with a band of its lettering colour and a gold dot if it's a must-read.
export function tinySpine(spine, { shade = null, sticker = false } = {}) {
  const counts = {};
  for (const row of spine) for (const pixel of row) if (pixel !== TRANSPARENT) counts[pixel] = (counts[pixel] ?? 0) + 1;
  const [main, accent = main] = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([pixel]) => pixel);
  const pair = (colour) => `${colour}${shade?.[colour] ?? colour}`;
  return [pair(main), pair(accent), pair(main), sticker ? `y${shade?.[main] ?? main}` : pair(main)];
}
