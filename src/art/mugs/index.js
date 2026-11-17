// Mug art by the file name of its job in content/jobs/ (throxy.md → 'throxy'): the mug's
// colours and the `print` wrapped round it (src/engine/mug.js draws the mug itself).
// { body, rim, inside, shine?, print } in palette keys.
import { openmined } from './openmined.js';
import { rover } from './rover.js';
import { throxy } from './throxy.js';

export const mugs = { throxy, rover, openmined };
