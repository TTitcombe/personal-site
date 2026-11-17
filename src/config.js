export const TILE_SIZE = 16;

// The view shows the whole room when it fits on screen (see engine/screen.js); on narrow
// screens it's at least this many game pixels across (a Game Boy screen's width), and the
// camera follows the player.
export const MIN_VIEW_WIDTH = 160;

// The most of the room the view tries to fit at once (16×12 tiles). On big screens, a bigger
// room than this is shown at the scale that fits this much, and the camera follows.
export const VIEW = { width: 16 * 16, height: 12 * 16 };

export const WALK_SPEED = 4; // tiles per second

// A tap shorter than this turns the player on the spot instead of walking (Game Boy feel).
export const TURN_DELAY = 0.09; // seconds

// How quickly dialogue text fills in.
export const WORD_DELAY = 0.06; // seconds per word

// Characters are drawn this many pixels above their tile so their feet sit inside it.
export const SPRITE_LIFT = 4;
