import { DIRECTIONS, sameTile, step } from './directions.js';

// What you reach standing on `from` facing `direction`: the tile ahead, or — if that tile
// is a counter with someone behind it — the person behind it, like a shop counter.
// Returns { tile, npc?, interact? }, or null when facing out of the room.
export function reach(room, from, direction) {
  const ahead = step(from, direction);
  const cell = room.cellAt(ahead.x, ahead.y);
  if (!cell) return null;
  if (cell.counter) {
    const beyond = step(ahead, direction);
    const npc = room.npcAt(beyond.x, beyond.y);
    if (npc) return { tile: beyond, npc };
  }
  return { tile: ahead, npc: room.npcAt(ahead.x, ahead.y), interact: cell.interact };
}

// How to walk to a tile: the floor tile itself, or for anything solid, the nearest spot
// that reaches it, turning to face it on arrival. Shaped for player.walkTo().
export function approach(room, target) {
  if (room.isWalkable(target.x, target.y)) {
    return { isGoal: (x, y) => x === target.x && y === target.y };
  }
  const facingFrom = (tile) =>
    DIRECTIONS.find((direction) => sameTile(reach(room, tile, direction)?.tile, target));
  return { isGoal: (x, y) => facingFrom({ x, y }) !== undefined, faceFor: facingFrom };
}

// Clicking a counter means you want whoever is standing behind it.
export function clickTarget(room, tile) {
  if (!room.cellAt(tile.x, tile.y)?.counter) return tile;
  const npc = DIRECTIONS.map((direction) => step(tile, direction))
    .map(({ x, y }) => room.npcAt(x, y))
    .find(Boolean);
  return npc ? { x: npc.x, y: npc.y } : tile;
}
