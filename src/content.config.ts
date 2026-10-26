import { defineCollection, reference } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';
import { VIDEO_CATEGORIES } from './lib/site';

// Every collection here is editable in the CMS at /admin (see public/admin/config.yml).
// Relationships are stored as slugs so editors can link content without touching layouts.

const seo = {
  seoTitle: z.string().optional(),
  seoDescription: z.string().max(170).optional(),
};

const topics = defineCollection({
  // Stored as { "topics": [...] } so the CMS can edit it as a single settings file.
  loader: file('src/content/topics.json', { parser: (text) => JSON.parse(text).topics }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    icon: z.string().default('lamp'),
    featured: z.boolean().default(false),
    order: z.number().default(100),
  }),
});

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      excerpt: z.string(),
      image: image(),
      imageAlt: z.string(),
      imagePosition: z.string().default('center'),
      author: z.string().default('Yona Tree'),
      adaptedFrom: z.string().optional(),
      publishDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      categories: z.array(reference('topics')).min(1),
      tags: z.array(z.string()).default([]),
      scripture: z.array(z.string()).default([]),
      bibleVersion: z.string().default('KJV'),
      perspective: z.string().optional(),
      relatedVideos: z.array(reference('videos')).default([]),
      relatedArticles: z.array(reference('articles')).default([]),
      relatedStudies: z.array(reference('studies')).default([]),
      book: reference('books').optional(),
      featured: z.boolean().default(false),
      popular: z.boolean().default(false),
      draft: z.boolean().default(false),
      ...seo,
    }),
});

const videos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/videos' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      series: z.string().optional(),
      episode: z.number().int().positive().optional(),
      youtubeId: z.string().length(11),
      thumbnail: image(),
      duration: z.string().regex(/^\d{1,2}:\d{2}(:\d{2})?$/),
      uploadDate: z.coerce.date(),
      summary: z.string(),
      categories: z.array(z.enum(VIDEO_CATEGORIES.map((c) => c.slug) as [string, ...string[]])).default([]),
      topics: z.array(reference('topics')).default([]),
      themes: z.array(z.string()).default([]),
      scripture: z.array(z.string()).default([]),
      relatedArticles: z.array(reference('articles')).default([]),
      relatedStudies: z.array(reference('studies')).default([]),
      book: reference('books').optional(),
      bookChapter: z.string().optional(),
      transcript: z.string().optional(),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
      ...seo,
    }),
});

const purchaseLink = z.object({
  label: z.string(),
  format: z.enum(['Ebook', 'Audiobook', 'Paperback', 'Hardcover', 'Video series']),
  retailer: z.string(),
  url: z.url(),
});

const books = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/books' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      cover: image(),
      coverAlt: z.string(),
      authors: z.array(z.string()).min(1),
      publisher: z.string().default('Yona Tree'),
      publisherLocation: z.string().optional(),
      copyrightYear: z.number().int().optional(),
      status: z.enum(['available', 'coming-soon']),
      tagline: z.string().optional(),
      description: z.string(),
      themes: z.array(z.string()).default([]),
      purchaseLinks: z.array(purchaseLink).default([]),
      toc: z.array(z.object({ title: z.string(), summary: z.string().optional() })).default([]),
      dedication: z.string().optional(),
      sampleTitle: z.string().optional(),
      sample: z.string().optional(),
      testimonials: z.array(z.object({ quote: z.string(), name: z.string(), note: z.string().optional() })).default([]),
      relatedVideos: z.array(reference('videos')).default([]),
      relatedArticles: z.array(reference('articles')).default([]),
      relatedStudies: z.array(reference('studies')).default([]),
      order: z.number().default(1),
      ...seo,
    }),
});

const studies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/studies' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      eyebrow: z.string().default('Featured Study'),
      introduction: z.string(),
      image: image(),
      imageAlt: z.string(),
      imagePosition: z.string().default('center'),
      feature: z
        .enum(['none', 'tree-of-life', 'seven-lamps', 'trinity', 'wisdom-tiers', 'new-jerusalem', 'dwelling-stages', 'lost-and-found', 'holy-spirit'])
        .default('none'),
      notice: z.string().optional(),
      perspective: z.string().optional(),
      categories: z.array(reference('topics')).default([]),
      scripture: z.array(z.string()).default([]),
      relatedArticles: z.array(reference('articles')).default([]),
      relatedVideos: z.array(reference('videos')).default([]),
      relatedStudies: z.array(reference('studies')).default([]),
      book: reference('books').optional(),
      order: z.number().default(100),
      inMenu: z.boolean().default(true),
      publishDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      draft: z.boolean().default(false),
      ...seo,
    }),
});

export const collections = { topics, articles, videos, books, studies };
