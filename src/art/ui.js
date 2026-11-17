// The look of the HTML drawn over the game: text boxes, menus and the section panel.
// Swap these to reskin them; src/ui/theme.js turns them into CSS.
export const ui = {
  // A 9-slice frame: the `slice`-pixel corners are kept and the edges stretch, so every
  // box, whatever its size, gets the same pixel-art border. The middle is the box's fill.
  slice: 5,
  frame: [
    '..kkkkkkk..',
    '.kbbbbbbbk.',
    'kbbcccccbbk',
    'kbckkkkkcbk',
    'kbckWWWkcbk',
    'kbckWWWkcbk',
    'kbckWWWkcbk',
    'kbckkkkkcbk',
    'kbbcccccbbk',
    '.kbbbbbbbk.',
    '..kkkkkkk..',
  ],
  // Palette keys for the CSS colours.
  colors: {
    text: 'n',
    outline: 'k',
    shadow: 'L', // text has a drop shadow, as on the GBA
    heading: 'u',
    link: 'B',
    muted: 'd',
    band: 'B', // menu screen background, behind the boxes
    bandText: 'W',
    bandShadow: 'k',
    shelf: 't', // the bookshelf's plank
    shelfShade: 'T',
  },
};
