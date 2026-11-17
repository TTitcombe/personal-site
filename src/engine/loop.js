// Runs update(dt) then render() each animation frame, but only while update() returns
// true (something is moving). Otherwise it sleeps until wake() — an idle page costs no
// CPU. dt is capped so a backgrounded tab doesn't teleport the player when it comes back.
export function startLoop(update, render) {
  let running = false;
  let last = 0;

  const frame = (now) => {
    const dt = Math.min(Math.max((now - last) / 1000, 0), 0.1);
    last = now;
    const busy = update(dt);
    render();
    if (busy) requestAnimationFrame(frame);
    else running = false;
  };

  const wake = () => {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  };

  wake();
  return { wake };
}
