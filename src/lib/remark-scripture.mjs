// Turns plain-text Bible references in Markdown into links to the passage,
// so articles can cite Scripture without reproducing long copyrighted text.
import { visitParents } from 'unist-util-visit-parents';
import { REF_PATTERN, parseRef, formatRef, refUrl, versionFor } from './scripture.mjs';

const SKIP = new Set(['link', 'linkReference', 'heading', 'code', 'inlineCode', 'definition', 'html']);

export function remarkScripture() {
  return (tree, file) => {
    const defaultVersion = file?.data?.astro?.frontmatter?.bibleVersion ?? 'KJV';
    visitParents(tree, 'text', (node, ancestors) => {
      if (ancestors.some((a) => SKIP.has(a.type))) return;
      const value = node.value;
      REF_PATTERN.lastIndex = 0;
      if (!REF_PATTERN.test(value)) return;
      REF_PATTERN.lastIndex = 0;

      const parts = [];
      let last = 0;
      for (const match of value.matchAll(REF_PATTERN)) {
        const [full] = match;
        const version = match[7];
        const refText = version ? full.slice(0, full.lastIndexOf(' (')) : full;
        const [base, ...extraVerses] = refText.split(',');
        const ref = parseRef(base);
        if (!ref) continue;
        if (match.index > last) parts.push({ type: 'text', value: value.slice(last, match.index) });
        // Keep the author's wording ("Psalm", "Gen."), only normalizing hyphens to en dashes.
        const label = base.replace(/\s?-\s?/g, '–') + (extraVerses.length ? `,${extraVerses.join(',')}` : '');
        parts.push({
          type: 'link',
          url: refUrl(ref, version ?? defaultVersion),
          title: `Read ${formatRef(ref)} (${version ?? defaultVersion}) on Bible Gateway`,
          data: { hProperties: { className: ['scripture-ref'], rel: 'noopener', target: '_blank' } },
          children: [{ type: 'text', value: label }],
        });
        if (version) {
          parts.push({ type: 'text', value: ' ' });
          parts.push({
            type: 'emphasis',
            data: { hName: 'abbr', hProperties: { className: ['version'], title: versionFor(version, ref.testament).name } },
            children: [{ type: 'text', value: version }],
          });
        }
        last = match.index + full.length;
      }
      if (!parts.length) return;
      if (last < value.length) parts.push({ type: 'text', value: value.slice(last) });

      const parent = ancestors[ancestors.length - 1];
      const index = parent.children.indexOf(node);
      parent.children.splice(index, 1, ...parts);
      return index + parts.length;
    });
  };
}
