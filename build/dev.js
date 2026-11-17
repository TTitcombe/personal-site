// Local preview: builds, serves dist/, and rebuilds when content or the game changes
// (restart it after editing build/ or site.config.js: Node caches those modules).
import { existsSync, readFileSync, statSync, watch } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import { build, out, root } from './build.js';

const PORT = Number(process.env.PORT ?? 8000);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.txt': 'text/plain; charset=utf-8',
  '.ttf': 'font/ttf',
};

let warned = false;
async function rebuild() {
  try {
    const { pages, warnings } = await build({ dev: true });
    console.log(`Built ${pages} pages`);
    if (!warned) warnings.forEach((warning) => console.warn(`To do: ${warning}`));
    warned = true;
  } catch (error) {
    console.error(`Build failed: ${error.message}`);
  }
}

await rebuild();
let pending;
for (const path of ['index.html', 'src', 'content', 'site.config.js']) {
  watch(join(root, path), { recursive: true }, () => {
    clearTimeout(pending);
    pending = setTimeout(rebuild, 50);
  });
}

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  let file = normalize(join(out, pathname));
  if (file !== out && !file.startsWith(out + sep)) {
    response.writeHead(403).end();
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) {
    // Like the host: unknown paths get the site's 404 page.
    response.writeHead(404, { 'content-type': TYPES['.html'] }).end(readFileSync(join(out, '404.html')));
    return;
  }
  response
    .writeHead(200, {
      'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    })
    .end(readFileSync(file));
}).listen(PORT, () => console.log(`Serving on http://localhost:${PORT}`));
