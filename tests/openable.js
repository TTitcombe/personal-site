import { site } from '../site.config.js';

// What a dialogue node or an object can open (see src/rooms/office.js).
export const OPENABLE = new Set([...site.sections.map((section) => section.id), 'hub', 'latest']);
