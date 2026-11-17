import { TILE_SIZE, TURN_DELAY, WALK_SPEED } from '../config.js';
import { findPath } from '../engine/pathfinding.js';
import { directionBetween, step as stepFrom } from './directions.js';

// The player moves tile-to-tile like a Game Boy RPG: a step, once started, always finishes.
export function createPlayer({ x, y, facing }) {
  return {
    x,
    y,
    facing,
    step: null, // { to: {x, y}, progress: 0..1 } while walking between tiles
    stepCount: 0,
    path: [], // queued tiles from click-to-walk
    faceOnArrival: null,
  };
}

// Walks by the shortest route to the nearest tile where isGoal(x, y), then turns to
// faceFor(tile) if given. Returns false if there's no way there.
export function walkTo(player, room, { isGoal, faceFor = () => null }) {
  const start = player.step ? player.step.to : { x: player.x, y: player.y };
  const path = findPath(start, isGoal, room.isWalkable);
  if (!path) return false;
  player.path = path;
  player.faceOnArrival = faceFor(path.at(-1) ?? start) ?? null;
  return true;
}

// Puts the player straight at the nearest spot walkTo() would reach, facing the right way:
// for opening a section from a link without making the visitor watch the walk.
export function placePlayer(player, room, { isGoal, faceFor = () => null }) {
  const start = player.step ? player.step.to : { x: player.x, y: player.y };
  const path = findPath(start, isGoal, room.isWalkable);
  if (!path) return false;
  const tile = path.at(-1) ?? start;
  Object.assign(player, { x: tile.x, y: tile.y, step: null, path: [], faceOnArrival: null });
  player.facing = faceFor(tile) ?? player.facing;
  return true;
}

export function updatePlayer(player, dt, held, room) {
  let remaining = dt * WALK_SPEED;
  // Loop so a step that finishes mid-frame flows straight into the next one without a stutter.
  while (remaining > 0) {
    if (!player.step && !beginStep(player, held, room)) return;
    const left = 1 - player.step.progress;
    if (remaining < left) {
      player.step.progress += remaining;
      return;
    }
    remaining -= left;
    player.x = player.step.to.x;
    player.y = player.step.to.y;
    player.step = null;
  }
}

function beginStep(player, held, room) {
  if (held) {
    player.path = []; // the keyboard always overrides click-to-walk
    player.faceOnArrival = null;
    const turning = held.direction !== player.facing;
    player.facing = held.direction;
    if (turning && held.duration < TURN_DELAY) return false;
    return tryStep(player, held.direction, room);
  }

  const next = player.path.shift();
  if (next) {
    player.facing = directionBetween(player, next);
    if (tryStep(player, player.facing, room)) return true;
    player.path = []; // something moved into the way
    return false;
  }

  if (player.faceOnArrival) {
    player.facing = player.faceOnArrival;
    player.faceOnArrival = null;
  }
  return false;
}

function tryStep(player, direction, room) {
  const to = stepFrom(player, direction);
  if (!room.isWalkable(to.x, to.y)) return false;
  player.step = { to, progress: 0 };
  player.stepCount++;
  return true;
}

export const isIdle = (player) => !player.step && player.path.length === 0 && !player.faceOnArrival;

export function playerPixelPosition(player) {
  const { x, y, step } = player;
  const t = step ? step.progress : 0;
  const to = step ? step.to : player;
  return {
    x: Math.round((x + (to.x - x) * t) * TILE_SIZE),
    y: Math.round((y + (to.y - y) * t) * TILE_SIZE),
  };
}

// Index into a four-frame walk cycle: stepping for the first half of each tile, then
// standing, alternating feet every step.
export function playerFrame(player) {
  if (!player.step || player.step.progress >= 0.5) return 0;
  return player.stepCount % 2 ? 1 : 3;
}
