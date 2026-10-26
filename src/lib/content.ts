import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { SERIES } from './site';

export type Article = CollectionEntry<'articles'>;
export type Video = CollectionEntry<'videos'>;
export type Study = CollectionEntry<'studies'>;
export type Book = CollectionEntry<'books'>;
export type Topic = CollectionEntry<'topics'>;

const published = <T extends { data: { draft?: boolean } }>(e: T) => import.meta.env.DEV || !e.data.draft;

export async function getArticles() {
  const all = await getCollection('articles', published);
  return all.sort(
    (a, b) =>
      b.data.publishDate.valueOf() - a.data.publishDate.valueOf() ||
      Number(b.data.featured) - Number(a.data.featured) ||
      a.data.title.localeCompare(b.data.title),
  );
}

export async function getVideos() {
  const all = await getCollection('videos', published);
  return all.sort((a, b) => b.data.uploadDate.valueOf() - a.data.uploadDate.valueOf());
}

export async function getEpisodes() {
  const all = await getCollection('videos', (v) => published(v) && v.data.series === SERIES.slug);
  return all.sort((a, b) => (a.data.episode ?? 0) - (b.data.episode ?? 0));
}

export async function getStudies() {
  const all = await getCollection('studies', published);
  return all.sort((a, b) => a.data.order - b.data.order);
}

export async function getTopics() {
  const all = await getCollection('topics');
  return all.sort((a, b) => a.data.order - b.data.order);
}

export async function getBooks() {
  const all = await getCollection('books');
  return all.sort((a, b) => a.data.order - b.data.order);
}

export async function getFlagshipBook() {
  return (await getEntry('books', 'seven-lamps-before-the-throne'))!;
}

/* ---------------------------------------------------------------------------
   Relationship engine
   Scores every other entry against the current one:
     explicit link from this entry  +100
     link back to this entry         +60
     each shared topic               +12
   so editors can curate relationships, and anything they forget is still
   connected by topic.
--------------------------------------------------------------------------- */

type Kind = 'articles' | 'videos' | 'studies';

interface Node {
  kind: Kind;
  id: string;
  topics: Set<string>;
  links: Record<Kind, Set<string>>;
  date: number;
}

const ids = (refs: { id: string }[] | undefined) => new Set((refs ?? []).map((r) => r.id));

function toNode(kind: Kind, entry: Article | Video | Study): Node {
  if (kind === 'articles') {
    const e = entry as Article;
    return {
      kind,
      id: e.id,
      topics: ids(e.data.categories),
      links: { articles: ids(e.data.relatedArticles), videos: ids(e.data.relatedVideos), studies: ids(e.data.relatedStudies) },
      date: e.data.publishDate.valueOf(),
    };
  }
  if (kind === 'videos') {
    const e = entry as Video;
    return {
      kind,
      id: e.id,
      topics: ids(e.data.topics),
      links: { articles: ids(e.data.relatedArticles), videos: new Set(), studies: ids(e.data.relatedStudies) },
      date: e.data.uploadDate.valueOf(),
    };
  }
  const e = entry as Study;
  return {
    kind,
    id: e.id,
    topics: ids(e.data.categories),
    links: { articles: ids(e.data.relatedArticles), videos: ids(e.data.relatedVideos), studies: ids(e.data.relatedStudies) },
    date: e.data.publishDate.valueOf(),
  };
}

let graphPromise: Promise<{ nodes: Node[]; articles: Article[]; videos: Video[]; studies: Study[] }> | undefined;

function graph() {
  graphPromise ??= (async () => {
    const [articles, videos, studies] = await Promise.all([getArticles(), getVideos(), getStudies()]);
    const nodes = [
      ...articles.map((e) => toNode('articles', e)),
      ...videos.map((e) => toNode('videos', e)),
      ...studies.map((e) => toNode('studies', e)),
    ];
    return { nodes, articles, videos, studies };
  })();
  return graphPromise;
}

export async function getRelated(kind: Kind, id: string, limits: Partial<Record<Kind, number>> = {}) {
  const { nodes, articles, videos, studies } = await graph();
  const self = nodes.find((n) => n.kind === kind && n.id === id);
  if (!self) return { articles: [] as Article[], videos: [] as Video[], studies: [] as Study[] };

  const score = (n: Node) => {
    let s = 0;
    if (self.links[n.kind].has(n.id)) s += 100;
    if (n.links[kind].has(id)) s += 60;
    for (const t of n.topics) if (self.topics.has(t)) s += 12;
    return s;
  };

  const pick = <T extends { id: string }>(k: Kind, list: T[], limit: number) => {
    const scored = nodes
      .filter((n) => n.kind === k && !(n.kind === kind && n.id === id))
      .map((n) => ({ n, s: score(n) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || b.n.date - a.n.date)
      .slice(0, limit);
    return scored.map((x) => list.find((e) => e.id === x.n.id)!).filter(Boolean);
  };

  return {
    articles: pick('articles', articles, limits.articles ?? 3),
    videos: pick('videos', videos, limits.videos ?? 3),
    studies: pick('studies', studies, limits.studies ?? 3),
  };
}

/** Everything tagged with a topic, for /topics/[slug] hubs. */
export async function getByTopic(topicId: string) {
  const { articles, videos, studies } = await graph();
  return {
    articles: articles.filter((a) => a.data.categories.some((c) => c.id === topicId)),
    videos: videos.filter((v) => v.data.topics.some((c) => c.id === topicId)),
    studies: studies.filter((s) => s.data.categories.some((c) => c.id === topicId)),
  };
}

export function adjacentEpisodes(episodes: Video[], id: string) {
  const i = episodes.findIndex((e) => e.id === id);
  return { prev: i > 0 ? episodes[i - 1] : undefined, next: i >= 0 && i < episodes.length - 1 ? episodes[i + 1] : undefined };
}
