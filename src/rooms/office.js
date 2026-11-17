// One character per tile; the legend says what each one is. A block of the same letter is one
// object (see engine/tilemap.js), so 'bb' is the two-tile bookcase.
// `interact` says what pressing A on it does:
//   { dialogue: name, start? }  a script from dialogue/index.js (optionally from a given node)
//   { open: id, at? }           a section from site.config.js (`at`: an anchor on its page),
//                               'hub' for the overview, or 'latest' for the newest post
// `counter` tiles can be talked across, like a shop counter.
//
// The open-plan office (top left) runs into the hang-out (top right) past a short wall, and
// down into reception at the front door. Off reception: the winter arc room (bottom left,
// shut in, half server room) and Tom's office (bottom right). The corkboard stands against
// reception's wall, overhanging it. Walls (T tops, W faces) can run
// anywhere; they're outlined where they end (art/tiles.js).
export const office = {
  name: 'office',
  layout: [
    'TTTTTTTTTTTTTTTTTTTTTT',
    'SSWWWWnnnWWWWWTWbbWWDW',
    'SS...........gW...oo..',
    '.....XX...........tt..',
    '.....XX.rr...........Y',
    '.................h....',
    '.....PP.OO............',
    '.....................g',
    'TTTTTT...TTTTTTTTTTTTT',
    'WWWWWT...vvWWWWTzuuWcW',
    ',m,RRW......KK.W______',
    ',,,::...........______',
    ',,,::...........__eLG_',
    'AA,QQT........gT_____p',
    'AA,::T...FF....T______',
  ],
  legend: {
    T: { tile: 'wallTop', solid: true },
    W: { tile: 'wall', solid: true },
    '.': { tile: 'floor' },
    ',': { tile: 'snow' },
    ':': { tile: 'serverFloor' },
    _: { tile: 'carpet' },

    // Open plan: the back wall, and four desks in a block
    S: { tile: 'floor', object: 'stairs', solid: true, interact: { dialogue: 'stairs' } },
    n: { tile: 'wall', object: 'windowShard', solid: true, interact: { dialogue: 'windowView' } },
    X: { tile: 'floor', object: 'workstation', solid: true, interact: { open: 'hub' } },
    r: { tile: 'floor', object: 'robotDesk', solid: true, interact: { open: 'projects' } },
    P: { tile: 'floor', object: 'printerDesk', solid: true, interact: { open: 'notes' } },
    O: { tile: 'floor', object: 'deskDualMonitor', solid: true, interact: { dialogue: 'otherPc' } },
    g: { tile: 'floor', object: 'plant', solid: true, interact: { dialogue: 'plant' } },

    // Hang-out
    b: { tile: 'wall', object: 'bookcase', solid: true, interact: { open: 'reading' } },
    D: { tile: 'wall', object: 'backDoor', solid: true, interact: { dialogue: 'backDoor' } },
    o: { tile: 'floor', object: 'sofa', solid: true },
    t: { tile: 'floor', object: 'coffeeTable', solid: true },
    Y: { tile: 'floor', object: 'trophyCabinet', solid: true, interact: { dialogue: 'trophies' } },
    h: { tile: 'floor', object: 'dogBed', solid: true, interact: { dialogue: 'dog' } },

    // Reception
    v: { tile: 'wall', object: 'tv', solid: true, interact: { dialogue: 'tv' } },
    K: { tile: 'floor', object: 'corkboard', solid: true, interact: { open: 'find-me' } },
    F: { tile: 'floor', object: 'frontDoor', solid: true, interact: { dialogue: 'frontDoor' } },

    // Winter arc room
    A: { tile: 'snow', object: 'shrine', solid: true, interact: { open: 'winter-arc' } },
    R: { tile: 'serverFloor', object: 'serverRacks', solid: true, interact: { dialogue: 'servers' } },
    m: { tile: 'snow', object: 'mirror', solid: true, interact: { dialogue: 'karpathy' } },
    Q: { tile: 'serverFloor', object: 'deskVertical', solid: true, interact: { dialogue: 'verticalMonitor' } },

    // Tom's office: the laptop has the YC sticker on its lid
    z: { tile: 'wall', object: 'certificates', solid: true, interact: { open: 'work', at: 'papers' } },
    u: { tile: 'wall', object: 'mugShelf', solid: true, interact: { open: 'work' } },
    c: { tile: 'wall', object: 'calendar', solid: true, interact: { open: 'talks' } },
    e: { tile: 'carpet', object: 'tomDesk', solid: true, interact: { dialogue: 'tomDesk' } },
    L: { tile: 'carpet', object: 'laptop', solid: true, interact: { dialogue: 'tom', start: 'sticker' } },
    G: { tile: 'carpet', object: 'gymBag', solid: true, interact: { dialogue: 'gymBag' } },
    p: { tile: 'carpet', object: 'plant', solid: true, interact: { dialogue: 'plant' } },
  },
  spawn: { x: 9, y: 13, facing: 'up' },
  // `sprite` is a key in art/index.js `characters`; `dialogue` a key in dialogue/index.js.
  npcs: [{ id: 'tom', sprite: 'tom', dialogue: 'tom', x: 19, y: 11, facing: 'down' }],
};
