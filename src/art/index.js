// The only place the game imports art from. Replace any of these to reskin.
import { tom } from './characters/tom.js';
import { visitor } from './characters/visitor.js';
import { backDoor } from './objects/back-door.js';
import { bookcase } from './objects/bookcase.js';
import { calendar } from './objects/calendar.js';
import { certificates } from './objects/certificates.js';
import { coffeeTable } from './objects/coffee-table.js';
import { corkboard } from './objects/corkboard.js';
import { deskDualMonitor } from './objects/desk-dual-monitor.js';
import { deskVertical } from './objects/desk-vertical.js';
import { dogBed } from './objects/dog-bed.js';
import { frontDoor } from './objects/front-door.js';
import { gymBag } from './objects/gym-bag.js';
import { laptop } from './objects/laptop.js';
import { mirror } from './objects/mirror.js';
import { mugShelf } from './objects/mug-shelf.js';
import { plant } from './objects/plant.js';
import { printerDesk } from './objects/printer-desk.js';
import { robotDesk } from './objects/robot-desk.js';
import { serverRacks } from './objects/server-racks.js';
import { shrine } from './objects/shrine.js';
import { sofa } from './objects/sofa.js';
import { stairs } from './objects/stairs.js';
import { tomDesk } from './objects/tom-desk.js';
import { trophyCabinet } from './objects/trophy-cabinet.js';
import { tv } from './objects/tv.js';
import { windowShard } from './objects/window-shard.js';
import { workstation } from './objects/workstation.js';

export { palette, shade } from './palette.js';
export { tileEdges, tiles } from './tiles.js';
export { ui } from './ui.js';

// Objects by name: art of any size (whole tiles) drawn over a room's tiles. Rooms place
// them by these names. Art taller than its spot in the room overhangs the tiles above.
export const objects = {
  backDoor,
  bookcase,
  calendar,
  certificates,
  coffeeTable,
  corkboard,
  deskDualMonitor,
  deskVertical,
  dogBed,
  frontDoor,
  gymBag,
  laptop,
  mirror,
  mugShelf,
  plant,
  printerDesk,
  robotDesk,
  serverRacks,
  shrine,
  sofa,
  stairs,
  tomDesk,
  trophyCabinet,
  tv,
  windowShard,
  workstation,
};

// Characters by name; rooms reference NPC sprites by these keys.
export const characters = { visitor, tom };
