MangaMood 🔮
MangaMood is a mood-based manga discovery app. Instead of searching by title, you describe how you want to feel ("something that will make me cry", "chaotic and funny") or tap a mood button, and it aggregates results across multiple manga APIs, ranks them by how well they match, and explains why.
Live example flow: type a vibe → NLU pipeline turns it into structured intent → results are fetched from a tiered API waterfall → each result is scored against your intent → ranked cards render with a "Why?" breakdown.
Features
Natural-language mood search — "I want something that will make me cry" gets parsed into genres, themes, tone, and intensity.
50-mood quick-select grid with a rotating 3-button preview, bypassing the NLU parser entirely for speed and reliability.
Multi-source API waterfall — AniList → Jikan → Kitsu → MangaDex, each tier only queried if the previous one returns nothing.
Recommendation scoring — every result gets a 0–100 match score (mood, genre, theme, demographic, constraints, popularity, rating, entity signals) with a collapsible "Why?" explanation.
Favorites / My List — stored locally and mirrored to Firestore per-device, so it survives a cleared cache.
AI Search Intelligence panel — live view of what the parser understood and which APIs were queried, collapsible after the search completes.
Circuit breaker for MangaDex — after 2 consecutive failures, MangaDex is skipped for the rest of the session instead of retried on every card.
Project structure
mymanga/
├── index.html
├── package.json
├── queue.txt                  # tags awaiting the harvester (see below)
├── css/
│   ├── style.css
│   └── cards.css
├── js/
│   ├── main.js                 # app bootstrap — binds everything to window
│   ├── search.js                # search orchestration + API waterfall
│   ├── moods.js                 # 50-mood grid, rotation, click routing
│   ├── renderer.js               # card rendering, favorites button, "Why?" panel
│   ├── resultNormalizer.js       # unifies each API's response shape
│   ├── mangaProfiles.js          # per-title mood vectors (Firestore-cached)
│   ├── favorites.js              # local + Firestore favorites list
│   ├── firebase.js               # Firebase init + cache helpers
│   ├── theme.js                  # background color per selected mood
│   ├── config.js, utils.js
│   ├── anilist.js, jikan.js, kitsu.js, mangadex.js   # per-source API adapters
│   ├── clean_queue.js            # CLI: turns a messy paste into queue.txt
│   └── parser/
│       ├── pipeline.js           # buildIntent(): text -> MangaIntent
│       ├── searchPlanner.js      # MangaIntent -> flat SearchPlan
│       ├── recommendationScorer.js  # scores + ranks results
│       ├── moodEngine.js, rules.js, ruleEngine.js, genreMapper.js, synonyms.js, normalize.js
│       ├── intentSchema.js       # MangaIntent class
│       ├── dictionary.js         # merges properties.js + harvested_knowledge.js
│       └── dictionary/
│           ├── properties.js         # hand-curated concept data (large, generated-shape file)
│           ├── harvested_knowledge.js  # auto-harvested concept data (generated, may not exist locally)
│           ├── harvester.js, HarvesterAPI.js  # Node CLI that builds harvested_knowledge.js
│           ├── entityRelations.js, shikimoriClient.js, mangaUpdatesClient.js
│           ├── MoodConfig.js, upgrade.js, backfillMoodWeights.js, reweightProperties.js
│           └── synopsisAnalyzer.js, lexicon.js
└── .github/workflows/
    ├── harvest.yml        # scheduled run of harvester.js
    └── clean-queue.yml    # scheduled run of clean_queue.js
How a search works
Input — typed text (triggerSearch) or a mood/preset button (triggerPresetSearch).
Intent — typed text goes through parser/pipeline.js's buildIntent(): normalize → detect negations → extract hard filters (status/sort/max chapters) → apply synonyms → detect moods & tone → map moods to genres/themes/demographics → apply reasoning rules → produce a MangaIntent. Preset buttons skip all of this and build a minimal intent directly from the button's genre list.
Plan — parser/searchPlanner.js flattens the intent (or genre list) into a SearchPlan: primary genres, secondary themes, excluded genres/themes, filters, and API order.
Waterfall — search.js's runSearch() tries AniList first (with a cache check via Firestore), then Jikan, then Kitsu, then MangaDex, stopping as soon as one tier returns results.
Normalize — each adapter's raw response is converted to a common shape by resultNormalizer.js.
Score — parser/recommendationScorer.js scores every result against the intent (mood similarity via mangaProfiles.js, genre/theme overlap, constraints, popularity, rating) and sorts by match score.
Render — renderer.js draws each card, including the score badge and the collapsible "Why?" match breakdown.
Key files at a glance
Task
File
Entry point
Change API call order
search.js
runSearch()
Add/adjust scoring weights
parser/recommendationScorer.js
WEIGHTS, scoreOne()
Add a new genre/mood button
moods.js
allMoods array
Change how text queries are parsed
parser/pipeline.js
buildIntent()
Fix a rendering/grid bug
renderer.js or main.js
renderMangaCard()
Add a new mood concept
parser/dictionary/properties.js (curated) or run the harvester
—
Data files: properties.js and harvested_knowledge.js
These two files hold the "concept dictionary" (mood/trope → genres, themes, demographics, tone, intensity). properties.js is hand-curated; harvested_knowledge.js is generated by js/parser/dictionary/harvester.js from queue.txt and may not exist in a fresh checkout — search.js falls back to properties.js alone if it's missing.
They're large, repetitive JSON-shaped data files with no logic in them. If you're debugging how scoring works, look at recommendationScorer.js; if you're debugging what a concept maps to, these are the files, but treat them as generated data rather than hand-editing — use harvester.js (via queue.txt) or reweightProperties.js / backfillMoodWeights.js for bulk changes instead of manual edits.
Notable design decisions
Preset vs. typed search: mood buttons call triggerPresetSearch(), which builds a SearchPlan directly from a fixed genre list — no NLU parsing, no ambiguity, no failure mode tied to the concept dictionary.
MangaDex circuit breaker: mangadex.js tracks consecutive failures in a session-scoped variable. After 2, MangaDex is skipped for the rest of the tab's life rather than retried on every card (avoids repeated multi-second timeouts).
Only AniList results are cached: search.js writes to Firestore only when dataSource === "anilist", keeping the cache small and consistent.
Silent-failure waterfall: every API adapter catches its own errors and returns [] rather than throwing, so one down API doesn't break the whole search.
Mood vectors, not just genre overlap: mangaProfiles.js computes and caches a per-title "mood atom" vector (exciting, dark, wholesome, etc.) from its genres/themes, compared via cosine similarity against the user's mood profile — this is the primary signal in scoring, with plain genre/theme overlap as a fallback for titles with no cached profile yet.
Running locally
This is a static frontend (index.html + ES modules) — no build step required for the app itself. Serve the folder with any static file server and open it in a browser.
The package.json dependencies (axios, xml2js, afinn-165) are only used by the Node-based harvester/queue tooling under js/parser/dictionary/, not by the browser app:
npm install
node js/clean_queue.js raw_paste.txt queue.txt   # turn a messy paste into a clean tag queue
node js/parser/dictionary/harvester.js            # harvest concept data for tags in queue.txt
Both also run on a schedule via .github/workflows/harvest.yml and clean-queue.yml.
Known limitations
popularity values are not comparable across sources — each API uses a different base. Cross-source comparisons are normalized per-batch in the scorer, not treated as a global scale.
Kitsu's API has no clean "exclude category" filter, so excludedGenres isn't enforced for Kitsu results (a real API limitation, not an oversight).
MangaDex has no cheap popularity field on the search endpoint (would require a separate /statistics call per title), so popularity is always null for MangaDex results.
