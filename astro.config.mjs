// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkDirective from 'remark-directive';
import { remarkTiers } from './src/lib/remark-tiers.mjs';
import { remarkScripture } from './src/lib/remark-scripture.mjs';

const NOINDEX = ['/brand/', '/admin/', '/404/', '/search/', '/thank-you/'];

export default defineConfig({
  site: 'https://yonatree.com',
  trailingSlash: 'ignore',
  // Inline CSS so first paint never waits on a stylesheet request (LCP on mobile).
  build: { format: 'directory', inlineStylesheets: 'always' },
  image: {
    responsiveStyles: false,
    // Encoder defaults tuned for the detailed, luminous artwork (AVIF first, WebP fallback).
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        avif: { quality: 48, effort: 5 },
        webp: { quality: 72 },
        jpeg: { quality: 78, mozjpeg: true },
      },
    },
  },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkDirective, remarkTiers, remarkScripture],
      remarkRehype: {
        footnoteLabel: 'Notes',
        footnoteLabelProperties: { className: ['footnotes__label'] },
        footnoteBackLabel: 'Back to reference',
      },
      smartypants: true,
      gfm: true,
    }),
  },
  // Static fallbacks for any host; netlify.toml also serves these as real 301s.
  redirects: {
    '/seven-lamps': '/seven-lamps-before-the-throne/',
    '/home': '/',
    '/feed': '/rss.xml',
  },
  integrations: [
    sitemap({
      filter: (page) => !NOINDEX.some((p) => new URL(page).pathname.startsWith(p)),
    }),
  ],
});
