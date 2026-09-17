/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isWordDisqualified, disqualifyWordForPuzzles } from "./dictionary";
import { verifyWordWithCollins, fetchValidatedLadder } from "./collinsClient";
import { PuzzleDifficulty } from "../types";

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
  const dictSet = dictionary;
  // Strictly filter out any word that has ever been disqualified from puzzle generation
  const list = Array.from(dictSet).filter(w => w.length === wordLength && !isWordDisqualified(w));

  if (list.length < 2) {
    if (min >= 4) {
      if (wordLength === 3) return { start: "AAH", end: "GAL", path: ["AAH", "BAH", "BAD", "GAD", "GAL"] };
      if (wordLength === 4) return { start: "BITE", end: "GOES", path: ["BITE", "RITE", "ROTE", "ROTS", "ROES", "GOES"] };
      return { start: "ADOBE", end: "SCOPE", path: ["ADOBE", "ADORE", "ADORN", "ACORN", "SCORN", "SCORE", "SCOPE"] };
    }
    if (wordLength === 3) return { start: "CAT", end: "DOG", path: ["CAT", "COT", "DOT", "DOG"] };
    if (wordLength === 4) return { start: "HAND", end: "LEAF", path: ["HAND", "LAND", "LEAD", "LEAF"] };
    return { start: "ABOVE", end: "ASIDE", path: ["ABOVE", "ABODE", "ABIDE", "ASIDE"] };
  }

  // Attempt to select a pair with exact step size
  for (let attempt = 0; attempt < 300; attempt++) {
    const startIdx = Math.floor(rand() * list.length);
    const endIdx = Math.floor(rand() * list.length);
    const start = list[startIdx];
    const end = list[endIdx];

    if (start === end || isWordDisqualified(start) || isWordDisqualified(end)) continue;

    const path = findShortestPath(start, end, dictSet);
    if (path) {
      const steps = path.length - 1;
      if (steps >= min && steps <= max) {
        return {
          start: start.toUpperCase(),
          end: end.toUpperCase(),
          path: path.map(w => w.toUpperCase())
        };
      }
    }
  }

  // Broaden parameters if strict match is unsuccessful
  for (let attempt = 0; attempt < 200; attempt++) {
    const startIdx = Math.floor(rand() * list.length);
    const endIdx = Math.floor(rand() * list.length);
    const start = list[startIdx];
    const end = list[endIdx];

    if (start === end || isWordDisqualified(start) || isWordDisqualified(end)) continue;

    const path = findShortestPath(start, end, dictSet);
    if (path) {
      const steps = path.length - 1;
      if (steps >= min && steps <= max + 1) {
        return {
          start: start.toUpperCase(),
          end: end.toUpperCase(),
          path: path.map(w => w.toUpperCase())
        };
      }
    }
  }

  // Absolute fallbacks
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
 * Uses Breadth-First Search (BFS) to find the shortest path from start Word to end Word.
 * Disqualified words are strictly excluded from the search graph.
 */
export function findShortestPath(
  startWord: string,
  endWord: string,
  dictionary: Set<string>
): string[] | null {
  const start = startWord.toLowerCase().trim();
  const end = endWord.toLowerCase().trim();

  if (start.length !== end.length) return null;
  if (isWordDisqualified(start) || isWordDisqualified(end)) return null;
  
  // Create a temporary set of valid words that matches our length excluding disqualified words
  const validWords = new Set<string>();
  dictionary.forEach(w => {
    const clean = w.toLowerCase().trim();
    if (clean.length === start.length && !isWordDisqualified(clean)) {
      validWords.add(clean);
    }
  });

  // Always force-add start and end to dictionary to prevent locking
  validWords.add(start);
  validWords.add(end);

  if (start === end) return [start];

  const queue: [string, string[]][] = [[start, [start]]];
  const visited = new Set<string>([start]);

  while (queue.length > 0) {
    const [current, path] = queue.shift()!;
    if (current === end) {
      return path;
    }

    // Generate neighbors
    for (let i = 0; i < current.length; i++) {
      for (let charCode = 97; charCode <= 122; charCode++) {
        const char = String.fromCharCode(charCode);
        if (char === current[i]) continue;

        const neighbor = current.slice(0, i) + char + current.slice(i + 1);

        if (validWords.has(neighbor) && !visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([neighbor, [...path, neighbor]]);
        }
      }
    }
  }

  return null; // Unsolvable ladder in given dictionary
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

  // Strictly filter out any word that has ever been disqualified from puzzle generation
  const list = Array.from(dictionary).filter(w => w.length === wordLength && !isWordDisqualified(w));
  if (list.length < 2) return null;

  // Perform a fast random search for a valid pair matching the step constraints
  const maxAttempts = 200;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const start = list[Math.floor(Math.random() * list.length)];
    const end = list[Math.floor(Math.random() * list.length)];
    if (start === end || isWordDisqualified(start) || isWordDisqualified(end)) continue;

    const path = findShortestPath(start, end, dictionary);
    if (path) {
      const steps = path.length - 1;
      if (steps >= min && steps <= max) {
        return {
          start: start.toUpperCase(),
          end: end.toUpperCase(),
          path: path.map(w => w.toUpperCase())
        };
      }
    }
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
