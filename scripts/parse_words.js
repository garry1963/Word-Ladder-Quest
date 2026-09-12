import fs from 'fs';
import path from 'path';

const raw = fs.readFileSync(path.join(process.cwd(), 'scripts/raw_words.txt'), 'utf8');

const lines = raw.split(/\r?\n/);
let currentCategory = 0;
const words3 = new Set();
const words4 = new Set();
const words5 = new Set();

for (let line of lines) {
  line = line.trim();
  if (!line) continue;
  if (line.includes('3-letter words')) {
    currentCategory = 3;
    continue;
  }
  if (line.includes('4-letter words')) {
    currentCategory = 4;
    continue;
  }
  if (line.includes('5-letter words')) {
    currentCategory = 5;
    continue;
  }

  const word = line.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) continue;

  if (currentCategory === 3 && word.length === 3) words3.add(word);
  else if (currentCategory === 4 && word.length === 4) words4.add(word);
  else if (currentCategory === 5 && word.length === 5) words5.add(word);
  else {
    console.warn(`Length mismatch or unknown category: "${word}" (len: ${word.length}, cat: ${currentCategory})`);
    if (word.length === 3) words3.add(word);
    else if (word.length === 4) words4.add(word);
    else if (word.length === 5) words5.add(word);
  }
}

const arr3 = Array.from(words3).sort();
const arr4 = Array.from(words4).sort();
const arr5 = Array.from(words5).sort();

console.log(`Parsed words: 3-letter: ${arr3.length}, 4-letter: ${arr4.length}, 5-letter: ${arr5.length}`);
console.log(`Total words: ${arr3.length + arr4.length + arr5.length}`);

// Write JSON file for scrabble_words.json compatibility
const jsonOutput = {
  "3": arr3,
  "4": arr4,
  "5": arr5,
  "6": []
};

fs.writeFileSync(
  path.join(process.cwd(), 'src/utils/scrabble_words.json'),
  JSON.stringify(jsonOutput, null, 2),
  'utf8'
);

// Write TypeScript export in src/data/wordLists.ts
const tsContent = `/**
 * Hardcoded Word Lists for Word Ladder Quest
 * Authoritative word lists provided for 3-letter, 4-letter, and 5-letter puzzles.
 * Puzzles and gameplay are strictly generated and validated against these lists.
 */

export const HARDCODED_WORDS_3: string[] = ${JSON.stringify(arr3, null, 2)};

export const HARDCODED_WORDS_4: string[] = ${JSON.stringify(arr4, null, 2)};

export const HARDCODED_WORDS_5: string[] = ${JSON.stringify(arr5, null, 2)};

export const HARDCODED_WORDLISTS: Record<number, string[]> = {
  3: HARDCODED_WORDS_3,
  4: HARDCODED_WORDS_4,
  5: HARDCODED_WORDS_5,
};

export const HARDCODED_WORDS_SET = new Set<string>([
  ...HARDCODED_WORDS_3,
  ...HARDCODED_WORDS_4,
  ...HARDCODED_WORDS_5,
]);
`;

fs.writeFileSync(path.join(process.cwd(), 'src/data/wordLists.ts'), tsContent, 'utf8');

// Write server-side hardcoded word text list
const allServerWords = [...arr3, ...arr4, ...arr5].sort().join('\n');
fs.writeFileSync(path.join(process.cwd(), 'src/server/data/collins_csw21.txt'), allServerWords, 'utf8');

console.log('Successfully wrote src/utils/scrabble_words.json, src/data/wordLists.ts, and src/server/data/collins_csw21.txt!');
