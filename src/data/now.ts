export type NowItem = {
  text: string;
  linkHref?: string;
  linkLabel?: string;
};

export const NOW = {
  lastUpdated: "2026-03-24",
  building: [
    {
      text: "Exploring the missing governance layer that is stopping generative AI from getting adopted in sensitive domains.",
    },
    {
      text: "Shipping some side projects I've wanted for ages. Right now, hacking on an agent-native learning tool.",
    },
    {
      text: "Talking to teams about what's next — if you need an engineer with a lot of AI + founder experience, reach out.",
      linkHref: "mailto:hi@tomtitcombe.com",
      linkLabel: "reach out",
    },
  ] as NowItem[],
  reading: [
    {
      text: "Getting deep in the weeds in LLM internals, inference and training challenges. Currently making my way through The Smol Training Playbook.",
      linkHref:
        "https://huggingface.co/spaces/HuggingFaceTB/smol-training-playbook",
      linkLabel: "The Smol Training Playbook",
    },
    {
      text: "Ripping through the Expanse series — just finished Cibola Burn.",
    },
  ] as NowItem[],
  thinkingAbout: [
    {
      text: "Why we're not seeing mass adoption of generative AI outside of software development (Hint: trust gap) and how to solve that.",
    },
  ] as NowItem[],
  status: "London · open to relocating · exploring ideas",
};
