# website

A personal site you walk around: a Game Boy-style office where each object opens a section.
Every section is also a plain page, so the site works as a normal website too ("normal
mode", the links in the top bar, and the hub below the game).

No runtime dependencies. Build-time only: `marked` (markdown → HTML) and `esbuild`
(bundles the game).

```sh
npm run dev    # builds, serves http://localhost:8000, rebuilds on change
npm run build  # runs the tests, writes the deployable site to dist/, checks size budgets
npm test
npm run art    # draws all the art onto dist/art-sheet.png, for checking edits
```

The build prints a "To do" list of anything still missing (domain, email, social links).

## Adding content

Everything is markdown in `content/`. Add or edit a file and commit it. A file starting
with `_` is an example and isn't published; `draft: true` hides a file until it's ready. A
malformed file fails the build with a message saying what to fix.

| Folder | One file per | Front matter |
|---|---|---|
| `posts/` | note (`/posts/<file-name>/`) | `title`, `date: YYYY-MM-DD`, `tags: [a, b]`, optional `summary`, `video` (a link to the video version) |
| `winter-arc/` | log entry (gets its own page if it has a body) | `title`, `date`, `type: experiment\|post\|video\|repo\|update`, optional `summary`, `links` |
| `projects/` | project | `title`, `status: active\|complete\|abandoned`, `summary`, optional `started: YYYY-MM` (or `YYYY`), `links` |
| `jobs/` | job (needs a mug: see Authoring art) | `company`, `role`, `start: YYYY-MM` (or `YYYY`), optional `end` (blank = now), `location`, `links` |
| `papers/` | paper | `title`, `authors`, `year`, optional `venue`, `arxiv` (an arxiv.org link), `links` |
| `reading/` | book (needs art: see Authoring art) | `title`, `author`, `status: reading\|read\|abandoned`, `verdict: must-read\|recommend\|not-for-me` (for read books), optional `finished: YYYY-MM` (or `YYYY-MM-DD`) |
| `talks/` | talk | `title`, `status: upcoming\|given\|available\|preparing`; upcoming and given talks also need `date` and `event` |
| `pages/` | section intro | `title`, `description` (search engines and the hub), body = the intro. `about.md` also has `short_bio`, `long_bio` (the speaker kit) and `open_to`. Put a `photo.jpg` here for the speaker kit. |

Links are written as a list:

```md
links:
  - GitHub: https://github.com/…
  - Write-up: /posts/some-note/
```

Names, socials, contact email, the domain and the list of sections are in `site.config.js`.

## How it fits together

- **Plain pages first.** The build turns `content/` into a static page per section, post, tag
  and Winter arc entry, plus the CV, a 404, RSS, `sitemap.xml`, `robots.txt` and `llms.txt`.
  Each post gets a pixel-art share image (`dist/og/`) drawn from the game's art and font.
- **The game shows the same pages.** Walking up to an object (or clicking a section in the
  top bar) opens that section's plain page in a window over the office, in the game's pixel
  font at its own readable scale: the game fetches the page and shows its `<main>`. So each
  section is written once, in `build/templates/`. Lists labelled with `data-item` (see
  `item()` in `sections.js`) become a list-and-detail view (`src/ui/split.js`). The URL
  becomes `/#reading`, which can be shared.
- **The view fits the office.** The canvas shows the whole room at the largest whole-number
  scale that fits the window; on phones it shows the full height and follows the player.
- **The homepage** (`index.html`) is a template: the build fills in the top bar, the plain
  hub (below the game, or instead of it in normal mode), and inlines the whole game,
  minified, so it's a single request. The game loop only runs while something is moving.
- **Size budgets** (`build/budgets.js`): the homepage must stay under 30KB gzipped, plain
  pages under 40KB, images under 40KB. The production build fails otherwise.

## Layout

| Path | What lives there | Knows about |
|---|---|---|
| `content/` | Everything written: posts, logs, projects, jobs, papers, books, talks, intros. | nothing |
| `site.config.js` | Name, socials, contact, domain, the sections. | nothing |
| `build/` | Turns content into pages, share images, feeds; size budgets; dev server. | content, config, art |
| `src/art/` | Palette, base tiles, objects (one file each), characters, the pixel font. Pure data. | nothing |
| `src/rooms/` | Room layouts and what each object does. Pure data. | art, dialogue and section names |
| `src/dialogue/` | What NPCs and objects say. Pure data. | section names |
| `src/engine/` | Generic pieces: input, loop, screen, camera, pathfinding, painting, rooms. | nothing game-specific |
| `src/game/` | Game rules: movement, interactions, conversations, saved position. | engine |
| `src/ui/` | HTML over the canvas: text box, section panel, normal-mode switch. | view models from `game/` |
| `src/main.js` | Wires art + rooms + engine + UI together. | everything |

## Authoring art

Art is code: arrays of strings, one character per pixel. Every character is a palette key
from `src/art/palette.js`; `.` is transparent. `npm test` checks every image's size and
colours and names the broken row; `npm run art` shows them all.

- **Reskin:** edit hex values in `palette.js`.
- **Base tiles** (`tiles.js`, 16×16): floors (boards, snow, server floor, carpet) and walls.
  `tileEdges` says where walls get an outline, so a wall top or face can go anywhere in a room
  (partitions, a wall jutting out) without a tile for every corner.
- **Text boxes and menus** (`ui.js`): the pixel-art frame every box uses (a 9-slice: corners
  kept, edges stretched) and the palette colours for text, links, headings and shadows.
- **Books** (`books/<file-name>.js`, named after the book's file in `content/reading/`): a
  `cover` and a `spine` of the same height (ours are 56×86 and 12×86), drawn from a photo of
  your edition, plus `labels`: lettering stamped on as text, in the main font or the 5-pixel
  `tiny-font.js`, `vertical` for spines. List it in `books/index.js`. In the game the books
  stand spine out on shelves in the Reading panel (`src/ui/shelf.js`): a bookmark sticks out
  of each one you're reading, must-reads get a gold sticker, and books you gave up on lie
  flat in a pile (`books/marks.js` is that art). Taking one down turns it to its cover
  (`src/engine/book.js` draws the turn from the two flat images, still as pixel art). The
  plain page shows each book at an angle. The build stops if a book has no art.
- **Mugs** (`mugs/<file-name>.js`, named after the job's file in `content/jobs/`): the
  company's colours (`body`, `rim`, `inside`, optional `shine`) and its logo as `print`, about
  20×20. List it in `mugs/index.js`. `src/engine/mug.js` draws the mug round the print; in
  the Work panel the mugs stand on a shelf and the chosen one turns to show its logo. The
  build stops if a job has no mug.
- **The office's bookcase and mug shelf** are filled at build time with tiny versions of
  the real books and mugs (`build/art.js`), so they change with the content.
- **Social icons** (`socials.js`, 9×9, by the social's name lowercased, plus `email`) go
  next to every link to them on the plain pages. Socials with `cv: true` in
  `site.config.js` go on the CV.
- **The font** (`font.js`): one glyph per character. It draws the share images, and the build
  turns it into `pixel.ttf` for the text over the game, so a new glyph shows up in both.
- **Objects** (`objects/<name>.js`, any whole number of tiles): add the file, add it to
  `art/index.js`, then use it in a room legend. Art taller than its spot in the room
  overhangs the tiles above (a tall cabinet against the wall).
- **Characters:** provide `down`, `up` and `left`, each with `stand` and optionally `step`
  (characters without `step` don't walk). The engine mirrors left into right.

## Authoring rooms

Walls inside a room are drawn like the outer one: a row of wall top (`T`) with a row of wall
face (`W`) below it if things hang on it, or a column of wall top for a side wall.

`layout` is one character per tile; `legend` maps each character to
`{ tile, object?, solid?, counter?, interact? }`. A rectangle of the same character is one
object, so `bb` is a single object two tiles wide.

- `interact: { dialogue: name, start? }`: pressing A shows that dialogue (from a given node).
- `interact: { open: id, at? }`: opens a section from `site.config.js` (`at` = an anchor on
  its page), `'hub'` for the overview, or `'latest'` for the newest post.
- `counter: true`: can be talked across, like a shop counter.

`npcs` places characters, each naming a `sprite` (from `art/index.js`) and a `dialogue`.
Tests check that every object exists at the right size, every interaction points somewhere
real, every section can be opened from the office, and everything can be reached.

## Authoring dialogue

A script is `{ speaker?, start, nodes }` (no speaker = narration). Each node has `text`
(an array of pages; each must fit the three-line text box, which `npm test` checks), then either
`choices: [{ label, next }]`, `next`, or `open: id` to end by opening a section. A `next`
of `null` ends the conversation. `{latest}` in text becomes the newest post's title.

Controls: E / Space / Enter / Z is the A button, Esc / X is B. Clicking or tapping
anything walks over and interacts with it. In a section, ▲▼ move the ▶ cursor between links
(scrolling through the text between them), ◀▶ turn a page, A opens, B goes back. In a list,
▲▼ choose an item (◀▶ too on shelves), A or ▶ goes into it, ◀ or B comes back out.

## Deploying

`npm run build` writes the whole site to `dist/`. Set `url` in `site.config.js` to the real
domain first: canonical links, RSS, the sitemap and share images use it.
