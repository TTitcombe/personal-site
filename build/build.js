// Builds the deployable site into dist/:
// - the homepage: the game (bundled and inlined), the top bar, and the plain hub
// - a plain page per section, post, tag and Winter arc entry, plus the CV and a 404
// - share images, section icons, book covers and the favicon, drawn from the game's art
// - pixel.ttf, the game's pixel font as a real font, for the text over the game
// - RSS, sitemap.xml, robots.txt and llms.txt
// Then checks the size budgets, so the site can't quietly get heavy.
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';
import { site } from '../site.config.js';
import { font } from '../src/art/font.js';
import { mugs as mugArt } from '../src/art/mugs/index.js';
import { socialIcons } from '../src/art/socials.js';
import { artByName, artPng, furniture, letteredBooks, restingBookRows, shelfRows } from './art.js';
import { checkBudgets } from './budgets.js';
import { loadContent, tagsByPopularity } from './content.js';
import { rssFeed } from './feed.js';
import { llmsTxt, robots, sitemap } from './seo.js';
import { shareImage } from './share-image.js';
import { loadSocialFeeds } from './social-feeds.js';
import { trueTypeFont } from './webfont.js';
import { hub, siteData } from './templates/home.js';
import { headTags, personJsonLd, TOP_BAR_CSS, topBar } from './templates/layout.js';
import {
  aboutPage,
  arcEntryPage,
  arcPage,
  cvPage,
  findMePage,
  notesPage,
  notFoundPage,
  postPage,
  projectsPage,
  readingPage,
  talksPage,
  workPage,
} from './templates/sections.js';

export const root = fileURLToPath(new URL('..', import.meta.url));
export const out = join(root, 'dist');

const GAME_SCRIPT = '<script type="module" src="src/main.js"></script>';
const PHOTO = 'content/pages/photo.jpg';

// index.html is a template: the build fills in the marked slots and inlines the whole game,
// minified, so the homepage arrives in a single request.
function homepage({ dev, content }) {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const slots = {
    '/* top-bar-css */': TOP_BAR_CSS,
    '<!-- top-bar -->': topBar({ modeToggle: true }),
    '<!-- hub -->': hub(content),
    '<!-- head -->': headTags({
      title: `${site.title} · ${site.jobTitle}`,
      description: `${site.description} Come in, have a look around the office.`,
      path: '/',
      jsonLd: personJsonLd(),
    }),
    '<!-- site-data -->': JSON.stringify(siteData(content)).replaceAll('</', '<\\/'),
  };
  for (const marker of [...Object.keys(slots), GAME_SCRIPT]) {
    if (!html.includes(marker)) throw new Error(`index.html: expected ${marker}`);
  }
  const [bundle] = buildSync({
    entryPoints: [join(root, 'src/main.js')],
    bundle: true,
    minify: true,
    format: 'esm',
    target: 'es2020',
    legalComments: 'none',
    sourcemap: dev ? 'inline' : false,
    write: false,
  }).outputFiles;
  // "</script" inside the code would end the inline script early.
  const js = bundle.text.trim().replaceAll('</script', '<\\/script');
  let filled = html;
  for (const [marker, value] of Object.entries(slots)) filled = filled.replace(marker, () => value);
  return filled.replace(GAME_SCRIPT, () => `<script type="module">${js}</script>`);
}

// `dev` adds source maps so browser devtools show the original files.
export async function build({ dev = false } = {}) {
  const content = loadContent(join(root, 'content'));
  const { pages, posts, arc, projects, jobs, papers, books, talks } = content;
  const tags = tagsByPopularity(posts);
  const about = { ...pages.about, photo: existsSync(join(root, PHOTO)) ? '/photo.jpg' : null };
  const feeds = await loadSocialFeeds();

  rmSync(out, { recursive: true, force: true });
  const written = [];
  const write = (path, data) => {
    const file = join(out, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, data);
    written.push(path);
  };
  const indexed = []; // plain pages for the sitemap
  const writePage = (path, html, date) => {
    write(`${path}index.html`, html);
    indexed.push({ path, date });
  };

  // Every book and job needs art: the game puts them on the shelves.
  const bookArt = letteredBooks();
  for (const book of books) {
    if (!bookArt[book.slug]) {
      throw new Error(
        `content/reading/${book.slug}.md: no art for this book yet. Add src/art/books/${book.slug}.js and list it in src/art/books/index.js`,
      );
    }
  }
  for (const job of jobs) {
    if (!mugArt[job.slug]) {
      throw new Error(`content/jobs/${job.slug}.md: no mug for this job yet. Add src/art/mugs/${job.slug}.js and list it in src/art/mugs/index.js`);
    }
  }
  const room = furniture({ books, jobs, bookArt, mugArt });
  const art = (name) => room[name] ?? artByName(name);

  write('index.html', homepage({ dev, content: { ...content, about, furniture: room } }));
  indexed.push({ path: '/', date: posts[0]?.date });

  posts.forEach((post, i) => {
    writePage(post.path, postPage(post, { next: posts[i + 1] ?? (i > 0 ? posts[0] : null) }), post.date);
    write(`og/${post.slug}.png`, shareImage({ title: post.title, footer: site.title, subtitle: site.tagline }));
  });
  writePage('/posts/', notesPage({ posts, tags, intro: pages.notes }), posts[0]?.date);
  for (const tag of tags) {
    const tagged = posts.filter((post) => post.tags.includes(tag));
    writePage(`/tags/${tag}/`, notesPage({ posts: tagged, tags, intro: pages.notes, activeTag: tag }));
  }

  writePage('/winter-arc/', arcPage({ arc, intro: pages['winter-arc'] }), arc[0]?.date);
  for (const entry of arc.filter((e) => e.path)) writePage(entry.path, arcEntryPage(entry), entry.date);
  writePage('/projects/', projectsPage({ projects, intro: pages.projects }));
  writePage('/work/', workPage({ jobs, papers, intro: pages.work }));
  writePage('/cv/', cvPage({ jobs, papers, about, cv: pages.cv }));
  // The plain page shows each book's cover at an angle.
  const covers = {};
  for (const book of books) {
    const rows = restingBookRows(bookArt[book.slug]);
    write(`art/books/${book.slug}.png`, artPng(rows));
    covers[book.slug] = { path: `/art/books/${book.slug}.png`, width: rows[0].length, height: rows.length };
  }
  // For the game's shelf: the faces to turn, and how each book stands on the shelf.
  const shelf = books.map((book) => [book.slug, { ...bookArt[book.slug], shelf: shelfRows(bookArt[book.slug], book) }]);
  write('art/books.json', JSON.stringify(Object.fromEntries(shelf)));
  write('art/mugs.json', JSON.stringify(Object.fromEntries(jobs.map((job) => [job.slug, mugArt[job.slug]]))));
  writePage('/reading/', readingPage({ books, covers, intro: pages.reading }));
  writePage('/talks/', talksPage({ talks, intro: pages.talks, about }));
  writePage('/about/', aboutPage({ about }));
  writePage('/find-me/', findMePage({ intro: pages['find-me'], feeds }));
  write('404.html', notFoundPage());
  if (about.photo) copyFileSync(join(root, PHOTO), join(out, 'photo.jpg'));

  write('og/default.png', shareImage({ title: site.description, footer: site.title, subtitle: site.tagline }));
  for (const section of site.sections) {
    const rows = section.icon && art(section.icon);
    if (rows) write(`art/${section.icon}.png`, artPng(rows));
  }
  for (const [name, rows] of Object.entries(socialIcons)) write(`art/social/${name}.png`, artPng(rows));
  write('favicon.png', artPng(artByName('tom'), 2));
  write('pixel.ttf', trueTypeFont(font, { family: 'Office Pixel' }));

  write('feed.xml', rssFeed(posts));
  write('sitemap.xml', sitemap(indexed));
  write('robots.txt', robots());
  write('llms.txt', llmsTxt({ posts, pages }));

  // Dev builds carry source maps, so only production builds are held to the budgets.
  if (!dev) checkBudgets(out, written);
  return { posts: posts.length, tags: tags.length, pages: indexed.length, warnings: todoWarnings(content) };
}

// Things to fill in before the site is ready, printed after each build.
function todoWarnings(content) {
  const warnings = [];
  if (site.url.includes('example.com')) warnings.push('site.config.js: url is still example.com');
  if (!site.email) warnings.push('site.config.js: no contact email (Contact falls back to LinkedIn)');
  for (const name of ['Instagram', 'LinkedIn']) {
    if (!site.socials.find((social) => social.name === name)?.url) warnings.push(`site.config.js: no ${name} url`);
  }
  if (!content.pages.about.data.open_to) warnings.push('content/pages/about.md: no open_to line');
  return warnings;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { posts, tags, pages, warnings } = await build();
  console.log(`Built ${pages} pages (${posts} posts, ${tags} tags) into dist/`);
  for (const warning of warnings) console.warn(`To do: ${warning}`);
}
