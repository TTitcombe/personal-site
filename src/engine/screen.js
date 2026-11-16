// A low-resolution canvas scaled up by whole numbers, so pixels stay square. It sizes itself
// to the space available: the largest scale at which the whole `content` (the room) fits, or
// at most `view` of it (game pixels) when the room is bigger, showing what fits and leaving
// the camera to follow; where even that is too small (phones), a scale that keeps at least
// `minWidth` game pixels across.
// The scale is exposed as the CSS variable --px on the canvas's parent, so HTML overlays can
// be sized in game pixels: calc(var(--px) * 8). reservedHeight (a number or a function) is
// the vertical space to leave for things around the canvas.
export function createScreen(canvas, { content, view = content, minWidth, reservedHeight = 0, gutter = 0 }) {
  const ctx = canvas.getContext('2d');
  const screen = { canvas, ctx, width: 0, height: 0, toScreenPixel };

  const fit = () => {
    const room = {
      width: innerWidth - gutter * 2,
      height: innerHeight - (typeof reservedHeight === 'function' ? reservedHeight() : reservedHeight),
    };
    const fitting = { width: Math.min(content.width, view.width), height: Math.min(content.height, view.height) };
    const whole = Math.floor(Math.min(room.width / fitting.width, room.height / fitting.height));
    const narrow = Math.min(Math.floor(room.height / fitting.height), Math.floor(room.width / minWidth));
    const scale = Math.max(1, whole, narrow);
    const width = Math.min(content.width, Math.floor(room.width / scale));
    const height = Math.min(content.height, Math.floor(room.height / scale));
    if (width !== screen.width || height !== screen.height) {
      canvas.width = screen.width = width;
      canvas.height = screen.height = height;
    }
    ctx.imageSmoothingEnabled = false;
    canvas.style.width = `${width * scale}px`;
    canvas.style.height = `${height * scale}px`;
    canvas.parentElement.style.setProperty('--px', `${scale}px`);
  };
  fit();
  addEventListener('resize', () => {
    fit();
    screen.onResize?.();
  });

  function toScreenPixel(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) * screen.width) / rect.width,
      y: ((clientY - rect.top) * screen.height) / rect.height,
    };
  }

  return screen;
}
