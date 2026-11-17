// One template per section page. Each takes loaded content (build/content.js) and returns
// a whole HTML page. The game shows the same pages in its frame by fetching them and taking
// their <main>, so everything a section says lives here once.
import { site } from '../../site.config.js';
import { TALK_STATUSES, VERDICTS } from '../content.js';
import {
  absoluteUrl,
  contactHref,
  escapeHtml,
  link,
  linkList,
  longDate,
  monthYear,
  page,
  personJsonLd,
  primarySocials,
  sectionById,
  sectionIcon,
  socialLink,
  emailLink,
  socials,
} from './layout.js';

const time = (iso, format = longDate) => `<time datetime="${iso}">${format(iso)}</time>`;
const badge = (label) => `<span class="badge">${escapeHtml(label)}</span>`;
const empty = (message) => `<p class="empty">${message}</p>`;
// An item in a list, labelled for the game's list-and-detail view (src/ui/split.js): its
// title, a chip (status, verdict) and a short line under the title (dates).
const item = ({ id, title, chip, sub, className }) =>
  `<li id="${id}"${className ? ` class="${className}"` : ''} data-item data-title="${escapeHtml(title)}"${chip ? ` data-chip="${escapeHtml(chip)}"` : ''}${sub ? ` data-sub="${escapeHtml(sub)}"` : ''}`;
const tagLink = (tag, active = false) =>
  `<a class="tag" href="/tags/${tag}/"${active ? ' aria-current="page"' : ''}>#${tag}</a>`;

// A section's page: its icon and title, the intro from content/pages/<id>.md, then `body`.
function sectionPage(id, intro, body, options = {}) {
  const section = sectionById(id);
  return page({
    title: `${intro.data.title ?? section.title} · ${site.title}`,
    description: intro.data.description ?? site.description,
    path: section.path,
    active: id,
    ...options,
    body: `<h1>${sectionIcon(section)}${escapeHtml(intro.data.title ?? section.title)}</h1>
${intro.html}
${body}`,
  });
}

// ── Notes ──────────────────────────────────────────────────────────────────────────────

const postList = (posts) =>
  `<ul class="list posts">
${posts.map((post) => `<li>${time(post.date)}<a href="${post.path}">${escapeHtml(post.title)}</a></li>`).join('\n')}
</ul>`;

// The full list of notes, or those with one tag.
export function notesPage({ posts, tags, intro, activeTag = null }) {
  const body = `<p class="tags"><a class="tag" href="/posts/"${activeTag ? '' : ' aria-current="page"'}>all</a>${tags.map((tag) => tagLink(tag, tag === activeTag)).join('')}</p>
${posts.length ? postList(posts) : empty('Nothing here yet. The printer is warming up.')}`;
  if (!activeTag) return sectionPage('notes', intro, body);
  return page({
    title: `Notes tagged #${activeTag} · ${site.title}`,
    description: `Notes tagged #${activeTag}.`,
    path: `/tags/${activeTag}/`,
    active: 'notes',
    body: `<h1>${sectionIcon(sectionById('notes'))}Notes tagged #${escapeHtml(activeTag)}</h1>\n${body}`,
  });
}

// Copy link and the phone's own share sheet need JavaScript, so they start hidden.
const SHARE_SCRIPT = `
const copy=document.querySelector('[data-copy]');
if(navigator.clipboard&&copy){copy.hidden=false;copy.onclick=()=>navigator.clipboard.writeText(location.href).then(()=>{copy.textContent=' · Copied'})}
const native=document.querySelector('[data-native-share]');
if(navigator.share&&native){native.hidden=false;native.onclick=()=>navigator.share({title:document.title,url:location.href}).catch(()=>{})}
`.trim();

export function postPage(post, { next }) {
  const url = encodeURIComponent(absoluteUrl(post.path));
  const title = encodeURIComponent(post.title);
  const share = [
    ['X', `https://x.com/intent/post?text=${title}&url=${url}`],
    ['Hacker News', `https://news.ycombinator.com/submitlink?u=${url}&t=${title}`],
    ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${url}`],
  ];
  const follow = [...primarySocials().map((social) => socialLink(social)), '<a href="/feed.xml">RSS</a>'];
  const after = [
    `<p>Share: ${share.map(([name, href]) => link(href, name)).join(' · ')}<button type="button" data-copy hidden> · Copy link</button><button type="button" data-native-share hidden> · Share…</button></p>`,
    site.email
      ? `<p>${link(`mailto:${site.email}?subject=${encodeURIComponent(`Re: ${post.title}`)}`, 'Reply by email')}: I read everything, eventually.</p>`
      : '',
    post.video ? `<p>${link(post.video, 'Watch the video version')}</p>` : '',
    `<p>Follow along: ${follow.join(' · ')}</p>`,
    next ? `<p>Read next: <a href="${next.path}">${escapeHtml(next.title)}</a></p>` : '',
  ];
  return page({
    title: `${post.title} · ${site.title}`,
    description: post.summary,
    path: post.path,
    type: 'article',
    active: 'notes',
    image: `/og/${post.slug}.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      datePublished: post.date,
      description: post.summary,
      url: absoluteUrl(post.path),
      image: absoluteUrl(`/og/${post.slug}.png`),
      author: { '@type': 'Person', name: site.title, url: absoluteUrl('/') },
    },
    script: SHARE_SCRIPT,
    body: `<article>
<h1>${escapeHtml(post.title)}</h1>
<p class="meta">${time(post.date)}${post.tags.length ? ' · ' : ''}${post.tags.map((tag) => tagLink(tag)).join('')}</p>
${post.html}
</article>
<aside class="after">
${after.filter(Boolean).join('\n')}
</aside>`,
  });
}

// ── Winter arc ─────────────────────────────────────────────────────────────────────────

export function arcPage({ arc, intro }) {
  const items = arc.map(
    (entry) => `<li id="${entry.slug}">
<p>${time(entry.date)}${badge(entry.type)}</p>
<h3>${entry.path ? `<a href="${entry.path}">${escapeHtml(entry.title)}</a>` : escapeHtml(entry.title)}</h3>
${entry.summary ? `<p>${escapeHtml(entry.summary)}</p>` : ''}
${linkList(entry.links)}
</li>`,
  );
  return sectionPage(
    'winter-arc',
    intro,
    `<h2>Log</h2>
${items.length ? `<ul class="list">\n${items.join('\n')}\n</ul>` : empty('Day one. Nothing logged yet.')}`,
  );
}

export function arcEntryPage(entry) {
  return page({
    title: `${entry.title} · Winter arc · ${site.title}`,
    description: entry.summary,
    path: entry.path,
    type: 'article',
    active: 'winter-arc',
    body: `<article>
<p class="meta"><a href="/winter-arc/">Winter arc</a> · ${time(entry.date)}${badge(entry.type)}</p>
<h1>${escapeHtml(entry.title)}</h1>
${entry.html}
${linkList(entry.links)}
</article>`,
  });
}

// ── Projects ───────────────────────────────────────────────────────────────────────────

export function projectsPage({ projects, intro }) {
  const items = projects.map(
    (project) => `${item({ id: project.slug, title: project.title, chip: project.status, sub: project.started && `Since ${monthYear(project.started)}` })}>
<h3>${escapeHtml(project.title)}${badge(project.status)}</h3>
${project.started ? `<p class="when">Started ${monthYear(project.started)}</p>` : ''}
<p>${escapeHtml(project.summary)}</p>
${project.html}
${linkList(project.links)}
</li>`,
  );
  return sectionPage(
    'projects',
    intro,
    items.length ? `<ul class="list">\n${items.join('\n')}\n</ul>` : empty('The robot is still in pieces.'),
  );
}

// ── Work ───────────────────────────────────────────────────────────────────────────────
// In the game, jobs are mugs on a shelf (src/ui/shelf.js, from data-mug) and papers are rows.

const dates = (job) => `${monthYear(job.start)} – ${job.end ? monthYear(job.end) : 'now'}`;

const jobList = (jobs) =>
  `<ul class="list">
${jobs
  .map(
    (job) => `${item({ id: job.slug, title: job.company, sub: job.title })} data-mug="${job.slug}">
<h3>${escapeHtml(job.title)}, ${escapeHtml(job.company)}</h3>
<p class="when">${dates(job)}${job.location ? ` · ${escapeHtml(job.location)}` : ''}</p>
${job.html}
${linkList(job.links)}
</li>`,
  )
  .join('\n')}
</ul>`;

const paperList = (papers) =>
  `<ul class="list">
${papers
  .map(
    (paper) => `${item({ id: paper.slug, title: paper.title, sub: paper.year })}>
<h3>${paper.arxiv ? link(paper.arxiv, paper.title) : escapeHtml(paper.title)}</h3>
<p class="when">${escapeHtml(paper.authors)} · ${[paper.venue, paper.year].filter(Boolean).map(escapeHtml).join(', ')}</p>
${paper.html}
${linkList(paper.links)}
</li>`,
  )
  .join('\n')}
</ul>`;

export function workPage({ jobs, papers, intro }) {
  return sectionPage(
    'work',
    intro,
    `<p><a href="/cv/">The one-page CV →</a></p>
<h2>Experience</h2>
${jobs.length ? jobList(jobs) : empty('Personnel file pending.')}
<h2 id="papers">Papers</h2>
${papers.length ? paperList(papers) : empty('Papers coming soon.')}`,
  );
}

export function cvPage({ jobs, papers, about, cv }) {
  const contact = [
    site.email ? emailLink() : '',
    ...socials()
      .filter((social) => social.cv)
      .map((social) => socialLink(social)),
    link(absoluteUrl('/'), new URL(site.url).host),
  ].filter(Boolean);
  return page({
    title: `CV · ${site.title}`,
    description: `${site.title}: ${site.tagline}.`,
    path: '/cv/',
    active: 'work',
    body: `<h1>${escapeHtml(site.title)}</h1>
<p class="meta">${escapeHtml(site.tagline)}<br>${contact.join(' · ')}</p>
${about.data.short_bio ? `<p>${escapeHtml(about.data.short_bio)}</p>` : ''}
<h2>Experience</h2>
${jobs.length ? jobList(jobs) : empty('To follow.')}
${papers.length ? `<h2>Papers</h2>\n${paperList(papers)}` : ''}
${cv.html}`,
  });
}

// ── Reading ────────────────────────────────────────────────────────────────────────────

// Each book shows its cover at an angle (covers: slug → { path, width, height }, drawn at
// twice size). In the game, the shelf (src/ui/shelf.js) takes the books from data-book.
export function readingPage({ books, covers, intro }) {
  const cover = ({ slug }) =>
    covers[slug]
      ? `<img class="cover" src="${covers[slug].path}" width="${covers[slug].width * 2}" height="${covers[slug].height * 2}" alt="" loading="lazy">`
      : '';
  const list = (status) =>
    books
      .filter((book) => book.status === status)
      .map(
        (book) => `${item({ id: book.slug, className: 'book', title: book.title, chip: book.verdict && VERDICTS[book.verdict], sub: book.author })} data-book="${book.slug}" data-status="${book.status}">
${cover(book)}
<h3><cite>${escapeHtml(book.title)}</cite>${book.verdict ? badge(VERDICTS[book.verdict]) : ''}</h3>
<p class="when">${escapeHtml(book.author)}${book.finished ? ` · finished ${time(book.finished, monthYear)}` : ''}</p>
${book.html}
</li>`,
      );
  const group = (title, status) => {
    const items = list(status);
    return items.length ? `<h2>${title}</h2>\n<ul class="list">\n${items.join('\n')}\n</ul>` : '';
  };
  const body = [group('Reading now', 'reading'), group('Read', 'read'), group('Gave up on', 'abandoned')].join(
    '\n',
  );
  return sectionPage('reading', intro, body.trim() ? body : empty('The shelf is empty. For now.'));
}

// ── Talks ──────────────────────────────────────────────────────────────────────────────

export function talksPage({ talks, intro, about }) {
  const byStatus = Object.fromEntries(TALK_STATUSES.map((status) => [status, talks.filter((t) => t.status === status)]));
  const event = (talk) => `<li id="${talk.slug}">
<p class="when">${time(talk.date)} · ${escapeHtml(talk.event)}${talk.location ? `, ${escapeHtml(talk.location)}` : ''}</p>
<h3>${escapeHtml(talk.title)}</h3>
${linkList(talk.links)}
</li>`;
  const offer = (talk) => `<li id="${talk.slug}">
<h3>${escapeHtml(talk.title)}${talk.status === 'preparing' ? badge('in preparation') : ''}</h3>
${talk.html}
</li>`;
  const upcoming = [...byStatus.upcoming].reverse(); // soonest first
  const sections = [
    upcoming.length ? `<h2>Coming up</h2>\n<ul class="list">\n${upcoming.map(event).join('\n')}\n</ul>` : '',
    byStatus.given.length ? `<h2>Given</h2>\n<ul class="list">\n${byStatus.given.map(event).join('\n')}\n</ul>` : '',
    !upcoming.length && !byStatus.given.length
      ? empty(`No talks yet. Be the first: <a href="${escapeHtml(contactHref())}">get in touch</a>.`)
      : '',
  ];
  const offers = [...byStatus.available, ...byStatus.preparing];
  if (offers.length) {
    sections.push(`<h2>Talks I can give</h2>\n<ul class="list">\n${offers.map(offer).join('\n')}\n</ul>`);
  }
  sections.push(`<h2 id="speaker-kit">Speaker kit</h2>
${about.data.short_bio ? `<h3>Short bio</h3>\n<p>${escapeHtml(about.data.short_bio)}</p>` : ''}
${about.data.long_bio ? `<h3>Long bio</h3>\n<p>${escapeHtml(about.data.long_bio)}</p>` : ''}
${about.photo ? `<p><a href="${about.photo}">Download a photo</a></p>` : ''}
<p>Booking: <a href="${escapeHtml(contactHref())}">get in touch</a>.</p>`);
  return sectionPage('talks', intro, sections.filter(Boolean).join('\n'));
}

// ── About ──────────────────────────────────────────────────────────────────────────────

export function contactBlock() {
  const items = [
    site.email ? `<li>${emailLink()}</li>` : '',
    ...socials().map((social) => `<li>${socialLink(social)}</li>`),
  ].filter(Boolean);
  return items.length ? `<ul>\n${items.join('\n')}\n</ul>` : empty('Contact details coming soon.');
}

export function aboutPage({ about }) {
  return sectionPage(
    'about',
    about,
    `${about.data.open_to ? `<h2>Open to</h2>\n<p>${escapeHtml(about.data.open_to)}</p>` : ''}
<h2 id="contact">Contact</h2>
${contactBlock()}
<p><a href="/cv/">One-page CV</a> · <a href="/talks/#speaker-kit">Speaker kit</a></p>`,
    { jsonLd: personJsonLd() },
  );
}

// ── Find me ────────────────────────────────────────────────────────────────────────────

export function findMePage({ intro, feeds }) {
  const list = (items) => `<ul class="list">\n${items.join('\n')}\n</ul>`;
  const feedSection = (title, items) =>
    items.length
      ? `<h2>${title}</h2>\n${list(items.map((item) => `<li><p>${time(item.date)}</p><p>${link(item.url, item.title)}</p></li>`))}`
      : '';
  const primary = primarySocials();
  const others = socials().filter((social) => !social.primary);
  return sectionPage(
    'find-me',
    intro,
    `${primary.length ? `<p class="big-links">${primary.map((s) => socialLink(s)).join(' · ')}</p>` : empty('Links coming soon.')}
${others.length ? `<p>Also: ${others.map((s) => socialLink(s)).join(' · ')} · <a href="/feed.xml">RSS</a></p>` : '<p><a href="/feed.xml">RSS</a></p>'}
${feedSection('Latest on YouTube', feeds.youtube)}
${feedSection('Latest on Bluesky', feeds.bluesky)}`,
  );
}

// ── 404 ────────────────────────────────────────────────────────────────────────────────

export function notFoundPage() {
  return page({
    title: `Not found · ${site.title}`,
    description: 'Nothing here.',
    path: '/404.html',
    body: `<h1>You walked into a wall.</h1>
<p>There's nothing at this address. It might have moved, or it might never have existed. Like my weekend plans.</p>
<p><a href="/">Back to the office</a> · <a href="/posts/">All notes</a></p>`,
  });
}
