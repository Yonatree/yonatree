// Renders Markdown stored in frontmatter fields (perspective notes, book samples)
// with the same pipeline as content bodies: Scripture links, tiers, smart quotes.
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import remarkDirective from 'remark-directive';
import { remarkTiers } from './remark-tiers.mjs';
import { remarkScripture } from './remark-scripture.mjs';

let processor: ReturnType<typeof createMarkdownProcessor> | undefined;

export async function renderMarkdown(source: string) {
  processor ??= createMarkdownProcessor({
    remarkPlugins: [remarkDirective, remarkTiers, remarkScripture],
    smartypants: true,
    gfm: true,
    syntaxHighlight: false,
  });
  const { code } = await (await processor).render(source);
  return code;
}
