// A conversation walks a dialogue script (see src/dialogue/). Each node has pages of
// text, then offers choices, moves on to `next`, or ends the conversation. A node with
// `open` ends it and leaves `conversation.open` set, for the caller to open that section.
export function startConversation(script, { wordDelay, start = script.start }) {
  return enterNode({ script, wordDelay, done: false, open: null }, start);
}

function enterNode(conversation, nodeId) {
  if (nodeId == null) {
    conversation.done = true;
    return conversation;
  }
  return Object.assign(conversation, { nodeId, page: 0, revealed: 1, selected: 0 });
}

const currentNode = (c) => c.script.nodes[c.nodeId];
const pageWords = (c) => currentNode(c).text[c.page].split(' ');
const pageComplete = (c) => c.revealed >= pageWords(c).length;
const onLastPage = (c) => c.page === currentNode(c).text.length - 1;
const shownChoices = (c) =>
  pageComplete(c) && onLastPage(c) && currentNode(c).choices ? currentNode(c).choices : null;

export const isRevealing = (c) => !pageComplete(c);

export function tickConversation(c, dt) {
  c.revealed = Math.min(pageWords(c).length, c.revealed + dt / c.wordDelay);
}

// action: 'a' (confirm), 'b' (cancel), 'tap' (advances text, never picks a choice), 'up'/'down'.
export function pressConversation(c, action) {
  const advancing = action === 'a' || action === 'b' || action === 'tap';
  if (!pageComplete(c)) {
    if (advancing) c.revealed = pageWords(c).length;
    return;
  }

  const choices = shownChoices(c);
  if (choices) {
    if (action === 'up') c.selected = (c.selected + choices.length - 1) % choices.length;
    if (action === 'down') c.selected = (c.selected + 1) % choices.length;
    if (action === 'a') chooseOption(c, c.selected);
    if (action === 'b') c.done = true;
    return;
  }

  if (!advancing) return;
  if (onLastPage(c)) {
    const { open, next } = currentNode(c);
    if (open) Object.assign(c, { done: true, open });
    else enterNode(c, next);
  } else {
    c.page++;
    c.revealed = 1;
  }
}

export function chooseOption(c, index) {
  const choices = shownChoices(c);
  if (choices) enterNode(c, choices[index].next);
}

// Moves the cursor to a choice without picking it (the mouse is over it).
export function pointAtOption(c, index) {
  if (shownChoices(c)) c.selected = index;
}

export function conversationView(c) {
  const choices = shownChoices(c);
  return {
    pageKey: `${c.nodeId}:${c.page}`,
    speaker: c.script.speaker,
    words: pageWords(c),
    revealed: Math.floor(c.revealed),
    waiting: pageComplete(c) && !choices,
    choices: choices && choices.map((choice) => choice.label),
    selected: c.selected,
  };
}

// Fills {name} placeholders in a script's text, e.g. { latest: 'Post title' }.
export function fillScript(script, values) {
  const fill = (text) => text.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
  const nodes = Object.fromEntries(
    Object.entries(script.nodes).map(([id, node]) => [id, { ...node, text: node.text.map(fill) }]),
  );
  return { ...script, nodes };
}
