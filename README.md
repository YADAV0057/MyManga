# MangaMood 🔮

MangaMood is a mood-based manga discovery app. Instead of searching by title, you describe how you want to feel ("something that will make me cry", "chaotic and funny") or tap a mood button, and it aggregates results across multiple manga APIs, ranks them by how well they match, and explains why.

Live example flow: type a vibe → NLU pipeline turns it into structured intent → results are fetched from a tiered API waterfall → each result is scored against your intent → ranked cards render with a "Why?" breakdown.

The landing page itself is never empty on first visit — see [Landing page rows](#landing-page-rows-trending-today--hidden-gems) below.

## Features

- **Natural-language mood search** — "I want something that will make me cry" gets parsed into genres, themes, tone, and intensity.
- **Dedicated paginated Search Results page** — typed searches open a full-page overlay (`js/searchResultsPage.js`) with a "Next Page" button, instead of rendering into the homepage grid. Quick filter chips, mood presets, and Reroll still render into the homepage grid as before — only the search bar opens this page.
- **50-mood quick-select grid** with a rotating 3-button preview, bypassing the NLU parser entirely for speed and reliability.
- **Multi-source API waterfall** — AniList → Jikan → Kitsu → MangaDex, each tier only queried if the previous one returns nothing.
- **Recommendation scoring** — every result gets a 0–100 match score (mood, genre, theme, demographic, constraints, popularity, rating, entity signals) with a collapsible "Why?" explanation.
- **Favorites / My List** — stored locally and mirrored to Firestore per-device, so it survives a cleared cache.
- **AI Search Intelligence panel** — live view of what the parser understood and which APIs were queried, collapsible after the search completes.
- **Circuit breaker for MangaDex** — after 2 consecutive failures, MangaDex is skipped for the rest of the session instead of retried on every card.
- **Landing page rows (Trending Today / Hidden Gems)** — always-populated content on first visit, before any search or mood tap. Fully isolated in `js/landing/` — see below.

## Project structure

```
mymanga/
├── index.html
├── package.json
├── queue.txt                     # tags awaiting the harvester (see below)
├── css/
│   ├── style.css
│   ├── cards.css
│   ├── detail.css
│   ├── mixer.css
│   ├── mylist.css
│   └── results.css
├── js/
│   ├── main.js                   # app bootstrap — binds everything to window
│   ├── search.js                 # search orchestration + API waterfall
│   ├── searchResultsPage.js      # dedicated paginated results page for typed searches
│   ├── mangaDetail.js            # full-page cover/synopsis/read-links view
│   ├── mixerPage.js              # dedicated Mood Mixer page
│   ├── myListPage.js             # dedicated favorites + recommendations page
│   ├── topPicks.js               # homepage "Today's Top Picks" auto-fill
│   ├── moods.js                  # 50-mood grid, rotation, click routing
│   ├── renderer.js               # card rendering, favorites button, "Why?" panel
│   ├── resultNormalizer.js       # unifies each API's response shape
│   ├── mangaProfiles.js          # per-title mood vectors (Firestore-cached)
│   ├── favorites.js              # local + Firestore favorites list
│   ├── firebase.js               # Firebase init + cache helpers
│   ├── theme.js                  # background color per selected mood
│   ├── config.js, utils.js
│   ├── anilist.js, jikan.js, kitsu.js, mangadex.js   # per-source API adapters
│   ├── clean_queue.js            # CLI: turns a messy paste into queue.txt
│   ├── landing/                  # isolated landing-page rows feature (Trending Today / Hidden Gems)
│   │   ├── fetch.js              # data only — AniList queries + Firebase caching
│   │   ├── render.js             # DOM only — turns data into card HTML
│   │   ├── styles.css            # visual only — scoped, self-injected
│   │   ├── index.js              # wiring only — the single integration point with search.js
│   │   ├── README.md             # "if X breaks, check file Y" diagnosis map
│   │   └── IMPLEMENTATION_GUIDE.md
│   └── parser/
│       ├── pipeline.js           # buildIntent(): text -> MangaIntent
│       ├── searchPlanner.js      # MangaIntent -> flat SearchPlan
│       ├── recommendationScorer.js  # scores + ranks results
│       ├── moodEngine.js, rules.js, ruleEngine.js, genreMapper.js, synonyms.js, normalize.js
│       ├── intentSchema.js       # MangaIntent class
│       ├── dictionary.js         # merges properties.js + harvested_knowledge.js
│       └── dictionary/
│           ├── properties.js             # hand-curated concept data (large, generated-shape file)
│           ├── harvested_knowledge.js    # auto-harvested concept data (generated, may not exist locally)
│           ├── harvester.js, HarvesterAPI.js   # Node CLI that builds harvested_knowledge.js
│           ├── entityRelations.js, shikimoriClient.js, mangaUpdatesClient.js
│           ├── MoodConfig.js, upgrade.js, backfillMoodWeights.js, reweightProperties.js
│           └── synopsisAnalyzer.js, lexicon.js
└── .github/workflows/
    ├── harvest.yml                # scheduled run of harvester.js
    └── clean-queue.yml            # scheduled run of clean_queue.js
```

## How a search works

1. **Input** — typed text opens the dedicated Search Results page (`js/searchResultsPage.js`), which calls `triggerSearch`; a mood/preset button, quick filter chip, or Reroll still renders straight into the homepage's `#community-grid` via `triggerPresetSearch`/`triggerQuickFilter`/`triggerSearch`.
2. **Intent** — typed text goes through `parser/pipeline.js`'s `buildIntent()`: normalize → detect negations → extract hard filters (status/sort/max chapters) → apply synonyms → detect moods & tone → map moods to genres/themes/demographics → apply reasoning rules → produce a `MangaIntent`. Preset buttons skip all of this and build a minimal intent directly from the button's genre list.
3. **Plan** — `parser/searchPlanner.js` flattens the intent (or genre list) into a `SearchPlan`: primary genres, secondary themes, excluded genres/themes, filters, and API order.
4. **Waterfall** — `search.js`'s `runSearch()` tries AniList first (with a cache check via Firestore), then Jikan, then Kitsu, then MangaDex, stopping as soon as one tier returns results. It always renders into `#community-grid` regardless of caller.
5. **Normalize** — each adapter's raw response is converted to a common shape by `resultNormalizer.js`.
6. **Score** — `parser/recommendationScorer.js` scores every result against the intent (mood similarity via `mangaProfiles.js`, genre/theme overlap, constraints, popularity, rating) and sorts by match score.
7. **Render** — `renderer.js` draws each card, including the score badge and the collapsible "Why?" match breakdown, into `#community-grid`. For a typed search, `searchResultsPage.js` then re-parents those freshly-rendered card nodes out of `#community-grid` onto its own page grid (moved, not cloned), so nothing is left duplicated on the homepage underneath. "Next Page" repeats this in `appendMode`, which skips the grid-clear/skeleton step in `runSearch()` and appends instead of replacing.

## Landing page rows: Trending Today / Hidden Gems

The landing page shows two always-populated rows on first visit — **before** any search or mood tap — so the app is never blank. This is entirely separate from the search waterfall above and lives in its own folder: `js/landing/`.

**Integration is a single line.** `search.js` contains exactly one line related to this feature:

```js
import './landing/index.js';
```

Everything else — fetching from AniList (`TRENDING_DESC` for Trending Today; `SCORE_DESC` + a popularity ceiling for Hidden Gems), Firebase caching (6-hour TTL), rendering cards, and scoped CSS — lives inside `js/landing/` and nowhere else. The only thing required outside that folder is one mount point in the landing page HTML:

```html
<div data-landing-mount></div>
```

| File | Role |
|---|---|
| `landing/fetch.js` | Data only — AniList queries + Firebase caching |
| `landing/render.js` | DOM only — turns data into card HTML |
| `landing/styles.css` | Visual only — scoped, self-injected stylesheet |
| `landing/index.js` | Wiring only — injects CSS, finds the mount point, calls fetch → render |
| `landing/README.md` | Diagnosis map — which file to check for which symptom |
| `landing/IMPLEMENTATION_GUIDE.md` | Step-by-step build/verification instructions |

**To disable instantly:** comment out the one import line in `search.js`. Nothing else in the app depends on `js/landing/`, so this is always safe.

**External dependencies** (the only things `js/landing/` imports from outside itself): `../firebase.js` (caching), `../resultNormalizer.js` (shaping AniList data), `../renderer.js` (card HTML). If any of those three change their exported signatures, `js/landing/` is the only place that needs updating to match.

## Key files at a glance

| Task | File | Entry point |
|---|---|---|
| Change API call order | `search.js` | `runSearch()` |
| Fix/tweak the Search Results page (pagination, layout, "Next Page") | `searchResultsPage.js`, `css/results.css` | `openSearchResultsPage()`, `loadNextPage()` |
| Add/adjust scoring weights | `parser/recommendationScorer.js` | `WEIGHTS`, `scoreOne()` |
| Add a new genre/mood button | `moods.js` | `allMoods` array |
| Change how text queries are parsed | `parser/pipeline.js` | `buildIntent()` |
| Fix a rendering/grid bug | `renderer.js` or `main.js` | `renderMangaCard()` |
| Add a new mood concept | `parser/dictionary/properties.js` (curated) or run the harvester | — |
| Fix/tweak the landing-page rows | `landing/fetch.js`, `landing/render.js`, `landing/styles.css`, or `landing/index.js` | see `landing/README.md` |

## Data files: `properties.js` and `harvested_knowledge.js`

These two files hold the "concept dictionary" (mood/trope → genres, themes, demographics, tone, intensity). `properties.js` is hand-curated; `harvested_knowledge.js` is generated by `js/parser/dictionary/harvester.js` from `queue.txt` and may not exist in a fresh checkout — `search.js` falls back to `properties.js` alone if it's missing.

They're large, repetitive JSON-shaped data files with no logic in them. If you're debugging how scoring works, look at `recommendationScorer.js`; if you're debugging what a concept maps to, these are the files, but treat them as generated data rather than hand-editing — use `harvester.js` (via `queue.txt`) or `reweightProperties.js` / `backfillMoodWeights.js` for bulk changes instead of manual edits.

## Notable design decisions

- **Preset vs. typed search:** mood buttons call `triggerPresetSearch()`, which builds a `SearchPlan` directly from a fixed genre list — no NLU parsing, no ambiguity, no failure mode tied to the concept dictionary.
- **MangaDex circuit breaker:** `mangadex.js` tracks consecutive failures in a session-scoped variable. After 2, MangaDex is skipped for the rest of the tab's life rather than retried on every card (avoids repeated multi-second timeouts).
- **Only AniList results are cached (search flow):** `search.js` writes to Firestore only when `dataSource === "anilist"`, keeping the search cache small and consistent. (The landing rows use their own separate daily cache — see above — because they query AniList with different sort orders than the search waterfall.)
- **Silent-failure waterfall:** every API adapter catches its own errors and returns `[]` rather than throwing, so one down API doesn't break the whole search.
- **Search Results page reuses, never reimplements, the search pipeline:** `searchResultsPage.js` has no NLU/scoring logic of its own — it calls `search.js`'s real `triggerSearch()` and re-parents the card nodes `runSearch()` renders into `#community-grid` onto its own grid. "Next Page" uses an `appendMode` flag on `triggerSearch`/`runSearch` that skips the grid-clear/skeleton step and appends instead of replacing. "Has more pages" is a heuristic (a full-size page of results implies another page probably exists), not a real total count from any of the four APIs.
- **Mood vectors, not just genre overlap:** `mangaProfiles.js` computes and caches a per-title "mood atom" vector (exciting, dark, wholesome, etc.) from its genres/themes, compared via cosine similarity against the user's mood profile — this is the primary signal in scoring, with plain genre/theme overlap as a fallback for titles with no cached profile yet.
- **Landing rows are folder-isolated on purpose:** unlike the rest of the app, `js/landing/` is a self-contained feature module with exactly one integration point (`import './landing/index.js';` in `search.js`) and one HTML mount point. This is a deliberate exception to the app's normal file layout — the goal is that if this feature breaks, the fix (or a one-line disable) never requires touching or risking the core search flow.

## Running locally

This is a static frontend (`index.html` + ES modules) — no build step required for the app itself. Serve the folder with any static file server and open it in a browser.

The `package.json` dependencies (`axios`, `xml2js`, `afinn-165`) are only used by the Node-based harvester/queue tooling under `js/parser/dictionary/`, not by the browser app:

```bash
npm install
node js/clean_queue.js raw_paste.txt queue.txt   # turn a messy paste into a clean tag queue
node js/parser/dictionary/harvester.js           # harvest concept data for tags in queue.txt
```

Both also run on a schedule via `.github/workflows/harvest.yml` and `clean-queue.yml`.

## Known limitations

- `popularity` values are not comparable across sources — each API uses a different base. Cross-source comparisons are normalized per-batch in the scorer, not treated as a global scale.
- Kitsu's API has no clean "exclude category" filter, so `excludedGenres` isn't enforced for Kitsu results (a real API limitation, not an oversight).
- MangaDex has no cheap popularity field on the search endpoint (would require a separate `/statistics` call per title), so popularity is always `null` for MangaDex results.
- The landing page's Hidden Gems popularity ceiling (`popularity_lesser`) is a loose default, not tuned against real traffic yet — revisit once you have actual popularity distribution data.

## Debugging notes: silent import-chain failures

`main.js` loads `search.js` with a dynamic `import()` wrapped in `try/catch`, and logs any failure as `"DEBUG - Search Load Failure:"` in the console. This only catches errors that actually throw during module evaluation — it does not guarantee something will show in the console, especially on mobile dev tools (e.g. Eruda), which can filter or miss module-load errors entirely.

`search.js` has a long static import chain (`search.js` → `recommendationScorer.js` → `dictionary.js` → `dictionary/properties.js`, etc.). A `SyntaxError` anywhere in that chain — even in a file several hops deep that `search.js` never directly touches — is fatal to the whole chain and can look identical to a "silently unresolved" bug (diagnostics show `Search: MISSING`, no console output, no thrown error visible).

Real example hit during development: a missing comma between two entries in `dictionary.js`'s `SYNONYM_MAP` object was a fatal `SyntaxError`. It broke `search.js`'s entire import chain with no visible console error, and looked like a logic bug rather than a syntax bug.

When Search (or any feature wired through a static import chain) is `MISSING` with a clean console: don't assume it's a logic/runtime issue. Check every file in the import chain for parse errors first (`node --check` on each, or trace the chain manually), starting from the deepest imports and working back up, before debugging scoring/matching logic.

`properties.js` and `harvested_knowledge.js` are large generated/curated data files with no logic — not usually worth uploading for debugging unless the bug is specifically about a missing or malformed concept entry.

**Note:** `js/landing/` is still reached via a normal static `import` in `search.js`, so a `SyntaxError` inside any `landing/` file would still break `search.js`'s import chain the same way the `dictionary.js` example above does — run `node --check` on the `landing/` files first if Search itself goes `MISSING` after touching that folder. What *is* isolated is runtime behavior: once the app has loaded, a failed AniList fetch, a bad cache read, or a missing mount point inside `landing/` is caught internally and logged, and cannot crash or block the search feature itself. If Search works but the landing rows don't, the bug is a runtime issue isolated to `js/landing/` — see `landing/README.md`.
