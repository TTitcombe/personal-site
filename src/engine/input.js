// event.code is the physical key, so WASD works on any keyboard layout.
const KEY_DIRECTIONS = {
  KeyW: 'up',
  KeyA: 'left',
  KeyS: 'down',
  KeyD: 'right',
  ArrowUp: 'up',
  ArrowLeft: 'left',
  ArrowDown: 'down',
  ArrowRight: 'right',
};

// Game Boy A/B buttons. (Not the A key: that's WASD-left.)
const KEY_BUTTONS = {
  Space: 'a',
  Enter: 'a',
  KeyE: 'a',
  KeyZ: 'a',
  Escape: 'b',
  KeyX: 'b',
};

// onInput is called on every key or pointer event, e.g. to wake a sleeping game loop.
export function createInput(screen, { onInput }) {
  const held = []; // direction key codes, most recently pressed last
  const pressedAt = new Map();
  let actions = []; // discrete presses since the last takeActions(): 'a', 'b', or a direction
  let tap = null;

  addEventListener('keydown', (event) => {
    const direction = KEY_DIRECTIONS[event.code];
    const button = KEY_BUTTONS[event.code];
    if (!direction && !button) return;
    onInput();
    // Focused buttons handle Enter and Space natively, and links handle Enter; don't press twice.
    const control = event.target.closest?.('button, a');
    if (control && (event.code === 'Enter' || (event.code === 'Space' && control.matches('button')))) {
      return;
    }
    event.preventDefault();
    if (event.repeat) return;
    actions.push(direction ?? button);
    if (direction) {
      release(event.code);
      held.push(event.code);
      pressedAt.set(event.code, performance.now());
    }
  });
  addEventListener('keyup', (event) => {
    release(event.code);
    onInput();
  });
  addEventListener('blur', () => (held.length = 0));
  screen.canvas.addEventListener('pointerdown', (event) => {
    tap = screen.toScreenPixel(event.clientX, event.clientY);
    onInput();
  });

  function release(code) {
    const index = held.indexOf(code);
    if (index !== -1) held.splice(index, 1);
  }

  return {
    // The direction being held, and for how long in seconds, or null.
    held() {
      const code = held.at(-1);
      if (!code) return null;
      return {
        direction: KEY_DIRECTIONS[code],
        duration: (performance.now() - pressedAt.get(code)) / 1000,
      };
    },
    takeActions() {
      const taken = actions;
      actions = [];
      return taken;
    },
    // The last tap/click position in screen pixels since the previous call, or null.
    takeTap() {
      const taken = tap;
      tap = null;
      return taken;
    },
  };
}
