import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { loadContent, parsePostFile, tagsByPopularity } from '../build/content.js';
import { rssFeed } from '../build/feed.js';
import { parseFrontmatter } from '../build/frontmatter.js';
import { postPage } from '../build/templates/sections.js';

const post = (front, body = 'Hello & welcome.') => `---\n${front}\n---\n\n${body}\n`;

test('front matter reads values, quoted strings, tag lists and link lists', () => {
  const { data, body } = parseFrontmatter(
    post('title: "Quoted: title"\ndate: 2026-10-14\ntags: [a, b-c]\nlinks:\n  - GitHub: https://github.com/x\n  - Post: /posts/y/'),
    'x.md',
  );
  assert.deepEqual(data, {
    title: 'Quoted: title',
    date: '2026-10-14',
    tags: ['a', 'b-c'],
    links: [
      { label: 'GitHub', url: 'https://github.com/x' },
      { label: 'Post', url: '/posts/y/' },
    ],
  });
  assert.equal(body.trim(), 'Hello & welcome.');
});

test('posts get a URL from the file name and a plain-text summary', () => {
  const parsed = parsePostFile('my-note.md', post('title: T\ndate: 2026-10-14\ntags: [Society]'));
  assert.equal(parsed.path, '/posts/my-note/');
  assert.deepEqual(parsed.tags, ['society']);
  assert.equal(parsed.summary, 'Hello & welcome.');
  assert.match(parsed.html, /<p>Hello &amp; welcome.<\/p>/);
});

test('bad posts fail the build with a message that says what to fix', () => {
  assert.throws(() => parsePostFile('My Note.md', post('title: T\ndate: 2026-10-14')), /file names become URLs/);
  assert.throws(() => parsePostFile('n.md', post('date: 2026-10-14')), /needs a title/);
  assert.throws(() => parsePostFile('n.md', post('title: T\ndate: 14/10/2026')), /YYYY-MM-DD/);
  assert.throws(() => parsePostFile('n.md', 'no front matter'), /front matter/);
});

test('all the real content loads, drafts and _examples are left out, newest first', () => {
  const content = loadContent(fileURLToPath(new URL('../content', import.meta.url)));
  for (let i = 1; i < content.posts.length; i++) assert.ok(content.posts[i - 1].date >= content.posts[i].date);
  for (const items of [content.papers, content.books, content.jobs]) {
    assert.ok(items.every((item) => item.title !== 'Paper title' && item.title !== 'Book title'));
  }
  assert.ok(content.pages.about.data.short_bio);
});

test('tags are ordered by how often they are used', () => {
  const posts = [{ tags: ['b'] }, { tags: ['a', 'b'] }, { tags: ['c'] }];
  assert.deepEqual(tagsByPopularity(posts), ['b', 'a', 'c']);
});

test('post pages escape titles, have share links, a share image and what to read next', () => {
  const parsed = parsePostFile('x.md', post('title: Cats <3 dogs\ndate: 2026-10-14'));
  const html = postPage(parsed, { next: { path: '/posts/y/', title: 'Next one' } });
  assert.match(html, /<h1>Cats &lt;3 dogs<\/h1>/);
  assert.match(html, /news\.ycombinator\.com\/submitlink\?u=/);
  assert.match(html, /x\.com\/intent\/post/);
  assert.match(html, /og:image" content="[^"]+\/og\/x\.png"/);
  assert.match(html, /Read next: <a href="\/posts\/y\/">Next one<\/a>/);
});

test('the feed has an item per post with absolute links', () => {
  const posts = [parsePostFile('x.md', post('title: T\ndate: 2026-10-14', '[home](/posts/)'))];
  const xml = rssFeed(posts);
  assert.equal(xml.match(/<item>/g).length, 1);
  assert.match(xml, /href="https?:\/\/[^"]+\/posts\/"/);
});
