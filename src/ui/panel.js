// The window that shows section pages over the office. It fetches the plain page (built by
// build/) and shows its <main>, so every section is written once and looks right in both
// places. Links to other section pages open in the window; posts and other pages load
// normally; external links open in a new tab so the office is still there when you come back.
//
// A ▶ cursor walks the links, as in a GBA menu: ▲▼ move it (scrolling through any text in
// between), ◀▶ turn a page, A follows the link, B closes.
//
// enhancers: functions called with each page's content and the window's controls, which can
// add game-only parts to a plain page (src/ui/split.js). One may return { press(action) },
// which gets every button press first and returns true if it used it. Parts marked
// [data-own-cursor] show the selection themselves; [data-scroll] marks a part that scrolls
// on its own.
export function createPanel(root, { onOpenSection, enhancers = [] }) {
  root.innerHTML = `
    <section class="panel box" role="dialog" aria-modal="true" aria-labelledby="panel-title" hidden>
      <header class="band">
        <h2 id="panel-title"></h2>
        <p class="subtitle"></p>
        <button type="button" class="close" aria-label="Close">✕</button>
      </header>
      <div class="panel-box">
        <div class="panel-body" tabindex="-1">
          <div class="panel-content"></div>
          <span class="cursor" aria-hidden="true" hidden>▶</span>
        </div>
        <span class="more" aria-hidden="true" hidden>▼</span>
      </div>
      <footer class="band">
        <a class="as-page" href="/">Full page</a>
        <span class="keys" aria-hidden="true">▲▼ Choose · A Open · B Back</span>
      </footer>
    </section>`;
  const frame = root.firstElementChild;
  const title = frame.querySelector('h2');
  const subtitle = frame.querySelector('.subtitle');
  const asPage = frame.querySelector('.as-page');
  const body = frame.querySelector('.panel-body');
  const content = frame.querySelector('.panel-content');
  const cursor = frame.querySelector('.cursor');
  const more = frame.querySelector('.more');
  const pages = new Map(); // path → { main, description }, so reopening is instant
  let onClose = () => {};
  let opened = 0; // ignores slow responses for a page the visitor has already left
  let returnFocus = null; // what had focus before the window opened, to give it back
  let enhanced = []; // what this page's enhancers returned

  frame.querySelector('.close').addEventListener('click', () => close());
  // While it's open, Tab goes round the window rather than off behind it.
  frame.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const stops = [...frame.querySelectorAll('a[href], button')].filter((el) => el.getClientRects().length);
    if (!stops.length) return;
    const [first, last] = [stops[0], stops.at(-1)];
    if (event.shiftKey ? document.activeElement === first || !frame.contains(document.activeElement) : document.activeElement === last) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  });
  content.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.button) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    const here = asPage.getAttribute('href');
    if (url.pathname === here && url.hash) {
      event.preventDefault();
      scrollTo(url.hash.slice(1));
    } else if (link.dataset.section) {
      event.preventDefault();
      onOpenSection(link.dataset.section);
    } else if (isFramePage(url.pathname)) {
      event.preventDefault();
      show({ path: url.pathname, at: url.hash.slice(1) });
    }
  });

  // Section index pages and tag lists open in the window; anything else is a full page.
  const framePaths = new Set();
  const isFramePage = (path) => framePaths.has(path) || path.startsWith('/tags/');

  async function load(path) {
    if (pages.has(path)) return pages.get(path);
    const response = await fetch(path);
    if (!response.ok) throw new Error(response.statusText);
    const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
    const main = doc.querySelector('main');
    const page = { main, description: doc.querySelector('meta[name="description"]')?.content ?? '' };
    pages.set(path, page);
    return page;
  }

  function fill({ main, description = '' }) {
    const copy = main.cloneNode(true);
    const heading = copy.querySelector('h1');
    title.textContent = heading?.textContent.trim() ?? '';
    subtitle.textContent = description;
    heading?.remove();
    // Other sites open in a new tab, so the office is still here afterwards.
    for (const link of copy.querySelectorAll('a[href^="http"]')) {
      link.target = '_blank';
      link.rel = 'noopener';
    }
    content.replaceChildren(...copy.childNodes);
    body.scrollTop = 0;
  }

  // Shows a page: { path } to fetch one, or { element, path } for content already on the
  // homepage (the hub). `at` scrolls to an anchor on it.
  async function show({ path, element, at, heading }) {
    const ticket = ++opened;
    if (frame.hidden) {
      const active = document.activeElement;
      returnFocus = active && active !== document.body && !frame.contains(active) ? active : null;
    }
    frame.hidden = false;
    document.documentElement.classList.add('window-open');
    asPage.href = path;
    select(null);
    if (element) {
      fill({ main: element });
      if (heading) title.textContent = heading;
    } else {
      title.textContent = subtitle.textContent = '';
      content.replaceChildren(status('Loading…'));
      try {
        const page = await load(path);
        if (ticket !== opened) return;
        fill(page);
      } catch {
        if (ticket !== opened) return;
        content.replaceChildren(status('The server is having a lie down. Try again in a moment.'));
        return;
      }
    }
    if (at) scrollTo(at);
    body.focus({ preventScroll: true });
    reselect();
    updateMore();
    enhance(ticket, at);
  }

  const reselect = () => select(links(content).find((el) => isOnScreen(el, body)) ?? null, { focus: false });

  function enhance(ticket, at) {
    enhanced = [];
    const controls = {
      isCurrent: () => ticket === opened,
      at, // the anchor the page was opened at, if any
      select: (element) => {
        select(element);
        reveal(element);
      },
      reselect,
      reveal,
      // ▲▼ within a part that scrolls on its own, as they work on the whole window.
      step: (direction, scroller) => step(direction, scroller),
      updateMore,
    };
    for (const enhancer of enhancers) {
      Promise.resolve(enhancer(content, controls)).then((result) => {
        if (result && controls.isCurrent()) enhanced.push(result);
        updateMore();
      });
    }
  }

  function scrollTo(id) {
    reveal(content.querySelector(`#${CSS.escape(id)}`), { start: true });
  }

  // Scrolls whatever `element` scrolls within (never the page) so it's in view, or at the
  // top with start.
  function reveal(element, { start = false } = {}) {
    if (!element) return;
    const scroller = element.parentElement?.closest('[data-scroll]') ?? body;
    const box = element.getBoundingClientRect();
    const { top, bottom } = scroller.getBoundingClientRect();
    if (start || box.top < top) scroller.scrollTop += box.top - top;
    else if (box.bottom > bottom) scroller.scrollTop += Math.min(box.bottom - bottom, box.top - top);
  }

  function close() {
    if (frame.hidden) return;
    frame.hidden = true;
    opened++;
    document.documentElement.classList.remove('window-open');
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    else document.activeElement?.blur();
    returnFocus = null;
    onClose();
  }

  // ── The cursor ────────────────────────────────────────────────────────────────────────

  let selected = null;
  const links = (within) =>
    [...within.querySelectorAll('a[href], button')].filter((el) => el.getClientRects().length);
  const isOnScreen = (el, scroller) => {
    const box = el.getBoundingClientRect();
    const view = scroller.getBoundingClientRect();
    return box.top >= view.top && box.bottom <= view.bottom;
  };

  function select(link, { focus = true } = {}) {
    selected?.classList.remove('selected');
    selected = link;
    cursor.hidden = !link || Boolean(link.closest('[data-own-cursor]'));
    if (!link) return;
    link.classList.add('selected');
    if (focus) link.focus({ preventScroll: true });
    placeCursor();
    link.dispatchEvent(new CustomEvent('cursor', { bubbles: true }));
  }

  // The cursor sits in the left margin, level with the first line of the link's text.
  function placeCursor() {
    if (!selected || cursor.hidden) return;
    const range = document.createRange();
    range.selectNodeContents(selected);
    const line = range.getClientRects()[0] ?? selected.getBoundingClientRect();
    cursor.style.top = `${line.top - body.getBoundingClientRect().top + body.scrollTop}px`;
  }

  // Moves to the next link if it's on screen or nearly; otherwise scrolls towards it, so
  // text between links can be read. `scroller`: the part to move within (the whole window
  // by default).
  function step(direction, scroller = body) {
    const all = links(scroller === body ? content : scroller);
    const { top, bottom, height } = scroller.getBoundingClientRect();
    const reach = height / 2;
    const current = all.includes(selected) && isOnScreen(selected, scroller);
    const next = current
      ? all[all.indexOf(selected) + direction]
      : direction > 0
        ? all.find((el) => el.getBoundingClientRect().top >= top)
        : all.findLast((el) => el.getBoundingClientRect().bottom <= bottom);
    const box = next?.getBoundingClientRect();
    if (box && (direction > 0 ? box.bottom <= bottom + reach : box.top >= top - reach)) {
      select(next);
      reveal(next);
    } else {
      scroller.scrollBy({ top: direction * reach });
    }
  }

  // ▼ in the corner while there's more below.
  function updateMore() {
    more.hidden = body.scrollTop + body.clientHeight >= body.scrollHeight - 1;
  }
  body.addEventListener('scroll', updateMore, { passive: true });
  // Text reflows when the font arrives, images load or the window resizes.
  const reflowed = new ResizeObserver(() => {
    placeCursor();
    updateMore();
  });
  reflowed.observe(body);
  reflowed.observe(content);
  // Tab and the mouse move the cursor too.
  content.addEventListener('focusin', (event) => {
    if (event.target !== selected && links(content).includes(event.target)) select(event.target, { focus: false });
  });
  content.addEventListener('pointermove', (event) => {
    const link = event.target.closest('a[href], button');
    if (link && link !== selected) select(link, { focus: false });
  });

  return {
    get isOpen() {
      return !frame.hidden;
    },
    // paths: every section page, so links between them stay in the window.
    setSectionPaths(paths) {
      paths.forEach((path) => framePaths.add(path));
    },
    open(page, { onClosed = () => {} } = {}) {
      onClose = onClosed;
      return show(page);
    },
    close,
    press(action) {
      if (enhanced.some((part) => part.press?.(action))) return;
      if (action === 'b') return close();
      if (action === 'up' || action === 'down') step(action === 'down' ? 1 : -1);
      if (action === 'left' || action === 'right') {
        body.scrollBy({ top: (action === 'right' ? 1 : -1) * body.clientHeight });
      }
      if (action === 'a') selected?.click();
    },
  };
}

function status(text) {
  const p = document.createElement('p');
  p.className = 'status';
  p.textContent = text;
  return p;
}
