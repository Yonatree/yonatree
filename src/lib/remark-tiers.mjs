// Evidence-tier callouts for theological writing. Editors write:
//
//   :::scripture
//   What the text itself says…
//   :::
//
// and readers see a labelled panel, so Scripture, history, other
// interpretations and Yona Tree's own conclusions are never blurred together.
// Also styles "— Reference" lines that close a blockquote as citations.
import { visit } from 'unist-util-visit';

export const TIERS = {
  scripture: { label: 'Scripture says', icon: 'book' },
  history: { label: 'Historical sources say', icon: 'scroll' },
  interpreters: { label: 'Some interpreters believe', icon: 'people' },
  yonatree: { label: 'Yona Tree proposes', icon: 'tree' },
  possible: { label: 'Possible interpretation', icon: 'lamp' },
  speculation: { label: 'Speculation', icon: 'star' },
  note: { label: 'Study note', icon: 'lamp' },
};

const toText = (node) =>
  node.type === 'text' ? node.value : (node.children ?? []).map(toText).join('');

export function remarkTiers() {
  return (tree) => {
    visit(tree, (node, index, parent) => {
      if (node.type === 'containerDirective' && TIERS[node.name]) {
        const tier = TIERS[node.name];
        let label = tier.label;
        const first = node.children[0];
        if (first?.data?.directiveLabel) {
          label = toText(first);
          node.children.shift();
        }
        node.data = {
          hName: 'aside',
          hProperties: { className: ['tier', `tier--${node.name}`], 'aria-label': label },
        };
        node.children.unshift({
          type: 'paragraph',
          data: { hName: 'p', hProperties: { className: ['tier__label'], 'data-icon': tier.icon } },
          children: [{ type: 'text', value: label }],
        });
        return;
      }

      // remark-directive reads the ":5" in "John 3:5" (or "10:30") as a text directive.
      // Anything that isn't one of our tiers goes back to the text it came from.
      if ((node.type === 'textDirective' || node.type === 'leafDirective') && parent && index !== undefined) {
        const label = node.children?.length ? `[${toText(node)}]` : '';
        const attrs = Object.entries(node.attributes ?? {});
        const attrText = attrs.length ? `{${attrs.map(([k, v]) => (v ? `${k}="${v}"` : k)).join(' ')}}` : '';
        const prefix = node.type === 'leafDirective' ? '::' : ':';
        parent.children.splice(index, 1, { type: 'text', value: `${prefix}${node.name}${label}${attrText}` });
        return index;
      }

      if (node.type === 'blockquote') {
        const last = node.children[node.children.length - 1];
        if (last?.type === 'paragraph' && /^[—–]\s?/.test(toText(last))) {
          last.data = { hName: 'p', hProperties: { className: ['quote-cite'] } };
          node.data = { hProperties: { className: ['scripture-quote'] } };
        }
      }
    });

    // Rejoin the text that the directive parser split, so later plugins
    // (Scripture linking) see "John 3:5–8" as one string.
    visit(tree, (node) => {
      if (!node.children) return;
      for (let i = node.children.length - 1; i > 0; i--) {
        const a = node.children[i - 1];
        const b = node.children[i];
        if (a.type === 'text' && b.type === 'text') {
          a.value += b.value;
          node.children.splice(i, 1);
        }
      }
    });
  };
}
