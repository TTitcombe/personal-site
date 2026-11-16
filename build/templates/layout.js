// The shell every plain page shares: head tags for search and sharing, the top bar, and
// the reading styles. Plain pages are "normal mode": readable, linkable, and JavaScript-free
// apart from small progressive enhancements.
import { site } from '../../site.config.js';
import { socialIcons } from '../../src/art/socials.js';
import { artByName } from '../art.js';

export const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );

export const absoluteUrl = (path) => new URL(path, site.url).href;

const formatDate = (iso, options) =>
  new Date(`${iso.length === 7 ? `${iso}-01` : iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    ...options,
  });
export const longDate = (iso) => formatDate(iso, { day: 'numeric', month: 'long', year: 'numeric' });
export const monthYear = (iso) => (iso.length === 4 ? iso : formatDate(iso, { month: 'short', year: 'numeric' }));

export const sectionById = (id) => site.sections.find((section) => section.id === id);
export const socials = () => site.socials.filter((social) => social.url);
export const primarySocials = () => socials().filter((social) => social.primary);
// Where "Contact" goes: email if there is one, otherwise the first primary social.
export const contactHref = () =>
  site.email ? `mailto:${site.email}` : (primarySocials().find((s) => s.name === 'LinkedIn')?.url ?? '/about/#contact');

const isExternal = (url) => /^https?:\/\//.test(url) && !url.startsWith(site.url);

// icon: a pixel-art icon to put before the label (src/art/socials.js), if there is one.
export function link(url, label, attributes = '', icon = '') {
  const external = isExternal(url) ? ' rel="noopener"' : '';
  const image = socialIcons[icon] ? `<img class="link-icon" src="/art/social/${icon}.png" alt="" width="18" height="18">` : '';
  return `<a href="${escapeHtml(url)}"${external}${attributes}>${image}${escapeHtml(label)}</a>`;
}

// A link to one of the socials in site.config.js, with its icon.
export const socialLink = (social, label = social.name) => link(social.url, label, '', social.name.toLowerCase());
export const emailLink = (label = site.email) => link(`mailto:${site.email}`, label, '', 'email');

export const linkList = (links) =>
  links.length ? `<p class="links">${links.map((l) => link(l.url, l.label)).join(' · ')}</p>` : '';

// Small pixel-art picture of a section's object in the office (rendered by build/art.js),
// shown 32px tall.
export function sectionIcon(section) {
  const rows = section?.icon && artByName(section.icon);
  if (!rows) return '';
  const width = Math.round((rows[0].length * 32) / rows.length);
  return `<img class="icon" src="/art/${section.icon}.png" alt="" width="${width}" height="32">`;
}

// Shared with the homepage (index.html), so the bar looks the same in and out of the game.
// It relies on each page defining --fg, --muted and --accent.
export const TOP_BAR_CSS = `
.topbar{display:flex;flex-wrap:wrap;align-items:baseline;gap:.25rem 1.25rem;padding:.75rem 1rem;font:.85rem/1.5 ui-monospace,Menlo,Consolas,monospace;border-bottom:1px solid color-mix(in srgb,var(--fg) 15%,transparent)}
.topbar a{color:inherit;text-decoration:none}
.topbar a:hover,.topbar a:focus-visible{text-decoration:underline}
.topbar .who{margin-right:auto}
.topbar .name{font-weight:bold;color:var(--fg)}
.topbar .tagline{color:var(--muted);margin-left:.6em}
.topbar nav{display:flex;flex-wrap:wrap;gap:0 .9rem}
.topbar nav a[aria-current]{color:var(--accent);font-weight:bold}
.topbar .elsewhere{margin-left:auto;align-items:baseline}
.topbar .elsewhere a{color:var(--accent)}
.link-icon{image-rendering:pixelated;vertical-align:middle;margin-right:.35em}
.topbar button{font:inherit;color:var(--muted);background:none;border:1px solid currentColor;border-radius:3px;padding:0 .5em;cursor:pointer}
@media (max-width:40rem){.topbar .who{width:100%}.topbar .elsewhere{margin-left:0}.topbar nav{gap:0 .75rem}}
`.trim();

export function topBar({ active = null, modeToggle = false } = {}) {
  const sections = site.sections
    .map(
      (section) =>
        `<a href="${section.path}" data-section="${section.id}"${section.id === active ? ' aria-current="page"' : ''}>${escapeHtml(section.title)}</a>`,
    )
    .join('');
  const elsewhere = [
    ...primarySocials().map((social) => socialLink(social)),
    `<a href="${escapeHtml(contactHref())}">Contact</a>`,
  ].join('');
  return `<header class="topbar">
<p class="who"><a class="name" href="/">${escapeHtml(site.title)}</a><span class="tagline">${escapeHtml(site.tagline)}</span></p>
<nav aria-label="Sections">${sections}</nav>
<nav class="elsewhere" aria-label="Elsewhere">${elsewhere}${modeToggle ? '<button type="button" id="mode-toggle" hidden></button>' : ''}</nav>
</header>`;
}

// Reading pages: one column, system fonts. Colours echo the office palette; light for
// reading, dark if the reader prefers it.
const CSS = `
:root{--bg:#f6f3e8;--fg:#1f1a24;--muted:#6d6878;--accent:#87607f;--rule:#ddd5c3;--code:#ece6d6;color-scheme:light dark}
@media (prefers-color-scheme:dark){:root{--bg:#1f1a24;--fg:#e4e0d2;--muted:#a39fae;--accent:#d2a8cb;--rule:#3a3442;--code:#2b2533}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:1.125rem/1.7 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
${TOP_BAR_CSS}
main{max-width:40rem;margin:0 auto;padding:2.5rem 1rem 4rem}
.meta,.after,footer,.tags,.list time,.badge,code,pre,.links{font-family:ui-monospace,Menlo,Consolas,monospace}
.meta,.after,footer,.tags,.links{font-size:.85rem}
a{color:var(--accent)}
h1{font-size:2rem;line-height:1.2;margin:0 0 .5rem;text-wrap:balance;display:flex;align-items:center;gap:.6rem}
h2,h3{line-height:1.3;margin-top:2.2rem}
h3{margin-bottom:.2rem}
.icon{image-rendering:pixelated;flex:none}
.lede{color:var(--muted)}
.meta{color:var(--muted);margin:0 0 2rem}
.tag{margin-right:.6em}
.tags{display:flex;flex-wrap:wrap}
.tag[aria-current]{color:var(--fg);font-weight:bold;text-decoration:none}
pre{background:var(--code);padding:1rem;overflow-x:auto;border-radius:4px;font-size:.85rem;line-height:1.5}
code{font-size:.88em}
:not(pre)>code{background:var(--code);padding:.1em .3em;border-radius:3px}
blockquote{margin:1.5rem 0;padding-left:1rem;border-left:3px solid var(--accent);color:var(--muted)}
img{max-width:100%;height:auto}
hr{border:0;border-top:1px solid var(--rule);margin:2rem 0}
.list{list-style:none;padding:0;margin:1.5rem 0}
.list>li{padding:.9rem 0;border-bottom:1px solid var(--rule)}
.list>li>:first-child{margin-top:0}
.list h3{margin-top:.3rem}
.list>li>:last-child{margin-bottom:0}
.list time,.list .when{color:var(--muted);font-size:.85rem}
.list p{margin:.3rem 0}
.list>.book{display:grid;grid-template-columns:auto 1fr;column-gap:1.25rem;align-content:start}
.book>*{grid-column:2}
.book>.cover{grid-column:1;grid-row:1/span 9;image-rendering:pixelated}
@media (max-width:30rem){.book>.cover{width:64px;height:auto}}
.posts>li{display:grid;grid-template-columns:7.5rem 1fr;gap:0 1rem;padding:.6rem 0}
.posts time{padding-top:.2rem}
@media (max-width:32rem){.posts>li{grid-template-columns:1fr}}
.badge{display:inline-block;font-size:.75rem;padding:0 .45em;border:1px solid currentColor;border-radius:3px;color:var(--muted);vertical-align:.15em;margin-left:.4em;font-weight:normal}
.empty{color:var(--muted);font-style:italic}
.after{margin-top:3rem;padding-top:1rem;border-top:1px solid var(--rule);color:var(--muted)}
.after p{margin:.4rem 0}
.after button{font:inherit;color:var(--accent);background:none;border:0;padding:0;text-decoration:underline;cursor:pointer}
footer{max-width:40rem;margin:0 auto;padding:0 1rem 3rem;color:var(--muted)}
@media print{.topbar,.after,footer{display:none}body{font-size:11pt}main{padding:0}}
`.trim();

const DEFAULT_IMAGE = '/og/default.png';

// Everything in <head> that search engines and link previews read. jsonLd: structured data
// for search engines (schema.org), as a plain object.
export function headTags({ title, description, path, type = 'website', image, jsonLd }) {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image ?? DEFAULT_IMAGE);
  return `<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${url}">
<link rel="alternate" type="application/rss+xml" title="${escapeHtml(site.title)}" href="/feed.xml">
<link rel="icon" href="/favicon.png">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${escapeHtml(site.title)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${imageUrl}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replaceAll('</', '<\\/')}</script>` : ''}`;
}

export function page({ title, description, path, type, body, active, image, jsonLd, script }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${headTags({ title, description, path, type, image, jsonLd })}
<style>${CSS}</style>
</head>
<body>
${topBar({ active })}
<main>
${body}
</main>
<footer><a href="/">Back to the office</a> · <a href="/feed.xml">RSS</a> · <a href="/find-me/">Find me</a></footer>
${script ? `<script>${script}</script>\n` : ''}</body>
</html>
`;
}

// The person this site is about, for search engines (homepage and About).
export function personJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.title,
    url: absoluteUrl('/'),
    jobTitle: site.jobTitle,
    worksFor: { '@type': 'Organization', name: site.employer },
    description: site.description,
    sameAs: socials().map((social) => social.url),
  };
}
