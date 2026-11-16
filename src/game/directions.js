export const OFFSETS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
export const DIRECTIONS = Object.keys(OFFSETS);

const OPPOSITES = { up: 'down', down: 'up', left: 'right', right: 'left' };
export const opposite = (direction) => OPPOSITES[direction];

export const step = (tile, direction) => ({
  x: tile.x + OFFSETS[direction].x,
  y: tile.y + OFFSETS[direction].y,
});

export const sameTile = (a, b) => Boolean(a && b) && a.x === b.x && a.y === b.y;

export const directionBetween = (from, to) =>
  DIRECTIONS.find((direction) => sameTile(step(from, direction), to));
