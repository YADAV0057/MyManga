// js/parser/rules.js

export function extractRules(normalizedText) {
    const rules = {
        status: null,         // "completed", "ongoing"
        sort: "relevance",    // "popularity", "rating", "newest"
        maxChapters: null,    // integer
        cleanText: normalizedText 
    };

    let textToProcess = ` ${normalizedText} `;

    // 1. STATUS MATCHING
    if (/(?:completed|finished|done)/i.test(textToProcess)) {
        rules.status = "completed";
        textToProcess = textToProcess.replace(/\b(completed|finished|done)\b/gi, " ");
    } else if (/(?:ongoing|new|publishing)/i.test(textToProcess)) {
        rules.status = "ongoing";
        textToProcess = textToProcess.replace(/\b(ongoing|new|publishing)\b/gi, " ");
    }

    // 2. SORTING MATCHING
    if (/(?:highest rated|best rated|top rated|masterpiece)/i.test(textToProcess)) {
        rules.sort = "rating";
        textToProcess = textToProcess.replace(/\b(highest rated|best rated|top rated|masterpiece)\b/gi, " ");
    } else if (/(?:popular|famous|trending|mainstream)/i.test(textToProcess)) {
        rules.sort = "popularity";
        textToProcess = textToProcess.replace(/\b(popular|famous|trending|mainstream)\b/gi, " ");
    }

    // 3. CHAPTER MATCHING
    const chapterMatch = textToProcess.match(/(?:under|less than) (\d+) chapters?/i);
    if (chapterMatch) {
        rules.maxChapters = parseInt(chapterMatch[1], 10);
        textToProcess = textToProcess.replace(chapterMatch[0], " ");
    }

    rules.cleanText = textToProcess.replace(/\s+/g, " ").trim();
    return rules;
}

