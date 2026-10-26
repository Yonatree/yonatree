import settings from '../data/settings.json';

export { settings };

export const SITE_URL = settings.siteUrl;

export const SERIES = {
  slug: 'seven-lamps-before-the-throne',
  title: 'Seven Lamps Before the Throne',
  subtitle: 'A 16-Part Biblical Audiobook Video Series',
  hub: '/seven-lamps-before-the-throne/',
  episodeBase: '/seven-lamps/',
  totalParts: 16,
  playlistUrl: `https://www.youtube.com/playlist?list=${settings.youtube.seriesPlaylistId}`,
};

export const YOUTUBE_SUBSCRIBE = `${settings.youtube.channelUrl}?sub_confirmation=1`;

/** Video library categories (navigation filters on /videos). */
export const VIDEO_CATEGORIES = [
  { slug: 'seven-lamps', title: 'Seven Lamps Before the Throne' },
  { slug: 'biblical-symbolism', title: 'Biblical Symbolism' },
  { slug: 'holy-spirit-studies', title: 'Holy Spirit Studies' },
  { slug: 'tree-of-life', title: 'Tree of Life' },
  { slug: 'new-jerusalem', title: 'New Jerusalem' },
  { slug: 'christian-theology', title: 'Christian Theology' },
  { slug: 'scripture-studies', title: 'Scripture Studies' },
  { slug: 'worship-music', title: 'Worship Music' },
  { slug: 'future-series', title: 'Future Series' },
] as const;

export const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Seven Lamps', href: '/seven-lamps-before-the-throne/', match: ['/seven-lamps'] },
  { label: 'Books', href: '/books/' },
  { label: 'Videos', href: '/videos/' },
  { label: 'Articles', href: '/articles/', match: ['/articles', '/topics'] },
  { label: 'Studies', href: '/studies/', mega: true },
  { label: 'About', href: '/about/' },
];

/** Studies mega menu. Topic hubs are auto-populated from tagged content. */
export const STUDIES_MENU = [
  { label: 'Holy Trinity', href: '/studies/holy-trinity/', icon: 'trinity', note: 'One God in three Persons' },
  { label: 'Holy Spirit', href: '/studies/holy-spirit/', icon: 'dove', note: 'The least understood Person' },
  { label: 'Lady Wisdom', href: '/studies/lady-wisdom/', icon: 'scroll', note: 'Proverbs 1, 3, 8 & 9' },
  { label: 'Seven Lamps', href: '/studies/seven-lamps/', icon: 'menorah', note: 'Revelation 4:5 & Isaiah 11' },
  { label: 'Tree of Life', href: '/studies/tree-of-life/', icon: 'tree', note: 'From Eden to Revelation 22' },
  { label: 'Bride of Christ', href: '/topics/bride-of-christ/', icon: 'crown', note: 'The Church and her Bridegroom' },
  { label: 'New Jerusalem', href: '/studies/new-jerusalem/', icon: 'city', note: 'Revelation 21–22' },
  { label: 'Book of Revelation', href: '/topics/book-of-revelation/', icon: 'star', note: 'Throne, lamps & new creation' },
  { label: 'Biblical Symbolism', href: '/topics/biblical-symbolism/', icon: 'lamp', note: 'Dove, menorah, sword & more' },
  { label: 'Heaven & Resurrection', href: '/topics/heaven-resurrection/', icon: 'gate', note: 'Where the righteous dwell' },
];

export const FOOTER_EXPLORE = [
  { label: 'Books', href: '/books/' },
  { label: 'Articles', href: '/articles/' },
  { label: 'Videos', href: '/videos/' },
  { label: 'Studies', href: '/studies/' },
  { label: 'Scripture Index', href: '/articles/scripture-index/' },
  { label: 'Search', href: '/search/' },
];

export const FOOTER_SITE = [
  { label: 'About', href: '/about/' },
  { label: 'Partner With Us', href: '/partner/' },
  { label: 'Contact', href: '/contact/' },
  { label: 'Privacy Policy', href: '/privacy/' },
  { label: 'Terms', href: '/terms/' },
];

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

export function episodeUrl(slug: string) {
  return `${SERIES.episodeBase}${slug}/`;
}

/** Series episodes live under /seven-lamps/, everything else under /videos/. */
export function videoUrl(video: { id: string; data: { series?: string } }) {
  return video.data.series === SERIES.slug ? episodeUrl(video.id) : `/videos/${video.id}/`;
}

export const formatDate = (d: Date) =>
  d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/** "9:47" → "PT9M47S" for VideoObject structured data. */
export function isoDuration(duration: string) {
  const parts = duration.split(':').map(Number);
  const [h, m, s] = parts.length === 3 ? parts : [0, ...parts];
  return `PT${h ? `${h}H` : ''}${m}M${s}S`;
}

export function readingTime(text = '') {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}
