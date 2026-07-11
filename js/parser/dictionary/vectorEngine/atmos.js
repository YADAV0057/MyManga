// js/parser/dictionary/vectorEngine/atoms.js
//
// Single source of truth for the atom vocabulary, per the plan doc's Phase
// 1 framing ("vectorEngine/atomVocabulary.js — canonical 15(+) atom list,
// single source of truth, imported by everything else in this folder").
// This file is what that was meant to become — named atoms.js here so
// both scoreTagAtoms.worker.js and judgeTagAtoms.js can share it directly.
//
// 16 atoms: the legacy 15 (Section 2, confirmed in use today) + the new
// `cognitive_load` atom (Section 7 open question 3 — RESOLVED count, name
// still provisional). If the real name changes before Job A/B's taxonomy
// is finalized, this is the only file that needs editing — every script
// in this folder imports the list from here, not a hardcoded copy.

export const ATOMS = [
    'dark', 'emotional', 'exciting', 'funny', 'happy', 'hopeful',
    'intense', 'mysterious', 'nostalgic', 'relaxing', 'romantic',
    'scary', 'tragic', 'violent', 'wholesome',
    'cognitive_load' // provisional name — see plan doc Section 7, question 3
];

