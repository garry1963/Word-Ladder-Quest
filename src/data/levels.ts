/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Chapter, Level, PuzzleDifficulty } from "../types";
import { ALL_WORDS_SET } from "../utils/dictionary";
import { getSeededSolvablePair, getDifficultySteps } from "../utils/helpers";

// Get seed based on current local date
const today = new Date();
const todaySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

function generateDailyLevel(
  idPrefix: string,
  chapterId: string,
  title: string,
  wordLength: number,
  difficulty: "Easy" | "Medium" | "Hard" | "Expert",
  minSteps: number,
  maxSteps: number,
  index: number,
  puzzleDifficulty: PuzzleDifficulty = 'default'
): Level {
  // Use a unique deterministic seed per level and difficulty
  const seed = todaySeed + index * 98765 + wordLength * 123 + (puzzleDifficulty === 'raised' ? 55555 : 0);
  const pair = getSeededSolvablePair(wordLength, ALL_WORDS_SET, seed, minSteps, maxSteps, puzzleDifficulty);
  
  return {
    id: `${idPrefix}-${todaySeed}${puzzleDifficulty === 'raised' ? '-r' : ''}`,
    chapterId,
    title,
    startWord: pair.start,
    targetWord: pair.end,
    par: pair.path.length - 1,
    difficulty
  };
}

export function getChapters(puzzleDifficulty: PuzzleDifficulty = 'default'): Chapter[] {
  const isRaised = puzzleDifficulty === 'raised';

  return [
    {
      id: "ch1",
      title: "Chapter 1: Three-Letter Sprints",
      description: isRaised
        ? "Advanced 3-letter word ladders with challenging 4 to 5 step paths."
        : "Begin your quest with breezy 3-letter word ladders. Fast, satisfying 2 to 3 step transitions!",
      wordLength: 3,
      levels: isRaised ? [
        generateDailyLevel("ch1-1", "ch1", "Pet Swap", 3, "Easy", 4, 4, 0, puzzleDifficulty),
        generateDailyLevel("ch1-2", "ch1", "Sunrise Magic", 3, "Easy", 4, 4, 1, puzzleDifficulty),
        generateDailyLevel("ch1-3", "ch1", "Ink Spills", 3, "Medium", 4, 5, 2, puzzleDifficulty),
        generateDailyLevel("ch1-4", "ch1", "Field Trip", 3, "Medium", 5, 5, 3, puzzleDifficulty),
        generateDailyLevel("ch1-5", "ch1", "Light & Dark", 3, "Hard", 5, 5, 4, puzzleDifficulty)
      ] : [
        generateDailyLevel("ch1-1", "ch1", "Pet Swap", 3, "Easy", 2, 3, 0, puzzleDifficulty),
        generateDailyLevel("ch1-2", "ch1", "Sunrise Magic", 3, "Easy", 2, 3, 1, puzzleDifficulty),
        generateDailyLevel("ch1-3", "ch1", "Ink Spills", 3, "Medium", 3, 3, 2, puzzleDifficulty),
        generateDailyLevel("ch1-4", "ch1", "Field Trip", 3, "Medium", 3, 3, 3, puzzleDifficulty),
        generateDailyLevel("ch1-5", "ch1", "Light & Dark", 3, "Hard", 3, 4, 4, puzzleDifficulty)
      ]
    },
    {
      id: "ch2",
      title: "Chapter 2: Four-Letter Transitions",
      description: isRaised
        ? "Test your linguistic mastery with 4-letter vocabulary along 5 to 6 step word pathways."
        : "Expand your mind to 4-letter vocabulary with accessible 3 to 4 step word pathways.",
      wordLength: 4,
      levels: isRaised ? [
        generateDailyLevel("ch2-1", "ch2", "Climate Shifter", 4, "Easy", 5, 5, 5, puzzleDifficulty),
        generateDailyLevel("ch2-2", "ch2", "Library Corner", 4, "Easy", 5, 5, 6, puzzleDifficulty),
        generateDailyLevel("ch2-3", "ch2", "Key & Locker", 4, "Medium", 5, 6, 7, puzzleDifficulty),
        generateDailyLevel("ch2-4", "ch2", "Secret Whisper", 4, "Hard", 5, 6, 8, puzzleDifficulty),
        generateDailyLevel("ch2-5", "ch2", "Sovereign Zone", 4, "Expert", 6, 6, 9, puzzleDifficulty)
      ] : [
        generateDailyLevel("ch2-1", "ch2", "Climate Shifter", 4, "Easy", 3, 3, 5, puzzleDifficulty),
        generateDailyLevel("ch2-2", "ch2", "Library Corner", 4, "Easy", 3, 4, 6, puzzleDifficulty),
        generateDailyLevel("ch2-3", "ch2", "Key & Locker", 4, "Medium", 3, 4, 7, puzzleDifficulty),
        generateDailyLevel("ch2-4", "ch2", "Secret Whisper", 4, "Hard", 4, 4, 8, puzzleDifficulty),
        generateDailyLevel("ch2-5", "ch2", "Sovereign Zone", 4, "Expert", 4, 4, 9, puzzleDifficulty)
      ]
    },
    {
      id: "ch3",
      title: "Chapter 3: Five-Letter Expeditions",
      description: isRaised
        ? "Engage deep 5-letter word grids with intricate 5 to 6 step pathways."
        : "Enjoy concise 5-letter word grids with approachable 3 to 4 step pathways.",
      wordLength: 5,
      levels: isRaised ? [
        generateDailyLevel("ch3-1", "ch3", "Ocean Hunter", 5, "Easy", 5, 5, 10, puzzleDifficulty),
        generateDailyLevel("ch3-2", "ch3", "Night Rest", 5, "Medium", 5, 5, 11, puzzleDifficulty),
        generateDailyLevel("ch3-3", "ch3", "Cosmic Glow", 5, "Hard", 5, 6, 12, puzzleDifficulty),
        generateDailyLevel("ch3-4", "ch3", "Slate Canvas", 5, "Medium", 5, 6, 13, puzzleDifficulty),
        generateDailyLevel("ch3-5", "ch3", "Grand Build", 5, "Expert", 6, 6, 14, puzzleDifficulty)
      ] : [
        generateDailyLevel("ch3-1", "ch3", "Ocean Hunter", 5, "Easy", 3, 3, 10, puzzleDifficulty),
        generateDailyLevel("ch3-2", "ch3", "Night Rest", 5, "Medium", 3, 4, 11, puzzleDifficulty),
        generateDailyLevel("ch3-3", "ch3", "Cosmic Glow", 5, "Hard", 3, 4, 12, puzzleDifficulty),
        generateDailyLevel("ch3-4", "ch3", "Slate Canvas", 5, "Medium", 4, 4, 13, puzzleDifficulty),
        generateDailyLevel("ch3-5", "ch3", "Grand Build", 5, "Expert", 4, 4, 14, puzzleDifficulty)
      ]
    }
  ];
}

export const CHAPTERS: Chapter[] = getChapters('default');

export const ACHIEVEMENTS = [
  {
    id: "ach-first-solve",
    title: "Scribe Initiate",
    description: "Successfully solve your very first word ladder quest.",
    icon: "Compass",
    condition: "First puzzle solved"
  },
  {
    id: "ach-three-stars",
    title: "Perfect Alchemist",
    description: "Earn 3 stars on any level by solving in optimal steps (Par).",
    icon: "Star",
    condition: "Get 3 stars"
  },
  {
    id: "ach-ch1-clear",
    title: "Sprint Graduate",
    description: "Successfully complete all levels in Chapter 1.",
    icon: "Award",
    condition: "Complete Ch 1"
  },
  {
    id: "ach-ch2-clear",
    title: "Linguistic Scholar",
    description: "Successfully complete all levels in Chapter 2.",
    icon: "BookOpen",
    condition: "Complete Ch 2"
  },
  {
    id: "ach-ch3-clear",
    title: "Ladder Sovereign",
    description: "Successfully complete all levels in Chapter 3.",
    icon: "Crown",
    condition: "Complete Ch 3"
  },
  {
    id: "ach-no-hints",
    title: "Pure Intellect",
    description: "Solve a Hard or Expert level without using any smart hints.",
    icon: "Zap",
    condition: "Hard level without hints"
  },
  {
    id: "ach-daily-streak",
    title: "Daily Oracle",
    description: "Maintain a daily challenge streak of at least 2 days.",
    icon: "Calendar",
    condition: "Daily run streak >= 2"
  }
];
