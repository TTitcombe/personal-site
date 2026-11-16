import { site } from '../site.config.js';
import { MIN_VIEW_WIDTH, SPRITE_LIFT, TILE_SIZE, VIEW, WORD_DELAY } from './config.js';
import { characters, objects, palette, shade, tileEdges, tiles, ui } from './art/index.js';
import * as dialogue from './dialogue/index.js';
import { office } from './rooms/office.js';
import { followCamera } from './engine/camera.js';
import { createInput } from './engine/input.js';
import { startLoop } from './engine/loop.js';
import { paintPixelArt } from './engine/pixel-art.js';
import { createScreen } from './engine/screen.js';
import { buildWalkCycles } from './engine/sprites.js';
import { paintRoom, parseRoom } from './engine/tilemap.js';
import { opposite, sameTile } from './game/directions.js';
import {
  chooseOption,
  conversationView,
  fillScript,
  isRevealing,
  pointAtOption,
  pressConversation,
  startConversation,
  tickConversation,
} from './game/dialogue.js';
import { approach, clickTarget, reach } from './game/interaction.js';
import {
  createPlayer,
  isIdle,
  placePlayer,
  playerFrame,
  playerPixelPosition,
  updatePlayer,
  walkTo,
} from './game/player.js';
import { loadPosition, savePosition } from './game/save.js';
import { setUpModeToggle, isNormalMode } from './ui/mode.js';
import { createPanel } from './ui/panel.js';
import { createShelves } from './ui/shelf.js';
import { createSplitView } from './ui/split.js';
import { createTextbox } from './ui/textbox.js';
import { applyTheme } from './ui/theme.js';

setUpModeToggle(document.getElementById('mode-toggle'));
if (!isNormalMode()) startGame();

function startGame() {
  const siteData = readSiteData();
  const topBar = document.querySelector('.topbar');
  const room = parseRoom(office);
  const roomSize = { width: room.width * TILE_SIZE, height: room.height * TILE_SIZE };
  const screen = createScreen(document.getElementById('screen'), {
    content: roomSize,
    view: VIEW,
    minWidth: MIN_VIEW_WIDTH,
    reservedHeight: () => (topBar?.offsetHeight ?? 0) + 64,
    gutter: 16,
  });
  screen.onResize = () => loop.wake();
  applyTheme(screen.canvas.parentElement, ui, palette);
  const input = createInput(screen, { onInput: () => loop.wake() });
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wordDelay = reducedMotion ? 0 : WORD_DELAY;

  const paintAll = (art) =>
    Object.fromEntries(Object.entries(art).map(([name, rows]) => [name, paintPixelArt(rows, palette)]));
  const tileImages = paintAll(tiles);
  // The bookcase and mug shelf hold tiny versions of the real books and mugs (build/art.js).
  const objectImages = paintAll({ ...objects, ...siteData.furniture });
  const characterFrames = Object.fromEntries(
    Object.entries(characters).map(([name, art]) => [name, buildWalkCycles(art, palette)]),
  );

  const roomImage = paintRoom(
    room,
    { tiles: tileImages, objects: objectImages, edges: tileEdges, outline: palette.k },
    TILE_SIZE,
  );
  const player = createPlayer(loadPosition(room) ?? room.spawn);
  addEventListener('pagehide', () => savePosition(room, player));

  let conversation = null;
  let pendingTarget = null; // tile to interact with once click-to-walk arrives

  const renderTextbox = createTextbox(document.getElementById('dialogue'), {
    onTap: () => {
      if (conversation) press('tap');
      loop.wake();
    },
    onChoose: (index) => {
      if (conversation && !conversation.done) chooseOption(conversation, index);
      loop.wake();
    },
    onPoint: (index) => {
      if (conversation && !conversation.done) pointAtOption(conversation, index);
      loop.wake();
    },
  });

  // ── Sections: the panel, links into it, and the in-game URL (/#id) ─────────────────────

  const panel = createPanel(document.getElementById('panel'), {
    onOpenSection: (id) => openSection(id),
    enhancers: [createSplitView({ kinds: createShelves({ palette, shade, reducedMotion }) })],
  });
  panel.setSectionPaths(site.sections.map((section) => section.path));
  const sectionIds = new Set([...site.sections.map((section) => section.id), 'hub']);

  // Opens a section in the panel. fromLink: it wasn't opened by walking up to its object,
  // so put the player in front of that object, ready for when the panel closes.
  function openSection(id, { at, fromLink = false, push = true } = {}) {
    if (id === 'latest') {
      if (siteData.latest) location.href = siteData.latest.url;
      return;
    }
    if (!sectionIds.has(id)) return;
    if (fromLink) placeBeside(id);
    // One history entry per visit to the panel, however many sections it shows.
    if (push && location.hash !== `#${id}`) {
      if (panel.isOpen) history.replaceState(history.state, '', `#${id}`);
      else history.pushState({ panel: id }, '', `#${id}`);
    }
    shownSection = id;
    const section = site.sections.find((s) => s.id === id);
    const page = section
      ? { path: section.path, at }
      : { path: '/', element: document.getElementById('overview'), heading: 'The workstation' };
    panel.open(page, {
      onClosed: () => {
        // Closing should undo the URL change; Back does that if we added it.
        if (history.state?.panel) history.back();
        else history.replaceState(null, '', location.pathname + location.search);
        loop.wake();
      },
    });
  }

  function placeBeside(id) {
    const object = room.objects.find(({ x, y }) => room.cellAt(x, y).interact?.open === id);
    if (object) placePlayer(player, room, approach(room, { x: object.x, y: object.y }));
    loop.wake();
  }

  // The URL decides what's open: a link to /#reading opens the bookcase.
  let shownSection = null;
  function syncWithUrl() {
    const id = location.hash.slice(1);
    if (sectionIds.has(id)) {
      if (!panel.isOpen || shownSection !== id) openSection(id, { fromLink: true, push: false });
    } else if (panel.isOpen) {
      panel.close();
    }
  }
  addEventListener('popstate', syncWithUrl);

  // Links to sections in the top bar and the hub open in the game; modified clicks
  // (new tab etc.) still get the plain page.
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-section]');
    if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.button) return;
    event.preventDefault();
    if (conversation) conversation = null;
    openSection(link.dataset.section, { fromLink: true });
    scrollTo({ top: 0 });
  });

  // ── Playing ─────────────────────────────────────────────────────────────────────────────

  const cameraOn = (position) =>
    followCamera(
      { x: position.x + TILE_SIZE / 2, y: position.y + TILE_SIZE / 2 },
      roomSize,
      screen,
    );

  function talk(name, start) {
    const script = fillScript(dialogue[name], { latest: siteData.latest?.title ?? 'nothing yet' });
    conversation = startConversation(script, { wordDelay, start });
  }

  function interact({ npc, interact }) {
    if (npc) {
      npc.facing = opposite(player.facing);
      talk(npc.dialogue);
    } else if (interact?.dialogue) {
      talk(interact.dialogue, interact.start);
    } else if (interact?.open) {
      openSection(interact.open, { at: interact.at });
    }
  }

  function press(action) {
    if (!conversation.done) pressConversation(conversation, action);
  }

  // Returns whether anything is still animating; when nothing is, the loop sleeps until input.
  function update(dt) {
    const actions = input.takeActions();
    const tap = input.takeTap();

    if (panel.isOpen) {
      actions.forEach(panel.press);
      return false;
    }

    if (conversation) {
      if (tap) actions.push('tap');
      actions.forEach(press);
      if (conversation.done) {
        const { open } = conversation;
        conversation = null;
        if (open) openSection(open);
        return false;
      }
      tickConversation(conversation, dt);
      return isRevealing(conversation);
    }

    if (tap) {
      const camera = cameraOn(playerPixelPosition(player));
      const target = clickTarget(room, {
        x: Math.floor((tap.x + camera.x) / TILE_SIZE),
        y: Math.floor((tap.y + camera.y) / TILE_SIZE),
      });
      pendingTarget = walkTo(player, room, approach(room, target)) ? target : null;
    }

    const held = input.held();
    if (held) pendingTarget = null;
    updatePlayer(player, dt, held, room);

    if (isIdle(player)) {
      const reached = reach(room, player, player.facing);
      if (reached && (actions.includes('a') || sameTile(reached.tile, pendingTarget))) {
        interact(reached);
      }
      pendingTarget = null;
    }
    return Boolean(held) || !isIdle(player) || conversation !== null;
  }

  function render() {
    const { ctx } = screen;
    const position = playerPixelPosition(player);
    const camera = cameraOn(position);
    ctx.fillStyle = palette.k;
    ctx.fillRect(0, 0, screen.width, screen.height);
    ctx.drawImage(roomImage, -camera.x, -camera.y);

    const sprites = [
      ...room.npcs.map((npc) => ({
        image: characterFrames[npc.sprite][npc.facing][0],
        x: npc.x * TILE_SIZE,
        y: npc.y * TILE_SIZE,
      })),
      { image: characterFrames.visitor[player.facing][playerFrame(player)], ...position },
    ];
    // Lower sprites draw last so they overlap the ones behind them.
    sprites.sort((a, b) => a.y - b.y);
    for (const { image, x, y } of sprites) {
      ctx.drawImage(image, x - camera.x, y - camera.y - SPRITE_LIFT);
    }

    renderTextbox(conversation && !conversation.done ? conversationView(conversation) : null);
  }

  const loop = startLoop(update, render);
  syncWithUrl();
}

// Data the build writes into the page (see build/templates/home.js). Missing when the
// homepage is opened unbuilt.
function readSiteData() {
  try {
    return JSON.parse(document.getElementById('site-data').textContent);
  } catch {
    return { latest: null, furniture: {} };
  }
}
