No problem! Sometimes markdown files get a bit too long for a single code block and can get cut off depending on the interface.
I will split the updated README.md into **two parts**. You can just copy Part 1, paste it into your file, and then copy and paste Part 2 directly underneath it.
### Part 1
Copy this first half:
```markdown
# MangaMood 🔮

MangaMood is a mood-based manga discovery app. Instead of searching by title, you describe how you want to feel ("something that will make me cry", "chaotic and funny") or tap a mood button, and it aggregates results across multiple manga APIs, ranks them by how well they match, and explains why.

Live example flow: type a vibe → NLU pipeline turns it into structured intent → results are fetched from a tiered API waterfall → each result is scored against your intent → ranked cards render with a "Why?" breakdown.

The app uses a clean, framework-free "full-page overlay" architecture for navigation, ensuring rapid transitions between the search grid, mood mixing, your personal list, and detailed manga views without full page reloads.

## Features

- **Natural-language mood search** — "I want something that will make me cry" gets parsed into genres, themes, tone, and intensity.
- **Mood Mixer & Quick-Select** — Stack up to 2 moods on the homepage to blend them seamlessly, or open the dedicated full-page Mood Mixer (`js/mixerPage.js`) to combine moods with specific genres, status, and chapter-length filters.
- **Dedicated paginated Search Results page** — Typed searches open a full-page overlay (`js/searchResultsPage.js`) with a "Next Page" append button, ensuring the homepage grid remains untouched.
- **Interactive Manga Detail View** — Tapping anywhere on a manga card opens a full-screen overlay (`js/mangaDetail.js`) featuring cover art, stats, a collapsible synopsis, match reasoning, and external read links.
- **Slide-out Navigation Drawer** — A glassmorphism menu (`js/menuDrawer.js`) accessible via the ☰ icon for page routing and cycling through dynamic app color themes.
- **Today's Top Picks** — Automatically populates the homepage grid on load with a rotating selection of highly-rated manga, cached on a deterministic 12-hour window (`js/topPicks.js`).
- **Favorites & Recommendations (My List)** — A dedicated page (`js/myListPage.js`) for your stored local/Firestore favorites, plus an hourly-rotating "Recommended for you" feed.
- **Multi-source API waterfall** — AniList → Jikan → Kitsu → MangaDex, each tier only queried if the previous one returns nothing.
- **Recommendation scoring** — Every result gets a 0–100 match score (mood, genre, theme, demographic, constraints, popularity, rating, entity signals) with a collapsible "Why?" explanation.
- **AI Search Intelligence panel** — Live view of what the parser understood and which APIs were queried, collapsible after the search completes.
- **Circuit breaker for MangaDex** — After 2 consecutive failures, MangaDex is skipped for the rest of the session instead of retried on every card.
- **Landing page rows (Trending Today / Hidden Gems)** — Always-populated content on first visit. Fully isolated in `js/landing/`.

## Project structure

```text
mymanga/
├── index.html
├── package.json
├── queue.txt                     # tags awaiting the harvester
├── css/
│   ├── style.css
│   ├── cards.css
│   ├── detail.css
│   ├── menu.css                  # Slide-out drawer & theme styling
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
│   ├── menuDrawer.js             # slide-out menu and theme toggle logic
│   ├── moods.js                  # 50-mood grid, rotation, 2-mood blending logic
│   ├── renderer.js               # card HTML rendering and UI event handlers
│   ├── resultNormalizer.js       # unifies each API's response shape
│   ├── mangaProfiles.js          # per-title mood vectors (Firestore-cached)
│   ├── favorites.js              # local + Firestore favorites list
│   ├── firebase.js               # Firebase init + cache helpers
│   ├── theme.js                  # dynamic color variables per selected mood
│   ├── config.js, utils.js
│   ├── anilist.js, jikan.js, kitsu.js, mangadex.js   # per-source API adapters
│   ├── clean_queue.js            # CLI: turns a messy paste into queue.txt
│   ├── landing/                  # isolated landing-page rows feature (Trending Today / Hidden Gems)
│   │   ├── fetch.js              # data only — AniList queries + Firebase caching
│   │   ├── render.js             # DOM only — turns data into card HTML
│   │   ├── carousel.js           # auto-scroll animation logic
│   │   ├── styles.css            # visual only — scoped, self-injected
│   │   ├── index.js              # wiring only — the single integration point with search.js
│   │   ├── README.md             # diagnosis map
│   │   └── IMPLEMENTATION_GUIDE.md
│   └── parser/
│       ├── pipeline.js           # buildIntent(): text -> MangaIntent
│       ├── searchPlanner.js      # MangaIntent -> flat SearchPlan
│       ├── recommendationScorer.js  # scores + ranks results
│       ├── moodEngine.js, rules.js, ruleEngine.js, genreMapper.js, synonyms.js, normalize.js
│       ├── intentSchema.js       # MangaIntent class
│       ├── dictionary.js         # merges properties.js + harvested_knowledge.js
│       └── dictionary/
│           ├── properties.js             # hand-curated concept data
│           ├── harvested_knowledge.js    # auto-harvested concept data
│           ├── harvester.js, HarvesterAPI.js   # Node CLI that builds harvested_knowledge.js
│           ├── entityRelations.js, shikimoriClient.js, mangaUpdatesClient.js
│           ├── MoodConfig.js, upgrade.js, backfillMoodWeights.js, reweightProperties.js
│           └── synopsisAnalyzer.js, lexicon.js
└── .github/workflows/
    ├── harvest.yml                # scheduled run of harvester.js
    └── clean-queue.yml            # scheduled run of clean_queue.js

```
## How a search works
 1. **Input** — Typed text opens the dedicated Search Results page (js/searchResultsPage.js), which calls triggerSearch. A mood/preset button, quick filter chip, or Reroll renders straight into the homepage's #community-grid via triggerPresetSearch/triggerQuickFilter/triggerSearch.
 2. **Intent** — Typed text goes through parser/pipeline.js's buildIntent(): normalize → detect negations → extract hard filters (status/sort/max chapters) → apply synonyms → detect moods & tone → map moods to genres/themes/demographics → apply reasoning rules → produce a MangaIntent. Preset buttons skip this and build a minimal intent directly from the button's genre list.
 3. **Plan** — parser/searchPlanner.js flattens the intent (or genre list) into a SearchPlan: primary genres, secondary themes, excluded genres/themes, filters, and API order.
 4. **Waterfall** — search.js's runSearch() tries AniList first (with a cache check via Firestore), then Jikan, then Kitsu, then MangaDex, stopping as soon as one tier returns results.
 5. **Normalize** — Each adapter's raw response is converted to a common shape by resultNormalizer.js.
 6. **Score** — parser/recommendationScorer.js scores every result against the intent (mood similarity via mangaProfiles.js, genre/theme overlap, constraints, popularity, rating, entity tracking) and sorts by match score.
 7. **Render** — renderer.js draws each card's HTML. For a typed search, searchResultsPage.js then re-parents those freshly-rendered card nodes out of #community-grid onto its own page grid (moved, not cloned), so nothing is left duplicated on the homepage underneath. "Next Page" uses appendMode, which skips the grid-clear/skeleton step and appends instead of replacing.
## Landing page rows & Top Picks
The landing page ensures the user never sees a blank screen:
 * **Trending Today / Hidden Gems**: Two always-populated rows on first visit. Fully isolated in js/landing/. Integration is a single line (import './landing/index.js';) in search.js.
 * **Today's Top Picks**: js/topPicks.js automatically fills the primary #community-grid with a curated, high-rated fallback search. Cached on a 12-hour deterministic window to save API calls while keeping the UI fresh.
## Key files at a glance
| Task | File | Entry point |
|---|---|---|
| Change API call order | search.js | runSearch() |
| Fix/tweak the Search Results page | searchResultsPage.js, css/results.css | openSearchResultsPage(), loadNextPage() |
| Change Slide-out Menu / Themes | menuDrawer.js, css/menu.css | openMenu(), cycleTheme() |
| Adjust Manga Detail view & Synopsis | mangaDetail.js, css/detail.css | openMangaDetail(), toggleSynopsis() |
| Adjust My List / Recommendations | myListPage.js, css/mylist.css | openMyListPage() |
| Tweak the Mood Mixer Page | mixerPage.js, css/mixer.css | openMixerPage() |
| Add/adjust scoring weights | parser/recommendationScorer.js | WEIGHTS, scoreOne() |
| Add a new genre/mood button | moods.js | allMoods array |
| Change how text queries are parsed | parser/pipeline.js | buildIntent() |
```

---

### Part 2
Paste this second half directly below Part 1:

```markdown
## Notable design decisions

- **Overlay Architecture:** The app avoids heavy routing libraries in favor of a clean, performant fixed-overlay pattern toggled by CSS classes (`detail-open`, `mixer-open`, `mylist-open`, `search-results-open`, `menu-open`).
- **MangaDex circuit breaker:** `mangadex.js` tracks consecutive failures in a session-scoped variable. After 2, MangaDex is skipped for the rest of the tab's life rather than retried on every card.
- **Silent-failure waterfall:** Every API adapter catches its own errors and returns `[]` rather than throwing, so one down API doesn't break the whole search.
- **Mood vectors, not just genre overlap:** `mangaProfiles.js` computes and caches a per-title "mood atom" vector (exciting, dark, wholesome, etc.) from its genres/themes, compared via cosine similarity against the user's mood profile.
- **Search Results page reuses the pipeline:** `searchResultsPage.js` has no NLU/scoring logic of its own. It calls `search.js`'s real `triggerSearch()` and re-parents the rendered DOM nodes onto its own grid.
- **Landing rows are folder-isolated on purpose:** unlike the rest of the app, `js/landing/` is a self-contained feature module with exactly one integration point and one HTML mount point.

## Running locally

This is a static frontend (`index.html` + ES modules) — no build step required for the app itself. Serve the folder with any static file server and open it in a browser.

The `package.json` dependencies (`axios`, `xml2js`, `afinn-165`) are only used by the Node-based harvester/queue tooling under `js/parser/dictionary/`, not by the browser app:

```bash
npm install
node js/clean_queue.js raw_paste.txt queue.txt   # turn a messy paste into a clean tag queue
node js/parser/dictionary/harvester.js           # harvest concept data for tags in queue.txt

```
Both also run on a schedule via .github/workflows/harvest.yml and clean-queue.yml.
## Known limitations
 * popularity values are not comparable across sources — each API uses a different base. Cross-source comparisons are normalized per-batch in the scorer, not treated as a global scale.
 * Kitsu's API has no clean "exclude category" filter, so excludedGenres isn't enforced for Kitsu results (a real API limitation, not an oversight).
 * MangaDex has no cheap popularity field on the search endpoint (would require a separate /statistics call per title), so popularity is always null for MangaDex results.
 * The landing page's Hidden Gems popularity ceiling (popularity_lesser) is a loose default, not tuned against real traffic yet — revisit once you have actual popularity distribution data.
## Debugging notes: silent import-chain failures
main.js loads search.js with a dynamic import() wrapped in try/catch, and logs any failure as "DEBUG - Search Load Failure:" in the console. This only catches errors that actually throw during module evaluation — it does not guarantee something will show in the console, especially on mobile dev tools (e.g. Eruda), which can filter or miss module-load errors entirely.
search.js has a long static import chain (search.js → recommendationScorer.js → dictionary.js → dictionary/properties.js, etc.). A SyntaxError anywhere in that chain — even in a file several hops deep that search.js never directly touches — is fatal to the whole chain and can look identical to a "silently unresolved" bug (diagnostics show Search: MISSING, no console output, no thrown error visible).
When Search (or any feature wired through a static import chain) is MISSING with a clean console: don't assume it's a logic/runtime issue. Check every file in the import chain for parse errors first (node --check on each, or trace the chain manually), starting from the deepest imports and working back up, before debugging scoring/matching logic.
```

```


