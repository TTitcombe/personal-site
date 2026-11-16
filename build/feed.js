import { site } from '../site.config.js';
import { absoluteUrl, escapeHtml } from './templates/layout.js';

const FEED_SIZE = 20;

const rfc822 = (iso) => new Date(`${iso}T00:00:00Z`).toUTCString();

// Feed readers don't know our origin, so root-relative links need making absolute.
// "]]>" would end the CDATA section early, so it's split across two sections.
const feedHtml = (html) =>
  html
    .replace(/(href|src)="\//g, `$1="${absoluteUrl('/')}`)
    .replaceAll(']]>', ']]]]><![CDATA[>');

export function rssFeed(posts) {
  const items = posts.slice(0, FEED_SIZE).map((post) => {
    const url = absoluteUrl(post.path);
    return `<item>
<title>${escapeHtml(post.title)}</title>
<link>${url}</link>
<guid isPermaLink="true">${url}</guid>
<pubDate>${rfc822(post.date)}</pubDate>
${post.tags.map((tag) => `<category>${tag}</category>`).join('\n')}
<description><![CDATA[${feedHtml(post.html)}]]></description>
</item>`;
  });
  return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${escapeHtml(site.title)}</title>
<link>${absoluteUrl('/')}</link>
<description>${escapeHtml(site.description)}</description>
<language>${site.language}</language>
<atom:link href="${absoluteUrl('/feed.xml')}" rel="self" type="application/rss+xml"/>
${posts.length ? `<lastBuildDate>${rfc822(posts[0].date)}</lastBuildDate>` : ''}
${items.join('\n')}
</channel>
</rss>
`;
}
