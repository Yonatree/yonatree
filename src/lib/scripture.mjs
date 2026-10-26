// Scripture reference utilities shared by the Markdown pipeline (remark plugin)
// and Astro components. Plain JS so astro.config.mjs can import it directly.

/** Canonical book order. `ap` marks Apocrypha / deuterocanonical texts. */
export const BOOKS = [
  ['Genesis', 'ot', ['Gen.', 'Gen']], ['Exodus', 'ot', ['Exod.', 'Ex.']], ['Leviticus', 'ot', ['Lev.']],
  ['Numbers', 'ot', ['Num.']], ['Deuteronomy', 'ot', ['Deut.']], ['Joshua', 'ot', ['Josh.']],
  ['Judges', 'ot', ['Judg.']], ['Ruth', 'ot', []], ['1 Samuel', 'ot', ['1 Sam.']], ['2 Samuel', 'ot', ['2 Sam.']],
  ['1 Kings', 'ot', []], ['2 Kings', 'ot', []], ['1 Chronicles', 'ot', ['1 Chron.']], ['2 Chronicles', 'ot', ['2 Chron.']],
  ['Ezra', 'ot', []], ['Nehemiah', 'ot', ['Neh.']], ['Esther', 'ot', []], ['Job', 'ot', []],
  ['Psalms', 'ot', ['Psalm', 'Ps.']], ['Proverbs', 'ot', ['Prov.']], ['Ecclesiastes', 'ot', ['Eccl.']],
  ['Song of Solomon', 'ot', ['Song of Songs']], ['Isaiah', 'ot', ['Isa.']], ['Jeremiah', 'ot', ['Jer.']],
  ['Lamentations', 'ot', ['Lam.']], ['Ezekiel', 'ot', ['Ezek.']], ['Daniel', 'ot', ['Dan.']], ['Hosea', 'ot', []],
  ['Joel', 'ot', []], ['Amos', 'ot', []], ['Obadiah', 'ot', []], ['Jonah', 'ot', []], ['Micah', 'ot', []],
  ['Nahum', 'ot', []], ['Habakkuk', 'ot', ['Hab.']], ['Zephaniah', 'ot', []], ['Haggai', 'ot', []],
  ['Zechariah', 'ot', ['Zech.']], ['Malachi', 'ot', ['Mal.']],
  ['Matthew', 'nt', ['Matt.']], ['Mark', 'nt', []], ['Luke', 'nt', []], ['John', 'nt', []], ['Acts', 'nt', []],
  ['Romans', 'nt', ['Rom.']], ['1 Corinthians', 'nt', ['1 Cor.']], ['2 Corinthians', 'nt', ['2 Cor.']],
  ['Galatians', 'nt', ['Gal.']], ['Ephesians', 'nt', ['Eph.']], ['Philippians', 'nt', ['Phil.']],
  ['Colossians', 'nt', ['Col.']], ['1 Thessalonians', 'nt', ['1 Thess.']], ['2 Thessalonians', 'nt', ['2 Thess.']],
  ['1 Timothy', 'nt', ['1 Tim.']], ['2 Timothy', 'nt', ['2 Tim.']], ['Titus', 'nt', []], ['Philemon', 'nt', []],
  ['Hebrews', 'nt', ['Heb.']], ['James', 'nt', []], ['1 Peter', 'nt', ['1 Pet.']], ['2 Peter', 'nt', ['2 Pet.']],
  ['1 John', 'nt', []], ['2 John', 'nt', []], ['3 John', 'nt', []], ['Jude', 'nt', []], ['Revelation', 'nt', ['Rev.']],
  ['Tobit', 'ap', []], ['Judith', 'ap', []], ['Wisdom of Solomon', 'ap', ['Wisdom']], ['Sirach', 'ap', ['Ecclesiasticus']],
  ['Baruch', 'ap', []], ['1 Maccabees', 'ap', []], ['2 Maccabees', 'ap', []], ['1 Esdras', 'ap', []], ['2 Esdras', 'ap', []],
].map(([name, testament, aliases], order) => ({ name, testament, aliases, order }));

const byName = new Map();
for (const book of BOOKS) {
  byName.set(book.name.toLowerCase(), book);
  for (const alias of book.aliases) byName.set(alias.toLowerCase(), book);
}

/** Bible versions Yona Tree cites, mapped to Bible Gateway version codes. */
export const VERSIONS = {
  KJV: { label: 'KJV', name: 'King James Version', code: 'KJV' },
  NKJV: { label: 'NKJV', name: 'New King James Version', code: 'NKJV' },
  NLT: { label: 'NLT', name: 'New Living Translation', code: 'NLT' },
  NIV: { label: 'NIV', name: 'New International Version', code: 'NIV' },
  ESV: { label: 'ESV', name: 'English Standard Version', code: 'ESV' },
  CSB: { label: 'CSB', name: 'Christian Standard Bible', code: 'CSB' },
  GNT: { label: 'GNT', name: 'Good News Translation', code: 'GNT' },
  GNV: { label: 'Geneva', name: 'Geneva Bible (1599)', code: 'GNV' },
  KJVA: { label: 'KJV Apocrypha', name: 'King James Version with Apocrypha', code: 'NRSVUE' },
};

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const bookPattern = BOOKS.flatMap((b) => [b.name, ...b.aliases])
  .sort((a, b) => b.length - a.length)
  .map(escape)
  .join('|');

/**
 * Matches references such as "John 3:5", "Proverbs 8:22–35", "Genesis 2:7–4:1",
 * optionally followed by a version in parentheses: "Proverbs 8:30 (NLT)".
 * A chapter:verse pair is required so prose like "Wisdom built" never links.
 */
export const REF_PATTERN = new RegExp(
  `(?<![\\w])(${bookPattern})\\s(\\d{1,3}):(\\d{1,3})(?:\\s?[–—-]\\s?(\\d{1,3})(?::(\\d{1,3}))?)?(?:,\\s?(\\d{1,3}(?:[–-]\\d{1,3})?))*(?:\\s\\((${Object.values(VERSIONS).map((v) => escape(v.label)).join('|')})\\))?`,
  'g',
);

export function findBook(name) {
  return byName.get(String(name).trim().toLowerCase());
}

/** Parse "Proverbs 8:22-35" → structured reference. Returns null when unknown. */
export function parseRef(input) {
  const raw = String(input).trim();
  const m = raw.match(/^(.+?)\s(\d{1,3})(?::(\d{1,3})(?:\s?[–—-]\s?(\d{1,3})(?::(\d{1,3}))?)?)?(?:\s?\(([^)]+)\))?$/);
  if (!m) return null;
  const book = findBook(m[1]);
  if (!book) return null;
  const chapter = Number(m[2]);
  const verse = m[3] ? Number(m[3]) : undefined;
  let endChapter;
  let endVerse;
  if (m[4] && m[5]) {
    endChapter = Number(m[4]);
    endVerse = Number(m[5]);
  } else if (m[4]) {
    if (verse === undefined) endChapter = Number(m[4]);
    else endVerse = Number(m[4]);
  }
  return { book: book.name, testament: book.testament, order: book.order, chapter, verse, endChapter, endVerse, version: m[6] };
}

/** Display form with an en dash: "Genesis 2:7–4:1". */
export function formatRef(ref) {
  const r = typeof ref === 'string' ? parseRef(ref) : ref;
  if (!r) return String(ref);
  const name = r.book === 'Psalms' && r.endChapter === undefined ? 'Psalm' : r.book;
  let out = `${name} ${r.chapter}`;
  if (r.verse !== undefined) out += `:${r.verse}`;
  if (r.endChapter !== undefined && r.endVerse !== undefined) out += `–${r.endChapter}:${r.endVerse}`;
  else if (r.endChapter !== undefined) out += `–${r.endChapter}`;
  else if (r.endVerse !== undefined) out += `–${r.endVerse}`;
  return out;
}

export function versionFor(label, testament) {
  if (testament === 'ap') return VERSIONS.KJVA;
  const key = Object.keys(VERSIONS).find((k) => k === label || VERSIONS[k].label === label);
  return VERSIONS[key ?? 'KJV'];
}

/** Bible Gateway link; readers are sent to the source instead of long quotations. */
export function refUrl(ref, versionLabel) {
  const r = typeof ref === 'string' ? parseRef(ref) : ref;
  const text = r ? formatRef(r).replace(/–/g, '-') : String(ref);
  const version = versionFor(versionLabel ?? r?.version, r?.testament);
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(text)}&version=${version.code}`;
}

export function compareRefs(a, b) {
  const ra = typeof a === 'string' ? parseRef(a) : a;
  const rb = typeof b === 'string' ? parseRef(b) : b;
  if (!ra || !rb) return 0;
  return ra.order - rb.order || ra.chapter - rb.chapter || (ra.verse ?? 0) - (rb.verse ?? 0);
}

export function slugifyBook(name) {
  return name.toLowerCase().replace(/\s+/g, '-');
}
