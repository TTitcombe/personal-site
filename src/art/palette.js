// Every colour the art can use, keyed by the single character used in pixel arrays.
// Swap hex values here to reskin everything at once.
export const palette = {
  k: '#1f1a24', // outline / near-black
  w: '#f6f3e8', // white
  W: '#f8f8f8', // text box white (cooler than w, like the GBA's)
  g: '#b9b4a6', // light grey
  d: '#6d6878', // slate (wall tops)
  s: '#f2c29a', // skin
  h: '#4a3426', // hair
  b: '#4f8fbf', // blue (shirt, marker)
  B: '#2e3f6b', // navy (jeans)
  r: '#c8693c', // terracotta (pot, marker)
  R: '#92472a', // terracotta shade
  p: '#6bb04d', // leaf
  P: '#3a7a3a', // leaf shade
  t: '#b07a48', // wood
  T: '#7a4f2e', // wood shade
  f: '#ead9b5', // floorboards
  F: '#cdb68a', // floorboard seams
  l: '#e4e0d2', // wall
  L: '#c5bfae', // wall shade
  c: '#8fcfe0', // glass / screen
  n: '#3a3442', // charcoal (Tom's top; lighter than the outline so it reads)
  m: '#b48aae', // mauve (Tom's cap)
  M: '#87607f', // mauve shade
  o: '#f26625', // YC orange
  y: '#e8b83a', // gold (trophies, frames)
  Y: '#a87a24', // gold shade
  u: '#c8463c', // red (calendar, shrine)
  U: '#8a2d28', // red shade
  a: '#8d94a3', // blue roan (the dog)
  A: '#4c5263', // blue roan shade
  e: '#24303d', // dark screen
  E: '#5fd08a', // screen green (loss curves, status lights)
  q: '#e88aa6', // pink
  i: '#dcecf2', // ice / snow
  v: '#16214d', // night navy (book covers)
  V: '#22326c', // night navy, lit
  z: '#fbeda2', // star glow
  G: '#beffcb', // mint (Throxy)
  H: '#d1beff', // lavender (Throxy)
  O: '#f0ac74', // peach (OpenMined)
  S: '#8fc79a', // sage (OpenMined)
  D: '#757fa3', // dusk blue (OpenMined)
  Q: '#c5507a', // rose (OpenMined)
  C: '#0a66c2', // LinkedIn blue
  x: '#1185fe', // Bluesky blue
  1: '#c9b27a', // chip gold (Chip War)
  2: '#2a9fa3', // teal (Chip War)
};

// The darker version of each colour, for surfaces turned away from the light (the side of a
// book as it turns). Colours missing here stay as they are.
export const shade = {
  w: 'g', W: 'g', g: 'd', d: 'n', l: 'L', L: 'd', f: 'F', F: 'T', s: 'r',
  b: 'B', B: 'e', c: 'b', i: 'c', r: 'R', p: 'P', t: 'T', y: 'Y', Y: 'T', u: 'U',
  o: 'r', m: 'M', a: 'A', E: 'P', q: 'u', n: 'k', e: 'k', v: 'k', V: 'v', z: 'y',
  G: 'S', H: 'm', O: 'r', S: 'P', D: 'B', Q: 'U', C: 'B', x: 'C',
  1: 'Y', 2: 'e',
};
