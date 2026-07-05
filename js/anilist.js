// ==========================================
// ANILIST API STACK (js/anilist.js)
// ==========================================

export async function fetchFromAniListUnified(parsedData, page = 1, isKorean = false, limit = 10) {
    // A strictly typed GraphQL query prevents ALL syntax errors
    const query = `
        query ($page: Int, $perPage: Int, $genres: [String], $search: String, $sort: [MediaSort], $countryOfOrigin: CountryCode, $status: MediaStatus) {
            Page(page: $page, perPage: $perPage) {
                media(type: MANGA, isAdult: false, countryOfOrigin: $countryOfOrigin, genre_in: $genres, search: $search, sort: $sort, status: $status) {
                    id title { romaji english } averageScore genres description(asHtml: false) coverImage { large } chapters status
                }
            }
        }
    `;

    // We only send the exact variables we need
    let variables = {
        page: page,
        perPage: limit
    };

    if (isKorean) {
        variables.countryOfOrigin = "KR";
    }

    if (parsedData.statusFilter) {
        variables.status = parsedData.statusFilter;
    }

    if (parsedData.isVibeOrTag) {
        variables.sort = ["POPULARITY_DESC"];
        // Safely cleans up the genres coming from the Quiz or Tags
        variables.genres = parsedData.cleanQuery.split(',')
            .map(g => g.trim())
            .map(g => g.toLowerCase() === 'sliceoflife' ? 'Slice of Life' : g)
            .filter(g => g.length > 0);
    } else if (parsedData.cleanQuery.length > 0) {
        variables.search = parsedData.cleanQuery;
        variables.sort = ["SEARCH_MATCH", "POPULARITY_DESC"];
    } else {
        variables.sort = ["POPULARITY_DESC"];
    }

    try {
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ query, variables })
        });

        if (!response.ok) {
            console.error(`AniList rejected the request: HTTP ${response.status}`);
            return [];
        }

        const data = await response.json();
        return data.data ? data.data.Page.media : [];
    } catch (error) {
        console.error("AniList Fetch Error:", error);
        return [];
    }
}
