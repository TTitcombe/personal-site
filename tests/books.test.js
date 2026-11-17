import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { letteredBooks } from '../build/art.js';
import { loadContent } from '../build/content.js';
import { books } from '../src/art/books/index.js';
import { shelfMarks } from '../src/art/books/marks.js';
import { font } from '../src/art/font.js';
import { palette, shade } from '../src/art/palette.js';
import { tinyFont } from '../src/art/tiny-font.js';
import { restingBook, shelfView, turnBook } from '../src/engine/book.js';
import { stampText, textWidth } from '../src/engine/lettering.js';
import { validatePixelArt } from '../src/engine/pixel-art.js';

const fonts = { main: font, tiny: tinyFont };
const lettered = letteredBooks();

// Whether `art` appears in `frame` exactly, at some offset.
function contains(frame, art) {
  for (let y = 0; y + art.length <= frame.length; y++) {
    for (let x = 0; x + art[0].length <= frame[0].length; x++) {
      if (art.every((row, ry) => frame[y + ry].slice(x, x + row.length) === row)) return true;
    }
  }
  return false;
}

test('every book in content/reading has art', () => {
  const content = loadContent(fileURLToPath(new URL('../content', import.meta.url)));
  for (const book of content.books) {
    assert.ok(books[book.slug], `content/reading/${book.slug}.md has no art: add src/art/books/${book.slug}.js`);
  }
});

test('book art is valid, and the cover and spine are the same height', () => {
  for (const [slug, book] of Object.entries(books)) {
    validatePixelArt(`${slug} cover`, book.cover, palette);
    validatePixelArt(`${slug} spine`, book.spine, palette);
    assert.equal(book.spine.length, book.cover.length, `${slug}: the spine and cover heights differ`);
  }
});

test('lettering on books fits on the face it is on', () => {
  for (const [slug, book] of Object.entries(books)) {
    for (const { on, text, x, y, font: fontName, vertical } of book.labels ?? []) {
      const face = book[on];
      const letters = fonts[fontName];
      assert.ok(face && letters, `${slug}: label "${text}" is on "${on}" in font "${fontName}"`);
      const room = vertical ? face.length - (y === 'center' ? 0 : y) : face[0].length - (x === 'center' ? 0 : x);
      assert.ok(textWidth(text, letters) <= room, `${slug}: "${text}" doesn't fit on the ${on}`);
    }
  }
});

test('turned face on, a book shows its spine or its cover exactly as drawn', () => {
  for (const [slug, book] of Object.entries(lettered)) {
    assert.ok(contains(turnBook(book, 0, { shade }), book.spine), `${slug}: the spine is distorted at 0°`);
    assert.ok(contains(turnBook(book, 90, { shade }), book.cover), `${slug}: the cover is distorted at 90°`);
  }
});

test('a book at rest shows its cover exactly as drawn', () => {
  for (const [slug, book] of Object.entries(lettered)) {
    assert.ok(contains(restingBook(book, { shade }), book.cover), `${slug}: the resting cover is distorted`);
  }
});

test('frames of a turn are all the same size, so they line up', () => {
  for (const book of Object.values(lettered)) {
    const sizes = new Set([0, 30, 45, 60, 90].map((a) => turnBook(book, a).map((r) => r.length).join()));
    assert.equal(sizes.size, 1);
  }
});

test('vertical lettering runs down the spine with the tops of the letters to the right', () => {
  const rows = stampText(['....', '....', '....'], { text: 'T', x: 0, y: 0, color: 'k', vertical: true }, {
    height: 3,
    spacing: 1,
    glyphs: { T: ['###', '.#.', '.#.'] },
  });
  // T's crossbar (its top row) becomes the rightmost column.
  assert.deepEqual(rows, ['..k.', 'kkk.', '..k.']);
});

test('on the shelf: a bookmark while reading, a sticker on must-reads, gave-ups lie flat', () => {
  for (const [name, rows] of Object.entries(shelfMarks)) validatePixelArt(`shelf mark ${name}`, rows, palette);
  for (const [slug, { spine }] of Object.entries(lettered)) {
    const standing = shelfView(spine, { marks: shelfMarks });
    assert.deepEqual([standing[0].length, standing.length], [spine[0].length + 2, spine.length + 2], `${slug}: outlined`);
    const reading = shelfView(spine, { marks: shelfMarks, reading: true });
    assert.equal(reading.length, standing.length + shelfMarks.bookmark.length, `${slug}: the bookmark sticks out of the top`);
    const sticker = shelfView(spine, { marks: shelfMarks, sticker: true });
    assert.notDeepEqual(sticker, standing, `${slug}: the sticker shows`);
    assert.ok(shelfMarks.sticker[0].length <= spine[0].length, `${slug}: the spine is too thin for the sticker`);
    const flat = shelfView(spine, { marks: shelfMarks, flat: true });
    assert.deepEqual([flat[0].length, flat.length], [standing.length, standing[0].length], `${slug}: lying flat`);
  }
});
