// Shows a section's list as a GBA-style list and detail (an enhancer, see ui/panel.js): the
// items down the left, the chosen one in full on the right. On narrow screens it's one at a
// time: the list, then the item. It's built from the plain page's li[data-item] (labelled by
// build/templates/sections.js); without the game the page is still a plain list.
//
// In the list, ▲▼ choose (or ◀▶▲▼ around a shelf) and A (or ▶) goes into the item, where
// ▲▼ move through its links and text; ◀ or B comes back out.
//
// kinds: other ways to show a list, tried first (shelves of books or mugs, ui/shelf.js). A
// kind has matches(entry), async prepare(entries) → items ({ entry, node }), renderList(items,
// pane), move(items, item, action) → item or null at the edge, showDetail(item, pane) and
// optionally hideDetail(item, pane, done). The default shows rows of text. A page can mix
// them (Work: a shelf of mugs, then rows of papers); each run of entries is a group, headed
// by its heading on the plain page.
const NARROW = 560; // px: below this width, one pane at a time

export function createSplitView({ kinds = [] } = {}) {
  return async function enhance(content, controls) {
    const entries = [...content.querySelectorAll('li[data-item]')];
    if (!entries.length) return null;
    const runs = [];
    for (const entry of entries) {
      const kind = kinds.find((k) => k.matches(entry)) ?? rows;
      if (runs.at(-1)?.kind !== kind) runs.push({ kind, entries: [], heading: headingOf(entry) });
      runs.at(-1).entries.push(entry);
    }
    const groups = [];
    for (const run of runs) {
      const prepared = await run.kind.prepare(run.entries);
      if (prepared?.length) groups.push({ ...run, items: prepared });
    }
    if (!controls.isCurrent() || !groups.length) return null;
    for (const group of groups) for (const item of group.items) item.group = group;
    const items = groups.flatMap((group) => group.items);

    const split = element('div', 'split');
    const list = element('div', 'split-pane split-list');
    const detail = element('div', 'split-pane split-detail');
    for (const pane of [list, detail]) Object.assign(pane.dataset, { scroll: '', ownCursor: '' });
    split.append(list, detail);
    for (const group of groups) {
      if (groups.length > 1 && group.heading) {
        list.append(Object.assign(element('h2', 'split-heading'), { textContent: group.heading.textContent }));
      }
      const pane = element('div', 'split-group');
      list.append(pane);
      group.kind.renderList(group.items, pane);
    }
    // The window shows just the list and the item; the page's intro is its subtitle.
    content.replaceChildren(split);

    let current = null;
    let narrow = false;
    let inside = false; // in the item rather than the list
    const itemFor = (node) => items.find((item) => item.node === node);

    function choose(item) {
      if (item === current) return;
      current?.node.classList.remove('current');
      current = item;
      item.node.classList.add('current');
      if (!narrow) item.group.kind.showDetail(item, detail);
    }

    function goInside() {
      if (!current || inside) return;
      inside = true;
      split.dataset.focus = 'item';
      if (narrow) {
        list.hidden = true;
        detail.hidden = false;
        current.group.kind.showDetail(current, detail);
        detail.prepend(backButton());
      }
      detail.scrollTop = 0;
      controls.select(null);
      controls.step(1, detail);
    }

    function comeOut() {
      if (!inside) return;
      inside = false;
      // ▲▼ off the end of a group go to the next one.
    function intoNextGroup(action) {
      const step = { up: -1, down: 1 }[action];
      const group = step && groups[groups.indexOf(current.group) + step];
      return group ? (step > 0 ? group.items[0] : group.items.at(-1)) : null;
    }

    split.dataset.focus = 'list';
      const back = () => {
        if (narrow) {
          detail.hidden = true;
          list.hidden = false;
        }
        controls.select(current.node);
      };
      if (narrow && current.group.kind.hideDetail) current.group.kind.hideDetail(current, detail, back);
      else back();
    }

    function backButton() {
      const button = element('button', 'split-back');
      button.type = 'button';
      button.textContent = '◀ Back';
      button.addEventListener('click', comeOut);
      return button;
    }

    // One pane or two, depending on the window's width.
    new ResizeObserver(() => {
      const wasNarrow = narrow;
      narrow = split.clientWidth < NARROW;
      if (narrow === wasNarrow && split.classList.contains('ready')) return;
      split.classList.add('ready');
      split.classList.toggle('narrow', narrow);
      list.hidden = narrow && inside;
      detail.hidden = narrow && !inside;
      if (!narrow && current) current.group.kind.showDetail(current, detail);
    }).observe(split);

    list.addEventListener('cursor', (event) => {
      const item = itemFor(event.target);
      if (item) choose(item);
    });
    list.addEventListener('click', (event) => {
      const item = items.find((i) => i.node.contains(event.target));
      if (!item) return;
      choose(item);
      controls.select(item.node);
      goInside();
    });

    split.dataset.focus = 'list';
    // Opened at an item, or at a group's heading (the certificates open Work at its papers).
    const first =
      items.find((item) => item.entry.id && item.entry.id === controls.at) ??
      groups.find((group) => controls.at && group.heading?.id === controls.at)?.items[0] ??
      items[0];
    choose(first);
    controls.select(first.node);

    return {
      press(action) {
        if (!inside) {
          if (action === 'a' || (action === 'right' && !narrow && current.group.kind === rows)) {
            goInside();
            return true;
          }
          if (['up', 'down', 'left', 'right'].includes(action)) {
            const next = current.group.kind.move(current.group.items, current, action) ?? intoNextGroup(action);
            if (next) controls.select(next.node);
            return true;
          }
          return false; // B closes the window
        }
        if (action === 'up' || action === 'down') controls.step(action === 'down' ? 1 : -1, detail);
        else if (action === 'left' || action === 'b') comeOut();
        else if (action === 'a') return false; // follows the link under the cursor
        return true;
      },
    };
  };
}

// The heading on the plain page above an entry's list, if there is one.
function headingOf(entry) {
  for (let node = entry.parentElement?.previousElementSibling; node; node = node.previousElementSibling) {
    if (node.matches('h2')) return node;
    if (node.matches('ul, ol')) return null;
  }
  return null;
}

// The default: rows of text, each with its chip and the line under it.
const rows = {
  matches: () => true,
  prepare(entries) {
    return entries.map((entry) => {
      const node = element('button', 'split-row');
      node.type = 'button';
      const { title, chip, sub } = entry.dataset;
      node.append(Object.assign(element('span', 'row-title'), { textContent: title }));
      if (chip) node.append(Object.assign(element('span', 'chip row-chip'), { textContent: chip }));
      if (sub) node.append(Object.assign(element('span', 'row-sub'), { textContent: sub }));
      return { entry, node };
    });
  },
  renderList(items, pane) {
    pane.append(...items.map((item) => item.node));
  },
  move(items, item, action) {
    const step = { up: -1, down: 1 }[action];
    return (step && items[items.indexOf(item) + step]) ?? null;
  },
  showDetail(item, pane) {
    pane.replaceChildren(...[...item.entry.childNodes].map((node) => node.cloneNode(true)));
  },
};

function element(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}
