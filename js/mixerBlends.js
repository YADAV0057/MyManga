// ==========================================
// MOOD MIXER — NAMED BLENDS (js/mixerBlends.js)
// ==========================================
// STEP 7: curated names/blurbs for ~18 popular 2-mood combos, with a
// template-based fallback for any pair not explicitly curated — this never
// returns blank/undefined, even for a pair nobody thought to write by hand.
// Imported only by mixerPage.js — keeps it isolated, doesn't bloat moods.js.

const CURATED_BLENDS = {
    '😭 Sad+🐶 Wholesome': { name: 'Bittersweet Comfort', blurb: 'Found-family stories that make you cry, then hug someone.' },
    '🖤 Edgy+🐶 Wholesome': { name: 'Soft Underneath', blurb: 'A rough exterior hiding a surprisingly tender heart.' },
    '🔥 Hype+💔 Heartbroken': { name: 'Fight Through It', blurb: 'High-stakes battles fueled by heartbreak and unfinished business.' },
    '🍵 Chill+🕵️ Mysterious': { name: 'Quiet Intrigue', blurb: 'Slow-paced mysteries you can sip tea through.' },
    '👻 Spooky+💕 Romantic': { name: 'Haunted Hearts', blurb: 'Ghost stories with an unexpected soft spot for romance.' },
    '🧠 Big Brain+🗡️ Revenge': { name: 'Calculated Payback', blurb: 'Meticulously plotted revenge, won with wits over muscle.' },
    '✨ Escapism+🪄 Dreamy': { name: 'Another World', blurb: 'Lose yourself completely in a lush, dreamlike setting.' },
    '☕ Cozy+🧸 Heartwarming': { name: 'Slow Sunday', blurb: 'Gentle, low-stakes stories meant to be savored slowly.' },
    '📼 Nostalgic+💔 Heartbroken': { name: 'Old Wounds', blurb: 'Bittersweet looks back at love and time already passed.' },
    '⚡ Adrenaline+💪 Overpowered': { name: 'Unstoppable', blurb: 'Nonstop momentum behind a protagonist who just doesn\u2019t lose.' },
    '😂 Laugh Out Loud+🤪 Chaotic': { name: 'Pure Nonsense', blurb: 'Absurd, high-energy comedy with zero brakes.' },
    '🌀 Mind-Bending+📖 Philosophical': { name: 'Existential Puzzle', blurb: 'Stories that mess with your head and your worldview at once.' },
    '⚔️ Epic+👑 Royal': { name: 'Throne and Blade', blurb: 'Grand-scale power struggles fought with politics and steel.' },
    '🎀 Cute+🔮 Magical': { name: 'Sparkle and Charm', blurb: 'Adorable characters wielding whimsical, storybook magic.' },
    '🏚️ Lonely+🌧️ Melancholic': { name: 'Quiet Ache', blurb: 'Solitary, rain-soaked stories about isolation and longing.' },
    '🎸 Rebellious+🚬 Gritty': { name: 'Against the Grain', blurb: 'Rough-edged characters clashing hard against the system.' },
    '🕴️ Fearless+🦸 Heroic': { name: 'No Hesitation', blurb: 'Larger-than-life heroes who never flinch, whatever the cost.' },
    '🦾 Tech-Savvy+🌀 Mind-Bending': { name: 'Digital Labyrinth', blurb: 'Sci-fi puzzles where technology bends reality itself.' }
};

function pairKey(labelA, labelB) {
    return [labelA, labelB].sort().join('+');
}

// Drops the leading emoji token, keeping just the word(s) — e.g.
// "😭 Sad" -> "Sad", "😂 Laugh Out Loud" -> "Laugh Out Loud".
function stripEmoji(label) {
    return (label || '').replace(/^\S+\s*/, '').trim();
}

/**
 * @param {string} labelA - a mood's full label (with emoji), from moods.js
 * @param {string} labelB
 * @returns {{name: string, blurb: string}} never null/undefined
 */
export function getBlendInfo(labelA, labelB) {
    const key = pairKey(labelA, labelB);
    if (CURATED_BLENDS[key]) return CURATED_BLENDS[key];

    const wordA = stripEmoji(labelA);
    const wordB = stripEmoji(labelB);
    return {
        name: `${wordA} + ${wordB}`,
        blurb: `A mix of ${wordA.toLowerCase()} and ${wordB.toLowerCase()} \u2014 expect stories that lean into both at once.`
    };
}
