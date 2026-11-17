// Parses the small subset of YAML front matter the content uses:
//   key: value
//   tags: [a, b]
//   links:
//     - GitHub: https://github.com/…     (→ { label, url })
//     - plain item                        (→ 'plain item')
// Anything fancier belongs in the body.
export function parseFrontmatter(source, file) {
  const text = source.replace(/\r\n/g, '\n');
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) throw new Error(`${file}: must start with front matter between --- lines`);

  const data = {};
  let list = null; // the key whose indented "- item" lines we're collecting
  for (const line of match[1].split('\n')) {
    if (!line.trim()) continue;
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item) {
      if (!list) throw new Error(`${file}: list item "${line.trim()}" has no key above it`);
      data[list].push(listItem(item[1].trim()));
      continue;
    }
    const [, key, raw] = line.match(/^(\w+):\s*(.*)$/) ?? [];
    if (!key) throw new Error(`${file}: can't read front matter line "${line}"`);
    const value = raw.trim();
    list = null;
    if (value === '') {
      data[key] = [];
      list = key;
    } else if (value.startsWith('[')) {
      data[key] = value
        .slice(1, -1)
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
    } else {
      data[key] = unquote(value);
    }
  }
  // `key:` with nothing after it and no list items is just blank.
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value) && value.length === 0) data[key] = '';
  }
  return { data, body: text.slice(match[0].length) };
}

const unquote = (value) => value.replace(/^(['"])(.*)\1$/, '$2');

// "Label: https://…" becomes a link; the first ": " splits it, so URLs keep their colons.
function listItem(value) {
  const split = value.indexOf(': ');
  if (split === -1) return unquote(value);
  return { label: unquote(value.slice(0, split).trim()), url: unquote(value.slice(split + 2).trim()) };
}
