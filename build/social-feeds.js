// Latest posts from the socials with public feeds, fetched at build time for Find me.
// Only YouTube (RSS) and Bluesky (public API) need no account or token; Instagram and
// LinkedIn don't offer that, so they're links only. A feed that fails is skipped with a
// warning rather than failing the build.
import { site } from '../site.config.js';

const LIMIT = 5;
const TIMEOUT = 5000;

async function youtube(channelId) {
  const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`, {
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!response.ok) throw new Error(`YouTube: ${response.status}`);
  const xml = await response.text();
  const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, LIMIT).map(([, entry]) => ({
    title: decode(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? 'Video'),
    url: entry.match(/<link rel="alternate" href="([^"]+)"/)?.[1],
    date: entry.match(/<published>(\d{4}-\d{2}-\d{2})/)?.[1],
  }));
}

async function bluesky(handle) {
  const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(handle)}&limit=${LIMIT * 2}&filter=posts_no_replies`;
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
  if (!response.ok) throw new Error(`Bluesky: ${response.status}`);
  const { feed } = await response.json();
  return feed
    .filter((item) => !item.reason) // skip reposts
    .slice(0, LIMIT)
    .map(({ post }) => {
      const text = post.record.text.replace(/\s+/g, ' ').trim();
      return {
        title: text.length > 140 ? `${text.slice(0, 137)}…` : text || 'Post',
        url: `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split('/').pop()}`,
        date: post.record.createdAt.slice(0, 10),
      };
    });
}

let cache = null; // the dev server rebuilds often; fetch once per process

export async function loadSocialFeeds() {
  if (cache) return cache;
  const { youtubeChannelId, blueskyHandle } = site.feeds;
  const attempt = async (name, enabled, load) => {
    if (!enabled) return [];
    try {
      return (await load()).filter((item) => item.url && item.date);
    } catch (error) {
      console.warn(`Skipping the ${name} feed: ${error.message}`);
      return [];
    }
  };
  const [youtubeItems, blueskyItems] = await Promise.all([
    attempt('YouTube', youtubeChannelId, () => youtube(youtubeChannelId)),
    attempt('Bluesky', blueskyHandle, () => bluesky(blueskyHandle)),
  ]);
  cache = { youtube: youtubeItems, bluesky: blueskyItems };
  return cache;
}
