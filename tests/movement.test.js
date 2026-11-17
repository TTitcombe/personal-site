import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findPath } from '../src/engine/pathfinding.js';
import { parseRoom } from '../src/engine/tilemap.js';
import { approach, clickTarget, reach } from '../src/game/interaction.js';
import { createPlayer, placePlayer, updatePlayer, walkTo } from '../src/game/player.js';

const legend = {
  '.': { tile: 'floor' },
  '#': { tile: 'wall', solid: true },
  '=': { tile: 'desk', solid: true, counter: true },
};

const room = parseRoom({
  name: 'test',
  layout: ['.....', '.###.', '.....'],
  legend,
  spawn: { x: 0, y: 0, facing: 'down' },
});

const at = (x, y) => (px, py) => px === x && py === y;
const walkUntilIdle = (player, held = null) => {
  for (let i = 0; i < 40; i++) updatePlayer(player, 0.1, held, room);
};

test('finds the shortest route around obstacles', () => {
  const path = findPath({ x: 0, y: 1 }, at(4, 1), room.isWalkable);
  assert.equal(path.length, 6);
  assert.deepEqual(path.at(-1), { x: 4, y: 1 });
});

test('returns null when the goal is unreachable', () => {
  const walled = parseRoom({ name: 'walled', layout: ['.#.'], legend });
  assert.equal(findPath({ x: 0, y: 0 }, at(2, 0), walled.isWalkable), null);
});

test('click-to-walk on something solid stops next to it and turns to face it', () => {
  const player = createPlayer(room.spawn);
  walkTo(player, room, approach(room, { x: 2, y: 1 }));
  walkUntilIdle(player);
  assert.deepEqual({ x: player.x, y: player.y, facing: player.facing }, { x: 2, y: 0, facing: 'down' });
});

test('a quick tap turns without moving; holding walks', () => {
  const player = createPlayer(room.spawn);
  updatePlayer(player, 0.016, { direction: 'right', duration: 0.01 }, room);
  assert.deepEqual({ x: player.x, facing: player.facing, step: player.step }, { x: 0, facing: 'right', step: null });
  updatePlayer(player, 0.25, { direction: 'right', duration: 0.5 }, room);
  assert.equal(player.x, 1);
});

test('walking into a wall turns the player but does not move them', () => {
  const player = createPlayer({ x: 1, y: 0, facing: 'up' });
  updatePlayer(player, 0.5, { direction: 'down', duration: 0.5 }, room);
  assert.deepEqual({ x: player.x, y: player.y, facing: player.facing }, { x: 1, y: 0, facing: 'down' });
});

// A shopkeeper behind a counter, with the counter wedged between walls.
const shop = parseRoom({
  name: 'shop',
  layout: ['#.#', '#=#', '...'],
  legend,
  npcs: [{ id: 'keeper', x: 1, y: 0, facing: 'down' }],
});

test('you can talk across a counter', () => {
  const reached = reach(shop, { x: 1, y: 2 }, 'up');
  assert.equal(reached.npc.id, 'keeper');
});

test('clicking a counter walks you up to it to talk to whoever is behind', () => {
  const target = clickTarget(shop, { x: 1, y: 1 });
  assert.deepEqual(target, { x: 1, y: 0 });
  const player = createPlayer({ x: 0, y: 2, facing: 'left' });
  walkTo(player, shop, approach(shop, target));
  for (let i = 0; i < 40; i++) updatePlayer(player, 0.1, null, shop);
  assert.deepEqual({ x: player.x, y: player.y, facing: player.facing }, { x: 1, y: 2, facing: 'up' });
});

test('a block of the same object letter is one object, and must be a rectangle', () => {
  const objectLegend = { ...legend, b: { tile: 'floor', object: 'bookcase', solid: true } };
  const parsed = parseRoom({ name: 'r', layout: ['bb.', 'bb.', '..b'], legend: objectLegend });
  assert.deepEqual(
    parsed.objects.map(({ x, y, width, height }) => ({ x, y, width, height })),
    [
      { x: 0, y: 0, width: 2, height: 2 },
      { x: 2, y: 2, width: 1, height: 1 },
    ],
  );
  assert.throws(
    () => parseRoom({ name: 'r', layout: ['bb', 'b.'], legend: objectLegend }),
    /isn't a rectangle/,
  );
  assert.throws(
    () => parseRoom({ name: 'r', layout: ['b.'], legend: objectLegend }, { bookcase: { width: 2, height: 1 } }),
    /is 1×1 tiles, but bookcase art is 2×1 tiles/,
  );
});

test('opening a section from a link puts the player in front of its object', () => {
  const player = createPlayer({ x: 0, y: 2, facing: 'left' });
  assert.ok(placePlayer(player, room, approach(room, { x: 2, y: 1 })));
  assert.equal(reach(room, player, player.facing).tile.x, 2);
  assert.equal(reach(room, player, player.facing).tile.y, 1);
  assert.equal(player.step, null);
});
