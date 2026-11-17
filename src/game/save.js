// Remembers where the player was standing, so coming back from a blog post puts you
// back at the PC. Per-tab and best-effort: storage can be unavailable or blocked.
const KEY = 'office:position';

export function loadPosition(room) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY));
    if (saved?.room === room.name && room.isWalkable(saved.x, saved.y)) return saved;
  } catch {}
  return null;
}

export function savePosition(room, { x, y, facing }) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ room: room.name, x, y, facing }));
  } catch {}
}
