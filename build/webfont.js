// Turns the pixel font (src/art/font.js) into a TrueType file, so the HTML drawn over the
// game (dialogue, menus, the section panel) uses exactly the letters the art uses.
// Every pixel is a UNIT-sized square and the em is the glyph height, so at
// font-size: calc(var(--px) * 9) one font pixel is one game pixel and edges stay crisp.
const UNIT = 64;

export function trueTypeFont(font, { family }) {
  const ascent = font.baseline * UNIT;
  const descent = (font.height - font.baseline) * UNIT;
  const chars = Object.keys(font.glyphs).sort((a, b) => a.codePointAt(0) - b.codePointAt(0));
  const glyphs = [NOTDEF, ...chars.map((char) => font.glyphs[char])].map((rows) => outline(rows, font));
  const inked = glyphs.filter((g) => g.rects.length);
  const bounds = {
    xMin: Math.min(...inked.map((g) => g.xMin)),
    yMin: Math.min(...inked.map((g) => g.yMin)),
    xMax: Math.max(...inked.map((g) => g.xMax)),
    yMax: Math.max(...inked.map((g) => g.yMax)),
  };

  const glyf = [];
  const loca = [0];
  for (const glyph of glyphs) {
    glyf.push(encodeGlyph(glyph));
    loca.push(loca.at(-1) + glyf.at(-1).length);
  }
  const advances = glyphs.map((g) => g.advance);
  const codes = chars.map((char) => char.codePointAt(0));

  const tables = {
    'OS/2': os2({ glyphs, codes, ascent, descent }),
    cmap: cmap(codes),
    glyf: Buffer.concat(glyf),
    head: Buffer.concat([
      u32(0x00010000, 0x00010000, 0, 0x5f0f3cf5), // version, revision, checksum adjustment, magic
      u16(0b1001, font.height * UNIT), // flags: baseline at y=0, integer scaling; units per em
      u32(0, 0, 0, 0), // created, modified
      i16(bounds.xMin, bounds.yMin, bounds.xMax, bounds.yMax),
      u16(0, 8), // style, smallest readable size
      i16(2, 1, 0), // direction hint, long offsets in loca, glyph format
    ]),
    hhea: Buffer.concat([
      u32(0x00010000),
      i16(ascent, -descent, 0),
      u16(Math.max(...advances)),
      i16(0, 0, bounds.xMax, 1, 0, 0, 0, 0, 0, 0, 0), // bearings, extent, upright caret, reserved
      u16(glyphs.length),
    ]),
    hmtx: Buffer.concat(glyphs.map((g) => Buffer.concat([u16(g.advance), i16(g.xMin)]))),
    loca: u32(...loca),
    maxp: Buffer.concat([
      u32(0x00010000),
      u16(glyphs.length, Math.max(...glyphs.map((g) => g.rects.length * 4)), Math.max(...glyphs.map((g) => g.rects.length))),
      u16(0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0),
    ]),
    name: names({ 1: family, 2: 'Regular', 3: `${family} Regular`, 4: family, 5: 'Version 1.0', 6: family.replace(/\W/g, '') }),
    post: Buffer.concat([u32(0x00030000, 0), i16(-UNIT, UNIT), u32(0, 0, 0, 0, 0)]),
  };
  return assemble(tables);
}

// Shown for characters the font doesn't have (browsers fall back before using it).
const NOTDEF = ['####', '#..#', '#..#', '#..#', '#..#', '#..#', '####', '....', '....'];

// A glyph as rectangles: runs of ink in each row, merged downwards while they line up.
function outline(rows, font) {
  const rects = [];
  const open = new Map(); // "x0,x1" → rectangle still growing downwards
  rows.forEach((row, y) => {
    const runs = [...row.matchAll(/#+/g)].map((m) => `${m.index},${m.index + m[0].length}`);
    for (const [key, rect] of open) if (!runs.includes(key)) open.delete(key);
    for (const key of runs) {
      if (open.has(key)) open.get(key).y1 = y + 1;
      else {
        const [x0, x1] = key.split(',').map(Number);
        const rect = { x0, x1, y0: y, y1: y + 1 };
        rects.push(rect);
        open.set(key, rect);
      }
    }
  });
  // Font units: x right, y up from the baseline.
  const units = rects.map(({ x0, x1, y0, y1 }) => ({
    left: x0 * UNIT,
    right: x1 * UNIT,
    top: (font.baseline - y0) * UNIT,
    bottom: (font.baseline - y1) * UNIT,
  }));
  return {
    rects: units,
    advance: (rows[0].length + font.spacing) * UNIT,
    xMin: Math.min(0, ...units.map((r) => r.left)),
    yMin: Math.min(0, ...units.map((r) => r.bottom)),
    xMax: Math.max(0, ...units.map((r) => r.right)),
    yMax: Math.max(0, ...units.map((r) => r.top)),
  };
}

// One clockwise contour per rectangle, every point on the curve.
function encodeGlyph(glyph) {
  if (!glyph.rects.length) return Buffer.alloc(0);
  const points = glyph.rects.flatMap((r) => [
    [r.left, r.bottom],
    [r.left, r.top],
    [r.right, r.top],
    [r.right, r.bottom],
  ]);
  const deltas = (axis) => points.map((p, i) => p[axis] - (i ? points[i - 1][axis] : 0));
  const data = Buffer.concat([
    i16(glyph.rects.length, glyph.xMin, glyph.yMin, glyph.xMax, glyph.yMax),
    u16(...glyph.rects.map((_, i) => i * 4 + 3), 0), // contour ends, no instructions
    Buffer.alloc(points.length, 1),
    i16(...deltas(0)),
    i16(...deltas(1)),
  ]);
  return pad(data);
}

// Maps characters to glyphs (glyph 0 is .notdef, then the characters in code order).
function cmap(codes) {
  const segments = [];
  codes.forEach((code, i) => {
    const last = segments.at(-1);
    if (last && code === last.end + 1) last.end = code;
    else segments.push({ start: code, end: code, delta: i + 1 - code });
  });
  segments.push({ start: 0xffff, end: 0xffff, delta: 1 });
  const count = segments.length;
  const searchRange = 2 ** Math.floor(Math.log2(count)) * 2;
  const subtable = Buffer.concat([
    u16(4, 16 + count * 8, 0, count * 2, searchRange, Math.log2(searchRange / 2), count * 2 - searchRange),
    u16(...segments.map((s) => s.end), 0),
    u16(...segments.map((s) => s.start)),
    u16(...segments.map((s) => s.delta & 0xffff)),
    u16(...segments.map(() => 0)),
  ]);
  return Buffer.concat([u16(0, 1, 3, 1), u32(12), subtable]);
}

function os2({ glyphs, codes, ascent, descent }) {
  const inked = glyphs.filter((g) => g.rects.length);
  return Buffer.concat([
    u16(4, Math.round(inked.reduce((sum, g) => sum + g.advance, 0) / inked.length), 400, 5, 0),
    i16(...Array(10).fill(UNIT * 4)), // sub/superscript sizes and offsets, strikeout
    i16(0), // family class
    Buffer.alloc(10), // panose
    u32(0, 0, 0, 0), // unicode ranges
    Buffer.from('NONE'),
    u16(0x00c0, Math.min(...codes), Math.min(0xffff, Math.max(...codes))), // regular, use typo metrics
    i16(ascent, -descent, 0),
    u16(ascent, descent),
    u32(1, 0), // code pages: Latin 1
    i16(5 * UNIT, 7 * UNIT), // x-height, cap height
    u16(0, 32, 1),
  ]);
}

function names(records) {
  const entries = Object.entries(records).map(([id, text]) => [Number(id), Buffer.from(text, 'utf16le').swap16()]);
  let offset = 0;
  const header = entries.map(([id, text]) => {
    const record = u16(3, 1, 0x409, id, text.length, offset);
    offset += text.length;
    return record;
  });
  return Buffer.concat([u16(0, entries.length, 6 + entries.length * 12), ...header, ...entries.map(([, text]) => text)]);
}

// The table directory, the tables (sorted by tag, 4-byte aligned) and the whole-file checksum.
function assemble(tables) {
  const tags = Object.keys(tables).sort();
  const searchRange = 2 ** Math.floor(Math.log2(tags.length)) * 16;
  let offset = 12 + tags.length * 16;
  const directory = [u32(0x00010000), u16(tags.length, searchRange, Math.log2(searchRange / 16), tags.length * 16 - searchRange)];
  const bodies = [];
  let headOffset = 0;
  for (const tag of tags) {
    const data = tables[tag];
    if (tag === 'head') headOffset = offset;
    directory.push(Buffer.from(tag, 'latin1'), u32(checksum(data), offset, data.length));
    bodies.push(pad(data));
    offset += pad(data).length;
  }
  const file = Buffer.concat([...directory, ...bodies]);
  file.writeUInt32BE((0xb1b0afba - checksum(file)) >>> 0, headOffset + 8);
  return file;
}

function checksum(data) {
  const padded = pad(data);
  let sum = 0;
  for (let i = 0; i < padded.length; i += 4) sum = (sum + padded.readUInt32BE(i)) >>> 0;
  return sum;
}

const pad = (data) => (data.length % 4 ? Buffer.concat([data, Buffer.alloc(4 - (data.length % 4))]) : data);
const writer = (size, write) => (...values) => {
  const buffer = Buffer.alloc(values.length * size);
  values.forEach((value, i) => buffer[write](value, i * size));
  return buffer;
};
const u16 = writer(2, 'writeUInt16BE');
const i16 = writer(2, 'writeInt16BE');
const u32 = writer(4, 'writeUInt32BE');
