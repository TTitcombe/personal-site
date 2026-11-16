// Book art by the file name of its entry in content/reading/ (the-anxious-generation.md →
// 'the-anxious-generation'). Each book is a cover and a spine of the same height, plus
// `labels` stamped on as text: { on: 'cover' | 'spine', text, x, y, color, font: 'main' |
// 'tiny', vertical? }. Draw from a photo of the edition you're reading.
import { chipWar } from './chip-war.js';
import { ifAnyoneBuildsItEveryoneDies } from './if-anyone-builds-it-everyone-dies.js';
import { theAnxiousGeneration } from './the-anxious-generation.js';
import { theEyeOfTheBedlamBride } from './the-eye-of-the-bedlam-bride.js';

export const books = {
  'chip-war': chipWar,
  'if-anyone-builds-it-everyone-dies': ifAnyoneBuildsItEveryoneDies,
  'the-anxious-generation': theAnxiousGeneration,
  'the-eye-of-the-bedlam-bride': theEyeOfTheBedlamBride,
};
