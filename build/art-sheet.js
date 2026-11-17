// npm run art: draws every tile, object and character frame onto one sheet, for checking art
// after an edit (or after an agent's edit). Writes dist/art-sheet.png.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { contactSheet } from './art.js';
import { out } from './build.js';

const { png, names } = contactSheet(4);
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'art-sheet.png'), png);
console.log(`Drew ${names.length} pieces of art into dist/art-sheet.png, left to right, top to bottom:`);
console.log(names.join(', '));
