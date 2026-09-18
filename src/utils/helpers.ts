/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  isWordDisqualified, 
  disqualifyWordForPuzzles,
  THREE_LETTER_WORDS,
  FOUR_LETTER_WORDS,
  FIVE_LETTER_WORDS,
  SIX_LETTER_WORDS,
  ALL_WORDS_SET
} from "./dictionary";
import { verifyWordWithCollins, fetchValidatedLadder } from "./collinsClient";
import { PuzzleDifficulty } from "../types";

// Pre-indexed word arrays by length for instant O(1) retrieval
const LENGTH_TO_WORDS: Record<number, string[]> = {
  3: THREE_LETTER_WORDS,
  4: FOUR_LETTER_WORDS,
  5: FIVE_LETTER_WORDS,
  6: SIX_LETTER_WORDS,
};

// Cached canonical clean lists and sets (avoid allocating on every search)
const cleanListCache: Record<number, string[]> = {};
const cleanSetCache: Record<number, Set<string>> = {};

/**
 * Returns pre-filtered clean word list and Set for a given word length.
 * Drastically eliminates garbage collection overhead and redundant iterations.
 */
export function getCleanLexiconForLength(
  wordLength: number, 
  customDict?: Set<string>
): { list: string[]; set: Set<string> } {
  // If a custom non-default dictionary is explicitly passed (e.g. from tests or editor)
  if (customDict && customDict !== ALL_WORDS_SET) {
    const list: string[] = [];
    const set = new Set<string>();
    for (const w of customDict) {
      const clean = w.toLowerCase().trim();
      if (clean.length === wordLength && !isWordDisqualified(clean)) {
        list.push(clean);
        set.add(clean);
      }
    }
    return { list, set };
  }

  // Use pre-computed canonical cache
  if (cleanListCache[wordLength] && cleanSetCache[wordLength]) {
    return { list: cleanListCache[wordLength], set: cleanSetCache[wordLength] };
  }

  const rawList = LENGTH_TO_WORDS[wordLength] || Array.from(ALL_WORDS_SET).filter(w => w.length === wordLength);
  const list: string[] = [];
  const set = new Set<string>();

  for (const w of rawList) {
    const clean = w.toLowerCase().trim();
    if (clean.length === wordLength && !isWordDisqualified(clean)) {
      list.push(clean);
      set.add(clean);
    }
  }

  cleanListCache[wordLength] = list;
  cleanSetCache[wordLength] = set;
  return { list, set };
}

/**
 * High-performance single-source BFS ladder finder.
 * Instead of randomly picking two nodes and running 300+ full BFS searches,
 * this explores outwards from a candidate start word level-by-level up to maxSteps depth.
 * At that exact depth range, all discovered nodes are GUARANTEED shortest paths!
 * Generates valid ladders in < 1ms.
 */
function findSolvableLadderWithSteps(
  wordLength: number,
  dictionary: Set<string> | undefined,
  minSteps: number,
  maxSteps: number,
  pickRandom: (max: number) => number,
  maxStartTries: number = 20
): { start: string; end: string; path: string[] } | null {
  const { list, set: validWords } = getCleanLexiconForLength(wordLength, dictionary);
  if (list.length < 2) return null;

  for (let tryIdx = 0; tryIdx < maxStartTries; tryIdx++) {
    const start = list[pickRandom(list.length)];
    if (!start || isWordDisqualified(start)) continue;

    // Single-source BFS up to maxSteps depth
    const queue: string[] = [start];
    let head = 0;
    const depthMap = new Map<string, number>();
    const parentMap = new Map<string, string>();
    depthMap.set(start, 0);

    const candidates: string[] = [];

    while (head < queue.length) {
      const current = queue[head++];
      const d = depthMap.get(current)!;

      if (d >= minSteps && d <= maxSteps) {
        candidates.push(current);
      }

      // Do not expand beyond maxSteps depth
      if (d >= maxSteps) continue;

      const currentLen = current.length;
      for (let i = 0; i < currentLen; i++) {
        const prefix = current.slice(0, i);
        const suffix = current.slice(i + 1);
        const originalChar = current[i];

        for (let code = 97; code <= 122; code++) {
          const ch = String.fromCharCode(code);
          if (ch === originalChar) continue;

          const neighbor = prefix + ch + suffix;

          if (!depthMap.has(neighbor) && validWords.has(neighbor) && !isWordDisqualified(neighbor)) {
            depthMap.set(neighbor, d + 1);
            parentMap.set(neighbor, current);
            queue.push(neighbor);
          }
        }
      }
    }

    if (candidates.length > 0) {
      // Pick target from valid candidates at the exact desired step count
      const target = candidates[pickRandom(candidates.length)];

      // Reconstruct path in O(steps)
      const path: string[] = [];
      let curr: string | undefined = target;
      while (curr) {
        path.push(curr);
        curr = parentMap.get(curr);
      }
      path.reverse();

      return {
        start: start.toUpperCase(),
        end: target.toUpperCase(),
        path: path.map(w => w.toUpperCase())
      };
    }
  }

  return null;
}

/**
 * Validates if two words of the same length are exactly one letter apart.
 */
export function areWordsOneLetterApart(word1: string, word2: string): boolean {
  const w1 = word1.toLowerCase().trim();
  const w2 = word2.toLowerCase().trim();

  if (w1.length !== w2.length) return false;
  if (w1 === w2) return false;

  let differences = 0;
  for (let i = 0; i < w1.length; i++) {
    if (w1[i] !== w2[i]) {
      differences++;
      if (differences > 1) return false;
    }
  }

  return differences === 1;
}

/**
 * A date-seeded pseudo-random number generator (LCG)
 */
export function getSeededRandom(seed: number) {
  let val = seed;
  return function() {
    val = (val * 1664525 + 1013904223) % 4294967296;
    return val / 4294967296;
  };
}

export interface DifficultyConfig {
  minSteps: number; // minimum steps/moves between start and target
  maxSteps: number; // maximum steps/moves between start and target
}

/**
 * Difficulty Step Configurations:
 * - Default:
 *   3-Letter Puzzles: 2–3 step paths (path length 3–4)
 *   4-Letter Puzzles: 3–4 step paths (path length 4–5)
 *   5-Letter Puzzles: 3–4 step paths (path length 4–5)
 * - Raised:
 *   3-Letter Puzzles: 4–5 step paths (path length 5–6)
 *   4-Letter Puzzles: 5–6 step paths (path length 6–7)
 *   5-Letter Puzzles: 5–6 step paths (path length 6–7)
 */
export const DIFFICULTY_SPECS: Record<PuzzleDifficulty, Record<number, DifficultyConfig>> = {
  default: {
    3: { minSteps: 2, maxSteps: 3 },
    4: { minSteps: 3, maxSteps: 4 },
    5: { minSteps: 3, maxSteps: 4 },
  },
  raised: {
    3: { minSteps: 4, maxSteps: 5 },
    4: { minSteps: 5, maxSteps: 6 },
    5: { minSteps: 5, maxSteps: 6 },
  }
};

export function getDifficultySteps(wordLength: number, difficulty: PuzzleDifficulty = 'default'): DifficultyConfig {
  const spec = DIFFICULTY_SPECS[difficulty]?.[wordLength];
  if (spec) return spec;
  return difficulty === 'raised' ? { minSteps: 5, maxSteps: 6 } : { minSteps: 3, maxSteps: 4 };
}

/**
 * Deterministically generates a solvable pair given a seed, word length, and step constraints.
 * Supports configurable difficulty: default (breezy 2-4 steps) or raised (challenging 4-6 steps).
 * Executes in < 1ms via single-source BFS outward from start word.
 */
export function getSeededSolvablePair(
  wordLength: number,
  dictionary: Set<string>,
  seed: number,
  minSteps?: number,
  maxSteps?: number,
  difficulty: PuzzleDifficulty = 'default'
): { start: string; end: string; path: string[] } {
  const diffDefaults = getDifficultySteps(wordLength, difficulty);
  const min = minSteps ?? diffDefaults.minSteps;
  const max = maxSteps ?? diffDefaults.maxSteps;

  const rand = getSeededRandom(seed);
  const pickRandom = (n: number) => Math.floor(rand() * n);

  const found = findSolvableLadderWithSteps(wordLength, dictionary, min, max, pickRandom, 25);
  if (found) {
    return found;
  }

  // Absolute fallbacks if search ever exhausts candidates
  if (min >= 4) {
    if (wordLength === 3) return { start: "AAH", end: "GAL", path: ["AAH", "BAH", "BAD", "GAD", "GAL"] };
    if (wordLength === 4) return { start: "BITE", end: "GOES", path: ["BITE", "RITE", "ROTE", "ROTS", "ROES", "GOES"] };
    return { start: "ADOBE", end: "SCOPE", path: ["ADOBE", "ADORE", "ADORN", "ACORN", "SCORN", "SCORE", "SCOPE"] };
  }

  if (wordLength === 3) {
    return { start: "CAT", end: "DOG", path: ["CAT", "COT", "DOT", "DOG"] };
  } else if (wordLength === 4) {
    return { start: "HAND", end: "LEAF", path: ["HAND", "LAND", "LEAD", "LEAF"] };
  } else {
    return { start: "ABOVE", end: "ASIDE", path: ["ABOVE", "ABODE", "ABIDE", "ASIDE"] };
  }
}

/**
 * High-performance Breadth-First Search (BFS) to find the shortest path from startWord to endWord.
 * Uses index pointer queue and parent pointer Map for zero-copy, O(1) dequeue operations.
 */
export function findShortestPath(
  startWord: string,
  endWord: string,
  dictionary?: Set<string>
): string[] | null {
  const start = startWord.toLowerCase().trim();
  const end = endWord.toLowerCase().trim();

  if (start.length !== end.length) return null;
  if (isWordDisqualified(start) || isWordDisqualified(end)) return null;
  if (start === end) return [start];

  const wordLength = start.length;
  const { set: validWords } = getCleanLexiconForLength(wordLength, dictionary);

  // High performance BFS with pointer queue and parent tracking
  const queue: string[] = [start];
  let head = 0;
  const parent = new Map<string, string>();
  const visited = new Set<string>([start]);

  let found = false;
  while (head < queue.length) {
    const current = queue[head++];
    if (current === end) {
      found = true;
      break;
    }

    const currentLen = current.length;
    for (let i = 0; i < currentLen; i++) {
      const prefix = current.slice(0, i);
      const suffix = current.slice(i + 1);
      const originalChar = current[i];

      for (let code = 97; code <= 122; code++) {
        const ch = String.fromCharCode(code);
        if (ch === originalChar) continue;

        const neighbor = prefix + ch + suffix;

        if (neighbor === end || (validWords.has(neighbor) && !isWordDisqualified(neighbor))) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            parent.set(neighbor, current);
            queue.push(neighbor);
            if (neighbor === end) {
              found = true;
              break;
            }
          }
        }
      }
      if (found) break;
    }
  }

  if (!found) return null;

  // Reconstruct path from parent pointer map
  const path: string[] = [];
  let curr: string | undefined = end;
  while (curr) {
    path.push(curr);
    curr = parent.get(curr);
  }
  path.reverse();
  return path;
}

/**
 * Calculates advice for the next step along the shortest path.
 */
export function getSmartHint(
  currentWord: string,
  endWord: string,
  dictionary: Set<string>
): { nextWord: string; explanation: string; letterIndex: number } | null {
  const path = findShortestPath(currentWord, endWord, dictionary);
  if (!path || path.length < 2) return null;

  const nextWord = path[1];
  
  // Find which letter changed
  let changedIndex = -1;
  for (let i = 0; i < currentWord.length; i++) {
    if (currentWord[i].toLowerCase() !== nextWord[i].toLowerCase()) {
      changedIndex = i;
      break;
    }
  }

  if (changedIndex === -1) return null;

  const letterPos = changedIndex + 1;
  const newLetter = nextWord[changedIndex].toUpperCase();
  const oldLetter = currentWord[changedIndex].toUpperCase();

  return {
    nextWord: nextWord.toUpperCase(),
    letterIndex: changedIndex,
    explanation: `Change letter ${letterPos} ('${oldLetter}' → '${newLetter}') to form "${nextWord.toUpperCase()}"`
  };
}

/**
 * Generates an accessible, solvable custom ladder of a specified word length.
 * Supports configurable difficulty: default (breezy 2-4 steps) or raised (challenging 4-6 steps).
 * Executes in < 1ms via single-source BFS outward from start word.
 */
export function getRandomSolvablePair(
  wordLength: number,
  dictionary: Set<string>,
  minSteps?: number,
  maxSteps?: number,
  difficulty: PuzzleDifficulty = 'default'
): { start: string; end: string; path: string[] } | null {
  const diffDefaults = getDifficultySteps(wordLength, difficulty);
  const min = minSteps ?? diffDefaults.minSteps;
  const max = maxSteps ?? diffDefaults.maxSteps;

  const pickRandom = (n: number) => Math.floor(Math.random() * n);

  const found = findSolvableLadderWithSteps(wordLength, dictionary, min, max, pickRandom, 25);
  if (found) {
    return found;
  }

  // Backup verified pair if search takes too long
  if (min >= 4) {
    if (wordLength === 3) return { start: "AAH", end: "GAL", path: ["AAH", "BAH", "BAD", "GAD", "GAL"] };
    if (wordLength === 4) return { start: "BITE", end: "GOES", path: ["BITE", "RITE", "ROTE", "ROTS", "ROES", "GOES"] };
    return { start: "ADOBE", end: "SCOPE", path: ["ADOBE", "ADORE", "ADORN", "ACORN", "SCORN", "SCORE", "SCOPE"] };
  }

  if (wordLength === 3) {
    return { start: "CAT", end: "DOG", path: ["CAT", "COT", "DOT", "DOG"] };
  } else if (wordLength === 4) {
    return { start: "HAND", end: "LEAF", path: ["HAND", "LAND", "LEAD", "LEAF"] };
  } else {
    return { start: "ABOVE", end: "ASIDE", path: ["ABOVE", "ABODE", "ABIDE", "ASIDE"] };
  }
}

/**
 * Validated Puzzle Generation Function
 * 
 * Generates an accessible solvable word ladder pair using the hardcoded word list with configured steps.
 * Collins Dictionary is exclusively utilized for looking up word definitions.
 */
export async function getRandomSolvablePairWithCollinsValidation(
  wordLength: number,
  dictionary: Set<string>,
  minSteps?: number,
  maxSteps?: number,
  maxAttempts: number = 50,
  difficulty: PuzzleDifficulty = 'default'
): Promise<{ start: string; end: string; path: string[] } | null> {
  const diffDefaults = getDifficultySteps(wordLength, difficulty);
  const min = minSteps ?? diffDefaults.minSteps;
  const max = maxSteps ?? diffDefaults.maxSteps;

  // 1. First prioritize server-side ladder generation if available
  try {
    const serverLadder = await fetchValidatedLadder(wordLength, min, max);
    if (serverLadder && serverLadder.path && serverLadder.path.length - 1 >= min) {
      return serverLadder;
    }
  } catch (err) {
    // Graceful fallback to client-side generation
  }

  // 2. Generate solvable pair directly from the hardcoded word list
  const generated = getRandomSolvablePair(wordLength, dictionary, min, max, difficulty);
  if (generated) {
    return generated;
  }

  // Curated fallbacks
  if (min >= 4) {
    if (wordLength === 3) return { start: "AAH", end: "GAL", path: ["AAH", "BAH", "BAD", "GAD", "GAL"] };
    if (wordLength === 4) return { start: "BITE", end: "GOES", path: ["BITE", "RITE", "ROTE", "ROTS", "ROES", "GOES"] };
    return { start: "ADOBE", end: "SCOPE", path: ["ADOBE", "ADORE", "ADORN", "ACORN", "SCORN", "SCORE", "SCOPE"] };
  }

  const fallbacks: Record<number, { start: string; end: string; path: string[] }> = {
    3: { start: "CAT", end: "DOG", path: ["CAT", "COT", "DOT", "DOG"] },
    4: { start: "HAND", end: "LEAF", path: ["HAND", "LAND", "LEAD", "LEAF"] },
    5: { start: "ABOVE", end: "ASIDE", path: ["ABOVE", "ABODE", "ABIDE", "ASIDE"] },
  };

  const fb = fallbacks[wordLength];
  if (fb) return fb;

  return null;
}
