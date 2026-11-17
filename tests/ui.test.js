import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trueTypeFont } from '../build/webfont.js';
import { palette, ui } from '../src/art/index.js';
import { font } from '../src/art/font.js';
import { MIN_VIEW_WIDTH } from '../src/config.js';
import * as dialogue from '../src/dialogue/index.js';
import { validatePixelArt } from '../src/engine/pixel-art.js';

const advance = (char) => font.glyphs[char][0].length + font.spacing;
const textWidth = (text) => [...text].reduce((sum, char) => sum + advance(char), 0);

// The text box's inner width in font pixels on the narrowest screen (where the office is
// MIN_VIEW_WIDTH game pixels wide at the same scale as the text), less the frame and padding
// on each side (.box in index.html). It shows three lines, and ▼ needs room on the last.
const TEXT_WIDTH = MIN_VIEW_WIDTH - 2 * ui.slice - 2 * 4;
const LINES = 3;
const ARROW_ROOM = 12;

function wrap(text) {
  const lines = [''];
  for (const word of text.split(' ')) {
    const line = lines.at(-1);
    if (line && textWidth(`${line} ${word}`) > TEXT_WIDTH) lines.push(word);
    else lines[lines.length - 1] = line ? `${line} ${word}` : word;
  }
  return lines;
}

const pages = Object.entries(dialogue).flatMap(([name, script]) =>
  Object.entries(script.nodes).flatMap(([id, node]) =>
    node.text.map((text, i) => ({
      where: `${name}.${id} page ${i + 1}`,
      text: text.replaceAll('_', ''), // `_a phrase_` is underlined, not printed
      marks: text.split('_').length - 1,
      arrow: !(node.choices && i === node.text.length - 1),
    })),
  ),
);

test('the pixel font has every character the dialogue and menus use', () => {
  const used = new Set([...pages.flatMap((page) => [...page.text]), ...'▶▼✕']);
  const missing = [...used].filter((char) => !font.glyphs[char]);
  assert.deepEqual(missing, [], `add these to src/art/font.js: ${missing.join(' ')}`);
});

test('every page of dialogue fits the text box', () => {
  for (const { where, text, marks, arrow } of pages) {
    assert.ok(marks % 2 === 0, `${where}: an _underline_ isn't closed`);
    const lines = wrap(text);
    assert.ok(lines.length <= LINES, `${where} is ${lines.length} lines; the box shows ${LINES}: "${text}"`);
    if (arrow && lines.length === LINES) {
      assert.ok(textWidth(lines.at(-1)) <= TEXT_WIDTH - ARROW_ROOM, `${where}: the last line runs into ▼`);
    }
  }
});

test('the UI frame is valid pixel art with a stretchable middle', () => {
  validatePixelArt('ui.frame', ui.frame, palette);
  assert.equal(ui.frame.length, ui.frame[0].length, 'the frame should be square');
  assert.ok(ui.frame.length > ui.slice * 2, 'the frame needs pixels between its corners');
  for (const [name, key] of Object.entries(ui.colors)) assert.ok(palette[key], `ui.colors.${name}: no colour "${key}"`);
});

test('the TrueType font is well formed and maps every glyph', () => {
  const file = trueTypeFont(font, { family: 'Test' });
  const numTables = file.readUInt16BE(4);
  const tables = {};
  for (let i = 0; i < numTables; i++) {
    const at = 12 + i * 16;
    tables[file.toString('latin1', at, at + 4)] = { offset: file.readUInt32BE(at + 8), length: file.readUInt32BE(at + 12) };
  }
  const tags = Object.keys(tables);
  assert.deepEqual(tags, [...tags].sort(), 'tables must be sorted by tag');
  for (const tag of ['OS/2', 'cmap', 'glyf', 'head', 'hhea', 'hmtx', 'loca', 'maxp', 'name', 'post']) {
    assert.ok(tables[tag], `missing ${tag} table`);
  }

  let sum = 0;
  for (let i = 0; i < file.length; i += 4) sum = (sum + file.readUInt32BE(i)) >>> 0;
  assert.equal(sum, 0xb1b0afba, 'whole-file checksum');

  const glyphCount = file.readUInt16BE(tables.maxp.offset + 4);
  assert.equal(glyphCount, Object.keys(font.glyphs).length + 1);

  // Look each character up through cmap (format 4) and check its advance in hmtx.
  const cmap = tables.cmap.offset + file.readUInt32BE(tables.cmap.offset + 8);
  const segments = file.readUInt16BE(cmap + 6) / 2;
  const field = (array, i) => cmap + 14 + array * (segments * 2) + (array ? 2 : 0) + i * 2;
  const glyphFor = (code) => {
    for (let i = 0; i < segments; i++) {
      if (file.readUInt16BE(field(0, i)) < code) continue;
      if (file.readUInt16BE(field(1, i)) > code) return 0;
      return (code + file.readUInt16BE(field(2, i))) & 0xffff;
    }
    return 0;
  };
  for (const char of Object.keys(font.glyphs)) {
    const glyph = glyphFor(char.codePointAt(0));
    assert.ok(glyph > 0, `"${char}" isn't mapped`);
    const advanceUnits = file.readUInt16BE(tables.hmtx.offset + glyph * 4);
    assert.equal(advanceUnits / 64, advance(char), `"${char}" advance`);
  }
});
