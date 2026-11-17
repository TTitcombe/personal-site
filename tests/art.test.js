import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TILE_SIZE } from '../src/config.js';
import { characters, objects, palette, tileEdges, tiles } from '../src/art/index.js';
import { font } from '../src/art/font.js';
import * as dialogue from '../src/dialogue/index.js';
import { validatePixelArt } from '../src/engine/pixel-art.js';
import { findPath } from '../src/engine/pathfinding.js';
import { parseRoom } from '../src/engine/tilemap.js';
import { approach } from '../src/game/interaction.js';
import { office } from '../src/rooms/office.js';
import { OPENABLE } from './openable.js';

const objectSizes = Object.fromEntries(
  Object.entries(objects).map(([name, rows]) => [
    name,
    { width: rows[0].length / TILE_SIZE, height: rows.length / TILE_SIZE },
  ]),
);
const room = parseRoom(office, objectSizes);
const cells = room.cells.flat();

test('every tile is a valid 16×16 image', () => {
  for (const [name, rows] of Object.entries(tiles)) {
    validatePixelArt(`tiles.${name}`, rows, palette, { width: TILE_SIZE, height: TILE_SIZE });
  }
});

test('wall outlines name real tiles and sides', () => {
  for (const [name, { joins, sides = [] }] of Object.entries(tileEdges)) {
    for (const tile of [name, ...joins]) assert.ok(tile in tiles, `tileEdges.${name}: no tile ${tile}`);
    for (const side of sides) assert.ok(['top', 'bottom', 'left', 'right'].includes(side), `tileEdges.${name}: ${side}`);
  }
});

test('every object is valid art spanning whole tiles', () => {
  for (const [name, rows] of Object.entries(objects)) {
    validatePixelArt(`objects.${name}`, rows, palette, { multipleOf: TILE_SIZE });
  }
});

test('every character frame is a valid 16×16 image', () => {
  for (const [name, character] of Object.entries(characters)) {
    for (const [direction, frames] of Object.entries(character)) {
      for (const [frame, rows] of Object.entries(frames)) {
        validatePixelArt(`${name}.${direction}.${frame}`, rows, palette, { width: TILE_SIZE, height: TILE_SIZE });
      }
    }
  }
});

test('validatePixelArt names the broken row', () => {
  assert.throws(() => validatePixelArt('bad', ['kk', 'k'], palette), /bad: row 1 is 1px wide/);
  assert.throws(() => validatePixelArt('bad', ['kk', 'kZ'], palette), /"Z"/);
  assert.throws(() => validatePixelArt('bad', ['kk', 'kk'], palette, { multipleOf: 16 }), /multiples of 16/);
});

test('every font glyph has the same height and even rows', () => {
  for (const [char, rows] of Object.entries(font.glyphs)) {
    assert.equal(rows.length, font.height, `glyph "${char}" has ${rows.length} rows`);
    assert.ok(rows.every((row) => row.length === rows[0].length && /^[#.]+$/.test(row)), `glyph "${char}"`);
  }
});

test('the office only uses art that exists, at the right size, and spawns on the floor', () => {
  for (const cell of cells) assert.ok(cell.tile in tiles, `missing tile ${cell.tile}`);
  for (const object of room.objects) assert.ok(object.name in objects, `missing object ${object.name}`);
  assert.ok(room.isWalkable(room.spawn.x, room.spawn.y));
});

test('office interactions reference real dialogue and sections', () => {
  for (const { interact } of cells.filter((cell) => cell.interact)) {
    if (interact.dialogue) {
      const script = dialogue[interact.dialogue];
      assert.ok(script, `missing dialogue ${interact.dialogue}`);
      if (interact.start) assert.ok(script.nodes[interact.start], `missing node ${interact.start}`);
    }
    if (interact.open) assert.ok(OPENABLE.has(interact.open), `unknown section ${interact.open}`);
  }
});

test('every section can be opened from something in the office', () => {
  // Directly (the bookcase opens Reading), or through what someone says (Tom opens About).
  const opened = new Set([
    ...cells.map((cell) => cell.interact?.open),
    ...Object.values(dialogue).flatMap((script) => Object.values(script.nodes).map((node) => node.open)),
  ]);
  for (const id of OPENABLE) assert.ok(opened.has(id), `nothing in the office opens ${id}`);
});

test('every interactive object can be reached from the spawn point', () => {
  for (const object of room.objects.filter(({ x, y }) => room.cellAt(x, y).interact)) {
    const tiles = [];
    for (let dy = 0; dy < object.height; dy++) {
      for (let dx = 0; dx < object.width; dx++) tiles.push({ x: object.x + dx, y: object.y + dy });
    }
    const reachable = tiles.some((tile) => findPath(room.spawn, approach(room, tile).isGoal, room.isWalkable));
    assert.ok(reachable, `can't reach ${object.name} at ${object.x},${object.y}`);
  }
});

test('office NPCs stand on floor and reference real sprites and dialogue', () => {
  for (const npc of room.npcs) {
    assert.ok(!room.cells[npc.y][npc.x].solid, `${npc.id} is standing inside something`);
    assert.ok(npc.sprite in characters, `${npc.id}: missing sprite ${npc.sprite}`);
    assert.ok(npc.dialogue in dialogue, `${npc.id}: missing dialogue ${npc.dialogue}`);
    assert.ok(!room.isWalkable(npc.x, npc.y), `${npc.id} can be walked through`);
  }
});
