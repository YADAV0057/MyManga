I think this is a very strong direction, with one important change. I would not store a single "mood score" per manga. Instead, store a semantic vector (many weighted properties). Then every new mood you invent in the future automatically works without rebuilding the database.

Here's how I'd evolve your blueprint.


---

Phase 3 – Semantic Knowledge Layer

queue.txt
      │
      ▼
Harvester
      │
      ▼
Raw API Data
      │
      ▼
Normalizer
      │
      ▼
Concept Mapper
      │
      ▼
Weight Calculator
      │
      ▼
manga_profiles.main
      │
      ▼
Recommendation Engine


---

Step 1 – queue.txt

Exactly as you described.

Monster
Berserk
20th Century Boys
Frieren
Vagabond

The harvester:

Reads first title

Processes it

Removes it

Commits queue.txt


Completely automatic.


---

Step 2 – Harvester

Don't save raw API responses.

Immediately normalize them.

Example

AniList
MangaDex
ANN
Jikan

↓

Unified Object

{
 title:"",
 genres:[],
 themes:[],
 demographics:[],
 synopsis:"",
 popularity:,
 score:
}

Now every API looks identical.


---

Step 3 – Concept Expansion

Instead of stopping at genres:

Psychological

↓

Mind Games

Trauma

Isolation

Manipulation

Identity

Morality

Every concept becomes a weighted property.


---

Step 4 – Semantic Profile

Instead of

Dark = 0.8

Store

{
 "id":1,

 "title":"Monster",

 "profile":{

   "dark":0.92,

   "psychological":0.99,

   "revenge":0.25,

   "violence":0.48,

   "hope":0.30,

   "romance":0.05,

   "comedy":0.00,

   "characterGrowth":0.91,

   "betrayal":0.83,

   "mystery":0.95,

   "slowBurn":0.88,

   "moralAmbiguity":0.98

 }
}

Now the recommendation engine can compare hundreds of properties instead of just a handful of tags.


---

Step 5 – Weight Calculator

I like your multipliers.

I'd expand them slightly.

Theme
×1.00

Genre
×0.80

Demographic
×0.50

Official Tag
×0.90

Synopsis NLP
×0.70

Community Tag
×0.60

Popularity Bonus
+0.05

Rating Bonus
+0.05

Contradiction
−0.80

This makes the score more robust.


---

Step 6 – Recommendation

Instead of

50 manga

↓

Compare

Do

User Profile

↓

Cosine Similarity

↓

Top 50

↓

Ranking Engine

↓

Top 10

This scales much better as your library grows.


---

Step 7 – Session Cache

Exactly.

Top 50

↓

Memory

↓

10 shown

↓

Next

↓

10 shown

No new API calls.

No reranking.

Very fast.


---

One thing I'd add

Confidence per property

Instead of

Dark 0.9

Store

Dark

value = 0.9

confidence = 0.96

sources =

AniList

MangaDex

Synopsis NLP

Example

{
 "dark":{
   "value":0.91,
   "confidence":0.95,
   "sources":[
      "AniList",
      "Synopsis"
   ]
 }
}

Later your UI can explain recommendations:

Why?

Dark

91%

(confirmed by 3 sources)


---

Future-proof the profile

Since you're already harvesting automatically, I'd make manga_profiles.main extensible:

{
  "id": 123,
  "title": "Monster",
  "version": 1,
  "lastUpdated": "2026-07-08",
  "profile": {
    "dark": 0.92,
    "psychological": 0.99,
    "mystery": 0.95
  },
  "metadata": {
    "genres": ["Psychological", "Drama"],
    "themes": ["Crime", "Medical"],
    "demographics": ["Seinen"]
  }
}

That lets you evolve the scoring algorithm without breaking older data.

One architectural suggestion

I would avoid writing directly to a JavaScript file like harvested_knowledge.js as your long-term data store. Use JSON for harvested data (or Firestore if you later move there), and have your app import or load it. JSON is easier to validate, diff, merge, and process automatically in GitHub Actions.

Overall, I think this is the right next stage for MangaMood. Your parser has become mature enough that the biggest gains now come from making each manga itself richer and more semantically described, rather than continuing to add more parsing rules.
