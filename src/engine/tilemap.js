// A room definition is a text layout plus a legend saying what each character means:
// { tile, object?, solid?, counter?, interact? }. `tile` is the base tile; `object` is art
// drawn over it. A block of the same character is one object: 'bb' is a single object two
// tiles wide, so its art must be 32px wide. Art taller than its block overhangs the tiles
// above it, e.g. a tall cabinet standing against the wall.
export function parseRoom(def, objectSizes = {}) {
  const height = def.layout.length;
  const width = def.layout[0].length;
  def.layout.forEach((row, y) => {
    if (row.length !== width) {
      throw new Error(`${def.name}: layout row ${y} is ${row.length} wide, expected ${width}`);
    }
    for (const char of row) {
      if (!def.legend[char]) {
        throw new Error(`${def.name}: layout uses "${char}", which is not in the legend`);
      }
    }
  });
  const cells = def.layout.map((row) => [...row].map((char) => def.legend[char]));
  const objects = findObjects(def, objectSizes);

  // Copied so NPC state (e.g. which way they face) can change without touching the definition.
  const npcs = (def.npcs ?? []).map((npc) => ({ ...npc }));
  const npcAt = (x, y) => npcs.find((npc) => npc.x === x && npc.y === y);
  const cellAt = (x, y) => cells[y]?.[x];
  const isWalkable = (x, y) => {
    const cell = cellAt(x, y);
    return Boolean(cell) && !cell.solid && !npcAt(x, y);
  };
  return {
    name: def.name,
    width,
    height,
    cells,
    objects,
    spawn: def.spawn,
    npcs,
    npcAt,
    cellAt,
    isWalkable,
  };
}

// Groups each block of a repeated object character into one object: { name, x, y, width,
// height } in tiles. objectSizes ({ name: { width, height } } in tiles) checks the art fits.
function findObjects(def, objectSizes) {
  const seen = new Set();
  const objects = [];
  def.layout.forEach((row, y) => {
    [...row].forEach((char, x) => {
      const name = def.legend[char].object;
      if (!name || seen.has(`${x},${y}`)) return;
      // Flood-fill the touching copies of this character, then check they form a rectangle.
      const block = [];
      const queue = [{ x, y }];
      seen.add(`${x},${y}`);
      while (queue.length) {
        const tile = queue.pop();
        block.push(tile);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const next = { x: tile.x + dx, y: tile.y + dy };
          const key = `${next.x},${next.y}`;
          if (def.layout[next.y]?.[next.x] === char && !seen.has(key)) {
            seen.add(key);
            queue.push(next);
          }
        }
      }
      const w = Math.max(...block.map((t) => t.x)) - x + 1;
      const h = Math.max(...block.map((t) => t.y)) - y + 1;
      if (block.length !== w * h || block.some((t) => t.x < x)) {
        throw new Error(`${def.name}: the "${char}" block at ${x},${y} isn't a rectangle`);
      }
      const size = objectSizes[name];
      if (size && (size.width !== w || size.height < h)) {
        throw new Error(
          `${def.name}: "${char}" at ${x},${y} is ${w}×${h} tiles, but ${name} art is ` +
            `${size.width}×${size.height} tiles`,
        );
      }
      objects.push({ name, x, y, width: w, height: h });
    });
  });
  return objects;
}

const SIDES = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] };

// Rooms never change at runtime, so they are painted once into a single canvas.
// Objects are drawn after every tile, top to bottom, so overhangs sit over the tiles above.
// edges: { tile: { joins: [tiles], sides? } } outlines a tile in `outline` (a CSS colour) on
// each side (all, or `sides`) where its neighbour isn't one it joins; the room's edge never is.
export function paintRoom(room, { tiles, objects, edges = {}, outline = '#000' }, tileSize) {
  const canvas = document.createElement('canvas');
  canvas.width = room.width * tileSize;
  canvas.height = room.height * tileSize;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = outline;
  room.cells.forEach((row, y) => {
    row.forEach((cell, x) => {
      ctx.drawImage(tiles[cell.tile], x * tileSize, y * tileSize);
      const rule = edges[cell.tile];
      if (!rule) return;
      for (const [side, [dx, dy]] of Object.entries(SIDES)) {
        const next = room.cellAt(x + dx, y + dy)?.tile;
        if (!next || rule.joins.includes(next) || (rule.sides && !rule.sides.includes(side))) continue;
        const left = x * tileSize + (side === 'right' ? tileSize - 1 : 0);
        const top = y * tileSize + (side === 'bottom' ? tileSize - 1 : 0);
        ctx.fillRect(left, top, dx ? 1 : tileSize, dy ? 1 : tileSize);
      }
    });
  });
  for (const object of [...room.objects].sort((a, b) => a.y + a.height - (b.y + b.height))) {
    const image = objects[object.name];
    ctx.drawImage(image, object.x * tileSize, (object.y + object.height) * tileSize - image.height);
  }
  return canvas;
}
