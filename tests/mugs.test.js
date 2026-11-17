import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { furniture, letteredBooks } from '../build/art.js';
import { loadContent } from '../build/content.js';
import { objects } from '../src/art/index.js';
import { mugs } from '../src/art/mugs/index.js';
import { palette, shade } from '../src/art/palette.js';
import { socialIcons } from '../src/art/socials.js';
import { mugFrameSize, tinyMug, turnMug } from '../src/engine/mug.js';
import { validatePixelArt } from '../src/engine/pixel-art.js';

const content = loadContent(fileURLToPath(new URL('../content', import.meta.url)));

test('every job in content/jobs has a mug', () => {
  for (const job of content.jobs) {
    assert.ok(mugs[job.slug], `content/jobs/${job.slug}.md has no mug: add src/art/mugs/${job.slug}.js`);
  }
});

test('mugs use palette colours and turn within one frame size', () => {
  const size = mugFrameSize();
  for (const [slug, mug] of Object.entries(mugs)) {
    for (const key of ['body', 'rim', 'inside']) assert.ok(palette[mug[key]], `${slug}.${key}: no colour "${mug[key]}"`);
    validatePixelArt(`${slug} print`, mug.print, palette);
    for (let angle = -180; angle <= 180; angle += 15) {
      validatePixelArt(`${slug} at ${angle}°`, turnMug(mug, angle, { shade }), palette, size);
    }
  }
});

test("the office's bookcase and mug shelf are the size of the art they replace, holding the real things", () => {
  const room = furniture({ books: content.books, jobs: content.jobs, bookArt: letteredBooks(), mugArt: mugs });
  for (const name of ['bookcase', 'mugShelf']) {
    validatePixelArt(name, room[name], palette, { width: objects[name][0].length, height: objects[name].length });
  }
  for (const job of content.jobs.slice(0, 4)) {
    const mug = tinyMug(mugs[job.slug], { shade });
    const found = room.mugShelf.some((row, y) =>
      [...row].some((_, x) => mug.every((line, dy) => [...line].every((p, dx) => p === '.' || room.mugShelf[y + dy]?.[x + dx] === p))),
    );
    assert.ok(found, `${job.slug}'s mug isn't on the shelf`);
  }
});

test('social icons are 9×9 pixel art', () => {
  for (const [name, rows] of Object.entries(socialIcons)) validatePixelArt(name, rows, palette, { width: 9, height: 9 });
});
