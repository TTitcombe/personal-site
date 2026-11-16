import { bookFrameSize, turnBook } from '../engine/book.js';
import { mugFrameSize, trimmed, turnMug } from '../engine/mug.js';
import { paintPixelArt } from '../engine/pixel-art.js';

// Things on shelves: kinds of list for the list-and-detail view (ui/split.js). On Reading,
// every book stands spine out, as the build drew it (bookmarks in the ones being read,
// stickers on must-reads, gave-ups lying flat in a pile at the end); choosing one takes it
// down and turns it to its cover. On Work, every job is a mug from the company; choosing
// one turns it round to show its logo. Both fill as many shelves as the width needs, and
// show what the plain page says beside the picture. The art comes from art/books.json and
// art/mugs.json, written by the build.
const FRAME_TIME = 35; // ms

export function createShelves({ palette, shade, reducedMotion = false }) {
  const art = {};
  const loadArt = (url) =>
    (art[url] ??= fetch(url)
      .then((response) => (response.ok ? response.json() : {}))
      .catch(() => ({})));
  let turning = null; // the turn in progress, so a newer one can stop it

  // Plays the frames for `angles` into `canvas`, one every FRAME_TIME, `zoom` times size.
  function play(canvas, size, frameAt, angles, { zoom = 1, done = () => {} } = {}) {
    if (turning) clearTimeout(turning);
    canvas.width = size.width;
    canvas.height = size.height;
    canvas.style.setProperty('--w', size.width * zoom);
    canvas.style.setProperty('--h', size.height * zoom);
    const ctx = canvas.getContext('2d');
    const queue = reducedMotion ? angles.slice(-1) : [...angles];
    const draw = () => {
      ctx.clearRect(0, 0, size.width, size.height);
      ctx.drawImage(paintPixelArt(frameAt(queue.shift()), palette), 0, 0);
      if (queue.length) {
        turning = setTimeout(draw, FRAME_TIME);
      } else {
        turning = null;
        done();
      }
    };
    draw();
  }

  const books = {
    matches: (entry) => Boolean(entry.dataset.book),

    async prepare(entries) {
      const all = await loadArt('/art/books.json');
      return entries
        .filter((entry) => all[entry.dataset.book])
        .map((entry) => {
          const book = describeBook(entry, all[entry.dataset.book]);
          const node = shelfItem('book', `${book.title}, ${book.author}, ${book.status}`, canvasOf(book.art.shelf, palette));
          return { entry, node, book };
        });
    },

    // The standing books one by one, then the pile of flat ones as one.
    renderList(items, pane) {
      const flat = items.filter((item) => item.book.flat);
      const blocks = items
        .filter((item) => !item.book.flat)
        .map((item) => ({ node: item.node, width: item.book.art.shelf[0].length - 1 }));
      if (flat.length) {
        const pile = element('div', 'shelf-pile');
        pile.append(...flat.map((item) => item.node));
        blocks.push({ node: pile, width: Math.max(...flat.map((item) => item.book.art.shelf[0].length)) + 2 });
      }
      fillShelves(blocks, pane);
    },

    move: moveOnShelves,

    // The book turning to face you, then what's known about it.
    showDetail({ book }, pane) {
      const canvas = element('canvas');
      const status = element('p');
      status.append(Object.assign(element('span', 'chip'), { textContent: book.status }));
      const about = element('div', 'shelf-about');
      about.append(
        Object.assign(element('h3'), { textContent: book.title }),
        Object.assign(element('p', 'when'), { textContent: book.author }),
        status,
      );
      pane.replaceChildren(detail(canvas, about, book.notes));
      turnBookIn(book, canvas, 0, 90);
    },

    hideDetail({ book }, pane, done) {
      const canvas = pane.querySelector('canvas');
      if (!canvas) return done();
      for (const part of pane.querySelectorAll('.shelf-about, .shelf-notes')) part.hidden = true;
      turnBookIn(book, canvas, 90, 0, done);
    },
  };

  function turnBookIn(book, canvas, from, to, done) {
    play(canvas, bookFrameSize(book.art), (angle) => turnBook(book.art, angle, { shade }), range(from, to, 10), { done });
  }

  const mugs = {
    matches: (entry) => Boolean(entry.dataset.mug),

    async prepare(entries) {
      const all = await loadArt('/art/mugs.json');
      return entries
        .filter((entry) => all[entry.dataset.mug])
        .map((entry) => {
          const mug = all[entry.dataset.mug];
          const { title, sub } = entry.dataset;
          const node = shelfItem('mug', [title, sub].filter(Boolean).join(', '), canvasOf(trimmed(turnMug(mug, 0, { shade })), palette));
          return { entry, node, mug };
        });
    },

    renderList(items, pane) {
      fillShelves(items.map((item) => ({ node: item.node, width: Number(item.node.firstChild.style.getPropertyValue('--w')) + 4 })), pane);
    },

    move: moveOnShelves,

    // The mug turning round to show its logo, twice size, then the job.
    showDetail({ entry, mug }, pane) {
      const canvas = element('canvas');
      const about = element('div', 'shelf-about');
      const parts = [...entry.children].map((child) => child.cloneNode(true));
      about.append(...parts.filter((part) => part.matches('h3, .when')));
      pane.replaceChildren(detail(canvas, about, parts.filter((part) => !part.matches('h3, .when'))));
      turnMugIn(mug, canvas, -180, 0);
    },

    hideDetail({ mug }, pane, done) {
      const canvas = pane.querySelector('canvas');
      if (!canvas) return done();
      for (const part of pane.querySelectorAll('.shelf-about, .shelf-notes')) part.hidden = true;
      turnMugIn(mug, canvas, 0, -180, done);
    },
  };

  function turnMugIn(mug, canvas, from, to, done) {
    play(canvas, mugFrameSize(), (angle) => turnMug(mug, angle, { shade }), range(from, to, 15), { zoom: 2, done });
  }

  return [books, mugs];
}

// Fills shelves left to right, starting a new one when the next block won't fit. blocks:
// { node, width in game pixels }.
function fillShelves(blocks, pane) {
  const shelf = element('div', 'shelf');
  pane.append(shelf);
  let packedFor = 0;
  new ResizeObserver(() => {
    const unit = parseFloat(getComputedStyle(pane).getPropertyValue('--unit')) || 1;
    const room = Math.floor(shelf.clientWidth / unit);
    if (!room || room === packedFor) return;
    packedFor = room;
    const lines = [];
    let used = Infinity;
    for (const block of blocks) {
      if (used + block.width > room) {
        lines.push(element('div', 'shelf-line'));
        lines.at(-1).dataset.line = '';
        used = 0;
      }
      lines.at(-1).append(block.node);
      used += block.width;
    }
    shelf.replaceChildren(...lines);
  }).observe(shelf);
}

// ◀▶ along the shelf in order; ▲▼ to the nearest thing on the shelf above or below.
function moveOnShelves(items, item, action) {
  const along = { left: -1, right: 1 }[action];
  if (along) return items[items.indexOf(item) + along] ?? null;
  const lines = [...item.node.closest('.shelf').querySelectorAll('[data-line]')];
  const line = lines[lines.indexOf(item.node.closest('[data-line]')) + (action === 'down' ? 1 : -1)];
  if (!line) return null;
  const centre = (node) => {
    const box = node.getBoundingClientRect();
    return box.left + box.width / 2;
  };
  const here = centre(item.node);
  return items
    .filter((other) => line.contains(other.node))
    .reduce((best, other) => (Math.abs(centre(other.node) - here) < Math.abs(centre(best.node) - here) ? other : best));
}

// The picture beside its title and dates, with the rest of the entry under both.
function detail(canvas, about, notes) {
  canvas.setAttribute('aria-hidden', 'true'); // the text beside it says what it is
  const rest = element('div', 'shelf-notes');
  rest.append(...notes.map((node) => node.cloneNode(true)));
  const box = element('div', 'shelf-detail');
  box.append(canvas, about, rest);
  return box;
}

// What the plain page says about a book, and its art.
function describeBook(entry, art) {
  const badge = entry.querySelector('.badge');
  const status = entry.dataset.status;
  return {
    art,
    title: entry.dataset.title,
    author: entry.querySelector('.when')?.textContent.trim() ?? '',
    status: badge?.textContent.trim() ?? (status === 'reading' ? 'Reading now' : status === 'abandoned' ? 'Gave up' : 'Read'),
    flat: status === 'abandoned',
    notes: [...entry.children].filter((child) => !child.matches('img, h3, .when')),
  };
}

function shelfItem(kind, label, canvas) {
  const node = element('button', `shelf-item ${kind}`);
  node.type = 'button';
  node.setAttribute('aria-label', label);
  node.append(canvas);
  return node;
}

const range = (from, to, step) => {
  const angles = [];
  const by = from < to ? step : -step;
  for (let a = from; by > 0 ? a <= to : a >= to; a += by) angles.push(a);
  return angles;
};

function canvasOf(rows, palette) {
  const canvas = paintPixelArt(rows, palette);
  canvas.setAttribute('aria-hidden', 'true'); // its button is labelled
  canvas.style.setProperty('--w', rows[0].length);
  canvas.style.setProperty('--h', rows.length);
  return canvas;
}

function element(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}
