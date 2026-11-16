// Site-wide settings. The build reads all of this; the game reads `sections`.
export const site = {
  title: 'Tom Titcombe',
  // Shown under your name in the top bar, and in share images.
  tagline: 'Engineer at Throxy (YC P25)',
  // For search engines' "who is this" (structured data on the homepage and About).
  jobTitle: 'Engineer',
  employer: 'Throxy',
  description: 'Engineer at Throxy (YC P25). Building agents by hand, and thinking about what AI means for everyone else.',
  // Absolute URLs in RSS, the sitemap, canonical and share links come from this.
  url: 'https://tomtitcombe.com',
  language: 'en-gb',
  // Public contact address: the top bar's "Contact", "Reply by email" on posts, the CV.
  // Leave empty to fall back to LinkedIn.
  email: 'hi@tomtitcombe.com',

  // Each section is a page (the plain version) and an object in the office (the game
  // version). `id` is what rooms use in `interact: { open: id }` and the in-game link (/#id).
  // `icon` names the object's art (src/art), shown next to the section's heading.
  sections: [
    { id: 'notes', title: 'Notes', path: '/posts/', icon: 'printerDesk' },
    { id: 'winter-arc', title: 'Winter arc', path: '/winter-arc/', icon: 'shrine' },
    { id: 'projects', title: 'Projects', path: '/projects/', icon: 'robotDesk' },
    { id: 'work', title: 'Work', path: '/work/', icon: 'mugShelf' },
    { id: 'reading', title: 'Reading', path: '/reading/', icon: 'bookcase' },
    { id: 'talks', title: 'Talks', path: '/talks/', icon: 'calendar' },
    { id: 'about', title: 'About', path: '/about/', icon: 'tom' },
    { id: 'find-me', title: 'Find me', path: '/find-me/', icon: 'corkboard' },
  ],

  // Socials with an empty url are hidden. `primary` ones go in the top bar and at the end
  // of every post; `cv` ones on the CV.
  socials: [
    { name: 'Instagram', url: 'https://www.instagram.com/tomtitcombe/', primary: true },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/tom-titcombe/', primary: true, cv: true },
    { name: 'YouTube', url: '' },
    { name: 'GitHub', url: 'https://github.com/TTitcombe', primary: true, cv: true },
    { name: 'Bluesky', url: '' },
    { name: 'X', url: '' },
  ],

  // Latest posts pulled onto Find me at build time. Leave empty to skip.
  feeds: {
    youtubeChannelId: '', // the UC… id from your channel's URL
    blueskyHandle: '', // e.g. someone.bsky.social
  },
};
