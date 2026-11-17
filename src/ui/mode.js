// "Normal mode": the plain homepage without the game, for anyone who'd rather not play.
// The choice is remembered in localStorage; index.html applies it before the page paints.
const KEY = 'mode';

export const isNormalMode = () => document.documentElement.classList.contains('normal');

export function setUpModeToggle(button) {
  if (!button) return;
  button.textContent = isNormalMode() ? 'Play the game' : 'Skip the game';
  button.hidden = false;
  button.addEventListener('click', () => {
    try {
      if (isNormalMode()) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, 'normal');
    } catch {
      // Storage blocked: the switch just won't be remembered.
    }
    document.documentElement.classList.toggle('normal');
    location.reload();
  });
}
