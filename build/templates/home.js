// The homepage's plain content (the "hub"): who I am, what I'm open to, the latest notes,
// and every section. It's what normal mode shows instead of the game, what search engines
// read, what sits below the game for anyone who scrolls, and what the workstation opens.
import { site } from '../../site.config.js';
import { contactHref, escapeHtml, longDate, sectionIcon } from './layout.js';

export function hub({ pages, posts, arc, about }) {
  const latest = posts.slice(0, 3);
  const arcEntry = arc[0];
  const sections = site.sections.map(
    (section) => `<li><a href="${section.path}" data-section="${section.id}">${sectionIcon(section)}<span><strong>${escapeHtml(section.title)}</strong>${pages[section.id]?.data.description ? `<br>${escapeHtml(pages[section.id].data.description)}` : ''}</span></a></li>`,
  );
  return `<main id="overview" class="hub">
<h2>${escapeHtml(pages.home.data.title ?? `Hi, I'm ${site.title.split(' ')[0]}`)}</h2>
${pages.home.html}
${about.data.open_to ? `<p class="open-to"><strong>Open to:</strong> ${escapeHtml(about.data.open_to)} <a href="${escapeHtml(contactHref())}">Get in touch</a>.</p>` : ''}
${latest.length ? `<h2>Latest notes</h2>
<ul class="latest">
${latest.map((post) => `<li><time datetime="${post.date}">${longDate(post.date)}</time> <a href="${post.path}">${escapeHtml(post.title)}</a></li>`).join('\n')}
</ul>
<p><a href="/posts/" data-section="notes">All notes →</a></p>` : ''}
${arcEntry ? `<h2>Currently: the Winter arc</h2>
<p>Latest: ${arcEntry.path ? `<a href="${arcEntry.path}">${escapeHtml(arcEntry.title)}</a>` : escapeHtml(arcEntry.title)} (${longDate(arcEntry.date)}). <a href="/winter-arc/" data-section="winter-arc">The whole log →</a></p>` : ''}
<h2>Around the office</h2>
<ul class="sections">
${sections.join('\n')}
</ul>
</main>`;
}

// What the game needs from the build: the newest thing to put on the TV, and the bookcase
// and mug shelf filled with what's in the content (build/art.js).
export function siteData({ posts, furniture }) {
  const post = posts[0];
  return { latest: post ? { label: 'NEW POST', title: post.title, url: post.path } : null, furniture };
}
