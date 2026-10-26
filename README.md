# Yona Tree — Yonatree.com

The redesigned home of Yona Tree: biblical studies, books, articles, audiobooks and video, and the
16-part **Seven Lamps Before the Throne** series.

Built with [Astro](https://astro.build) (static site), [Decap CMS](https://decapcms.org) (editing without code)
and [Pagefind](https://pagefind.app) (site search). No client framework; a few small scripts for menus,
tabs, filters, footnotes and the YouTube player.

## Commands

| Command | What it does |
| --- | --- |
| `npm install` | Install dependencies (Node 22.12+; Node 24 recommended) |
| `npm run dev` | Local site at http://localhost:4321 |
| `npm run cms` | Local CMS backend — run alongside `npm run dev`, then open http://localhost:4321/admin/ |
| `npm run build` | Production build to `dist/`, then builds the search index |
| `npm run preview` | Serve the production build (search works here, not in `dev`) |

## Site map

| URL | Page |
| --- | --- |
| `/` | Home |
| `/seven-lamps-before-the-throne/` | Series hub — all 16 episodes, complete playlist |
| `/seven-lamps/<part>/` | Episode pages, e.g. `/seven-lamps/part-15-sword-of-the-spirit/` |
| `/books/`, `/books/seven-lamps-before-the-throne/` | Books and the book page |
| `/videos/`, `/videos/<slug>/` | Video library (search + category filters) and non-series videos |
| `/articles/`, `/articles/<slug>/` | Article library and article pages |
| `/articles/scripture-index/` | Every Bible passage cited across the site |
| `/studies/`, `/studies/<slug>/` | Study hubs: holy-trinity, holy-spirit, lady-wisdom, seven-lamps, tree-of-life, new-jerusalem, lost-and-found, three-dwelling-places |
| `/topics/`, `/topics/<slug>/` | Topic hubs, filled automatically from tagged content |
| `/about/`, `/contact/`, `/partner/`, `/privacy/`, `/terms/` | Ministry and legal pages |
| `/search/` | Site search (articles, videos, studies, books, pages) |
| `/our-spiritual-mother/` | Preserved from the old site (it was indexed by search engines) |
| `/brand/` | Brand audit, color system and before/after comparison (noindex) |
| `/admin/` | Content manager |
| `/sitemap-index.xml`, `/robots.txt`, `/rss.xml` | Generated automatically |

## Editing content

All content lives in plain files, edited through the CMS at `/admin/` (or directly):

```
src/content/articles/*.md   Articles
src/content/videos/*.md     Videos and Seven Lamps episodes
src/content/books/*.md      Books
src/content/studies/*.md    Study hubs
src/content/topics.json     Topic categories
src/data/settings.json      Social links, YouTube, forms, mission text
src/assets/art/             Artwork (upload large originals — sizes and AVIF/WebP are generated)
src/assets/thumbnails/      Video thumbnails
```

When an article, video or study is saved, the site rebuilds and these update on their own: latest
articles, related content on every page, the video library, topic hubs, the Scripture index, the RSS feed,
the sitemap and search.

### Writing conventions

- **Scripture references link automatically.** Write `John 3:5–8`, `Proverbs 8:30 (NLT)` or `Psalm 139:7–10`
  in any body text and it becomes a Bible Gateway link (KJV unless a version is given). A chapter and verse
  are required, so ordinary words like "Wisdom" never link by accident.
- **Evidence tiers.** Whenever a page moves from the text of Scripture into interpretation, use a labelled block:

  ```md
  :::scripture
  What the passage itself says…
  :::

  :::history
  What creeds, Church Fathers, translations or historical texts say…
  :::

  :::interpreters
  What other Christians and scholars believe…
  :::

  :::yonatree
  Yona Tree's own conclusion…
  :::
  ```

  `:::possible` and `:::speculation` are also available (used on New Jerusalem).
- **Yona Tree Study Perspective.** Fill in the *perspective* field on any article or study that advances a
  distinctive position; it appears in a discreet box on the page.
- **Footnotes.** Write `[^1]` in the text and `[^1]: The note.` at the end. Readers can open notes inline.
- **Scripture quotations** in blockquotes: put the reference on its own last line, separated by a blank `>` line:

  ```md
  > Except a man be born of water and of the Spirit…
  >
  > — John 3:5
  ```

### Adding a video

1. Download the thumbnail from `https://i.ytimg.com/vi/<VIDEO_ID>/maxresdefault.jpg`.
2. In the CMS, *Videos › New Video*: title, YouTube ID, thumbnail, duration, upload date, summary, categories.
3. For a new Seven Lamps-style series, add the series to `SERIES`/`VIDEO_CATEGORIES` in `src/lib/site.ts`.

## Hosting (Netlify)

`netlify.toml` is included: build command, publish folder, long-lived caching for fingerprinted assets,
security headers and 301 redirects from old WordPress addresses.

1. Push this folder to a GitHub repository and create a Netlify site from it.
2. In `public/admin/config.yml`, set `backend.repo` to that repository.
3. In Netlify, enable GitHub OAuth (*Site configuration › Access & security › OAuth*) so editors can sign in to `/admin/`.
4. Point the `yonatree.com` domain at Netlify. Netlify Forms will pick up the newsletter and contact forms automatically.

To use Mailchimp, ConvertKit or Buttondown for the newsletter instead, change *Site settings › Forms* in the
CMS (or `src/data/settings.json`).

## Quality checks

Lighthouse (mobile, simulated slow 4G) on the production build: **Performance 92–98, Accessibility 100,
Best Practices 100, SEO 100** across the home, article, study, book and series pages.

- WCAG 2.2 AA: semantic landmarks, skip link, visible focus, keyboard-operable menus/tabs/filters,
  4.5:1 text contrast, alt text on all artwork, `prefers-reduced-motion` respected, zoom allowed.
- Images: AVIF + WebP + JPEG fallback, responsive `srcset`, lazy loading below the fold, fixed dimensions (no layout shift).
- Fonts: self-hosted Cinzel, Source Serif 4 and Inter, Latin subsets only.
- YouTube: a local thumbnail until *Play* is pressed; then the privacy-enhanced player loads.
- Structured data: Organization, WebSite (with search), Book, Article, VideoObject, ItemList and BreadcrumbList.
  No invented ISBNs, prices, ratings, reviews or dates.

## Items for the ministry to confirm before launch

- **Theological review.** The 14 articles and 8 studies were adapted from the *Seven Lamps Before the Throne*
  manuscript and the episode descriptions. Please have the authors review them. Publication dates are set to the
  date they were written (October 25, 2026); change them as you like.
- **Corrections made while adapting the manuscript:** "John 4:28–29" in Chapter 7 is cited as John 5:28–29; a note
  explains that the wording of 1 John 5:7 is found in the KJV but not in most modern translations; and the
  "filioque" history of the Nicene Creed is explained.
- **Reader reflections** (Brenda O. and Todd) are carried over from the current site, with two typos corrected.
- **Contact email** is blank, so only the contact form shows. Add one in *Site settings* if you want it published.
- **Privacy Policy and Terms** are marked as drafts for review.
- **Book Two** has no title or details, as requested. The teaser collects notification sign-ups.
- **Artwork:** `trinity-family-portrait.jpg` and `trinity-throne-assembly.jpg` are low-resolution in the originals.
  The second is used only as a dimmed study image; higher-resolution versions would improve it.
- **Old site placeholders** ("(555) 111-1111" and "Book An Appointment") were not carried over.
