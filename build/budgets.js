// Size budgets, checked on every build so the site can't quietly get heavy. Sizes are
// gzipped, which is roughly what visitors download. Raise a budget deliberately or not at all.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const KB = 1024;
const BUDGETS = [
  // The homepage is the whole game: markup, styles and code in one request.
  { match: (path) => path === 'index.html', limit: 30 * KB, what: 'the homepage (game included)' },
  // Plain pages are mostly the writing itself; this catches a template that bloats.
  { match: (path) => path.endsWith('.html'), limit: 40 * KB, what: 'a plain page' },
  { match: (path) => path.endsWith('.png'), limit: 40 * KB, what: 'an image' },
  // The pixel font, loaded with the game.
  { match: (path) => path.endsWith('.ttf'), limit: 12 * KB, what: 'the font' },
];

export function checkBudgets(dir, paths) {
  const failures = [];
  for (const path of paths) {
    const budget = BUDGETS.find((b) => b.match(path));
    if (!budget) continue;
    const size = gzipSync(readFileSync(join(dir, path))).length;
    if (size > budget.limit) {
      failures.push(`${path} is ${(size / KB).toFixed(1)}KB gzipped; the budget for ${budget.what} is ${budget.limit / KB}KB`);
    }
  }
  if (failures.length) throw new Error(`Over budget:\n${failures.join('\n')}`);
}
