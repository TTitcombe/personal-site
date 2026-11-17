const NEIGHBOURS = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

// Breadth-first search over a 4-connected grid; rooms are small enough that BFS is plenty.
// Walks to the nearest tile where isGoal(x, y) is true. Returns the tiles to walk through
// (excluding start), or null if no goal tile can be reached.
export function findPath(start, isGoal, isWalkable) {
  const key = (x, y) => `${x},${y}`;
  const cameFrom = new Map([[key(start.x, start.y), null]]);
  const queue = [start];

  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    if (isGoal(current.x, current.y)) {
      const path = [];
      for (let node = current; node !== start; node = cameFrom.get(key(node.x, node.y))) {
        path.unshift(node);
      }
      return path;
    }
    for (const offset of NEIGHBOURS) {
      const next = { x: current.x + offset.x, y: current.y + offset.y };
      if (cameFrom.has(key(next.x, next.y)) || !isWalkable(next.x, next.y)) continue;
      cameFrom.set(key(next.x, next.y), current);
      queue.push(next);
    }
  }
  return null;
}
