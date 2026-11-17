// Files for search engines and AI agents: sitemap.xml, robots.txt and llms.txt.
import { site } from '../site.config.js';
import { absoluteUrl, escapeHtml, socials } from './templates/layout.js';

// pages: [{ path, date? }] — every plain page worth indexing.
export function sitemap(pages) {
  const urls = pages.map(
    ({ path, date }) =>
      `<url><loc>${escapeHtml(absoluteUrl(path))}</loc>${date ? `<lastmod>${date}</lastmod>` : ''}</url>`,
  );
  return `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}

export const robots = () => `User-agent: *
Allow: /

Sitemap: ${absoluteUrl('/sitemap.xml')}
`;

// A plain-text map of the site for language models (https://llmstxt.org).
export function llmsTxt({ posts, pages }) {
  const sections = site.sections.map((section) => {
    const description = pages[section.id]?.data.description;
    return `- [${section.title}](${absoluteUrl(section.path)})${description ? `: ${description}` : ''}`;
  });
  return `# ${site.title}

> ${site.description}

The homepage is a small pixel-art office you can walk around; every object in it opens one of
the plain pages below, which are the same content without the game.

## Sections

${sections.join('\n')}
- [CV](${absoluteUrl('/cv/')})

## Notes

${posts.map((post) => `- [${post.title}](${absoluteUrl(post.path)}): ${post.summary}`).join('\n')}

## Elsewhere

${[...socials().map((social) => `- [${social.name}](${social.url})`), `- [RSS](${absoluteUrl('/feed.xml')})`].join('\n')}
`;
}
