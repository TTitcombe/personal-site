// Centres the view on a point, clamped to the room edges. Rooms smaller than the
// view are centred instead.
export function followCamera(focus, roomSize, viewSize) {
  const axis = (centre, room, view) =>
    room <= view
      ? Math.round((room - view) / 2)
      : Math.round(Math.min(Math.max(centre - view / 2, 0), room - view));
  return {
    x: axis(focus.x, roomSize.width, viewSize.width),
    y: axis(focus.y, roomSize.height, viewSize.height),
  };
}
