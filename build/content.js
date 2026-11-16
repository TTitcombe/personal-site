// Loads everything in content/: one folder of markdown files per collection, plus
// content/pages/ for the words at the top of each section. Every file is checked, and a
// mistake fails the build with a message naming the file and what to fix.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { marked } from 'marked';
import { parseFrontmatter } from './frontmatter.js';

const URL_SAFE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const YEAR_MONTH = /^\d{4}(-\d{2})?$/; // or just the year, when the month isn't known

// Reads every published .md file in `dir` (not _-prefixed, not `draft: true`).
function readDir(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith('.md') && !file.startsWith('_'))
    .map((file) => readEntry(file, readFileSync(join(dir, file), 'utf8')))
    .filter((entry) => entry.data.draft !== 'true');
}

function readEntry(file, source) {
  const slug = file.replace(/\.md$/, '');
  if (!URL_SAFE.test(slug)) {
    throw new Error(`${file}: file names become URLs, so use lowercase letters, numbers and dashes`);
  }
  const { data, body } = parseFrontmatter(source, file);
  return { file, slug, data, body: body.trim(), html: body.trim() ? marked.parse(body) : '' };
}

// Small validators. Each returns the cleaned value or throws a message naming the file.
const text = (entry, key, { required = false } = {}) => {
  const value = entry.data[key];
  const present = typeof value === 'string' && value !== '';
  if (required && !present) throw new Error(`${entry.file}: needs a ${key}`);
  return present ? value : null;
};
const matching = (pattern, hint) => (entry, key, options) => {
  const value = text(entry, key, options);
  if (value !== null && !pattern.test(value)) throw new Error(`${entry.file}: ${key} must be ${hint}`);
  return value;
};
const isoDate = matching(ISO_DATE, 'YYYY-MM-DD');
const yearMonth = matching(YEAR_MONTH, 'YYYY-MM (or just YYYY)');
const oneOf = (allowed) => (entry, key, options) => {
  const value = text(entry, key, options);
  if (value !== null && !allowed.includes(value)) {
    throw new Error(`${entry.file}: ${key} must be one of: ${allowed.join(', ')}`);
  }
  return value;
};
const links = (entry, key = 'links') =>
  [entry.data[key] || []].flat().map((link) => {
    if (typeof link === 'string' || !/^(https?:\/\/|\/|mailto:)/.test(link.url)) {
      throw new Error(`${entry.file}: each of ${key} must look like "- Label: https://…"`);
    }
    return link;
  });
const tags = (entry) => {
  const list = [entry.data.tags || []].flat().map((tag) => tag.toLowerCase());
  for (const tag of list) {
    if (!URL_SAFE.test(tag)) throw new Error(`${entry.file}: tag "${tag}" must be lowercase-with-dashes`);
  }
  return list;
};

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };

// The first paragraph as plain text, trimmed to a sentence-ish length for summaries.
export function firstParagraphText(html) {
  const paragraph = html.match(/<p>([\s\S]*?)<\/p>/)?.[1] ?? '';
  const plain = paragraph
    .replace(/<[^>]+>/g, '')
    .replace(/&(amp|lt|gt|quot|#39);/g, (entity) => ENTITIES[entity])
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > 160 ? `${plain.slice(0, 157).trimEnd()}…` : plain;
}

const newestFirst = (key) => (a, b) =>
  (b[key] ?? '').localeCompare(a[key] ?? '') || a.title.localeCompare(b.title);

// content/posts/some-note.md → /posts/some-note/
export function parsePost(entry) {
  return {
    slug: entry.slug,
    path: `/posts/${entry.slug}/`,
    title: text(entry, 'title', { required: true }),
    date: isoDate(entry, 'date', { required: true }),
    tags: tags(entry),
    summary: text(entry, 'summary') ?? firstParagraphText(entry.html),
    // A video version of the post (Instagram, YouTube…), linked at the end of it.
    video: text(entry, 'video'),
    html: entry.html,
  };
}

// The Winter arc's log. Entries with a body get their own page; the rest are just a line
// (with links) in the log.
function parseArcEntry(entry) {
  return {
    slug: entry.slug,
    path: entry.html ? `/winter-arc/${entry.slug}/` : null,
    title: text(entry, 'title', { required: true }),
    date: isoDate(entry, 'date', { required: true }),
    type: oneOf(['experiment', 'post', 'video', 'repo', 'update'])(entry, 'type') ?? 'update',
    summary: text(entry, 'summary') ?? firstParagraphText(entry.html),
    links: links(entry),
    html: entry.html,
  };
}

const PROJECT_ORDER = ['active', 'complete', 'abandoned'];
function parseProject(entry) {
  return {
    slug: entry.slug,
    title: text(entry, 'title', { required: true }),
    status: oneOf(PROJECT_ORDER)(entry, 'status', { required: true }),
    started: yearMonth(entry, 'started'),
    summary: text(entry, 'summary', { required: true }),
    links: links(entry),
    html: entry.html,
  };
}

function parseJob(entry) {
  return {
    slug: entry.slug,
    company: text(entry, 'company', { required: true }),
    title: text(entry, 'role', { required: true }),
    start: yearMonth(entry, 'start', { required: true }),
    end: yearMonth(entry, 'end'), // blank means "now"
    location: text(entry, 'location'),
    links: links(entry),
    html: entry.html,
  };
}

function parsePaper(entry) {
  return {
    slug: entry.slug,
    title: text(entry, 'title', { required: true }),
    authors: text(entry, 'authors', { required: true }),
    year: matching(/^\d{4}$/, 'a year like 2021')(entry, 'year', { required: true }),
    venue: text(entry, 'venue'),
    arxiv: matching(/^https:\/\/arxiv\.org\//, 'an https://arxiv.org/ link')(entry, 'arxiv'),
    links: links(entry),
    html: entry.html,
  };
}

const BOOK_STATUSES = ['reading', 'read', 'abandoned'];
export const VERDICTS = {
  'must-read': 'Absolutely must read',
  recommend: 'Would recommend',
  'not-for-me': 'Would not recommend',
};
function parseBook(entry) {
  const book = {
    slug: entry.slug,
    title: text(entry, 'title', { required: true }),
    author: text(entry, 'author', { required: true }),
    status: oneOf(BOOK_STATUSES)(entry, 'status', { required: true }),
    verdict: oneOf(Object.keys(VERDICTS))(entry, 'verdict'),
    finished: matching(/^\d{4}-\d{2}(-\d{2})?$/, 'YYYY-MM or YYYY-MM-DD')(entry, 'finished'),
    html: entry.html,
  };
  if (book.status === 'read' && !book.verdict) {
    throw new Error(`${entry.file}: finished books need a verdict (${Object.keys(VERDICTS).join(', ')})`);
  }
  return book;
}

export const TALK_STATUSES = ['upcoming', 'given', 'available', 'preparing'];
function parseTalk(entry) {
  const talk = {
    slug: entry.slug,
    title: text(entry, 'title', { required: true }),
    status: oneOf(TALK_STATUSES)(entry, 'status', { required: true }),
    date: isoDate(entry, 'date'),
    event: text(entry, 'event'),
    location: text(entry, 'location'),
    links: links(entry),
    html: entry.html,
  };
  if ((talk.status === 'upcoming' || talk.status === 'given') && !(talk.date && talk.event)) {
    throw new Error(`${entry.file}: ${talk.status} talks need a date and an event`);
  }
  return talk;
}

// content/pages/<name>.md: front matter is free-form (title, description, and whatever that
// page uses); the body is the intro.
function loadPage(dir, name) {
  const file = join(dir, `${name}.md`);
  if (!existsSync(file)) return { data: {}, html: '' };
  const entry = readEntry(`${name}.md`, readFileSync(file, 'utf8'));
  return { data: entry.data, html: entry.html };
}

export function loadContent(root) {
  const dir = (name) => join(root, name);
  const load = (name, parse) => readDir(dir(name)).map(parse);
  const pages = Object.fromEntries(
    ['home', 'notes', 'winter-arc', 'projects', 'work', 'cv', 'reading', 'talks', 'about', 'find-me'].map(
      (name) => [name, loadPage(dir('pages'), name)],
    ),
  );
  return {
    pages,
    posts: load('posts', parsePost).sort(newestFirst('date')),
    arc: load('winter-arc', parseArcEntry).sort(newestFirst('date')),
    projects: load('projects', parseProject).sort(
      (a, b) =>
        PROJECT_ORDER.indexOf(a.status) - PROJECT_ORDER.indexOf(b.status) ||
        newestFirst('started')(a, b),
    ),
    jobs: load('jobs', parseJob).sort(newestFirst('start')),
    papers: load('papers', parsePaper).sort(newestFirst('year')),
    books: load('reading', parseBook).sort(
      (a, b) =>
        BOOK_STATUSES.indexOf(a.status) - BOOK_STATUSES.indexOf(b.status) ||
        newestFirst('finished')(a, b),
    ),
    talks: load('talks', parseTalk).sort(
      (a, b) =>
        TALK_STATUSES.indexOf(a.status) - TALK_STATUSES.indexOf(b.status) || newestFirst('date')(a, b),
    ),
  };
}

// Tags ordered by how many posts use them, then alphabetically.
export function tagsByPopularity(posts) {
  const counts = new Map();
  for (const tag of posts.flatMap((post) => post.tags)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([tag]) => tag);
}

// For tests and tools: parse one post from its file name and source.
export const parsePostFile = (file, source) => parsePost(readEntry(file, source));
