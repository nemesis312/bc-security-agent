// Minimal YAML-subset frontmatter parser (no dependencies).
// Supports `key: value`, comma lists (`a, b`), `[a, b]` and `- item` lists.
// `name` and `description` are always kept as plain strings (commas allowed).

const STRING_KEYS = new Set(['name', 'description']);

const unquote = (s) => {
  const t = s.trim();
  if (t.length >= 2 && ((t[0] === '"' && t.at(-1) === '"') || (t[0] === "'" && t.at(-1) === "'"))) {
    return t.slice(1, -1);
  }
  return t;
};

const splitList = (s) =>
  s
    .split(',')
    .map(unquote)
    .filter((x) => x !== '');

export function parseFrontmatter(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  if (lines[0]?.trim() !== '---') return {};
  const end = lines.indexOf('---', 1);
  if (end === -1) return {};
  const out = {};
  let listKey = null;
  for (const line of lines.slice(1, end)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const item = line.match(/^\s+-\s+(.*)$/) ?? line.match(/^-\s+(.*)$/);
    if (item && listKey) {
      out[listKey].push(unquote(item[1]));
      continue;
    }
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, raw] = kv;
    const value = raw.trim();
    if (value === '') {
      out[key] = [];
      listKey = key;
      continue;
    }
    listKey = null;
    if (STRING_KEYS.has(key)) {
      out[key] = unquote(value);
    } else if (value.startsWith('[') && value.endsWith(']')) {
      out[key] = splitList(value.slice(1, -1));
    } else if (value.includes(',')) {
      out[key] = splitList(value);
    } else {
      out[key] = unquote(value);
    }
  }
  // Keys that opened a list but got no items are empty strings.
  for (const [k, v] of Object.entries(out)) {
    if (Array.isArray(v) && v.length === 0) out[k] = '';
  }
  return out;
}
