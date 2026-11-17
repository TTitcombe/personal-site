// What things in the office say when you press A on them. No speaker = narration.
// A node with `open` opens that section once its text is read (see rooms/office.js).
// {latest} is replaced with the newest post's title; `_like this_` underlines a phrase.
const say = (...text) => ({ start: 'only', nodes: { only: { text, next: null } } });

export const windowView = say(
  'London, with the Shard out the window.',
  'Not since Watch Dogs: Legion has a better representation of London been digitalised.',
);

export const tv = {
  start: 'news',
  nodes: {
    news: {
      text: ['The office TV is on the news channel.', 'BREAKING: {latest}'],
      choices: [
        { label: 'Read it', next: 'read' },
        { label: 'Not now', next: null },
      ],
    },
    read: { text: ['You tune in.'], open: 'latest' },
  },
};

export const backDoor = say("STAFF ONLY. It's locked.");

export const frontDoor = say(
  'The front door, the way out.',
  'Before you go: the _corkboard_ has ways to get in touch.',
);

export const stairs = say('Stairs up to the rooftop. A sign says: UNDER CONSTRUCTION.');

export const trophies = say(
  'A trophy cabinet with room for ten badges.',
  'Plenty of space left.',
);

export const tomDesk = say("Tom's notebook. It's barely legible.");

export const gymBag = say(
  "Tom's gym bag. Smells like it's been used recently.",
  'I should probably leave it alone.',
);

export const karpathy = say(
  'A photo of Karpathy, taped to the mirror.',
  "The corner's worn from being touched for luck before every training run.",
);

export const otherPc = say("Someone else's computer. 47 unread Slack messages.", 'Best leave it.');

export const verticalMonitor = say(
  'A vertical monitor showing one very long function.',
  'Someone has written "refactor later" on a sticky note. The note is yellowing.',
);

export const servers = say("Server racks, humming away. It's freezing in here.");

export const plant = say('A plant. Someone remembers to water it.');

export const dog = say('A cocker spaniel, fast asleep.', "You probably shouldn't wake the dog.");
