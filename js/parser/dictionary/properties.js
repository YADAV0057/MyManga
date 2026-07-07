export const CONCEPT_PROPERTIES = {
    "revenge": {
        "id": "revenge",
        "aliases": [
            "revenge",
            "vengeance",
            "payback",
            "retaliation",
            "get even",
            "retribution",
            "avenge"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.95
            },
            {
                "name": "Psychological",
                "weight": 0.9
            },
            {
                "name": "Drama",
                "weight": 0.85
            }
        ],
        "themes": [
            {
                "name": "Revenge",
                "weight": 1
            },
            {
                "name": "Betrayal",
                "weight": 0.8
            },
            {
                "name": "Villainess",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "dark",
            "survival",
            "antihero"
        ],
        "excludes": {
            "genres": [
                "Comedy",
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei",
                "Fluff",
                "Gag"
            ]
        },
        "tone": "negative",
        "intensity": 0.9
    },
    "horror": {
        "id": "horror",
        "aliases": [
            "gore",
            "blood",
            "violent",
            "terrifying",
            "creepy",
            "nightmare",
            "fear",
            "horror",
            "scary",
            "spooky"
        ],
        "genres": [
            {
                "name": "Horror",
                "weight": 1
            },
            {
                "name": "Psychological",
                "weight": 0.85
            },
            {
                "name": "Mystery",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Monsters",
                "weight": 0.9
            },
            {
                "name": "Survival",
                "weight": 0.85
            },
            {
                "name": "Gore",
                "weight": 0.95
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "dark",
            "mystery",
            "tragedy"
        ],
        "excludes": {
            "genres": [
                "Comedy",
                "Romance",
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei",
                "SchoolLife",
                "FoundFamily"
            ]
        },
        "tone": "negative",
        "intensity": 1
    },
    "healing": {
        "id": "healing",
        "aliases": [
            "healing",
            "comfort",
            "comforting",
            "cozy",
            "warm",
            "heartwarming",
            "feel good",
            "wholesome",
            "soft",
            "gentle",
            "peaceful",
            "relaxing"
        ],
        "genres": [
            {
                "name": "SliceOfLife",
                "weight": 1
            },
            {
                "name": "Comedy",
                "weight": 0.7
            },
            {
                "name": "Romance",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Iyashikei",
                "weight": 1
            },
            {
                "name": "FoundFamily",
                "weight": 0.85
            }
        ],
        "demographics": [
            {
                "name": "Shoujo",
                "weight": 0.6
            },
            {
                "name": "Josei",
                "weight": 0.5
            }
        ],
        "boosts": [
            "happy",
            "romance"
        ],
        "excludes": {
            "genres": [
                "Horror",
                "Psychological",
                "Tragedy",
                "Action"
            ],
            "themes": [
                "Survival",
                "Gore",
                "Revenge",
                "Betrayal"
            ]
        },
        "tone": "positive",
        "intensity": 0.2
    },
    "romance": {
        "id": "romance",
        "aliases": [
            "love",
            "relationship",
            "dating",
            "girlfriend",
            "boyfriend",
            "romance",
            "romantic",
            "couple",
            "kiss",
            "crush"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 1
            },
            {
                "name": "Drama",
                "weight": 0.6
            },
            {
                "name": "SliceOfLife",
                "weight": 0.5
            }
        ],
        "themes": [
            {
                "name": "SchoolLife",
                "weight": 0.7
            },
            {
                "name": "LoveTriangle",
                "weight": 0.6
            },
            {
                "name": "FirstLove",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Shoujo",
                "weight": 0.9
            },
            {
                "name": "Josei",
                "weight": 0.8
            }
        ],
        "boosts": [
            "healing",
            "drama",
            "happy"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Survival",
                "Gore"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "tragedy": {
        "id": "tragedy",
        "aliases": [
            "cry",
            "sad",
            "depressing",
            "tragedy",
            "angst",
            "bittersweet",
            "tearjerker",
            "heartbreak",
            "devastating"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 0.95
            },
            {
                "name": "Tragedy",
                "weight": 0.9
            },
            {
                "name": "Psychological",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Loss",
                "weight": 0.85
            },
            {
                "name": "CharacterGrowth",
                "weight": 0.7
            }
        ],
        "demographics": [],
        "boosts": [
            "dark",
            "romance"
        ],
        "excludes": {
            "genres": [
                "Comedy",
                "Parody",
                "Ecchi"
            ],
            "themes": [
                "Gag",
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.9
    },
    "action": {
        "id": "action",
        "aliases": [
            "action",
            "fights",
            "fighting",
            "battles",
            "combat",
            "brawl",
            "epic fights",
            "beat em up"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 1
            },
            {
                "name": "Adventure",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "MartialArts",
                "weight": 0.6
            },
            {
                "name": "SuperPower",
                "weight": 0.5
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.9
            },
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "martial_arts",
            "superpower",
            "military"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.8
    },
    "martial_arts": {
        "id": "martial_arts",
        "aliases": [
            "martial arts",
            "kung fu",
            "karate",
            "taekwondo",
            "murim",
            "cultivation",
            "wuxia",
            "dojo",
            "hand to hand"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 1
            },
            {
                "name": "Sports",
                "weight": 0.4
            }
        ],
        "themes": [
            {
                "name": "MartialArts",
                "weight": 1
            },
            {
                "name": "Cultivation",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.8
            },
            {
                "name": "Seinen",
                "weight": 0.6
            }
        ],
        "boosts": [
            "action",
            "training",
            "weak_to_strong"
        ],
        "excludes": {
            "genres": [
                "Romance"
            ],
            "themes": [
                "MagicalSexShift"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "military": {
        "id": "military",
        "aliases": [
            "military",
            "war",
            "army",
            "soldier",
            "tactics",
            "commander",
            "battlefield",
            "warfare"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.9
            },
            {
                "name": "Drama",
                "weight": 0.8
            },
            {
                "name": "SciFi",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Military",
                "weight": 1
            },
            {
                "name": "Survival",
                "weight": 0.6
            },
            {
                "name": "Politics",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "action",
            "dark",
            "mecha"
        ],
        "excludes": {
            "genres": [
                "Comedy",
                "SliceOfLife"
            ],
            "themes": [
                "SchoolLife",
                "Gag"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "assassin": {
        "id": "assassin",
        "aliases": [
            "assassin",
            "hitman",
            "ninja",
            "stealth",
            "murderer",
            "killing",
            "mercenary"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.9
            },
            {
                "name": "Mystery",
                "weight": 0.5
            },
            {
                "name": "Thriller",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Assassins",
                "weight": 1
            },
            {
                "name": "Crime",
                "weight": 0.6
            },
            {
                "name": "Antihero",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            },
            {
                "name": "Shounen",
                "weight": 0.5
            }
        ],
        "boosts": [
            "dark",
            "revenge",
            "underworld"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "fantasy": {
        "id": "fantasy",
        "aliases": [
            "fantasy",
            "magic",
            "sword and sorcery",
            "mythical",
            "elves",
            "witches",
            "wizards",
            "spells",
            "mana"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 1
            },
            {
                "name": "Adventure",
                "weight": 0.9
            }
        ],
        "themes": [
            {
                "name": "Magic",
                "weight": 0.95
            },
            {
                "name": "Demons",
                "weight": 0.5
            },
            {
                "name": "Monsters",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "isekai",
            "magic_school",
            "adventure"
        ],
        "excludes": {
            "genres": [
                "SciFi",
                "Sports"
            ],
            "themes": [
                "Cyberpunk",
                "Space"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "magic_school": {
        "id": "magic_school",
        "aliases": [
            "magic school",
            "academy",
            "wizard school",
            "magic academy",
            "hogwarts",
            "magic students"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 1
            },
            {
                "name": "SliceOfLife",
                "weight": 0.4
            }
        ],
        "themes": [
            {
                "name": "SchoolLife",
                "weight": 1
            },
            {
                "name": "Magic",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.8
            },
            {
                "name": "Shoujo",
                "weight": 0.6
            }
        ],
        "boosts": [
            "fantasy",
            "harem",
            "op_mc"
        ],
        "excludes": {
            "genres": [
                "Horror",
                "Thriller"
            ],
            "themes": [
                "Space",
                "Military"
            ]
        },
        "tone": "positive",
        "intensity": 0.4
    },
    "demons": {
        "id": "demons",
        "aliases": [
            "demon",
            "devil",
            "demon lord",
            "satan",
            "lucifer",
            "yokai",
            "hell"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 0.9
            },
            {
                "name": "Supernatural",
                "weight": 0.8
            },
            {
                "name": "Action",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Demons",
                "weight": 1
            },
            {
                "name": "Monsters",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.8
            },
            {
                "name": "Seinen",
                "weight": 0.6
            }
        ],
        "boosts": [
            "fantasy",
            "dark",
            "supernatural"
        ],
        "excludes": {
            "genres": [
                "SciFi"
            ],
            "themes": [
                "Mecha"
            ]
        },
        "tone": "mixed",
        "intensity": 0.6
    },
    "isekai": {
        "id": "isekai",
        "aliases": [
            "isekai",
            "reincarnated",
            "another world",
            "transmigrated",
            "portal fantasy",
            "summoned",
            "truck-kun"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 1
            },
            {
                "name": "Adventure",
                "weight": 0.9
            }
        ],
        "themes": [
            {
                "name": "Isekai",
                "weight": 1
            },
            {
                "name": "Reincarnation",
                "weight": 0.95
            },
            {
                "name": "Magic",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.9
            },
            {
                "name": "Shoujo",
                "weight": 0.4
            }
        ],
        "boosts": [
            "fantasy",
            "system",
            "op_mc"
        ],
        "excludes": {
            "genres": [
                "SciFi",
                "Sports"
            ],
            "themes": [
                "Cyberpunk"
            ]
        },
        "tone": "positive",
        "intensity": 0.5
    },
    "system": {
        "id": "system",
        "aliases": [
            "system",
            "leveling",
            "litrpg",
            "stats",
            "skills",
            "status screen",
            "player",
            "game elements",
            "quests"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.8
            },
            {
                "name": "Fantasy",
                "weight": 0.7
            },
            {
                "name": "SciFi",
                "weight": 0.4
            }
        ],
        "themes": [
            {
                "name": "VideoGames",
                "weight": 0.9
            },
            {
                "name": "Survival",
                "weight": 0.5
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "isekai",
            "op_mc",
            "weak_to_strong",
            "dungeon"
        ],
        "excludes": {
            "genres": [
                "Historical",
                "Romance"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "op_mc": {
        "id": "op_mc",
        "aliases": [
            "overpowered",
            "op mc",
            "too strong",
            "badass mc",
            "undefeatable",
            "bada$$",
            "strongest",
            "god tier"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.9
            },
            {
                "name": "Fantasy",
                "weight": 0.8
            }
        ],
        "themes": [],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.95
            },
            {
                "name": "Seinen",
                "weight": 0.5
            }
        ],
        "boosts": [
            "action",
            "system",
            "isekai"
        ],
        "excludes": {
            "genres": [
                "Drama",
                "Tragedy"
            ],
            "themes": [
                "WeakToStrong",
                "Underdog"
            ]
        },
        "tone": "positive",
        "intensity": 0.8
    },
    "dungeon": {
        "id": "dungeon",
        "aliases": [
            "dungeon",
            "tower",
            "labyrinth",
            "raids",
            "dungeon diving",
            "hunters",
            "guild"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.9
            },
            {
                "name": "Adventure",
                "weight": 0.9
            },
            {
                "name": "Fantasy",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Monsters",
                "weight": 0.8
            },
            {
                "name": "Survival",
                "weight": 0.5
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "system",
            "action",
            "fantasy"
        ],
        "excludes": {
            "genres": [
                "Romance",
                "SliceOfLife"
            ],
            "themes": [
                "SchoolLife"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "mystery": {
        "id": "mystery",
        "aliases": [
            "mystery",
            "whodunit",
            "clues",
            "investigation",
            "puzzle",
            "enigma",
            "suspense"
        ],
        "genres": [
            {
                "name": "Mystery",
                "weight": 1
            },
            {
                "name": "Thriller",
                "weight": 0.7
            },
            {
                "name": "Psychological",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Detective",
                "weight": 0.7
            },
            {
                "name": "Crime",
                "weight": 0.5
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            },
            {
                "name": "Shounen",
                "weight": 0.5
            }
        ],
        "boosts": [
            "detective",
            "psychological",
            "thriller"
        ],
        "excludes": {
            "genres": [
                "Comedy",
                "Parody"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "mixed",
        "intensity": 0.6
    },
    "comedy": {
        "id": "comedy",
        "aliases": [
            "comedy",
            "funny",
            "hilarious",
            "laugh",
            "lmao",
            "humor",
            "joke",
            "goofy",
            "silly"
        ],
        "genres": [
            {
                "name": "Comedy",
                "weight": 1
            },
            {
                "name": "SliceOfLife",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Gag",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.6
            }
        ],
        "boosts": [
            "parody",
            "happy",
            "healing"
        ],
        "excludes": {
            "genres": [
                "Horror",
                "Tragedy",
                "Psychological"
            ],
            "themes": [
                "Gore",
                "Survival",
                "DeathGame"
            ]
        },
        "tone": "positive",
        "intensity": 0.4
    },
    "parody": {
        "id": "parody",
        "aliases": [
            "parody",
            "satire",
            "spoof",
            "mocking",
            "meta",
            "4th wall"
        ],
        "genres": [
            {
                "name": "Comedy",
                "weight": 1
            },
            {
                "name": "Parody",
                "weight": 1
            }
        ],
        "themes": [
            {
                "name": "Gag",
                "weight": 0.8
            }
        ],
        "demographics": [],
        "boosts": [
            "comedy"
        ],
        "excludes": {
            "genres": [
                "Drama",
                "Tragedy",
                "Horror"
            ],
            "themes": [
                "Serious"
            ]
        },
        "tone": "positive",
        "intensity": 0.5
    },
    "enemies_to_lovers": {
        "id": "enemies_to_lovers",
        "aliases": [
            "enemies to lovers",
            "hate to love",
            "rivals to lovers",
            "bickering couple"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 1
            },
            {
                "name": "Comedy",
                "weight": 0.5
            },
            {
                "name": "Drama",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "SchoolLife",
                "weight": 0.4
            }
        ],
        "demographics": [
            {
                "name": "Shoujo",
                "weight": 0.8
            },
            {
                "name": "Josei",
                "weight": 0.6
            }
        ],
        "boosts": [
            "romance",
            "drama"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Gore"
            ]
        },
        "tone": "mixed",
        "intensity": 0.6
    },
    "harem": {
        "id": "harem",
        "aliases": [
            "harem",
            "multiple girls",
            "many wives",
            "surrounded by girls"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 0.8
            },
            {
                "name": "Comedy",
                "weight": 0.7
            },
            {
                "name": "Ecchi",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Harem",
                "weight": 1
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.9
            },
            {
                "name": "Seinen",
                "weight": 0.6
            }
        ],
        "boosts": [
            "romance",
            "comedy",
            "isekai"
        ],
        "excludes": {
            "genres": [
                "Horror",
                "Tragedy"
            ],
            "themes": [
                "ReverseHarem",
                "Yaoi"
            ]
        },
        "tone": "positive",
        "intensity": 0.5
    },
    "villainess": {
        "id": "villainess",
        "aliases": [
            "villainess",
            "bad girl",
            "otome game villainess",
            "evil lady",
            "noble girl"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 0.9
            },
            {
                "name": "Romance",
                "weight": 0.8
            },
            {
                "name": "Drama",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Villainess",
                "weight": 1
            },
            {
                "name": "Reincarnation",
                "weight": 0.8
            },
            {
                "name": "Nobility",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Shoujo",
                "weight": 0.9
            },
            {
                "name": "Josei",
                "weight": 0.7
            }
        ],
        "boosts": [
            "romance",
            "reverse_harem",
            "isekai"
        ],
        "excludes": {
            "genres": [
                "SciFi",
                "Sports"
            ],
            "themes": [
                "Cyberpunk"
            ]
        },
        "tone": "mixed",
        "intensity": 0.6
    },
    "yuri": {
        "id": "yuri",
        "aliases": [
            "yuri",
            "gl",
            "girls love",
            "lesbian",
            "wlw",
            "shoujo ai"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 1
            },
            {
                "name": "GirlsLove",
                "weight": 1
            }
        ],
        "themes": [
            {
                "name": "SchoolLife",
                "weight": 0.6
            }
        ],
        "demographics": [],
        "boosts": [
            "romance",
            "healing",
            "drama"
        ],
        "excludes": {
            "genres": [
                "BoysLove"
            ],
            "themes": [
                "Harem",
                "ReverseHarem"
            ]
        },
        "tone": "positive",
        "intensity": 0.5
    },
    "death_game": {
        "id": "death_game",
        "aliases": [
            "death game",
            "survival game",
            "battle royale",
            "squid game",
            "killing game",
            "elimination"
        ],
        "genres": [
            {
                "name": "Psychological",
                "weight": 1
            },
            {
                "name": "Horror",
                "weight": 0.8
            },
            {
                "name": "Thriller",
                "weight": 0.9
            }
        ],
        "themes": [
            {
                "name": "Survival",
                "weight": 1
            },
            {
                "name": "DeathGame",
                "weight": 1
            },
            {
                "name": "Betrayal",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            },
            {
                "name": "Shounen",
                "weight": 0.5
            }
        ],
        "boosts": [
            "horror",
            "dark",
            "psychological"
        ],
        "excludes": {
            "genres": [
                "Comedy",
                "Romance",
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei",
                "Fluff"
            ]
        },
        "tone": "negative",
        "intensity": 1
    },
    "psychological": {
        "id": "psychological",
        "aliases": [
            "psychological",
            "mind games",
            "mindbreak",
            "manipulation",
            "sanity",
            "madness",
            "insane"
        ],
        "genres": [
            {
                "name": "Psychological",
                "weight": 1
            },
            {
                "name": "Thriller",
                "weight": 0.8
            },
            {
                "name": "Drama",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "MentalIllness",
                "weight": 0.6
            },
            {
                "name": "Betrayal",
                "weight": 0.5
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.95
            }
        ],
        "boosts": [
            "dark",
            "thriller",
            "mystery"
        ],
        "excludes": {
            "genres": [
                "Comedy",
                "SliceOfLife"
            ],
            "themes": [
                "Gag",
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.9
    },
    "cultivation": {
        "id": "cultivation",
        "aliases": [
            "cultivation",
            "qi",
            "immortal",
            "ascension",
            "dao",
            "sect",
            "dantian"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 0.9
            },
            {
                "name": "Action",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Cultivation",
                "weight": 1
            },
            {
                "name": "MartialArts",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.8
            },
            {
                "name": "Seinen",
                "weight": 0.6
            }
        ],
        "boosts": [
            "martial_arts",
            "fantasy",
            "weak_to_strong"
        ],
        "excludes": {
            "genres": [
                "SciFi",
                "Sports"
            ],
            "themes": [
                "Cyberpunk",
                "Space"
            ]
        },
        "tone": "positive",
        "intensity": 0.7
    },
    "post_apocalyptic": {
        "id": "post_apocalyptic",
        "aliases": [
            "apocalypse",
            "post-apocalyptic",
            "after the end",
            "ruined world",
            "collapse"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.8
            },
            {
                "name": "SciFi",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Survival",
                "weight": 1
            },
            {
                "name": "Dystopia",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "horror",
            "dystopia",
            "military"
        ],
        "excludes": {
            "genres": [
                "Comedy",
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.9
    },
    "detective": {
        "id": "detective",
        "aliases": [
            "detective",
            "police",
            "cop",
            "sleuth",
            "investigator",
            "noir"
        ],
        "genres": [
            {
                "name": "Mystery",
                "weight": 1
            },
            {
                "name": "Drama",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Detective",
                "weight": 1
            },
            {
                "name": "Police",
                "weight": 0.9
            },
            {
                "name": "Crime",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            },
            {
                "name": "Shounen",
                "weight": 0.6
            }
        ],
        "boosts": [
            "mystery",
            "thriller"
        ],
        "excludes": {
            "genres": [
                "Fantasy",
                "Isekai"
            ],
            "themes": [
                "Magic"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "nobility": {
        "id": "nobility",
        "aliases": [
            "nobility",
            "royal",
            "royalty",
            "king",
            "prince",
            "princess",
            "aristocrat",
            "empire"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 0.6
            },
            {
                "name": "Drama",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Nobility",
                "weight": 1
            },
            {
                "name": "Politics",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Shoujo",
                "weight": 0.7
            },
            {
                "name": "Josei",
                "weight": 0.7
            }
        ],
        "boosts": [
            "villainess",
            "historical",
            "romance"
        ],
        "excludes": {
            "genres": [
                "Sports"
            ],
            "themes": [
                "ModernLife"
            ]
        },
        "tone": "mixed",
        "intensity": 0.4
    },
    "survival": {
        "id": "survival",
        "aliases": [
            "survival",
            "stuck",
            "stranded",
            "last one standing",
            "hardship"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.7
            },
            {
                "name": "Psychological",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Survival",
                "weight": 1
            },
            {
                "name": "Dystopia",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "horror",
            "dystopia",
            "dark"
        ],
        "excludes": {
            "genres": [
                "Comedy",
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "mecha": {
        "id": "mecha",
        "aliases": [
            "mecha",
            "robot",
            "giant robot",
            "piloting",
            "mech",
            "gundam"
        ],
        "genres": [
            {
                "name": "SciFi",
                "weight": 0.9
            },
            {
                "name": "Action",
                "weight": 0.9
            },
            {
                "name": "Drama",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Mecha",
                "weight": 1
            },
            {
                "name": "Military",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.8
            },
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "scifi",
            "military",
            "action"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "school_life": {
        "id": "school_life",
        "aliases": [
            "school life",
            "high school",
            "academy",
            "student",
            "classmate",
            "school",
            "campus"
        ],
        "genres": [
            {
                "name": "SliceOfLife",
                "weight": 0.8
            },
            {
                "name": "Comedy",
                "weight": 0.6
            },
            {
                "name": "Romance",
                "weight": 0.5
            }
        ],
        "themes": [
            {
                "name": "SchoolLife",
                "weight": 1
            },
            {
                "name": "Friendship",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.7
            },
            {
                "name": "Shoujo",
                "weight": 0.7
            }
        ],
        "boosts": [
            "healing",
            "romance",
            "comedy"
        ],
        "excludes": {
            "genres": [
                "Horror",
                "Thriller"
            ],
            "themes": [
                "Survival",
                "Gore",
                "Military"
            ]
        },
        "tone": "positive",
        "intensity": 0.3
    },
    "office_work": {
        "id": "office_work",
        "aliases": [
            "office",
            "workplace",
            "salaryman",
            "career",
            "corporate",
            "company",
            "boss",
            "adult life"
        ],
        "genres": [
            {
                "name": "SliceOfLife",
                "weight": 0.9
            },
            {
                "name": "Romance",
                "weight": 0.7
            },
            {
                "name": "Drama",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "AdultLife",
                "weight": 1
            },
            {
                "name": "Workplace",
                "weight": 1
            }
        ],
        "demographics": [
            {
                "name": "Josei",
                "weight": 0.9
            },
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "romance",
            "healing"
        ],
        "excludes": {
            "genres": [
                "Fantasy",
                "Action"
            ],
            "themes": [
                "Magic",
                "Isekai"
            ]
        },
        "tone": "mixed",
        "intensity": 0.4
    },
    "delinquents": {
        "id": "delinquents",
        "aliases": [
            "delinquent",
            "gangster",
            "thug",
            "yankee",
            "bad boy",
            "school bully"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.7
            },
            {
                "name": "Comedy",
                "weight": 0.6
            },
            {
                "name": "Drama",
                "weight": 0.5
            }
        ],
        "themes": [
            {
                "name": "Delinquents",
                "weight": 1
            },
            {
                "name": "SchoolLife",
                "weight": 0.5
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.8
            },
            {
                "name": "Seinen",
                "weight": 0.6
            }
        ],
        "boosts": [
            "action",
            "enemies_to_lovers",
            "comedy"
        ],
        "excludes": {
            "genres": [
                "Fantasy"
            ],
            "themes": [
                "Magic"
            ]
        },
        "tone": "mixed",
        "intensity": 0.6
    },
    "sports_training": {
        "id": "sports_training",
        "aliases": [
            "training",
            "practice",
            "workout",
            "coaching",
            "getting stronger",
            "camp"
        ],
        "genres": [
            {
                "name": "Sports",
                "weight": 1
            },
            {
                "name": "Action",
                "weight": 0.5
            }
        ],
        "themes": [
            {
                "name": "CharacterGrowth",
                "weight": 0.9
            },
            {
                "name": "Teamwork",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 1
            }
        ],
        "boosts": [
            "sports",
            "martial_arts",
            "weak_to_strong"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Gore",
                "DeathGame"
            ]
        },
        "tone": "positive",
        "intensity": 0.5
    },
    "superpower": {
        "id": "superpower",
        "aliases": [
            "superpower",
            "ability",
            "gifted",
            "powers",
            "quirk",
            "esper"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.9
            },
            {
                "name": "Fantasy",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "SuperPower",
                "weight": 1
            },
            {
                "name": "Action",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "action",
            "dungeon",
            "op_mc"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife",
                "Sports"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "dystopia_politics": {
        "id": "dystopia_politics",
        "aliases": [
            "government",
            "uprising",
            "rebellion",
            "revolution",
            "dictatorship",
            "caste system"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 0.9
            },
            {
                "name": "Psychological",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Politics",
                "weight": 1
            },
            {
                "name": "Dystopia",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "dystopia",
            "military",
            "assassin"
        ],
        "excludes": {
            "genres": [
                "Comedy",
                "Romance"
            ],
            "themes": [
                "Gag",
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "cooking": {
        "id": "cooking",
        "aliases": [
            "cooking",
            "food",
            "chef",
            "restaurant",
            "culinary",
            "baking",
            "gourmet",
            "kitchen"
        ],
        "genres": [
            {
                "name": "SliceOfLife",
                "weight": 0.9
            },
            {
                "name": "Comedy",
                "weight": 0.5
            }
        ],
        "themes": [
            {
                "name": "Food",
                "weight": 1
            },
            {
                "name": "AdultLife",
                "weight": 0.4
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.6
            },
            {
                "name": "Josei",
                "weight": 0.6
            }
        ],
        "boosts": [
            "healing",
            "office_work"
        ],
        "excludes": {
            "genres": [
                "Horror",
                "Thriller"
            ],
            "themes": [
                "Gore",
                "Survival"
            ]
        },
        "tone": "positive",
        "intensity": 0.3
    },
    "trauma_recovery": {
        "id": "trauma_recovery",
        "aliases": [
            "trauma",
            "recovery",
            "healing from past",
            "overcoming",
            "moving on",
            "abuse",
            "ptsd"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 1
            },
            {
                "name": "Psychological",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "CharacterGrowth",
                "weight": 1
            },
            {
                "name": "Loss",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.7
            },
            {
                "name": "Josei",
                "weight": 0.7
            }
        ],
        "boosts": [
            "tragedy",
            "healing",
            "psychological"
        ],
        "excludes": {
            "genres": [
                "Comedy",
                "Ecchi"
            ],
            "themes": [
                "Gag",
                "Harem"
            ]
        },
        "tone": "negative",
        "intensity": 0.9
    },
    "supernatural_detective": {
        "id": "supernatural_detective",
        "aliases": [
            "supernatural mystery",
            "paranormal investigation",
            "ghost hunting"
        ],
        "genres": [
            {
                "name": "Supernatural",
                "weight": 0.9
            },
            {
                "name": "Mystery",
                "weight": 0.9
            }
        ],
        "themes": [
            {
                "name": "Ghosts",
                "weight": 0.8
            },
            {
                "name": "Detective",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "mystery",
            "supernatural",
            "horror"
        ],
        "excludes": {
            "genres": [
                "Sports",
                "Romance"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "adventure": {
        "id": "adventure",
        "aliases": [
            "adventure",
            "journey",
            "explore",
            "quest",
            "travel",
            "road trip"
        ],
        "genres": [
            {
                "name": "Adventure",
                "weight": 1
            },
            {
                "name": "Fantasy",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "CharacterGrowth",
                "weight": 0.6
            },
            {
                "name": "FoundFamily",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "fantasy",
            "isekai",
            "dungeon"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "SchoolLife"
            ]
        },
        "tone": "positive",
        "intensity": 0.5
    },
    "martial_arts_tournament": {
        "id": "martial_arts_tournament",
        "aliases": [
            "tournament arc",
            "fighting tournament",
            "arena battle",
            "championship fight"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 1
            },
            {
                "name": "Sports",
                "weight": 0.5
            }
        ],
        "themes": [
            {
                "name": "MartialArts",
                "weight": 0.9
            },
            {
                "name": "Teamwork",
                "weight": 0.5
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 1
            }
        ],
        "boosts": [
            "action",
            "martial_arts",
            "underdog"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei",
                "SchoolLife"
            ]
        },
        "tone": "mixed",
        "intensity": 0.8
    },
    "monster_girl": {
        "id": "monster_girl",
        "aliases": [
            "monster girl",
            "harpy",
            "lamia",
            "succubus",
            "non-human girlfriend"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 0.8
            },
            {
                "name": "Romance",
                "weight": 0.7
            },
            {
                "name": "Ecchi",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Monsters",
                "weight": 0.9
            },
            {
                "name": "Harem",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "fantasy",
            "romance",
            "comedy"
        ],
        "excludes": {
            "genres": [
                "Tragedy"
            ],
            "themes": [
                "Gore"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "body_horror": {
        "id": "body_horror",
        "aliases": [
            "body horror",
            "mutation",
            "transformation",
            "grotesque",
            "flesh",
            "distortion"
        ],
        "genres": [
            {
                "name": "Horror",
                "weight": 1
            },
            {
                "name": "Psychological",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Gore",
                "weight": 1
            },
            {
                "name": "Monsters",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "horror",
            "dark",
            "psychological"
        ],
        "excludes": {
            "genres": [
                "Comedy",
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei",
                "Fluff"
            ]
        },
        "tone": "negative",
        "intensity": 1
    },
    "stalker_thriller": {
        "id": "stalker_thriller",
        "aliases": [
            "stalker",
            "obsessive",
            "creepy admirer",
            "followed",
            "watched",
            "obsession"
        ],
        "genres": [
            {
                "name": "Thriller",
                "weight": 1
            },
            {
                "name": "Psychological",
                "weight": 0.9
            }
        ],
        "themes": [
            {
                "name": "Crime",
                "weight": 0.7
            },
            {
                "name": "Betrayal",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            },
            {
                "name": "Josei",
                "weight": 0.7
            }
        ],
        "boosts": [
            "horror",
            "dark",
            "mystery"
        ],
        "excludes": {
            "genres": [
                "Comedy",
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.9
    },
    "urban_legend": {
        "id": "urban_legend",
        "aliases": [
            "urban legend",
            "folklore",
            "haunted house",
            "curse",
            "myth"
        ],
        "genres": [
            {
                "name": "Horror",
                "weight": 1
            },
            {
                "name": "Supernatural",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Monsters",
                "weight": 0.7
            },
            {
                "name": "Ghosts",
                "weight": 1
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.6
            },
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "supernatural",
            "horror",
            "mystery"
        ],
        "excludes": {
            "genres": [
                "SciFi",
                "Sports"
            ],
            "themes": [
                "Space"
            ]
        },
        "tone": "negative",
        "intensity": 0.7
    },
    "survival_horror": {
        "id": "survival_horror",
        "aliases": [
            "survival horror",
            "trapped",
            "zombie",
            "outbreak",
            "apocalypse"
        ],
        "genres": [
            {
                "name": "Horror",
                "weight": 1
            },
            {
                "name": "Action",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Survival",
                "weight": 1
            },
            {
                "name": "Gore",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "horror",
            "dystopia",
            "dark"
        ],
        "excludes": {
            "genres": [
                "Comedy",
                "Romance"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 1
    },
    "thriller": {
        "id": "thriller",
        "aliases": [
            "thriller",
            "suspense",
            "high stakes",
            "fast paced",
            "ticking clock"
        ],
        "genres": [
            {
                "name": "Thriller",
                "weight": 1
            },
            {
                "name": "Mystery",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Crime",
                "weight": 0.7
            },
            {
                "name": "Politics",
                "weight": 0.5
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            },
            {
                "name": "Shounen",
                "weight": 0.6
            }
        ],
        "boosts": [
            "mystery",
            "dark",
            "assassin"
        ],
        "excludes": {
            "genres": [
                "Comedy",
                "SliceOfLife"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "secret_identity": {
        "id": "secret_identity",
        "aliases": [
            "secret identity",
            "masked",
            "double life",
            "disguise",
            "alter ego",
            "hidden identity"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.7
            },
            {
                "name": "Mystery",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "SuperPower",
                "weight": 0.8
            },
            {
                "name": "CharacterGrowth",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "action",
            "superpower",
            "thriller"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.6
    },
    "found_family": {
        "id": "found_family",
        "aliases": [
            "found family",
            "ragtag group",
            "misfits",
            "clique",
            "squad"
        ],
        "genres": [
            {
                "name": "Adventure",
                "weight": 0.8
            },
            {
                "name": "SliceOfLife",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "FoundFamily",
                "weight": 1
            },
            {
                "name": "Teamwork",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.7
            },
            {
                "name": "Shoujo",
                "weight": 0.6
            }
        ],
        "boosts": [
            "healing",
            "adventure",
            "comedy"
        ],
        "excludes": {
            "genres": [
                "Horror",
                "Thriller"
            ],
            "themes": [
                "DeathGame"
            ]
        },
        "tone": "positive",
        "intensity": 0.3
    },
    "time_travel": {
        "id": "time_travel",
        "aliases": [
            "time travel",
            "loop",
            "time leap",
            "back in time",
            "butterfly effect",
            "regressor"
        ],
        "genres": [
            {
                "name": "SciFi",
                "weight": 0.8
            },
            {
                "name": "Drama",
                "weight": 0.7
            },
            {
                "name": "Psychological",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Reincarnation",
                "weight": 0.5
            },
            {
                "name": "Regret",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "mystery",
            "thriller",
            "drama"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "rivals": {
        "id": "rivals",
        "aliases": [
            "rival",
            "nemesis",
            "competitor",
            "arch-nemesis",
            "frenemy"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.7
            },
            {
                "name": "Sports",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Teamwork",
                "weight": 0.5
            },
            {
                "name": "CharacterGrowth",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "sports",
            "martial_arts",
            "action"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.6
    },
    "slice_of_life": {
        "id": "slice_of_life",
        "aliases": [
            "slice of life",
            "daily life",
            "everyday",
            "relaxing",
            "school life"
        ],
        "genres": [
            {
                "name": "SliceOfLife",
                "weight": 1
            },
            {
                "name": "Comedy",
                "weight": 0.5
            }
        ],
        "themes": [
            {
                "name": "SchoolLife",
                "weight": 0.7
            },
            {
                "name": "AdultLife",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Shoujo",
                "weight": 0.6
            },
            {
                "name": "Seinen",
                "weight": 0.6
            }
        ],
        "boosts": [
            "healing",
            "romance",
            "comedy"
        ],
        "excludes": {
            "genres": [
                "Horror",
                "Action"
            ],
            "themes": [
                "Survival",
                "Gore",
                "DeathGame"
            ]
        },
        "tone": "positive",
        "intensity": 0.2
    },
    "tsundere": {
        "id": "tsundere",
        "aliases": [
            "tsundere",
            "hot and cold",
            "mean but nice",
            "denial",
            "blushing"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 0.8
            },
            {
                "name": "Comedy",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "SchoolLife",
                "weight": 0.5
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.6
            },
            {
                "name": "Shoujo",
                "weight": 0.8
            }
        ],
        "boosts": [
            "romance",
            "comedy",
            "enemies_to_lovers"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Survival"
            ]
        },
        "tone": "positive",
        "intensity": 0.4
    },
    "kuudere": {
        "id": "kuudere",
        "aliases": [
            "kuudere",
            "cool",
            "stoic",
            "emotionless",
            "robotic"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 0.6
            },
            {
                "name": "Drama",
                "weight": 0.5
            }
        ],
        "themes": [
            {
                "name": "CharacterGrowth",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.5
            }
        ],
        "boosts": [
            "romance",
            "psychological"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "mixed",
        "intensity": 0.3
    },
    "antihero": {
        "id": "antihero",
        "aliases": [
            "antihero",
            "morally grey",
            "not a hero",
            "edgy mc",
            "villain protagonist"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.9
            },
            {
                "name": "Psychological",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Revenge",
                "weight": 0.8
            },
            {
                "name": "Betrayal",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "dark",
            "revenge",
            "thriller"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "shounen_jump_style": {
        "id": "shounen_jump_style",
        "aliases": [
            "shounen jump",
            "battle shounen",
            "power system",
            "epic battle"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 1
            },
            {
                "name": "Adventure",
                "weight": 0.9
            }
        ],
        "themes": [
            {
                "name": "Teamwork",
                "weight": 0.8
            },
            {
                "name": "CharacterGrowth",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 1
            }
        ],
        "boosts": [
            "action",
            "superpower",
            "martial_arts"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "positive",
        "intensity": 0.8
    },
    "josei_drama": {
        "id": "josei_drama",
        "aliases": [
            "josei",
            "adult drama",
            "realistic romance",
            "mature relationship"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 1
            },
            {
                "name": "Romance",
                "weight": 0.9
            }
        ],
        "themes": [
            {
                "name": "AdultLife",
                "weight": 1
            },
            {
                "name": "Workplace",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Josei",
                "weight": 1
            }
        ],
        "boosts": [
            "office_work",
            "slow_burn",
            "romance"
        ],
        "excludes": {
            "genres": [
                "Action",
                "Fantasy"
            ],
            "themes": [
                "Magic",
                "Isekai"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "seinen_psychological": {
        "id": "seinen_psychological",
        "aliases": [
            "seinen",
            "mature",
            "dark psychological",
            "complex"
        ],
        "genres": [
            {
                "name": "Psychological",
                "weight": 1
            },
            {
                "name": "Drama",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "MentalIllness",
                "weight": 0.7
            },
            {
                "name": "Politics",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 1
            }
        ],
        "boosts": [
            "dark",
            "thriller",
            "mystery"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "negative",
        "intensity": 0.9
    },
    "elves": {
        "id": "elves",
        "aliases": [
            "elf",
            "elves",
            "high elf",
            "dark elf",
            "forest dwellers"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 1
            }
        ],
        "themes": [
            {
                "name": "Magic",
                "weight": 0.8
            },
            {
                "name": "Nature",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.5
            }
        ],
        "boosts": [
            "fantasy",
            "adventure"
        ],
        "excludes": {
            "genres": [
                "SciFi"
            ],
            "themes": [
                "Cyberpunk"
            ]
        },
        "tone": "mixed",
        "intensity": 0.4
    },
    "dragons": {
        "id": "dragons",
        "aliases": [
            "dragon",
            "wyvern",
            "drake",
            "dragon lord"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 1
            },
            {
                "name": "Action",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Monsters",
                "weight": 1
            },
            {
                "name": "Magic",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "fantasy",
            "action",
            "op_mc"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "dwarves": {
        "id": "dwarves",
        "aliases": [
            "dwarf",
            "dwarves",
            "blacksmith",
            "miner",
            "mountain folk"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 1
            }
        ],
        "themes": [
            {
                "name": "Crafting",
                "weight": 0.9
            },
            {
                "name": "Adventure",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.5
            }
        ],
        "boosts": [
            "fantasy",
            "system"
        ],
        "excludes": {
            "genres": [
                "SciFi"
            ],
            "themes": [
                "Space"
            ]
        },
        "tone": "positive",
        "intensity": 0.3
    },
    "magic_circles": {
        "id": "magic_circles",
        "aliases": [
            "magic circle",
            "runes",
            "glyphs",
            "casting",
            "incantation"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 1
            }
        ],
        "themes": [
            {
                "name": "Magic",
                "weight": 1
            },
            {
                "name": "Scholar",
                "weight": 0.5
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "fantasy",
            "magic_school"
        ],
        "excludes": {
            "genres": [
                "Sports"
            ],
            "themes": [
                "ModernLife"
            ]
        },
        "tone": "mixed",
        "intensity": 0.4
    },
    "alchemy": {
        "id": "alchemy",
        "aliases": [
            "alchemy",
            "alchemist",
            "transmutation",
            "potions",
            "elixir"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 0.9
            },
            {
                "name": "Action",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Magic",
                "weight": 0.8
            },
            {
                "name": "Science",
                "weight": 0.5
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.7
            },
            {
                "name": "Seinen",
                "weight": 0.6
            }
        ],
        "boosts": [
            "fantasy",
            "magic_school"
        ],
        "excludes": {
            "genres": [
                "Sports"
            ],
            "themes": [
                "Teamwork"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "guilds": {
        "id": "guilds",
        "aliases": [
            "guild",
            "adventurer guild",
            "party",
            "rank",
            "quests"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 0.9
            },
            {
                "name": "Adventure",
                "weight": 0.9
            }
        ],
        "themes": [
            {
                "name": "FoundFamily",
                "weight": 0.8
            },
            {
                "name": "Teamwork",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "dungeon",
            "isekai",
            "adventure"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Isolation"
            ]
        },
        "tone": "positive",
        "intensity": 0.4
    },
    "baseball": {
        "id": "baseball",
        "aliases": [
            "baseball",
            "koshien",
            "pitcher",
            "batter",
            "catcher",
            "home run"
        ],
        "genres": [
            {
                "name": "Sports",
                "weight": 1
            }
        ],
        "themes": [
            {
                "name": "Teamwork",
                "weight": 0.9
            },
            {
                "name": "HardWork",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "sports",
            "rivals",
            "sports_training"
        ],
        "excludes": {
            "genres": [
                "Horror",
                "Fantasy"
            ],
            "themes": [
                "Magic"
            ]
        },
        "tone": "positive",
        "intensity": 0.5
    },
    "soccer": {
        "id": "soccer",
        "aliases": [
            "soccer",
            "football",
            "goal",
            "striker",
            "midfielder"
        ],
        "genres": [
            {
                "name": "Sports",
                "weight": 1
            }
        ],
        "themes": [
            {
                "name": "Teamwork",
                "weight": 0.9
            },
            {
                "name": "CharacterGrowth",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "sports",
            "rivals"
        ],
        "excludes": {
            "genres": [
                "Horror",
                "Fantasy"
            ],
            "themes": [
                "Magic"
            ]
        },
        "tone": "positive",
        "intensity": 0.5
    },
    "volleyball": {
        "id": "volleyball",
        "aliases": [
            "volleyball",
            "spike",
            "receive",
            "set",
            "libero"
        ],
        "genres": [
            {
                "name": "Sports",
                "weight": 1
            }
        ],
        "themes": [
            {
                "name": "Teamwork",
                "weight": 1
            },
            {
                "name": "CharacterGrowth",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "sports",
            "rivals",
            "sports_training"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Gore"
            ]
        },
        "tone": "positive",
        "intensity": 0.6
    },
    "basketball": {
        "id": "basketball",
        "aliases": [
            "basketball",
            "dunk",
            "court",
            "point guard"
        ],
        "genres": [
            {
                "name": "Sports",
                "weight": 1
            }
        ],
        "themes": [
            {
                "name": "Teamwork",
                "weight": 0.8
            },
            {
                "name": "SuperPower",
                "weight": 0.4
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "sports",
            "rivals"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "DeathGame"
            ]
        },
        "tone": "positive",
        "intensity": 0.6
    },
    "esports": {
        "id": "esports",
        "aliases": [
            "esports",
            "gaming tournament",
            "pro gamer",
            "streaming",
            "ranked"
        ],
        "genres": [
            {
                "name": "Sports",
                "weight": 0.8
            },
            {
                "name": "Action",
                "weight": 0.5
            }
        ],
        "themes": [
            {
                "name": "VideoGames",
                "weight": 1
            },
            {
                "name": "Teamwork",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.7
            },
            {
                "name": "Seinen",
                "weight": 0.5
            }
        ],
        "boosts": [
            "system",
            "comedy",
            "sports"
        ],
        "excludes": {
            "genres": [
                "Fantasy"
            ],
            "themes": [
                "Magic"
            ]
        },
        "tone": "positive",
        "intensity": 0.5
    },
    "racing": {
        "id": "racing",
        "aliases": [
            "racing",
            "car race",
            "drift",
            "speed",
            "track"
        ],
        "genres": [
            {
                "name": "Sports",
                "weight": 1
            },
            {
                "name": "Action",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "HardWork",
                "weight": 0.7
            },
            {
                "name": "Technique",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "sports",
            "rivals",
            "action"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "music": {
        "id": "music",
        "aliases": [
            "music",
            "band",
            "concert",
            "singer",
            "guitar",
            "piano",
            "idol",
            "practice"
        ],
        "genres": [
            {
                "name": "SliceOfLife",
                "weight": 0.8
            },
            {
                "name": "Drama",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Art",
                "weight": 1
            },
            {
                "name": "CharacterGrowth",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Shoujo",
                "weight": 0.7
            },
            {
                "name": "Seinen",
                "weight": 0.6
            }
        ],
        "boosts": [
            "healing",
            "school_life",
            "romance"
        ],
        "excludes": {
            "genres": [
                "Horror",
                "Action"
            ],
            "themes": [
                "Gore",
                "Survival"
            ]
        },
        "tone": "positive",
        "intensity": 0.4
    },
    "art": {
        "id": "art",
        "aliases": [
            "art",
            "painting",
            "drawing",
            "manga artist",
            "painter",
            "sketch"
        ],
        "genres": [
            {
                "name": "SliceOfLife",
                "weight": 0.9
            },
            {
                "name": "Drama",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Art",
                "weight": 1
            },
            {
                "name": "CharacterGrowth",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.7
            },
            {
                "name": "Josei",
                "weight": 0.7
            }
        ],
        "boosts": [
            "healing",
            "office_work",
            "school_life"
        ],
        "excludes": {
            "genres": [
                "Action",
                "Thriller"
            ],
            "themes": [
                "DeathGame"
            ]
        },
        "tone": "positive",
        "intensity": 0.3
    },
    "theater": {
        "id": "theater",
        "aliases": [
            "theater",
            "acting",
            "play",
            "stage",
            "drama club",
            "performance"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 0.9
            },
            {
                "name": "SliceOfLife",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Art",
                "weight": 1
            },
            {
                "name": "CharacterGrowth",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Shoujo",
                "weight": 0.8
            }
        ],
        "boosts": [
            "school_life",
            "romance"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Survival"
            ]
        },
        "tone": "mixed",
        "intensity": 0.4
    },
    "dance": {
        "id": "dance",
        "aliases": [
            "dance",
            "ballroom",
            "ballet",
            "hip hop",
            "dancer"
        ],
        "genres": [
            {
                "name": "Sports",
                "weight": 0.8
            },
            {
                "name": "Drama",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Art",
                "weight": 0.9
            },
            {
                "name": "HardWork",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.6
            },
            {
                "name": "Shoujo",
                "weight": 0.6
            }
        ],
        "boosts": [
            "sports_training",
            "romance"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Gore"
            ]
        },
        "tone": "positive",
        "intensity": 0.5
    },
    "fashion": {
        "id": "fashion",
        "aliases": [
            "fashion",
            "model",
            "design",
            "clothing",
            "runway",
            "style"
        ],
        "genres": [
            {
                "name": "SliceOfLife",
                "weight": 0.8
            },
            {
                "name": "Drama",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Art",
                "weight": 1
            },
            {
                "name": "AdultLife",
                "weight": 0.5
            }
        ],
        "demographics": [
            {
                "name": "Josei",
                "weight": 0.9
            },
            {
                "name": "Shoujo",
                "weight": 0.7
            }
        ],
        "boosts": [
            "office_work",
            "romance"
        ],
        "excludes": {
            "genres": [
                "Action",
                "SciFi"
            ],
            "themes": [
                "Magic"
            ]
        },
        "tone": "positive",
        "intensity": 0.3
    },
    "prison": {
        "id": "prison",
        "aliases": [
            "prison",
            "jail",
            "cell",
            "inmate",
            "warden",
            "incarceration"
        ],
        "genres": [
            {
                "name": "Thriller",
                "weight": 0.9
            },
            {
                "name": "Action",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Survival",
                "weight": 1
            },
            {
                "name": "Crime",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "dark",
            "death_game",
            "psychological"
        ],
        "excludes": {
            "genres": [
                "Comedy",
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.9
    },
    "deserted_island": {
        "id": "deserted_island",
        "aliases": [
            "island",
            "stranded",
            "deserted island",
            "shipwreck",
            "tropical",
            "wilderness"
        ],
        "genres": [
            {
                "name": "Adventure",
                "weight": 0.8
            },
            {
                "name": "Horror",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Survival",
                "weight": 1
            },
            {
                "name": "Isolation",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "survival",
            "horror",
            "found_family"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "SchoolLife"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "yakuza": {
        "id": "yakuza",
        "aliases": [
            "yakuza",
            "mob",
            "mafia",
            "gang",
            "underworld",
            "syndicate"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.9
            },
            {
                "name": "Drama",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Crime",
                "weight": 1
            },
            {
                "name": "Politics",
                "weight": 0.5
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "dark",
            "assassin",
            "thriller"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "space_travel": {
        "id": "space_travel",
        "aliases": [
            "space",
            "spaceship",
            "starship",
            "void",
            "interstellar",
            "gravity"
        ],
        "genres": [
            {
                "name": "SciFi",
                "weight": 1
            },
            {
                "name": "Adventure",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Space",
                "weight": 1
            },
            {
                "name": "Dystopia",
                "weight": 0.4
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "scifi",
            "mecha",
            "military"
        ],
        "excludes": {
            "genres": [
                "Fantasy",
                "SliceOfLife"
            ],
            "themes": [
                "Magic"
            ]
        },
        "tone": "mixed",
        "intensity": 0.6
    },
    "cyber_crime": {
        "id": "cyber_crime",
        "aliases": [
            "hacker",
            "internet",
            "dark web",
            "cyber attack",
            "digital"
        ],
        "genres": [
            {
                "name": "Thriller",
                "weight": 0.9
            },
            {
                "name": "SciFi",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Crime",
                "weight": 0.9
            },
            {
                "name": "Cyberpunk",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "cyberpunk",
            "thriller",
            "mystery"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.7
    },
    "necromancy": {
        "id": "necromancy",
        "aliases": [
            "necromancy",
            "undead",
            "resurrection",
            "corpse",
            "soul"
        ],
        "genres": [
            {
                "name": "DarkFantasy",
                "weight": 1
            },
            {
                "name": "Horror",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Magic",
                "weight": 1
            },
            {
                "name": "Death",
                "weight": 1
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "demons",
            "horror",
            "dark"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.9
    },
    "shinto_occult": {
        "id": "shinto_occult",
        "aliases": [
            "shinto",
            "yokai",
            "shrine",
            "miko",
            "spirit realm"
        ],
        "genres": [
            {
                "name": "Supernatural",
                "weight": 1
            },
            {
                "name": "Fantasy",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Magic",
                "weight": 0.8
            },
            {
                "name": "Nature",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.6
            }
        ],
        "boosts": [
            "supernatural",
            "mystery"
        ],
        "excludes": {
            "genres": [
                "SciFi"
            ],
            "themes": [
                "Cyberpunk"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "vampire": {
        "id": "vampire",
        "aliases": [
            "vampire",
            "blood-sucker",
            "dracula",
            "night",
            "immortal"
        ],
        "genres": [
            {
                "name": "Supernatural",
                "weight": 1
            },
            {
                "name": "Romance",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Demons",
                "weight": 0.9
            },
            {
                "name": "Gore",
                "weight": 0.5
            }
        ],
        "demographics": [
            {
                "name": "Shoujo",
                "weight": 0.7
            },
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "dark",
            "romance",
            "horror"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "werewolf": {
        "id": "werewolf",
        "aliases": [
            "werewolf",
            "lycanthrope",
            "beast",
            "full moon"
        ],
        "genres": [
            {
                "name": "Supernatural",
                "weight": 1
            },
            {
                "name": "Action",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Monsters",
                "weight": 1
            },
            {
                "name": "Survival",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "dark",
            "action",
            "horror"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "witchcraft": {
        "id": "witchcraft",
        "aliases": [
            "witch",
            "coven",
            "spellcasting",
            "familiar",
            "black magic"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 1
            },
            {
                "name": "Supernatural",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Magic",
                "weight": 1
            }
        ],
        "demographics": [
            {
                "name": "Shoujo",
                "weight": 0.8
            },
            {
                "name": "Shounen",
                "weight": 0.5
            }
        ],
        "boosts": [
            "fantasy",
            "magic_school"
        ],
        "excludes": {
            "genres": [
                "SciFi"
            ],
            "themes": [
                "Cyberpunk"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "exorcism": {
        "id": "exorcism",
        "aliases": [
            "exorcism",
            "cleansing",
            "holy",
            "blessing",
            "demon banishment"
        ],
        "genres": [
            {
                "name": "Supernatural",
                "weight": 1
            },
            {
                "name": "Action",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Demons",
                "weight": 1
            },
            {
                "name": "Magic",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "demons",
            "action",
            "fantasy"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.8
    },
    "demon_harem": {
        "id": "demon_harem",
        "aliases": [
            "demon girl",
            "succubus",
            "harem",
            "monster harem"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 0.8
            },
            {
                "name": "Ecchi",
                "weight": 1
            }
        ],
        "themes": [
            {
                "name": "Demons",
                "weight": 1
            },
            {
                "name": "Harem",
                "weight": 1
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "demons",
            "romance",
            "harem"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Tragedy"
            ]
        },
        "tone": "positive",
        "intensity": 0.6
    },
    "cursed_items": {
        "id": "cursed_items",
        "aliases": [
            "cursed",
            "relic",
            "artifact",
            "haunted object",
            "sealed"
        ],
        "genres": [
            {
                "name": "Supernatural",
                "weight": 0.9
            },
            {
                "name": "Fantasy",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Magic",
                "weight": 0.9
            },
            {
                "name": "Mystery",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "horror",
            "mystery",
            "supernatural"
        ],
        "excludes": {
            "genres": [
                "Sports"
            ],
            "themes": [
                "Teamwork"
            ]
        },
        "tone": "negative",
        "intensity": 0.7
    },
    "ghost_hunter": {
        "id": "ghost_hunter",
        "aliases": [
            "ghost hunter",
            "paranormal investigator",
            "psychic",
            "medium"
        ],
        "genres": [
            {
                "name": "Supernatural",
                "weight": 1
            },
            {
                "name": "Mystery",
                "weight": 0.9
            }
        ],
        "themes": [
            {
                "name": "Ghosts",
                "weight": 1
            },
            {
                "name": "Detective",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "supernatural",
            "mystery",
            "horror"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "possession": {
        "id": "possession",
        "aliases": [
            "possession",
            "controlled",
            "mind control",
            "shared body",
            "host"
        ],
        "genres": [
            {
                "name": "Horror",
                "weight": 0.9
            },
            {
                "name": "Psychological",
                "weight": 0.9
            }
        ],
        "themes": [
            {
                "name": "Demons",
                "weight": 0.8
            },
            {
                "name": "MentalIllness",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "horror",
            "psychological",
            "dark"
        ],
        "excludes": {
            "genres": [
                "Comedy",
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.9
    },
    "surgery": {
        "id": "surgery",
        "aliases": [
            "surgery",
            "doctor",
            "surgeon",
            "operating room",
            "scalpel",
            "medical"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 0.9
            },
            {
                "name": "Medical",
                "weight": 1
            }
        ],
        "themes": [
            {
                "name": "LifeAndDeath",
                "weight": 1
            },
            {
                "name": "AdultLife",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            },
            {
                "name": "Josei",
                "weight": 0.7
            }
        ],
        "boosts": [
            "trauma_recovery",
            "drama"
        ],
        "excludes": {
            "genres": [
                "Fantasy"
            ],
            "themes": [
                "Magic"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "plague_outbreak": {
        "id": "plague_outbreak",
        "aliases": [
            "plague",
            "epidemic",
            "pandemic",
            "virus",
            "infection",
            "quarantine"
        ],
        "genres": [
            {
                "name": "Horror",
                "weight": 0.8
            },
            {
                "name": "SciFi",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Survival",
                "weight": 1
            },
            {
                "name": "Death",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "dystopia",
            "horror",
            "dark"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "negative",
        "intensity": 0.9
    },
    "bio_engineering": {
        "id": "bio_engineering",
        "aliases": [
            "genetic engineering",
            "dna",
            "clone",
            "biotech",
            "mutation",
            "lab grown"
        ],
        "genres": [
            {
                "name": "SciFi",
                "weight": 1
            },
            {
                "name": "Psychological",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Science",
                "weight": 1
            },
            {
                "name": "Dystopia",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "scifi",
            "dark",
            "body_horror"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "cyborg": {
        "id": "cyborg",
        "aliases": [
            "cyborg",
            "android",
            "enhanced human",
            "prosthetic",
            "metal body"
        ],
        "genres": [
            {
                "name": "SciFi",
                "weight": 1
            },
            {
                "name": "Action",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Cyberpunk",
                "weight": 0.9
            },
            {
                "name": "Identity",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "mecha",
            "scifi",
            "cyber_crime"
        ],
        "excludes": {
            "genres": [
                "Fantasy"
            ],
            "themes": [
                "Magic"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "ai_awakening": {
        "id": "ai_awakening",
        "aliases": [
            "ai",
            "robot sentient",
            "machine learning",
            "digital mind",
            "singularity"
        ],
        "genres": [
            {
                "name": "SciFi",
                "weight": 1
            },
            {
                "name": "Psychological",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Cyberpunk",
                "weight": 0.8
            },
            {
                "name": "Science",
                "weight": 1
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "scifi",
            "cyber_crime"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "mixed",
        "intensity": 0.6
    },
    "space_opera": {
        "id": "space_opera",
        "aliases": [
            "space opera",
            "galactic empire",
            "space war",
            "fleet",
            "space station"
        ],
        "genres": [
            {
                "name": "SciFi",
                "weight": 1
            },
            {
                "name": "Drama",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Space",
                "weight": 1
            },
            {
                "name": "Politics",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "mecha",
            "military",
            "politics"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "exploration": {
        "id": "exploration",
        "aliases": [
            "exploration",
            "discovery",
            "new world",
            "expedition",
            "ruins"
        ],
        "genres": [
            {
                "name": "Adventure",
                "weight": 1
            },
            {
                "name": "Fantasy",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Nature",
                "weight": 0.7
            },
            {
                "name": "Survival",
                "weight": 0.5
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "adventure",
            "dungeon",
            "isekai"
        ],
        "excludes": {
            "genres": [
                "Office_work"
            ],
            "themes": [
                "Workplace"
            ]
        },
        "tone": "positive",
        "intensity": 0.4
    },
    "time_loop": {
        "id": "time_loop",
        "aliases": [
            "loop",
            "time loop",
            "repetition",
            "retry",
            "save point",
            "reset"
        ],
        "genres": [
            {
                "name": "Psychological",
                "weight": 0.8
            },
            {
                "name": "SciFi",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Mystery",
                "weight": 0.7
            },
            {
                "name": "Regret",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "mystery",
            "thriller",
            "drama"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "royal_court": {
        "id": "royal_court",
        "aliases": [
            "royal court",
            "palace",
            "nobility intrigue",
            "queen",
            "emperor",
            "dynasty"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 1
            },
            {
                "name": "Historical",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Politics",
                "weight": 1
            },
            {
                "name": "Nobility",
                "weight": 1
            }
        ],
        "demographics": [
            {
                "name": "Josei",
                "weight": 0.9
            },
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "villainess",
            "historical",
            "politics"
        ],
        "excludes": {
            "genres": [
                "SciFi"
            ],
            "themes": [
                "ModernLife"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "grand_strategy": {
        "id": "grand_strategy",
        "aliases": [
            "strategy",
            "tactics",
            "war planning",
            "maneuver",
            "general"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 0.8
            },
            {
                "name": "Action",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Military",
                "weight": 1
            },
            {
                "name": "Politics",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 1
            }
        ],
        "boosts": [
            "military",
            "politics",
            "mecha"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "espionage": {
        "id": "espionage",
        "aliases": [
            "espionage",
            "spy",
            "covert",
            "intelligence",
            "secret agent",
            "double agent"
        ],
        "genres": [
            {
                "name": "Thriller",
                "weight": 1
            },
            {
                "name": "Action",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Politics",
                "weight": 0.8
            },
            {
                "name": "Crime",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "assassin",
            "thriller",
            "military"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "uprising": {
        "id": "uprising",
        "aliases": [
            "rebellion",
            "uprising",
            "revolution",
            "protest",
            "coup d'etat"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 0.9
            },
            {
                "name": "Action",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Politics",
                "weight": 1
            },
            {
                "name": "Survival",
                "weight": 0.5
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "dystopia",
            "military",
            "dark"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "mercenary_life": {
        "id": "mercenary_life",
        "aliases": [
            "mercenary",
            "sellsword",
            "soldier of fortune",
            "contractor",
            "bounty hunter"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 1
            },
            {
                "name": "Adventure",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Military",
                "weight": 0.8
            },
            {
                "name": "Crime",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "assassin",
            "military",
            "action"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "propaganda": {
        "id": "propaganda",
        "aliases": [
            "propaganda",
            "media control",
            "indoctrination",
            "censorship"
        ],
        "genres": [
            {
                "name": "Psychological",
                "weight": 0.9
            },
            {
                "name": "Drama",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Politics",
                "weight": 1
            },
            {
                "name": "Dystopia",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "dystopia_politics",
            "dark",
            "thriller"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "diplomacy": {
        "id": "diplomacy",
        "aliases": [
            "diplomacy",
            "treaty",
            "negotiation",
            "summit",
            "envoy"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 0.8
            },
            {
                "name": "Psychological",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Politics",
                "weight": 1
            },
            {
                "name": "Nobility",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.7
            },
            {
                "name": "Josei",
                "weight": 0.7
            }
        ],
        "boosts": [
            "politics",
            "royal_court",
            "drama"
        ],
        "excludes": {
            "genres": [
                "Action"
            ],
            "themes": [
                "Survival"
            ]
        },
        "tone": "mixed",
        "intensity": 0.4
    },
    "warlord": {
        "id": "warlord",
        "aliases": [
            "warlord",
            "tyrant",
            "conqueror",
            "despot"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.8
            },
            {
                "name": "Drama",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Military",
                "weight": 1
            },
            {
                "name": "Politics",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "military",
            "politics",
            "historical"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "childcare": {
        "id": "childcare",
        "aliases": [
            "childcare",
            "parenting",
            "nanny",
            "babysitting",
            "raising child",
            "taking care of baby"
        ],
        "genres": [
            {
                "name": "SliceOfLife",
                "weight": 1
            },
            {
                "name": "Comedy",
                "weight": 0.5
            }
        ],
        "themes": [
            {
                "name": "Family",
                "weight": 1
            },
            {
                "name": "Responsibility",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Josei",
                "weight": 0.7
            },
            {
                "name": "Seinen",
                "weight": 0.6
            }
        ],
        "boosts": [
            "healing",
            "found_family",
            "romance"
        ],
        "excludes": {
            "genres": [
                "Horror",
                "Action"
            ],
            "themes": [
                "Gore",
                "Survival"
            ]
        },
        "tone": "positive",
        "intensity": 0.3
    },
    "single_parent": {
        "id": "single_parent",
        "aliases": [
            "single father",
            "single mother",
            "single parent",
            "sole provider"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 0.9
            },
            {
                "name": "SliceOfLife",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Family",
                "weight": 1
            },
            {
                "name": "AdultLife",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Josei",
                "weight": 0.8
            },
            {
                "name": "Seinen",
                "weight": 0.6
            }
        ],
        "boosts": [
            "childcare",
            "healing",
            "romance"
        ],
        "excludes": {
            "genres": [
                "Fantasy"
            ],
            "themes": [
                "Magic"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "domestic_life": {
        "id": "domestic_life",
        "aliases": [
            "housewife",
            "househusband",
            "cooking for family",
            "chores",
            "living together"
        ],
        "genres": [
            {
                "name": "SliceOfLife",
                "weight": 1
            },
            {
                "name": "Romance",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Family",
                "weight": 0.9
            },
            {
                "name": "AdultLife",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Josei",
                "weight": 0.8
            }
        ],
        "boosts": [
            "healing",
            "cooking",
            "childcare"
        ],
        "excludes": {
            "genres": [
                "Action"
            ],
            "themes": [
                "Survival"
            ]
        },
        "tone": "positive",
        "intensity": 0.2
    },
    "orphan": {
        "id": "orphan",
        "aliases": [
            "orphan",
            "orphanage",
            "lonely child",
            "abandoned"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 0.9
            },
            {
                "name": "Adventure",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "FoundFamily",
                "weight": 0.8
            },
            {
                "name": "CharacterGrowth",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "found_family",
            "healing"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "mixed",
        "intensity": 0.6
    },
    "elderly_care": {
        "id": "elderly_care",
        "aliases": [
            "elderly",
            "grandparent",
            "taking care of grandma",
            "nursing home"
        ],
        "genres": [
            {
                "name": "SliceOfLife",
                "weight": 1
            },
            {
                "name": "Drama",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Family",
                "weight": 0.9
            },
            {
                "name": "Loss",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Josei",
                "weight": 0.7
            }
        ],
        "boosts": [
            "healing",
            "trauma_recovery"
        ],
        "excludes": {
            "genres": [
                "Action"
            ],
            "themes": [
                "Gore"
            ]
        },
        "tone": "positive",
        "intensity": 0.3
    },
    "sibling_bond": {
        "id": "sibling_bond",
        "aliases": [
            "sibling",
            "brother",
            "sister",
            "big brother",
            "little sister",
            "protecting siblings"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 0.7
            },
            {
                "name": "SliceOfLife",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Family",
                "weight": 1
            },
            {
                "name": "Responsibility",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.8
            },
            {
                "name": "Shoujo",
                "weight": 0.8
            }
        ],
        "boosts": [
            "found_family",
            "healing"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "DeathGame"
            ]
        },
        "tone": "positive",
        "intensity": 0.4
    },
    "pet_care": {
        "id": "pet_care",
        "aliases": [
            "pets",
            "dog",
            "cat",
            "stray animal",
            "taking care of pet"
        ],
        "genres": [
            {
                "name": "SliceOfLife",
                "weight": 1
            }
        ],
        "themes": [
            {
                "name": "Family",
                "weight": 0.7
            },
            {
                "name": "Healing",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.6
            },
            {
                "name": "Shoujo",
                "weight": 0.6
            }
        ],
        "boosts": [
            "healing",
            "domestic_life"
        ],
        "excludes": {
            "genres": [
                "Action"
            ],
            "themes": [
                "Survival"
            ]
        },
        "tone": "positive",
        "intensity": 0.2
    },
    "marriage": {
        "id": "marriage",
        "aliases": [
            "marriage",
            "wedding",
            "husband",
            "wife",
            "engaged",
            "couple life"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 1
            },
            {
                "name": "SliceOfLife",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Family",
                "weight": 0.8
            },
            {
                "name": "AdultLife",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Josei",
                "weight": 0.9
            }
        ],
        "boosts": [
            "domestic_life",
            "romance",
            "office_work"
        ],
        "excludes": {
            "genres": [
                "Fantasy"
            ],
            "themes": [
                "Isekai"
            ]
        },
        "tone": "positive",
        "intensity": 0.4
    },
    "mentorship": {
        "id": "mentorship",
        "aliases": [
            "mentor",
            "student-teacher",
            "disciple",
            "master",
            "training"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.7
            },
            {
                "name": "Drama",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "CharacterGrowth",
                "weight": 1
            },
            {
                "name": "FoundFamily",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "martial_arts",
            "fantasy",
            "weak_to_strong"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Gore"
            ]
        },
        "tone": "positive",
        "intensity": 0.5
    },
    "community_life": {
        "id": "community_life",
        "aliases": [
            "neighborhood",
            "community",
            "townspeople",
            "local shop"
        ],
        "genres": [
            {
                "name": "SliceOfLife",
                "weight": 1
            }
        ],
        "themes": [
            {
                "name": "Family",
                "weight": 0.6
            },
            {
                "name": "Friendship",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "healing",
            "domestic_life"
        ],
        "excludes": {
            "genres": [
                "Thriller"
            ],
            "themes": [
                "Survival"
            ]
        },
        "tone": "positive",
        "intensity": 0.3
    },
    "nihilism": {
        "id": "nihilism",
        "aliases": [
            "nihilism",
            "meaningless",
            "nothingness",
            "void",
            "existential dread"
        ],
        "genres": [
            {
                "name": "Psychological",
                "weight": 1
            },
            {
                "name": "Drama",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "MentalIllness",
                "weight": 0.7
            },
            {
                "name": "Death",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 1
            }
        ],
        "boosts": [
            "dark",
            "psychological",
            "thriller"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag",
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.9
    },
    "determinism": {
        "id": "determinism",
        "aliases": [
            "fate",
            "destiny",
            "predestined",
            "fated",
            "inescapable"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 0.8
            },
            {
                "name": "Fantasy",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "CharacterGrowth",
                "weight": 0.5
            },
            {
                "name": "Regret",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.7
            },
            {
                "name": "Shounen",
                "weight": 0.6
            }
        ],
        "boosts": [
            "time_loop",
            "mystery",
            "drama"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "human_nature": {
        "id": "human_nature",
        "aliases": [
            "human nature",
            "morality",
            "ethics",
            "good vs evil",
            "humanity"
        ],
        "genres": [
            {
                "name": "Psychological",
                "weight": 0.9
            },
            {
                "name": "Drama",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Politics",
                "weight": 0.6
            },
            {
                "name": "Betrayal",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 1
            }
        ],
        "boosts": [
            "dark",
            "psychological",
            "thriller"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "mixed",
        "intensity": 0.8
    },
    "absurdism": {
        "id": "absurdism",
        "aliases": [
            "absurd",
            "surreal",
            "nonsense",
            "bizarre",
            "weird"
        ],
        "genres": [
            {
                "name": "Comedy",
                "weight": 0.9
            },
            {
                "name": "Psychological",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Gag",
                "weight": 0.8
            },
            {
                "name": "MentalIllness",
                "weight": 0.5
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "parody",
            "comedy",
            "psychological"
        ],
        "excludes": {
            "genres": [
                "Action"
            ],
            "themes": [
                "Survival"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "transcendence": {
        "id": "transcendence",
        "aliases": [
            "ascension",
            "enlightenment",
            "godhood",
            "higher being",
            "evolution"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 0.9
            },
            {
                "name": "SciFi",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Magic",
                "weight": 0.7
            },
            {
                "name": "Cultivation",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "op_mc",
            "fantasy",
            "cultivation"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "positive",
        "intensity": 0.6
    },
    "solitude": {
        "id": "solitude",
        "aliases": [
            "solitude",
            "loneliness",
            "isolation",
            "alone",
            "reclusive"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 0.8
            },
            {
                "name": "Psychological",
                "weight": 0.9
            }
        ],
        "themes": [
            {
                "name": "Loss",
                "weight": 0.7
            },
            {
                "name": "CharacterGrowth",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            },
            {
                "name": "Josei",
                "weight": 0.8
            }
        ],
        "boosts": [
            "healing",
            "trauma_recovery",
            "dark"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag",
                "Harem"
            ]
        },
        "tone": "negative",
        "intensity": 0.7
    },
    "hedonism": {
        "id": "hedonism",
        "aliases": [
            "pleasure",
            "decadence",
            "excess",
            "indulgence",
            "vice"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 0.7
            },
            {
                "name": "Ecchi",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Crime",
                "weight": 0.5
            },
            {
                "name": "AdultLife",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "dark",
            "romance",
            "thriller"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.6
    },
    "self_discovery": {
        "id": "self_discovery",
        "aliases": [
            "finding myself",
            "identity",
            "who am i",
            "self-actualization",
            "growth"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 1
            },
            {
                "name": "SliceOfLife",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "CharacterGrowth",
                "weight": 1
            }
        ],
        "demographics": [
            {
                "name": "Josei",
                "weight": 0.8
            },
            {
                "name": "Shoujo",
                "weight": 0.8
            }
        ],
        "boosts": [
            "healing",
            "trauma_recovery",
            "adventure"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Gore",
                "DeathGame"
            ]
        },
        "tone": "positive",
        "intensity": 0.4
    },
    "justice": {
        "id": "justice",
        "aliases": [
            "justice",
            "righteousness",
            "law",
            "moral code",
            "duty"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.8
            },
            {
                "name": "Drama",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Politics",
                "weight": 0.6
            },
            {
                "name": "Crime",
                "weight": 0.5
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "detective",
            "military",
            "action"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "positive",
        "intensity": 0.6
    },
    "conspiracy": {
        "id": "conspiracy",
        "aliases": [
            "conspiracy",
            "secret society",
            "cover-up",
            "hidden truth",
            "shadows"
        ],
        "genres": [
            {
                "name": "Mystery",
                "weight": 1
            },
            {
                "name": "Thriller",
                "weight": 0.9
            }
        ],
        "themes": [
            {
                "name": "Politics",
                "weight": 0.8
            },
            {
                "name": "Crime",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "mystery",
            "thriller",
            "dark"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "slow_burn": {
        "id": "slow_burn",
        "aliases": [
            "slow burn",
            "gradual",
            "patience",
            "long term",
            "development"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 0.9
            },
            {
                "name": "Drama",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "CharacterGrowth",
                "weight": 1
            }
        ],
        "demographics": [
            {
                "name": "Josei",
                "weight": 0.8
            },
            {
                "name": "Seinen",
                "weight": 0.6
            }
        ],
        "boosts": [
            "romance",
            "drama",
            "healing"
        ],
        "excludes": {
            "genres": [
                "Action"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "positive",
        "intensity": 0.2
    },
    "non_linear": {
        "id": "non_linear",
        "aliases": [
            "flashback",
            "non-linear",
            "fragmented",
            "memory",
            "multiple timelines"
        ],
        "genres": [
            {
                "name": "Mystery",
                "weight": 0.8
            },
            {
                "name": "Psychological",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Regret",
                "weight": 0.7
            },
            {
                "name": "Identity",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "mystery",
            "thriller",
            "drama"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "episodic": {
        "id": "episodic",
        "aliases": [
            "episodic",
            "anthology",
            "one-shot style",
            "vignette"
        ],
        "genres": [
            {
                "name": "SliceOfLife",
                "weight": 0.9
            },
            {
                "name": "Comedy",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Family",
                "weight": 0.5
            },
            {
                "name": "Friendship",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.6
            }
        ],
        "boosts": [
            "healing",
            "slice_of_life"
        ],
        "excludes": {
            "genres": [
                "Thriller"
            ],
            "themes": [
                "DeathGame"
            ]
        },
        "tone": "positive",
        "intensity": 0.2
    },
    "cliffhanger": {
        "id": "cliffhanger",
        "aliases": [
            "cliffhanger",
            "suspenseful",
            "high tension",
            "urgent"
        ],
        "genres": [
            {
                "name": "Thriller",
                "weight": 1
            },
            {
                "name": "Action",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Survival",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "thriller",
            "mystery",
            "action"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.9
    },
    "multiple_pov": {
        "id": "multiple_pov",
        "aliases": [
            "ensemble cast",
            "multiple perspectives",
            "shifting focus"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 0.8
            },
            {
                "name": "Mystery",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Politics",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "mystery",
            "drama",
            "politics"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "flashback": {
        "id": "flashback",
        "aliases": [
            "flashback",
            "past story",
            "backstory",
            "origin story"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 0.7
            },
            {
                "name": "Action",
                "weight": 0.5
            }
        ],
        "themes": [
            {
                "name": "Regret",
                "weight": 0.8
            },
            {
                "name": "CharacterGrowth",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "drama",
            "trauma_recovery",
            "mystery"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "mixed",
        "intensity": 0.4
    },
    "meta_fiction": {
        "id": "meta_fiction",
        "aliases": [
            "breaking fourth wall",
            "meta",
            "self-aware",
            "narrator"
        ],
        "genres": [
            {
                "name": "Comedy",
                "weight": 1
            },
            {
                "name": "Psychological",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Gag",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "parody",
            "comedy",
            "absurdism"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Survival"
            ]
        },
        "tone": "positive",
        "intensity": 0.5
    },
    "crescendo": {
        "id": "crescendo",
        "aliases": [
            "fast paced",
            "escalating",
            "build-up",
            "climax"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.9
            },
            {
                "name": "Thriller",
                "weight": 0.9
            }
        ],
        "themes": [
            {
                "name": "Survival",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "action",
            "thriller",
            "military"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.9
    },
    "unreliable_narrator": {
        "id": "unreliable_narrator",
        "aliases": [
            "unreliable narrator",
            "deceptive",
            "liar",
            "twisted perspective"
        ],
        "genres": [
            {
                "name": "Psychological",
                "weight": 1
            },
            {
                "name": "Mystery",
                "weight": 0.9
            }
        ],
        "themes": [
            {
                "name": "Betrayal",
                "weight": 0.9
            },
            {
                "name": "MentalIllness",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 1
            }
        ],
        "boosts": [
            "dark",
            "psychological",
            "mystery"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.9
    },
    "world_building_heavy": {
        "id": "world_building_heavy",
        "aliases": [
            "dense world",
            "lore-heavy",
            "detailed setting",
            "exposition"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 1
            },
            {
                "name": "SciFi",
                "weight": 1
            }
        ],
        "themes": [
            {
                "name": "Magic",
                "weight": 0.7
            },
            {
                "name": "Politics",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "fantasy",
            "scifi",
            "politics"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "swordplay": {
        "id": "swordplay",
        "aliases": [
            "sword",
            "kenjutsu",
            "fencing",
            "blade",
            "katana",
            "saber"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 1
            }
        ],
        "themes": [
            {
                "name": "MartialArts",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "action",
            "martial_arts",
            "military"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "gunplay": {
        "id": "gunplay",
        "aliases": [
            "gun",
            "pistol",
            "rifle",
            "firearm",
            "sniper",
            "shooting"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 1
            },
            {
                "name": "Thriller",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Crime",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "action",
            "assassin",
            "military"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "elemental_magic": {
        "id": "elemental_magic",
        "aliases": [
            "fire",
            "water",
            "earth",
            "wind",
            "ice",
            "lightning"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 1
            }
        ],
        "themes": [
            {
                "name": "Magic",
                "weight": 1
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "fantasy",
            "magic_school",
            "op_mc"
        ],
        "excludes": {
            "genres": [
                "SciFi"
            ],
            "themes": [
                "Cyberpunk"
            ]
        },
        "tone": "positive",
        "intensity": 0.5
    },
    "dark_magic": {
        "id": "dark_magic",
        "aliases": [
            "curse",
            "hex",
            "forbidden magic",
            "shadow",
            "void magic"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 0.9
            },
            {
                "name": "Horror",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Magic",
                "weight": 1
            },
            {
                "name": "Demons",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "dark",
            "necromancy",
            "horror"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "archery": {
        "id": "archery",
        "aliases": [
            "bow",
            "arrow",
            "archer",
            "marksman"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.8
            },
            {
                "name": "Fantasy",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Technique",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "action",
            "martial_arts"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "stealth_combat": {
        "id": "stealth_combat",
        "aliases": [
            "stealth",
            "ninja",
            "assassination",
            "invisibility",
            "hiding"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.9
            },
            {
                "name": "Thriller",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Assassins",
                "weight": 1
            },
            {
                "name": "Crime",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "assassin",
            "action",
            "dark"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "martial_arts_styles": {
        "id": "martial_arts_styles",
        "aliases": [
            "kung fu",
            "karate",
            "judo",
            "bjj",
            "muay thai",
            "boxing"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 1
            },
            {
                "name": "Sports",
                "weight": 0.5
            }
        ],
        "themes": [
            {
                "name": "MartialArts",
                "weight": 1
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "martial_arts",
            "action",
            "sports_training"
        ],
        "excludes": {
            "genres": [
                "Romance"
            ],
            "themes": [
                "Magic"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "summoning": {
        "id": "summoning",
        "aliases": [
            "summon",
            "familiar",
            "creature calling",
            "contract"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 1
            },
            {
                "name": "Supernatural",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Magic",
                "weight": 0.9
            },
            {
                "name": "Monsters",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "fantasy",
            "isekai",
            "dungeon"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.6
    },
    "transformation_magic": {
        "id": "transformation_magic",
        "aliases": [
            "polymorph",
            "shifter",
            "beast form",
            "transformation"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 1
            }
        ],
        "themes": [
            {
                "name": "Magic",
                "weight": 0.9
            },
            {
                "name": "Monsters",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "fantasy",
            "action"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "ModernLife"
            ]
        },
        "tone": "mixed",
        "intensity": 0.6
    },
    "psionics": {
        "id": "psionics",
        "aliases": [
            "telepathy",
            "telekinesis",
            "psychic",
            "esper",
            "mind reading"
        ],
        "genres": [
            {
                "name": "SciFi",
                "weight": 0.8
            },
            {
                "name": "Action",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "SuperPower",
                "weight": 1
            },
            {
                "name": "Science",
                "weight": 0.5
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "superpower",
            "psychological",
            "action"
        ],
        "excludes": {
            "genres": [
                "Romance"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "technomancy": {
        "id": "technomancy",
        "aliases": [
            "technomancy",
            "magitech",
            "cyber-magic",
            "data magic"
        ],
        "genres": [
            {
                "name": "SciFi",
                "weight": 1
            },
            {
                "name": "Fantasy",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Magic",
                "weight": 0.8
            },
            {
                "name": "Cyberpunk",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "cyberpunk",
            "fantasy",
            "scifi"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.6
    },
    "spirit_energy": {
        "id": "spirit_energy",
        "aliases": [
            "aura",
            "ki",
            "chakra",
            "spirit pressure",
            "mana pool"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.9
            },
            {
                "name": "Fantasy",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "MartialArts",
                "weight": 0.8
            },
            {
                "name": "Magic",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 1
            }
        ],
        "boosts": [
            "action",
            "martial_arts",
            "cultivation"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "trap_setting": {
        "id": "trap_setting",
        "aliases": [
            "traps",
            "snare",
            "pitfall",
            "dungeon trap",
            "minefield"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.7
            },
            {
                "name": "Adventure",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Survival",
                "weight": 0.8
            },
            {
                "name": "Strategy",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "dungeon",
            "action",
            "survival"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.6
    },
    "siege_warfare": {
        "id": "siege_warfare",
        "aliases": [
            "siege",
            "castle assault",
            "fortress",
            "catapult",
            "ballista"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.8
            },
            {
                "name": "Drama",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Military",
                "weight": 1
            },
            {
                "name": "Strategy",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "military",
            "politics",
            "action"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "ritual_magic": {
        "id": "ritual_magic",
        "aliases": [
            "ritual",
            "ceremony",
            "sacrificial",
            "altar",
            "chanting"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 0.9
            },
            {
                "name": "Horror",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Magic",
                "weight": 1
            },
            {
                "name": "Darkness",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "dark",
            "necromancy",
            "horror"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "knighthood": {
        "id": "knighthood",
        "aliases": [
            "knight",
            "paladin",
            "crusader",
            "squire",
            "order of knights"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 1
            },
            {
                "name": "Action",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "MartialArts",
                "weight": 0.7
            },
            {
                "name": "Honor",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "fantasy",
            "military",
            "action"
        ],
        "excludes": {
            "genres": [
                "SciFi"
            ],
            "themes": [
                "Space"
            ]
        },
        "tone": "positive",
        "intensity": 0.5
    },
    "martial_arts_weapons": {
        "id": "martial_arts_weapons",
        "aliases": [
            "staff",
            "spear",
            "nunchaku",
            "sai",
            "throwing stars",
            "fan"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 1
            }
        ],
        "themes": [
            {
                "name": "MartialArts",
                "weight": 1
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "martial_arts",
            "action"
        ],
        "excludes": {
            "genres": [
                "Romance"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.6
    },
    "blood_magic": {
        "id": "blood_magic",
        "aliases": [
            "blood magic",
            "hemomancy",
            "sacrifice",
            "life force"
        ],
        "genres": [
            {
                "name": "DarkFantasy",
                "weight": 1
            },
            {
                "name": "Horror",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Magic",
                "weight": 1
            },
            {
                "name": "Gore",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "dark",
            "necromancy",
            "horror"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.9
    },
    "heavy_artillery": {
        "id": "heavy_artillery",
        "aliases": [
            "artillery",
            "cannon",
            "tank",
            "missile",
            "bomber"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 1
            },
            {
                "name": "SciFi",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Military",
                "weight": 1
            },
            {
                "name": "Destruction",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "military",
            "action",
            "mecha"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.9
    },
    "energy_shielding": {
        "id": "energy_shielding",
        "aliases": [
            "forcefield",
            "barrier",
            "defense",
            "deflector"
        ],
        "genres": [
            {
                "name": "SciFi",
                "weight": 1
            },
            {
                "name": "Fantasy",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Technology",
                "weight": 0.6
            },
            {
                "name": "Magic",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "scifi",
            "mecha",
            "action"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "transformation_items": {
        "id": "transformation_items",
        "aliases": [
            "device",
            "transformation trinket",
            "wand",
            "belt",
            "morpher"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 1
            },
            {
                "name": "Action",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "SuperPower",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "superpower",
            "fantasy",
            "action"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "ModernLife"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "enchantment": {
        "id": "enchantment",
        "aliases": [
            "enchant",
            "buff",
            "magic item",
            "infused weapon",
            "rune"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 1
            }
        ],
        "themes": [
            {
                "name": "Magic",
                "weight": 1
            },
            {
                "name": "Crafting",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "fantasy",
            "dungeon",
            "system"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Survival"
            ]
        },
        "tone": "positive",
        "intensity": 0.4
    },
    "beast_taming": {
        "id": "beast_taming",
        "aliases": [
            "tamer",
            "beast master",
            "monster trainer",
            "pet master"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 1
            },
            {
                "name": "Adventure",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Monsters",
                "weight": 1
            },
            {
                "name": "Family",
                "weight": 0.5
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "fantasy",
            "dungeon",
            "isekai"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Gore"
            ]
        },
        "tone": "positive",
        "intensity": 0.5
    },
    "weapon_forging": {
        "id": "weapon_forging",
        "aliases": [
            "blacksmithing",
            "forging",
            "crafting",
            "armory"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 0.9
            },
            {
                "name": "Action",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Crafting",
                "weight": 1
            },
            {
                "name": "Technique",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "fantasy",
            "dungeon",
            "martial_arts"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.4
    },
    "gravity_manipulation": {
        "id": "gravity_manipulation",
        "aliases": [
            "gravity",
            "heavy",
            "flight",
            "weight control"
        ],
        "genres": [
            {
                "name": "SciFi",
                "weight": 0.9
            },
            {
                "name": "Action",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "SuperPower",
                "weight": 1
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "superpower",
            "action",
            "mecha"
        ],
        "excludes": {
            "genres": [
                "Romance"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "stealth_technology": {
        "id": "stealth_technology",
        "aliases": [
            "cloaking",
            "radar jammer",
            "stealth suit",
            "invisibility field"
        ],
        "genres": [
            {
                "name": "SciFi",
                "weight": 1
            },
            {
                "name": "Thriller",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Technology",
                "weight": 0.9
            },
            {
                "name": "Crime",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "cyberpunk",
            "thriller",
            "action"
        ],
        "excludes": {
            "genres": [
                "Fantasy"
            ],
            "themes": [
                "Magic"
            ]
        },
        "tone": "mixed",
        "intensity": 0.6
    },
    "martial_arts_energy": {
        "id": "martial_arts_energy",
        "aliases": [
            "qi blast",
            "wave",
            "pressure point",
            "internal energy"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 1
            },
            {
                "name": "Fantasy",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "MartialArts",
                "weight": 1
            },
            {
                "name": "Cultivation",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 1
            }
        ],
        "boosts": [
            "martial_arts",
            "cultivation",
            "action"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "positive",
        "intensity": 0.8
    },
    "dimensional_travel": {
        "id": "dimensional_travel",
        "aliases": [
            "portal",
            "rift",
            "dimension hopping",
            "multiverse"
        ],
        "genres": [
            {
                "name": "SciFi",
                "weight": 0.9
            },
            {
                "name": "Fantasy",
                "weight": 0.9
            }
        ],
        "themes": [
            {
                "name": "Magic",
                "weight": 0.7
            },
            {
                "name": "Science",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "isekai",
            "adventure",
            "fantasy"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "mechanical_engineering": {
        "id": "mechanical_engineering",
        "aliases": [
            "engineering",
            "tinkering",
            "robotics",
            "mechanic",
            "gadget"
        ],
        "genres": [
            {
                "name": "SciFi",
                "weight": 1
            },
            {
                "name": "Comedy",
                "weight": 0.5
            }
        ],
        "themes": [
            {
                "name": "Technology",
                "weight": 1
            },
            {
                "name": "Crafting",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "mecha",
            "cyberpunk",
            "action"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Magic"
            ]
        },
        "tone": "positive",
        "intensity": 0.4
    },
    "psionic_combat": {
        "id": "psionic_combat",
        "aliases": [
            "mind blast",
            "psychic duel",
            "willpower fight",
            "mental struggle"
        ],
        "genres": [
            {
                "name": "Psychological",
                "weight": 1
            },
            {
                "name": "Action",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "SuperPower",
                "weight": 1
            },
            {
                "name": "MentalIllness",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "psionics",
            "psychological",
            "dark"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "love_triangle": {
        "id": "love_triangle",
        "aliases": [
            "love triangle",
            "three-way romance",
            "two girls one boy",
            "rivalry in love"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 1
            },
            {
                "name": "Drama",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Jealousy",
                "weight": 0.9
            },
            {
                "name": "SchoolLife",
                "weight": 0.5
            }
        ],
        "demographics": [
            {
                "name": "Shoujo",
                "weight": 0.8
            },
            {
                "name": "Shounen",
                "weight": 0.6
            }
        ],
        "boosts": [
            "romance",
            "drama"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Gore"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "childhood_friend": {
        "id": "childhood_friend",
        "aliases": [
            "childhood friend",
            "neighbor",
            "always there",
            "first love"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 0.9
            },
            {
                "name": "SliceOfLife",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Family",
                "weight": 0.4
            },
            {
                "name": "Friendship",
                "weight": 1
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.8
            },
            {
                "name": "Shoujo",
                "weight": 0.8
            }
        ],
        "boosts": [
            "romance",
            "healing",
            "school_life"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "DeathGame"
            ]
        },
        "tone": "positive",
        "intensity": 0.3
    },
    "forbidden_love": {
        "id": "forbidden_love",
        "aliases": [
            "forbidden love",
            "taboo",
            "impossible romance",
            "secret lovers"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 1
            },
            {
                "name": "Drama",
                "weight": 0.9
            }
        ],
        "themes": [
            {
                "name": "Secrets",
                "weight": 0.8
            },
            {
                "name": "Conflict",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.7
            },
            {
                "name": "Josei",
                "weight": 0.8
            }
        ],
        "boosts": [
            "drama",
            "romance"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "negative",
        "intensity": 0.7
    },
    "arranged_marriage": {
        "id": "arranged_marriage",
        "aliases": [
            "arranged marriage",
            "contract marriage",
            "political union"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 1
            },
            {
                "name": "Drama",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Politics",
                "weight": 0.8
            },
            {
                "name": "Nobility",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Josei",
                "weight": 0.9
            },
            {
                "name": "Shoujo",
                "weight": 0.7
            }
        ],
        "boosts": [
            "romance",
            "royal_court"
        ],
        "excludes": {
            "genres": [
                "SciFi"
            ],
            "themes": [
                "Cyberpunk"
            ]
        },
        "tone": "mixed",
        "intensity": 0.4
    },
    "reunion": {
        "id": "reunion",
        "aliases": [
            "reunited",
            "long lost",
            "meeting again",
            "after years"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 0.8
            },
            {
                "name": "Drama",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Regret",
                "weight": 0.7
            },
            {
                "name": "CharacterGrowth",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Josei",
                "weight": 0.7
            },
            {
                "name": "Seinen",
                "weight": 0.6
            }
        ],
        "boosts": [
            "romance",
            "drama",
            "healing"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Survival"
            ]
        },
        "tone": "mixed",
        "intensity": 0.4
    },
    "age_gap": {
        "id": "age_gap",
        "aliases": [
            "age gap",
            "teacher student",
            "adult x minor",
            "mentor romance"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 0.9
            },
            {
                "name": "Drama",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Taboo",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.7
            },
            {
                "name": "Josei",
                "weight": 0.7
            }
        ],
        "boosts": [
            "romance",
            "drama"
        ],
        "excludes": {
            "genres": [
                "Action"
            ],
            "themes": [
                "Gore"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "rivalry_romance": {
        "id": "rivalry_romance",
        "aliases": [
            "rivals to lovers",
            "competitive romance",
            "bickering"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 1
            },
            {
                "name": "Comedy",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Conflict",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Shoujo",
                "weight": 0.9
            },
            {
                "name": "Shounen",
                "weight": 0.6
            }
        ],
        "boosts": [
            "romance",
            "comedy"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "DeathGame"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "fake_relationship": {
        "id": "fake_relationship",
        "aliases": [
            "fake dating",
            "pretend couple",
            "contract relationship"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 1
            },
            {
                "name": "Comedy",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Secrets",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Shoujo",
                "weight": 0.8
            },
            {
                "name": "Shounen",
                "weight": 0.6
            }
        ],
        "boosts": [
            "romance",
            "comedy",
            "harem"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Survival"
            ]
        },
        "tone": "positive",
        "intensity": 0.4
    },
    "unrequited_love": {
        "id": "unrequited_love",
        "aliases": [
            "one-sided love",
            "crush",
            "ignoring feelings",
            "friendzone"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 1
            },
            {
                "name": "Drama",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Regret",
                "weight": 0.8
            },
            {
                "name": "Loss",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Shoujo",
                "weight": 0.9
            },
            {
                "name": "Josei",
                "weight": 0.7
            }
        ],
        "boosts": [
            "drama",
            "romance"
        ],
        "excludes": {
            "genres": [
                "Action"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "negative",
        "intensity": 0.6
    },
    "workplace_romance": {
        "id": "workplace_romance",
        "aliases": [
            "office romance",
            "coworker crush",
            "boss x employee"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 1
            },
            {
                "name": "SliceOfLife",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "AdultLife",
                "weight": 0.9
            },
            {
                "name": "Workplace",
                "weight": 1
            }
        ],
        "demographics": [
            {
                "name": "Josei",
                "weight": 0.9
            },
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "office_work",
            "romance"
        ],
        "excludes": {
            "genres": [
                "Fantasy"
            ],
            "themes": [
                "Magic"
            ]
        },
        "tone": "mixed",
        "intensity": 0.4
    },
    "friendship_bond": {
        "id": "friendship_bond",
        "aliases": [
            "best friend",
            "bros",
            "squad",
            "clique",
            "loyalty"
        ],
        "genres": [
            {
                "name": "SliceOfLife",
                "weight": 0.8
            },
            {
                "name": "Adventure",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Friendship",
                "weight": 1
            },
            {
                "name": "Teamwork",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "found_family",
            "healing",
            "adventure"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Survival"
            ]
        },
        "tone": "positive",
        "intensity": 0.3
    },
    "rival_to_ally": {
        "id": "rival_to_ally",
        "aliases": [
            "former rival",
            "new ally",
            "redemption",
            "teaming up"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.9
            },
            {
                "name": "Adventure",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "CharacterGrowth",
                "weight": 0.9
            },
            {
                "name": "Teamwork",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "action",
            "martial_arts",
            "adventure"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "positive",
        "intensity": 0.6
    },
    "betrayal_arc": {
        "id": "betrayal_arc",
        "aliases": [
            "betrayal",
            "traitor",
            "backstabbed",
            "broken trust"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 0.9
            },
            {
                "name": "Thriller",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Betrayal",
                "weight": 1
            },
            {
                "name": "Regret",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            },
            {
                "name": "Shounen",
                "weight": 0.6
            }
        ],
        "boosts": [
            "dark",
            "psychological",
            "thriller"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "negative",
        "intensity": 0.9
    },
    "secret_crush": {
        "id": "secret_crush",
        "aliases": [
            "hidden feelings",
            "shy",
            "pining",
            "secret love"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 1
            },
            {
                "name": "SliceOfLife",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Secrets",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Shoujo",
                "weight": 0.9
            },
            {
                "name": "Shounen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "romance",
            "healing",
            "school_life"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Survival"
            ]
        },
        "tone": "positive",
        "intensity": 0.3
    },
    "long_distance": {
        "id": "long_distance",
        "aliases": [
            "long distance",
            "separate worlds",
            "waiting",
            "letters"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 1
            },
            {
                "name": "Drama",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Loss",
                "weight": 0.6
            },
            {
                "name": "Regret",
                "weight": 0.5
            }
        ],
        "demographics": [
            {
                "name": "Josei",
                "weight": 0.7
            }
        ],
        "boosts": [
            "romance",
            "drama"
        ],
        "excludes": {
            "genres": [
                "Action"
            ],
            "themes": [
                "Gore"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "toxic_relationship": {
        "id": "toxic_relationship",
        "aliases": [
            "abusive relationship",
            "manipulative",
            "gaslighting",
            "toxic"
        ],
        "genres": [
            {
                "name": "Psychological",
                "weight": 1
            },
            {
                "name": "Drama",
                "weight": 0.9
            }
        ],
        "themes": [
            {
                "name": "Betrayal",
                "weight": 0.8
            },
            {
                "name": "MentalIllness",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            },
            {
                "name": "Josei",
                "weight": 0.8
            }
        ],
        "boosts": [
            "dark",
            "thriller",
            "psychological"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "negative",
        "intensity": 0.9
    },
    "reincarnated_love": {
        "id": "reincarnated_love",
        "aliases": [
            "past life love",
            "lovers across time",
            "reincarnation romance"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 1
            },
            {
                "name": "Fantasy",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Reincarnation",
                "weight": 1
            }
        ],
        "demographics": [
            {
                "name": "Shoujo",
                "weight": 0.8
            },
            {
                "name": "Shounen",
                "weight": 0.6
            }
        ],
        "boosts": [
            "romance",
            "isekai",
            "fantasy"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Gore"
            ]
        },
        "tone": "mixed",
        "intensity": 0.6
    },
    "team_dynamics": {
        "id": "team_dynamics",
        "aliases": [
            "squad",
            "guild party",
            "team",
            "group",
            "cooperation"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.8
            },
            {
                "name": "Adventure",
                "weight": 0.9
            }
        ],
        "themes": [
            {
                "name": "Teamwork",
                "weight": 1
            },
            {
                "name": "Friendship",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "adventure",
            "dungeon",
            "found_family"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Isolation"
            ]
        },
        "tone": "positive",
        "intensity": 0.4
    },
    "rival_in_love": {
        "id": "rival_in_love",
        "aliases": [
            "love rival",
            "competitor in love",
            "obstruction"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 1
            },
            {
                "name": "Comedy",
                "weight": 0.5
            }
        ],
        "themes": [
            {
                "name": "Jealousy",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Shoujo",
                "weight": 0.8
            }
        ],
        "boosts": [
            "romance",
            "drama"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "DeathGame"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "comfort_bond": {
        "id": "comfort_bond",
        "aliases": [
            "comfort",
            "support",
            "healing bond",
            "shoulder to cry on"
        ],
        "genres": [
            {
                "name": "SliceOfLife",
                "weight": 1
            },
            {
                "name": "Drama",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Healing",
                "weight": 1
            },
            {
                "name": "Family",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Josei",
                "weight": 0.7
            },
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "healing",
            "trauma_recovery",
            "domestic_life"
        ],
        "excludes": {
            "genres": [
                "Action"
            ],
            "themes": [
                "Survival"
            ]
        },
        "tone": "positive",
        "intensity": 0.3
    },
    "harem_dynamics": {
        "id": "harem_dynamics",
        "aliases": [
            "reverse harem",
            "harem",
            "multiple partners",
            "surrounded"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 0.9
            },
            {
                "name": "Ecchi",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Harem",
                "weight": 1
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            },
            {
                "name": "Shoujo",
                "weight": 0.6
            }
        ],
        "boosts": [
            "romance",
            "comedy",
            "harem"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Tragedy"
            ]
        },
        "tone": "positive",
        "intensity": 0.5
    },
    "guardian_ward": {
        "id": "guardian_ward",
        "aliases": [
            "protector",
            "ward",
            "bodyguard",
            "guardian",
            "surrogate parent"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.7
            },
            {
                "name": "Drama",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Responsibility",
                "weight": 0.9
            },
            {
                "name": "Family",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "found_family",
            "childcare",
            "adventure"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "DeathGame"
            ]
        },
        "tone": "positive",
        "intensity": 0.6
    },
    "enforced_closeness": {
        "id": "enforced_closeness",
        "aliases": [
            "trapped together",
            "roommates",
            "forced to live together",
            "close proximity"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 0.9
            },
            {
                "name": "Comedy",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Conflict",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Shoujo",
                "weight": 0.8
            },
            {
                "name": "Shounen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "romance",
            "comedy",
            "domestic_life"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Survival"
            ]
        },
        "tone": "positive",
        "intensity": 0.4
    },
    "power_imbalance": {
        "id": "power_imbalance",
        "aliases": [
            "master slave",
            "dynamic difference",
            "unbalanced",
            "control"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 0.9
            },
            {
                "name": "Psychological",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Politics",
                "weight": 0.7
            },
            {
                "name": "Betrayal",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "dark",
            "thriller",
            "psychological"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "mentor_mentee_romance": {
        "id": "mentor_mentee_romance",
        "aliases": [
            "mentor romance",
            "student teacher romance",
            "senior junior"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 1
            },
            {
                "name": "Drama",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "CharacterGrowth",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Josei",
                "weight": 0.8
            },
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "romance",
            "drama",
            "mentorship"
        ],
        "excludes": {
            "genres": [
                "Action"
            ],
            "themes": [
                "Survival"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "rebellion_together": {
        "id": "rebellion_together",
        "aliases": [
            "partners in crime",
            "uprising partners",
            "rebel couple"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.9
            },
            {
                "name": "Drama",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Politics",
                "weight": 0.8
            },
            {
                "name": "Teamwork",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "uprising",
            "military",
            "action"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "secret_society_romance": {
        "id": "secret_society_romance",
        "aliases": [
            "spy romance",
            "hidden organization romance"
        ],
        "genres": [
            {
                "name": "Thriller",
                "weight": 0.9
            },
            {
                "name": "Romance",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Secrets",
                "weight": 1
            },
            {
                "name": "Politics",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "espionage",
            "thriller",
            "romance"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "rival_families": {
        "id": "rival_families",
        "aliases": [
            "rival clans",
            "feuding families",
            "romeo and juliet"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 1
            },
            {
                "name": "Drama",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Politics",
                "weight": 0.7
            },
            {
                "name": "Conflict",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Shoujo",
                "weight": 0.9
            },
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "romance",
            "drama",
            "forbidden_love"
        ],
        "excludes": {
            "genres": [
                "SciFi"
            ],
            "themes": [
                "ModernLife"
            ]
        },
        "tone": "negative",
        "intensity": 0.7
    },
    "social_class_difference": {
        "id": "social_class_difference",
        "aliases": [
            "rich x poor",
            "caste gap",
            "status difference"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 1
            },
            {
                "name": "Drama",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Politics",
                "weight": 0.6
            },
            {
                "name": "AdultLife",
                "weight": 0.5
            }
        ],
        "demographics": [
            {
                "name": "Shoujo",
                "weight": 0.9
            },
            {
                "name": "Josei",
                "weight": 0.8
            }
        ],
        "boosts": [
            "romance",
            "drama",
            "nobility"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Gore"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "destined_meeting": {
        "id": "destined_meeting",
        "aliases": [
            "fated encounter",
            "meant to be",
            "fate"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 1
            },
            {
                "name": "Fantasy",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Destiny",
                "weight": 1
            }
        ],
        "demographics": [
            {
                "name": "Shoujo",
                "weight": 0.9
            }
        ],
        "boosts": [
            "romance",
            "fantasy",
            "reincarnated_love"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "DeathGame"
            ]
        },
        "tone": "positive",
        "intensity": 0.5
    },
    "urban_night": {
        "id": "urban_night",
        "aliases": [
            "city at night",
            "neon",
            "rainy city",
            "skyscraper",
            "dark metropolis"
        ],
        "genres": [
            {
                "name": "Thriller",
                "weight": 0.8
            },
            {
                "name": "Drama",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Isolation",
                "weight": 0.7
            },
            {
                "name": "Crime",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "cyberpunk",
            "thriller",
            "dark"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.7
    },
    "cozy_countryside": {
        "id": "cozy_countryside",
        "aliases": [
            "village",
            "rural",
            "countryside",
            "nature",
            "peaceful",
            "slow life"
        ],
        "genres": [
            {
                "name": "SliceOfLife",
                "weight": 1
            },
            {
                "name": "Comedy",
                "weight": 0.5
            }
        ],
        "themes": [
            {
                "name": "Healing",
                "weight": 1
            },
            {
                "name": "Nature",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.7
            },
            {
                "name": "Josei",
                "weight": 0.7
            }
        ],
        "boosts": [
            "healing",
            "domestic_life",
            "slice_of_life"
        ],
        "excludes": {
            "genres": [
                "Action"
            ],
            "themes": [
                "Survival"
            ]
        },
        "tone": "positive",
        "intensity": 0.2
    },
    "gothic_mansion": {
        "id": "gothic_mansion",
        "aliases": [
            "manor",
            "mansion",
            "castle",
            "haunted house",
            "gothic"
        ],
        "genres": [
            {
                "name": "Horror",
                "weight": 1
            },
            {
                "name": "Mystery",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Ghosts",
                "weight": 0.9
            },
            {
                "name": "Secrets",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "horror",
            "mystery",
            "dark"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "steampunk_world": {
        "id": "steampunk_world",
        "aliases": [
            "steampunk",
            "clockwork",
            "industrial",
            "steam engine",
            "brass"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 0.8
            },
            {
                "name": "SciFi",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Technology",
                "weight": 0.9
            },
            {
                "name": "Adventure",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "adventure",
            "mecha",
            "fantasy"
        ],
        "excludes": {
            "genres": [
                "Sports"
            ],
            "themes": [
                "ModernLife"
            ]
        },
        "tone": "mixed",
        "intensity": 0.6
    },
    "post_apocalyptic_ruins": {
        "id": "post_apocalyptic_ruins",
        "aliases": [
            "ruined city",
            "wasteland",
            "abandoned world",
            "overgrown city"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.8
            },
            {
                "name": "SciFi",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Survival",
                "weight": 1
            },
            {
                "name": "Isolation",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "dystopia",
            "survival",
            "horror"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.9
    },
    "underground_world": {
        "id": "underground_world",
        "aliases": [
            "cavern",
            "underground",
            "dungeon",
            "cave",
            "subterranean"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 0.9
            },
            {
                "name": "Adventure",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Survival",
                "weight": 0.7
            },
            {
                "name": "Exploration",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "dungeon",
            "adventure",
            "survival"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "ModernLife"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "high_fantasy_kingdom": {
        "id": "high_fantasy_kingdom",
        "aliases": [
            "kingdom",
            "empire",
            "medieval city",
            "capital"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 1
            },
            {
                "name": "Adventure",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Nobility",
                "weight": 0.8
            },
            {
                "name": "Magic",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "fantasy",
            "adventure",
            "royal_court"
        ],
        "excludes": {
            "genres": [
                "SciFi"
            ],
            "themes": [
                "Space"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "isolated_mountain": {
        "id": "isolated_mountain",
        "aliases": [
            "mountain",
            "peak",
            "monastery",
            "climb",
            "high altitude"
        ],
        "genres": [
            {
                "name": "Adventure",
                "weight": 0.8
            },
            {
                "name": "Drama",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Isolation",
                "weight": 0.7
            },
            {
                "name": "Training",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "adventure",
            "martial_arts",
            "healing"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "sea_faring": {
        "id": "sea_faring",
        "aliases": [
            "ocean",
            "sea",
            "pirate",
            "island hopping",
            "ship",
            "voyage"
        ],
        "genres": [
            {
                "name": "Adventure",
                "weight": 1
            },
            {
                "name": "Action",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Survival",
                "weight": 0.6
            },
            {
                "name": "Exploration",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "adventure",
            "action",
            "found_family"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "SchoolLife"
            ]
        },
        "tone": "positive",
        "intensity": 0.6
    },
    "desert_wasteland": {
        "id": "desert_wasteland",
        "aliases": [
            "desert",
            "dunes",
            "scorching",
            "nomad",
            "oasis"
        ],
        "genres": [
            {
                "name": "Adventure",
                "weight": 0.9
            },
            {
                "name": "Action",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Survival",
                "weight": 0.9
            },
            {
                "name": "Isolation",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "adventure",
            "survival",
            "dystopia"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "winter_tundra": {
        "id": "winter_tundra",
        "aliases": [
            "snow",
            "winter",
            "ice",
            "tundra",
            "frozen",
            "blizzard"
        ],
        "genres": [
            {
                "name": "Survival",
                "weight": 0.8
            },
            {
                "name": "Drama",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Isolation",
                "weight": 0.8
            },
            {
                "name": "Survival",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "survival",
            "dark",
            "horror"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "negative",
        "intensity": 0.8
    },
    "space_colony": {
        "id": "space_colony",
        "aliases": [
            "colony",
            "space habitat",
            "dome",
            "artificial environment"
        ],
        "genres": [
            {
                "name": "SciFi",
                "weight": 1
            },
            {
                "name": "Drama",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Space",
                "weight": 1
            },
            {
                "name": "Dystopia",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "scifi",
            "mecha",
            "military"
        ],
        "excludes": {
            "genres": [
                "Fantasy"
            ],
            "themes": [
                "Magic"
            ]
        },
        "tone": "mixed",
        "intensity": 0.6
    },
    "tropical_paradise": {
        "id": "tropical_paradise",
        "aliases": [
            "beach",
            "island",
            "resort",
            "sun",
            "vacation"
        ],
        "genres": [
            {
                "name": "SliceOfLife",
                "weight": 1
            },
            {
                "name": "Comedy",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Family",
                "weight": 0.5
            },
            {
                "name": "Friendship",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.6
            },
            {
                "name": "Shoujo",
                "weight": 0.6
            }
        ],
        "boosts": [
            "healing",
            "romance",
            "comedy"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Gore"
            ]
        },
        "tone": "positive",
        "intensity": 0.3
    },
    "dense_forest": {
        "id": "dense_forest",
        "aliases": [
            "woods",
            "jungle",
            "forest",
            "wild",
            "nature"
        ],
        "genres": [
            {
                "name": "Adventure",
                "weight": 0.8
            },
            {
                "name": "Fantasy",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Nature",
                "weight": 1
            },
            {
                "name": "Survival",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "adventure",
            "fantasy",
            "survival"
        ],
        "excludes": {
            "genres": [
                "SciFi"
            ],
            "themes": [
                "Cyberpunk"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "dystopian_city": {
        "id": "dystopian_city",
        "aliases": [
            "megacity",
            "oppressed city",
            "ghetto",
            "walled city"
        ],
        "genres": [
            {
                "name": "SciFi",
                "weight": 0.9
            },
            {
                "name": "Action",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Dystopia",
                "weight": 1
            },
            {
                "name": "Politics",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "dystopia",
            "dark",
            "thriller"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "negative",
        "intensity": 0.9
    },
    "floating_island": {
        "id": "floating_island",
        "aliases": [
            "floating city",
            "sky island",
            "skylands",
            "clouds"
        ],
        "genres": [
            {
                "name": "Fantasy",
                "weight": 1
            },
            {
                "name": "Adventure",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Magic",
                "weight": 0.7
            },
            {
                "name": "Exploration",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "fantasy",
            "adventure",
            "isekai"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Survival"
            ]
        },
        "tone": "positive",
        "intensity": 0.5
    },
    "suburban_neighborhood": {
        "id": "suburban_neighborhood",
        "aliases": [
            "suburbs",
            "residential area",
            "street",
            "home life"
        ],
        "genres": [
            {
                "name": "SliceOfLife",
                "weight": 1
            },
            {
                "name": "Drama",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Family",
                "weight": 0.9
            },
            {
                "name": "AdultLife",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.7
            },
            {
                "name": "Josei",
                "weight": 0.7
            }
        ],
        "boosts": [
            "healing",
            "domestic_life",
            "slice_of_life"
        ],
        "excludes": {
            "genres": [
                "Action"
            ],
            "themes": [
                "Survival"
            ]
        },
        "tone": "positive",
        "intensity": 0.2
    },
    "war_zone": {
        "id": "war_zone",
        "aliases": [
            "battlefield",
            "frontline",
            "trenches",
            "destruction"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 1
            },
            {
                "name": "Drama",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Military",
                "weight": 1
            },
            {
                "name": "Survival",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "military",
            "action",
            "dark"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "negative",
        "intensity": 0.9
    },
    "haunted_asylum": {
        "id": "haunted_asylum",
        "aliases": [
            "asylum",
            "mental hospital",
            "institution",
            "padded cell"
        ],
        "genres": [
            {
                "name": "Horror",
                "weight": 1
            },
            {
                "name": "Psychological",
                "weight": 0.9
            }
        ],
        "themes": [
            {
                "name": "MentalIllness",
                "weight": 1
            },
            {
                "name": "Ghosts",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "horror",
            "psychological",
            "dark"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "negative",
        "intensity": 0.9
    },
    "underwater_city": {
        "id": "underwater_city",
        "aliases": [
            "atlantis",
            "underwater",
            "deep sea",
            "ocean floor"
        ],
        "genres": [
            {
                "name": "SciFi",
                "weight": 0.8
            },
            {
                "name": "Fantasy",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Isolation",
                "weight": 0.7
            },
            {
                "name": "Exploration",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "fantasy",
            "scifi",
            "adventure"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "ModernLife"
            ]
        },
        "tone": "mixed",
        "intensity": 0.6
    },
    "rags_to_riches": {
        "id": "rags_to_riches",
        "aliases": [
            "poor to rich",
            "success story",
            "underdog rising",
            "wealth building"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 0.9
            },
            {
                "name": "SliceOfLife",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "CharacterGrowth",
                "weight": 1
            },
            {
                "name": "AdultLife",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.8
            },
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "cultivation",
            "isekai",
            "weak_to_strong"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Gore"
            ]
        },
        "tone": "positive",
        "intensity": 0.5
    },
    "corporate_hierarchy": {
        "id": "corporate_hierarchy",
        "aliases": [
            "office politics",
            "promotion",
            "climbing the ladder",
            "corporate war"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 1
            },
            {
                "name": "SliceOfLife",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Politics",
                "weight": 1
            },
            {
                "name": "Workplace",
                "weight": 1
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            },
            {
                "name": "Josei",
                "weight": 0.9
            }
        ],
        "boosts": [
            "office_work",
            "politics",
            "drama"
        ],
        "excludes": {
            "genres": [
                "Fantasy"
            ],
            "themes": [
                "Magic"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "feudal_system": {
        "id": "feudal_system",
        "aliases": [
            "feudalism",
            "caste system",
            "serfdom",
            "lord and peasant"
        ],
        "genres": [
            {
                "name": "Historical",
                "weight": 1
            },
            {
                "name": "Drama",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Politics",
                "weight": 1
            },
            {
                "name": "Nobility",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "historical",
            "politics",
            "royal_court"
        ],
        "excludes": {
            "genres": [
                "SciFi"
            ],
            "themes": [
                "Cyberpunk"
            ]
        },
        "tone": "mixed",
        "intensity": 0.6
    },
    "new_money": {
        "id": "new_money",
        "aliases": [
            "nouveau riche",
            "suddenly wealthy",
            "social climber"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 0.9
            },
            {
                "name": "Comedy",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Politics",
                "weight": 0.7
            },
            {
                "name": "AdultLife",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Josei",
                "weight": 0.8
            }
        ],
        "boosts": [
            "romance",
            "office_work"
        ],
        "excludes": {
            "genres": [
                "Action"
            ],
            "themes": [
                "Survival"
            ]
        },
        "tone": "mixed",
        "intensity": 0.4
    },
    "social_outcast": {
        "id": "social_outcast",
        "aliases": [
            "pariah",
            "loner",
            "rejected",
            "marginalized",
            "exile"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 0.9
            },
            {
                "name": "Psychological",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "CharacterGrowth",
                "weight": 0.8
            },
            {
                "name": "Isolation",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "dark",
            "trauma_recovery",
            "healing"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "negative",
        "intensity": 0.7
    },
    "aristocratic_decline": {
        "id": "aristocratic_decline",
        "aliases": [
            "fallen noble",
            "bankrupt estate",
            "ruined dynasty",
            "past glory"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 1
            },
            {
                "name": "Historical",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Nobility",
                "weight": 1
            },
            {
                "name": "Regret",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            },
            {
                "name": "Josei",
                "weight": 0.7
            }
        ],
        "boosts": [
            "historical",
            "royal_court",
            "politics"
        ],
        "excludes": {
            "genres": [
                "SciFi"
            ],
            "themes": [
                "ModernLife"
            ]
        },
        "tone": "negative",
        "intensity": 0.6
    },
    "commoner_hero": {
        "id": "commoner_hero",
        "aliases": [
            "peasant hero",
            "working class hero",
            "laborer",
            "everyman"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.8
            },
            {
                "name": "Adventure",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "CharacterGrowth",
                "weight": 0.9
            },
            {
                "name": "HardWork",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "fantasy",
            "adventure",
            "weak_to_strong"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "positive",
        "intensity": 0.5
    },
    "meritocracy": {
        "id": "meritocracy",
        "aliases": [
            "ability-based",
            "ranked system",
            "skill-based",
            "testing"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.8
            },
            {
                "name": "Psychological",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Politics",
                "weight": 0.7
            },
            {
                "name": "Strategy",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.9
            }
        ],
        "boosts": [
            "system",
            "action",
            "military"
        ],
        "excludes": {
            "genres": [
                "Comedy"
            ],
            "themes": [
                "Gag"
            ]
        },
        "tone": "mixed",
        "intensity": 0.7
    },
    "secret_wealth": {
        "id": "secret_wealth",
        "aliases": [
            "hidden millionaire",
            "secret heir",
            "disguised identity"
        ],
        "genres": [
            {
                "name": "Romance",
                "weight": 0.9
            },
            {
                "name": "Comedy",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Secrets",
                "weight": 0.8
            },
            {
                "name": "AdultLife",
                "weight": 0.5
            }
        ],
        "demographics": [
            {
                "name": "Shoujo",
                "weight": 0.8
            },
            {
                "name": "Josei",
                "weight": 0.8
            }
        ],
        "boosts": [
            "romance",
            "office_work"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Gore"
            ]
        },
        "tone": "positive",
        "intensity": 0.4
    },
    "bureaucracy": {
        "id": "bureaucracy",
        "aliases": [
            "red tape",
            "administration",
            "paperwork",
            "government official",
            "clerk"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 0.9
            },
            {
                "name": "SliceOfLife",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Politics",
                "weight": 1
            },
            {
                "name": "AdultLife",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "office_work",
            "politics",
            "drama"
        ],
        "excludes": {
            "genres": [
                "Fantasy"
            ],
            "themes": [
                "Magic"
            ]
        },
        "tone": "mixed",
        "intensity": 0.4
    },
    "manga_artist_life": {
        "id": "manga_artist_life",
        "aliases": [
            "mangaka",
            "manga artist",
            "editor",
            "deadline",
            "submission",
            "serialized"
        ],
        "genres": [
            {
                "name": "SliceOfLife",
                "weight": 1
            },
            {
                "name": "Comedy",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Art",
                "weight": 1
            },
            {
                "name": "AdultLife",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            },
            {
                "name": "Josei",
                "weight": 0.7
            }
        ],
        "boosts": [
            "office_work",
            "art",
            "slice_of_life"
        ],
        "excludes": {
            "genres": [
                "Action"
            ],
            "themes": [
                "Survival"
            ]
        },
        "tone": "positive",
        "intensity": 0.3
    },
    "fourth_wall_break": {
        "id": "fourth_wall_break",
        "aliases": [
            "meta",
            "talking to reader",
            "self-aware",
            "narrator interaction"
        ],
        "genres": [
            {
                "name": "Comedy",
                "weight": 1
            },
            {
                "name": "Psychological",
                "weight": 0.5
            }
        ],
        "themes": [
            {
                "name": "Gag",
                "weight": 1
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "parody",
            "comedy",
            "absurdism"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Gore"
            ]
        },
        "tone": "positive",
        "intensity": 0.4
    },
    "game_development": {
        "id": "game_development",
        "aliases": [
            "game dev",
            "indie dev",
            "programming",
            "bug fixing",
            "coding"
        ],
        "genres": [
            {
                "name": "SliceOfLife",
                "weight": 0.9
            },
            {
                "name": "Drama",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Art",
                "weight": 0.8
            },
            {
                "name": "Workplace",
                "weight": 1
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "office_work",
            "esports",
            "comedy"
        ],
        "excludes": {
            "genres": [
                "Fantasy"
            ],
            "themes": [
                "Magic"
            ]
        },
        "tone": "positive",
        "intensity": 0.4
    },
    "parody_story": {
        "id": "parody_story",
        "aliases": [
            "spoof",
            "parody",
            "satire",
            "caricature",
            "pastiche"
        ],
        "genres": [
            {
                "name": "Comedy",
                "weight": 1
            },
            {
                "name": "Action",
                "weight": 0.6
            }
        ],
        "themes": [
            {
                "name": "Gag",
                "weight": 1
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "comedy",
            "meta_fiction",
            "absurdism"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Tragedy"
            ]
        },
        "tone": "positive",
        "intensity": 0.6
    },
    "publisher_politics": {
        "id": "publisher_politics",
        "aliases": [
            "editorial",
            "publisher",
            "contract",
            "license",
            "censorship"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 1
            },
            {
                "name": "SliceOfLife",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Politics",
                "weight": 0.9
            },
            {
                "name": "Workplace",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "office_work",
            "manga_artist_life"
        ],
        "excludes": {
            "genres": [
                "Action"
            ],
            "themes": [
                "Magic"
            ]
        },
        "tone": "mixed",
        "intensity": 0.5
    },
    "writer_block": {
        "id": "writer_block",
        "aliases": [
            "creative slump",
            "stagnation",
            "artist struggle",
            "burnout"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 1
            },
            {
                "name": "Psychological",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Art",
                "weight": 0.9
            },
            {
                "name": "MentalIllness",
                "weight": 0.7
            }
        ],
        "demographics": [
            {
                "name": "Josei",
                "weight": 0.8
            },
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "trauma_recovery",
            "healing",
            "manga_artist_life"
        ],
        "excludes": {
            "genres": [
                "Action"
            ],
            "themes": [
                "Survival"
            ]
        },
        "tone": "negative",
        "intensity": 0.7
    },
    "fan_culture": {
        "id": "fan_culture",
        "aliases": [
            "fandom",
            "otaku",
            "fanboy",
            "fangirl",
            "convention",
            "merch"
        ],
        "genres": [
            {
                "name": "SliceOfLife",
                "weight": 0.9
            },
            {
                "name": "Comedy",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Art",
                "weight": 0.6
            },
            {
                "name": "Friendship",
                "weight": 0.8
            }
        ],
        "demographics": [
            {
                "name": "Shounen",
                "weight": 0.7
            },
            {
                "name": "Shoujo",
                "weight": 0.7
            }
        ],
        "boosts": [
            "comedy",
            "school_life",
            "otaku_culture"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Gore"
            ]
        },
        "tone": "positive",
        "intensity": 0.3
    },
    "as_if_story": {
        "id": "as_if_story",
        "aliases": [
            "what-if",
            "alternate universe",
            "speculative fiction",
            "parallel path"
        ],
        "genres": [
            {
                "name": "SciFi",
                "weight": 0.8
            },
            {
                "name": "Fantasy",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Identity",
                "weight": 0.7
            },
            {
                "name": "Regret",
                "weight": 0.6
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.8
            }
        ],
        "boosts": [
            "time_loop",
            "mystery",
            "drama"
        ],
        "excludes": {
            "genres": [
                "SliceOfLife"
            ],
            "themes": [
                "Iyashikei"
            ]
        },
        "tone": "mixed",
        "intensity": 0.6
    },
    "editor_perspective": {
        "id": "editor_perspective",
        "aliases": [
            "editor mentor",
            "editorial guidance",
            "critique",
            "industry insider"
        ],
        "genres": [
            {
                "name": "Drama",
                "weight": 0.8
            },
            {
                "name": "SliceOfLife",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Art",
                "weight": 0.8
            },
            {
                "name": "Workplace",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Josei",
                "weight": 0.8
            },
            {
                "name": "Seinen",
                "weight": 0.7
            }
        ],
        "boosts": [
            "manga_artist_life",
            "office_work"
        ],
        "excludes": {
            "genres": [
                "Action"
            ],
            "themes": [
                "Magic"
            ]
        },
        "tone": "mixed",
        "intensity": 0.4
    },
    "creative_collaboration": {
        "id": "creative_collaboration",
        "aliases": [
            "team art",
            "duo creative",
            "co-writer",
            "art partner"
        ],
        "genres": [
            {
                "name": "SliceOfLife",
                "weight": 0.9
            },
            {
                "name": "Drama",
                "weight": 0.7
            }
        ],
        "themes": [
            {
                "name": "Art",
                "weight": 1
            },
            {
                "name": "Teamwork",
                "weight": 0.9
            }
        ],
        "demographics": [
            {
                "name": "Seinen",
                "weight": 0.7
            },
            {
                "name": "Josei",
                "weight": 0.7
            }
        ],
        "boosts": [
            "manga_artist_life",
            "friendship_bond"
        ],
        "excludes": {
            "genres": [
                "Horror"
            ],
            "themes": [
                "Gore"
            ]
        },
        "tone": "positive",
        "intensity": 0.3
    },
    "​cyberpunk": {
        "id": "​cyberpunk",
        "aliases": [
            "​cyberpunk"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.95
            },
            {
                "name": "Drama",
                "weight": 0.85
            },
            {
                "name": "Psychological",
                "weight": 0.9
            },
            {
                "name": "Sci-Fi",
                "weight": 0.85
            }
        ],
        "themes": [
            {
                "name": "Cyberpunk",
                "weight": 0.8
            },
            {
                "name": "Urban",
                "weight": 0.8
            },
            {
                "name": "Crime",
                "weight": 0.8
            },
            {
                "name": "Anti-Hero",
                "weight": 0.8
            },
            {
                "name": "Dystopian",
                "weight": 0.8
            }
        ],
        "moodWeights": {
            "exciting": 0.78,
            "violent": 0.63,
            "emotional": 1,
            "tragic": 0.42,
            "dark": 0.67,
            "mysterious": 0.52
        }
    },
    "​necromancer": {
        "id": "​necromancer",
        "aliases": [
            "​necromancer"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.95
            },
            {
                "name": "Mystery",
                "weight": 0.7
            },
            {
                "name": "Supernatural",
                "weight": 0.7
            },
            {
                "name": "Hentai",
                "weight": 0.7
            },
            {
                "name": "Horror",
                "weight": 0.9
            },
            {
                "name": "Psychological",
                "weight": 0.9
            }
        ],
        "themes": [
            {
                "name": "Zombie",
                "weight": 0.8
            },
            {
                "name": "Clone",
                "weight": 0.8
            },
            {
                "name": "Dystopian",
                "weight": 0.8
            },
            {
                "name": "Survival",
                "weight": 0.8
            },
            {
                "name": "Full Color",
                "weight": 0.8
            }
        ],
        "moodWeights": {
            "exciting": 0.95,
            "violent": 0.76,
            "dark": 0.81,
            "mysterious": 0.63,
            "emotional": 0.45
        }
    },
    "​time_loop": {
        "id": "​time_loop",
        "aliases": [
            "​time_loop",
            "​time loop",
            "circle",
            "coil",
            "cycle"
        ],
        "genres": [
            {
                "name": "Action",
                "weight": 0.95
            },
            {
                "name": "Comedy",
                "weight": 0.7
            },
            {
                "name": "Drama",
                "weight": 0.85
            },
            {
                "name": "Sci-Fi",
                "weight": 0.85
            },
            {
                "name": "Supernatural",
                "weight": 0.7
            },
            {
                "name": "Thriller",
                "weight": 0.7
            },
            {
                "name": "Romance",
                "weight": 0.75
            },
            {
                "name": "Fantasy",
                "weight": 0.8
            }
        ],
        "themes": [
            {
                "name": "Male Protagonist",
                "weight": 0.8
            },
            {
                "name": "Seinen",
                "weight": 0.8
            },
            {
                "name": "Time Manipulation",
                "weight": 0.8
            },
            {
                "name": "Cultivation",
                "weight": 0.8
            },
            {
                "name": "Family Life",
                "weight": 0.8
            }
        ],
        "moodWeights": {
            "exciting": 0.95,
            "violent": 0.76,
            "emotional": 0.77,
            "tragic": 0.51
        }
    }

};
