import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as dialogue from '../src/dialogue/index.js';
import {
  chooseOption,
  conversationView,
  fillScript,
  pressConversation,
  startConversation,
  tickConversation,
} from '../src/game/dialogue.js';
import { OPENABLE } from './openable.js';

const script = {
  speaker: 'TEST',
  start: 'hello',
  nodes: {
    hello: {
      text: ['one two three', 'second page'],
      choices: [
        { label: 'More', next: 'more' },
        { label: 'Bye', next: null },
      ],
    },
    more: { text: ['the end'], next: null },
  },
};

const start = () => startConversation(script, { wordDelay: 0.1 });

test('text fills in word by word', () => {
  const c = start();
  assert.equal(conversationView(c).revealed, 1);
  tickConversation(c, 0.1);
  assert.equal(conversationView(c).revealed, 2);
  tickConversation(c, 10);
  assert.equal(conversationView(c).revealed, 3);
});

test('pressing mid-page completes it; pressing again turns the page', () => {
  const c = start();
  pressConversation(c, 'a');
  assert.equal(conversationView(c).revealed, 3);
  assert.equal(conversationView(c).waiting, true);
  pressConversation(c, 'a');
  assert.equal(conversationView(c).words.join(' '), 'second page');
});

test('choices appear once the last page is complete, and arrows wrap', () => {
  const c = start();
  pressConversation(c, 'a');
  pressConversation(c, 'a');
  assert.equal(conversationView(c).choices, null);
  pressConversation(c, 'a');
  assert.deepEqual(conversationView(c).choices, ['More', 'Bye']);
  pressConversation(c, 'up');
  assert.equal(conversationView(c).selected, 1);
});

test('a tap never picks a choice; A or a click does', () => {
  const c = start();
  for (let i = 0; i < 3; i++) pressConversation(c, 'a');
  pressConversation(c, 'tap');
  assert.ok(conversationView(c).choices);
  chooseOption(c, 0);
  assert.equal(conversationView(c).words.join(' '), 'the end');
  pressConversation(c, 'a');
  pressConversation(c, 'a');
  assert.equal(c.done, true);
});

test('B at a choice ends the conversation', () => {
  const c = start();
  for (let i = 0; i < 3; i++) pressConversation(c, 'a');
  pressConversation(c, 'b');
  assert.equal(c.done, true);
});

test('every dialogue script only links to nodes that exist', () => {
  for (const [name, s] of Object.entries(dialogue)) {
    assert.ok(s.nodes[s.start], `${name}: missing start node ${s.start}`);
    for (const [id, node] of Object.entries(s.nodes)) {
      assert.ok(node.text.length > 0, `${name}.${id}: no text`);
      if (node.open) {
        assert.ok(OPENABLE.has(node.open), `${name}.${id}: opens unknown section ${node.open}`);
        continue;
      }
      const targets = node.choices ? node.choices.map((choice) => choice.next) : [node.next];
      for (const next of targets) {
        assert.ok(next === null || s.nodes[next], `${name}.${id}: links to missing node ${next}`);
      }
    }
  }
});

test('a node with `open` ends the conversation and says what to open', () => {
  const c = startConversation(
    { start: 'a', nodes: { a: { text: ['Off you go.'], open: 'about' } } },
    { wordDelay: 0 },
  );
  pressConversation(c, 'a');
  assert.equal(c.done, false);
  tickConversation(c, 1);
  pressConversation(c, 'a');
  assert.deepEqual({ done: c.done, open: c.open }, { done: true, open: 'about' });
});

test('conversations can start from any node, and fill placeholders', () => {
  const c = startConversation(fillScript(script, { x: 'filled' }), { wordDelay: 0, start: 'more' });
  assert.equal(conversationView(c).words.join(' '), 'the end');
  const filled = fillScript({ start: 'a', nodes: { a: { text: ['NEW: {x} {y}'] } } }, { x: 'Hi' });
  assert.equal(filled.nodes.a.text[0], 'NEW: Hi {y}');
});
