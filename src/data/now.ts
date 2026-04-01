export type NowItem = {
  text: string;
  linkHref?: string;
  linkLabel?: string;
};

export const NOW = {
  lastUpdated: "2026-03-24",
  building: [
    {
      text: "Shipping some side projects I've wanted for ages. Right now, hacking on an agent-native learning tool, 'questlog'",
      linkHref: "https://github.com/TTitcombe/questlog",
      linkLabel: "questlog",
    },
    {
      text: "Talking to teams about what's next — if you need an engineer with a lot of AI + founder experience, reach out.",
      linkHref: "mailto:hi@tomtitcombe.com",
      linkLabel: "reach out",
    },
  ] as NowItem[],
  reading: [
    {
      text: "Getting deep in the weeds in LLM internals, inference and training challenges. Catching up on the literature.",
    },
    {
      text: "In non-technical land, I'm reading 'Failed State' - a sad/frustrating book about how the UK government apparatus is a little bit shit in a lot of ways.",
    },
  ] as NowItem[],
  thinkingAbout: [] as NowItem[],
  status: "London · open to relocating · exploring ideas",
};
