import type { APIRoute } from 'astro';
import { getArticles, getStudies } from '../lib/content';
import { settings, absoluteUrl } from '../lib/site';

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);

export const GET: APIRoute = async () => {
  const [articles, studies] = await Promise.all([getArticles(), getStudies()]);
  const items = [
    ...articles.map((a) => ({ title: a.data.title, url: absoluteUrl(`/articles/${a.id}/`), date: a.data.publishDate, desc: a.data.excerpt })),
    ...studies.map((s) => ({ title: s.data.title, url: absoluteUrl(`/studies/${s.id}/`), date: s.data.publishDate, desc: s.data.introduction })),
  ].sort((a, b) => b.date.valueOf() - a.date.valueOf());

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${esc(settings.siteName)} — Articles &amp; Studies</title>
<link>${settings.siteUrl}/</link>
<atom:link href="${absoluteUrl('/rss.xml')}" rel="self" type="application/rss+xml" />
<description>${esc(settings.description)}</description>
<language>en-us</language>
${items
  .map(
    (i) => `<item><title>${esc(i.title)}</title><link>${i.url}</link><guid isPermaLink="true">${i.url}</guid><pubDate>${i.date.toUTCString()}</pubDate><description>${esc(i.desc)}</description></item>`,
  )
  .join('\n')}
</channel>
</rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
