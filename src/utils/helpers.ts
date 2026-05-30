/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
 * Uses Breadth-First Search (BFS) to find the shortest path from start Word to end Word.
 * Relies on the provided offline dictionary Set.
 */
export function findShortestPath(
  startWord: string,
  endWord: string,
  dictionary: Set<string>
): string[] | null {
  const start = startWord.toLowerCase().trim();
  const end = endWord.toLowerCase().trim();

  if (start.length !== end.length) return null;
  
  // Create a temporary set of valid words that matches our length
  // We make sure both starts and ends are in the search-space
  const validWords = new Set<string>();
  dictionary.forEach(w => {
    if (w.length === start.length) {
      validWords.add(w.toLowerCase());
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
 * Generates an interesting, solvable custom ladder of a specified word length.
 * Serves as a dynamic generator when we need a random quick puzzle.
 */
export function getRandomSolvablePair(
  wordLength: number,
  dictionary: Set<string>,
  minSteps: number = 3,
  maxSteps: number = 5
): { start: string; end: string; path: string[] } | null {
  const list = Array.from(dictionary).filter(w => w.length === wordLength);
  if (list.length < 2) return null;

  // Let's perform a fast random search for a valid pair
  // To keep it fast, we sample randomly and verify paths
  const maxAttempts = 120;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const start = list[Math.floor(Math.random() * list.length)];
    const end = list[Math.floor(Math.random() * list.length)];
    if (start === end) continue;

    const path = findShortestPath(start, end, dictionary);
    if (path && path.length >= minSteps && path.length <= maxSteps + 1) {
      return {
        start: start.toUpperCase(),
        end: end.toUpperCase(),
        path: path.map(w => w.toUpperCase())
      };
    }
  }

  // Backup basic pair if search takes too long
  if (wordLength === 3) {
    return { start: "CAT", end: "DOG", path: ["CAT", "COT", "COG", "DOG"] };
  } else if (wordLength === 4) {
    return { start: "COLD", end: "WARM", path: ["COLD", "CORD", "CARD", "WARD", "WARM"] };
  } else {
    return { start: "SHARK", end: "SMART", path: ["SHARK", "SHARE", "STARE", "START", "SMART"] };
  }
}
