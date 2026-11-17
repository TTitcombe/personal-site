// Each string in `text` is one page of the text box, which shows three lines (npm test says if
// a page doesn't fit). `_like this_` underlines a phrase (things in the office). `next: null`
// ends the conversation, and `open: 'about'` ends it by opening that section (see rooms/office.js).
const topics = [
  { label: 'What do you do?', next: 'work' },
  { label: 'What are you into?', next: 'interests' },
  { label: 'What is this website?', next: 'website' },
  { label: 'Can we work together?', next: 'together' },
  { label: 'Learn more', next: 'learnMore' },
  { label: 'Bye', next: 'bye' },
];

export const tom = {
  speaker: 'TOM',
  start: 'greeting',
  nodes: {
    greeting: {
      text: ["Hi, I'm Tom! Welcome to my office.", "I'm an engineer at Throxy (YC P25). Have a look around, or ask me anything."],
      choices: topics,
    },
    // Pressing A on the laptop instead of on Tom.
    sticker: {
      text: ["That's my Throxy sticker. We're in YC's P25 batch.", 'Anything I can help with?'],
      choices: topics,
    },
    work: {
      text: [
        "I'm an engineer at Throxy, where I run bottom-of-funnel engineering.",
        'I built our in-house dialer, which handles millions of dials a week.',
        'And AI that coaches our SDRs on their calls.',
        'Before that I was founder and CTO of Rover, and a volunteer team lead at OpenMined.',
        'The full story is on the _mug shelf_, and my papers are on the _certificates_.',
      ],
      next: 'more',
    },
    interests: {
      text: [
        'Researching frontier AI and governance -',
        'what happens to everyone else as AI keeps scaling.',
        "Right now I'm building a home assistant from scratch,",
        'to learn what breaks in agents when we introduce it into our lives.',
        "That's my _winter arc_, at the shrine.",
        'Away from the keyboard, I play rugby and D&D.',
        'I write about all of it. New notes come out of the _printer_.',
      ],
      next: 'more',
    },
    website: {
      text: [
        'My website, as an office! Walk up to anything to open it, or use the links up top.',
        "My CV is on the _mug shelf_, and what I'm reading is on the _bookcase_.",
        'Projects are on the _robot desk_, and my winter arc is at the _shrine_.',
        'Notes come out of the _printer_, and talks are on the _calendar_.',
        'Ways to reach me are on the _corkboard_. The big _workstation_ has everything in one place.',
      ],
      next: 'more',
    },
    together: {
      text: [
        'Possibly!',
        "If you're working on a cool problem, I'm always happy to help with advice or ideas.",
        "I give talks too. Everything's on my About page. I'll open it for you.",
      ],
      open: 'about',
    },
    learnMore: {
      text: ["Here's the long version."],
      open: 'about',
    },
    more: {
      text: ['Anything else?'],
      choices: topics,
    },
    bye: {
      text: ['Good to meet you! If anything here sparks an idea, get in touch.'],
      next: null,
    },
  },
};
