// schema.org structured data. Only facts we actually have are emitted:
// no ISBNs, prices, ratings, review counts or invented dates.
import { SITE_URL, absoluteUrl, settings, isoDuration } from './site';

export const ORG_ID = `${SITE_URL}/#organization`;
export const SITE_ID = `${SITE_URL}/#website`;

export function organization(logoUrl: string) {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: settings.siteName,
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: logoUrl },
    description: settings.mission,
    email: settings.contactEmail || undefined,
    address: { '@type': 'PostalAddress', addressLocality: 'Pensacola', addressRegion: 'FL', addressCountry: 'US' },
    sameAs: settings.social.map((s) => s.url),
  };
}

export function website() {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: SITE_URL,
    name: settings.siteName,
    description: settings.description,
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-US',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/search/?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbs(items: { name: string; href: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}

export function article(opts: {
  url: string;
  title: string;
  description: string;
  image: string;
  published: Date;
  modified?: Date;
  author: string;
  section?: string;
  keywords?: string[];
}) {
  return {
    '@type': 'Article',
    '@id': `${opts.url}#article`,
    headline: opts.title,
    description: opts.description,
    image: [opts.image],
    datePublished: opts.published.toISOString(),
    dateModified: (opts.modified ?? opts.published).toISOString(),
    author: opts.author === settings.siteName ? { '@id': ORG_ID } : { '@type': 'Person', name: opts.author },
    publisher: { '@id': ORG_ID },
    mainEntityOfPage: opts.url,
    articleSection: opts.section,
    keywords: opts.keywords?.join(', '),
    inLanguage: 'en-US',
  };
}

export function video(opts: { url: string; title: string; description: string; thumbnail: string; uploadDate: Date; duration: string; youtubeId: string }) {
  return {
    '@type': 'VideoObject',
    '@id': `${opts.url}#video`,
    name: opts.title,
    description: opts.description,
    thumbnailUrl: [opts.thumbnail, `https://i.ytimg.com/vi/${opts.youtubeId}/maxresdefault.jpg`],
    uploadDate: opts.uploadDate.toISOString(),
    duration: isoDuration(opts.duration),
    embedUrl: `https://www.youtube-nocookie.com/embed/${opts.youtubeId}`,
    contentUrl: `https://www.youtube.com/watch?v=${opts.youtubeId}`,
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-US',
  };
}

export function book(opts: {
  url: string;
  title: string;
  subtitle?: string;
  description: string;
  image: string;
  authors: string[];
  publisher: string;
  copyrightYear?: number;
  formats: { format: string; url: string }[];
}) {
  const formatType: Record<string, string> = {
    Ebook: 'https://schema.org/EBook',
    Audiobook: 'https://schema.org/AudiobookFormat',
    Paperback: 'https://schema.org/Paperback',
    Hardcover: 'https://schema.org/Hardcover',
  };
  return {
    '@type': 'Book',
    '@id': `${opts.url}#book`,
    name: opts.title,
    alternativeHeadline: opts.subtitle,
    description: opts.description,
    image: opts.image,
    url: opts.url,
    author: opts.authors.map((name) => ({ '@type': 'Person', name })),
    publisher: { '@id': ORG_ID },
    copyrightYear: opts.copyrightYear,
    inLanguage: 'en-US',
    workExample: opts.formats
      .filter((f) => formatType[f.format])
      .map((f) => ({ '@type': 'Book', bookFormat: formatType[f.format], url: f.url, inLanguage: 'en-US' })),
  };
}

export function graphLd(...nodes: object[]) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}
