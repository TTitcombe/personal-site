// Renders the game's pixel art for the plain pages: section icons, the favicon, books, and the
// art contact sheet (npm run art). Art is plain data, so Node can import it directly.
import { books } from '../src/art/books/index.js';
import { shelfMarks } from '../src/art/books/marks.js';
import { font } from '../src/art/font.js';
import { characters, objects, palette, shade, tiles } from '../src/art/index.js';
import { tinyFont } from '../src/art/tiny-font.js';
import { restingBook, shelfView, tinySpine } from '../src/engine/book.js';
import { tinyMug } from '../src/engine/mug.js';
import { letterFaces } from '../src/engine/lettering.js';
import { createBitmap, encodePng } from './png.js';

// Any piece of art by name: an object, a tile, or a character (facing the viewer).
export function artByName(name) {
  return objects[name] ?? tiles[name] ?? characters[name]?.down.stand ?? null;
}

// Every book's cover and spine with its lettering stamped on, by slug. The game fetches
// these (as art/books.json) when the Reading panel opens, so the fonts stay out of the game.
export function letteredBooks() {
  return Object.fromEntries(
    Object.entries(books).map(([slug, art]) => {
      try {
        return [slug, letterFaces(art, { main: font, tiny: tinyFont })];
      } catch (error) {
        throw new Error(`src/art/books: ${slug}: ${error.message}`);
      }
    }),
  );
}

// The book as it stands on the game's shelf, from what the content says about it.
export const shelfRows = (lettered, { status, verdict }) =>
  shelfView(lettered.spine, {
    marks: shelfMarks,
    reading: status === 'reading',
    sticker: verdict === 'must-read',
    flat: status === 'abandoned',
  });

// The book at an angle, as the plain Reading page shows it.
export const restingBookRows = (lettered) => restingBook(lettered, { shade });

// The bookcase and mug shelf in the office, filled with tiny versions of the real books and
// mugs (in the content's order). The game gets these from the page (build/templates/home.js).
// shortcut: books or mugs beyond what the furniture holds are left off; make the furniture
// bigger (in src/rooms/office.js too) if that starts to happen.
export function furniture({ books, jobs, bookArt, mugArt }) {
  return { bookcase: bookcaseOf(books, bookArt), mugShelf: mugShelfOf(jobs, mugArt) };
}

const SHELVES = [2, 7]; // the top row of each shelf in the bookcase, each 4 rows tall
const SHELF_LEFT = 3;
const SHELF_RIGHT = 29;
const PLANT = ['TpPT', 'pPpP', 'TrRT', 'TrRT']; // at the right end of the top shelf

function bookcaseOf(books, bookArt) {
  const grid = objects.bookcase.map((row) => [...row]);
  const fill = (x, y, rows) => rows.forEach((row, dy) => [...row].forEach((pixel, dx) => (grid[y + dy][x + dx] = pixel)));
  for (const top of SHELVES) fill(SHELF_LEFT, top, Array(4).fill('T'.repeat(SHELF_RIGHT - SHELF_LEFT)));
  fill(SHELF_RIGHT - PLANT[0].length - 1, SHELVES[0], PLANT);

  const flat = books.filter((book) => book.status === 'abandoned').slice(0, 4);
  const pileLeft = flat.length ? SHELF_RIGHT - 5 : SHELF_RIGHT;
  const ends = [SHELF_RIGHT - PLANT[0].length - 1, pileLeft]; // where each shelf's books stop
  let shelf = 0;
  let x = SHELF_LEFT;
  for (const book of books.filter((b) => b.status !== 'abandoned')) {
    if (x + 2 > ends[shelf]) [shelf, x] = [shelf + 1, SHELF_LEFT];
    if (shelf >= SHELVES.length) break;
    fill(x, SHELVES[shelf], tinySpine(bookArt[book.slug].spine, { shade, sticker: book.verdict === 'must-read' }));
    x += 2;
  }
  // Books given up on lie in a pile at the end of the bottom shelf.
  flat.forEach((book, i) => {
    const [main, side] = tinySpine(bookArt[book.slug].spine, { shade })[0];
    fill(pileLeft, SHELVES[1] + 3 - i, [`${main}${main}${main}${side}`]);
  });
  return grid.map((row) => row.join(''));
}

function mugShelfOf(jobs, mugArt) {
  const grid = objects.mugShelf.map((row, y) => (y >= 2 && y <= 8 ? [...'.'.repeat(row.length)] : [...row]));
  const shown = jobs.slice(0, 4);
  shown.forEach((job, i) => {
    const x = 1 + 4 * (4 - shown.length) + i * 8;
    tinyMug(mugArt[job.slug], { shade }).forEach((row, dy) =>
      [...row].forEach((pixel, dx) => pixel !== '.' && (grid[2 + dy][x + dx] = pixel)),
    );
  });
  return grid.map((row) => row.join(''));
}

export function artPng(rows, scale = 1) {
  const bitmap = createBitmap(rows[0].length * scale, rows.length * scale);
  bitmap.drawArt(rows, palette, 0, 0, scale);
  return encodePng(bitmap);
}

// Every tile, object and character frame on one labelled-by-position sheet, 4× size, for
// checking art after an edit. Returns the PNG and the order things were drawn in.
export function contactSheet(scale = 4) {
  const pieces = [
    ...Object.entries(letteredBooks()).flatMap(([slug, book]) => [
      [`book.${slug}.resting`, restingBookRows(book)],
      [`book.${slug}.spine`, book.spine],
    ]),
    ...Object.entries(tiles),
    ...Object.entries(objects),
    ...Object.entries(characters).flatMap(([name, character]) =>
      Object.entries(character).flatMap(([direction, frames]) =>
        Object.entries(frames).map(([frame, rows]) => [`${name}.${direction}.${frame}`, rows]),
      ),
    ),
  ];
  const gap = 8;
  const rowWidth = 320;
  let x = gap;
  let y = gap;
  let lineHeight = 0;
  const placed = pieces.map(([name, rows]) => {
    const w = rows[0].length;
    if (x + w + gap > rowWidth) {
      x = gap;
      y += lineHeight + gap;
      lineHeight = 0;
    }
    const spot = { name, rows, x, y };
    x += w + gap;
    lineHeight = Math.max(lineHeight, rows.length);
    return spot;
  });
  const bitmap = createBitmap(rowWidth * scale, (y + lineHeight + gap) * scale, '#2b2533');
  for (const { rows, x: px, y: py } of placed) bitmap.drawArt(rows, palette, px * scale, py * scale, scale);
  return { png: encodePng(bitmap), names: placed.map((spot) => spot.name) };
}
