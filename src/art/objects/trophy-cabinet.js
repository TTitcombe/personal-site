// Trophy cabinet (16x32: 1x1 floor tile + 16px overhang over the wall): glass front, 3 shelves, one gold cup.
// Empty glass above each shelf, as (x, y, w, h) in px from the top-left; badges stand on the shelf row just below:
//   top shelf    (3, 6, 10, 6)  shelf at y=12 (w glint at (4,6),(3,7) can be drawn over)
//   middle shelf (8, 13, 5, 6)  shelf at y=19 (trophy fills x 3..7)
//   bottom shelf (3, 20, 10, 6) shelf at y=26 (w glint at (4,20),(3,21) can be drawn over)
export const trophyCabinet = [
  'kkkkkkkkkkkkkkkk',
  'kttttttttttttttk',
  'kttttttttttttttk',
  'kkkkkkkkkkkkkkkk',
  'ktttttttttttttTk',
  'ktkkkkkkkkkkkkTk',
  'ktkcwcccccccckTk',
  'ktkwccccccccckTk',
  'ktkcccccccccckTk',
  'ktkcccccccccckTk',
  'ktkcccccccccckTk',
  'ktkcccccccccckTk',
  'ktkttttttttttkTk',
  'ktkcccccccccckTk',
  'ktkywyyYccccckTk',
  'ktkyyyyYccccckTk',
  'ktkcyyYcccccckTk',
  'ktkccYccccccckTk',
  'ktkcyyYcccccckTk',
  'ktkttttttttttkTk',
  'ktkcwcccccccckTk',
  'ktkwccccccccckTk',
  'ktkcccccccccckTk',
  'ktkcccccccccckTk',
  'ktkcccccccccckTk',
  'ktkcccccccccckTk',
  'ktkttttttttttkTk',
  'kkkkkkkkkkkkkkkk',
  'kTTTTTTTTTTTTTTk',
  'kkkkkkkkkkkkkkkk',
  '.kT..........Tk.',
  '.kk..........kk.',
];
