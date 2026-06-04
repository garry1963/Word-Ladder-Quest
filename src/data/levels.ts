/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Chapter, Level } from "../types";
import { ALL_WORDS_SET } from "../utils/dictionary";
import { getSeededSolvablePair } from "../utils/helpers";

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
  index: number
): Level {
  // Use a unique deterministic seed per level
  const seed = todaySeed + index * 98765 + wordLength * 123;
  const pair = getSeededSolvablePair(wordLength, ALL_WORDS_SET, seed, minSteps, maxSteps);
  
  return {
    id: `${idPrefix}-${todaySeed}`,
    chapterId,
    title,
    startWord: pair.start,
    targetWord: pair.end,
    par: pair.path.length - 1,
    difficulty
  };
}

export const CHAPTERS: Chapter[] = [
  {
    id: "ch1",
    title: "Chapter 1: Three-Letter Sprints",
    description: "Begin your quest with quick, elegant 3-letter word ladders. Warm up your vocabulary engines!",
    wordLength: 3,
    levels: [
      generateDailyLevel("ch1-1", "ch1", "Pet Swap", 3, "Easy", 3, 3, 0),
      generateDailyLevel("ch1-2", "ch1", "Sunrise Magic", 3, "Easy", 3, 4, 1),
      generateDailyLevel("ch1-3", "ch1", "Ink Spills", 3, "Medium", 4, 4, 2),
      generateDailyLevel("ch1-4", "ch1", "Field Trip", 3, "Medium", 4, 5, 3),
      generateDailyLevel("ch1-5", "ch1", "Light & Dark", 3, "Hard", 5, 6, 4)
    ]
  },
  {
    id: "ch2",
    title: "Chapter 2: Four-Letter Transitions",
    description: "Expand your mind to 4-letter vocabulary. Discover hidden corridors and optimal step progressions.",
    wordLength: 4,
    levels: [
      generateDailyLevel("ch2-1", "ch2", "Climate Shifter", 4, "Easy", 3, 3, 5),
      generateDailyLevel("ch2-2", "ch2", "Library Corner", 4, "Easy", 3, 4, 6),
      generateDailyLevel("ch2-3", "ch2", "Key & Locker", 4, "Medium", 4, 4, 7),
      generateDailyLevel("ch2-4", "ch2", "Secret Whisper", 4, "Hard", 4, 5, 8),
      generateDailyLevel("ch2-5", "ch2", "Sovereign Zone", 4, "Expert", 5, 6, 9)
    ]
  },
  {
    id: "ch3",
    title: "Chapter 3: Five-Letter Expeditions",
    description: "Challenge yourself with the ultimate 5-letter word grids. True test of spatial vocabulary and quick thinking.",
    wordLength: 5,
    levels: [
      generateDailyLevel("ch3-1", "ch3", "Ocean Hunter", 5, "Easy", 3, 4, 10),
      generateDailyLevel("ch3-2", "ch3", "Night Rest", 5, "Medium", 4, 4, 11),
      generateDailyLevel("ch3-3", "ch3", "Cosmic Glow", 5, "Hard", 5, 5, 12),
      generateDailyLevel("ch3-4", "ch3", "Slate Canvas", 5, "Medium", 4, 4, 13),
      generateDailyLevel("ch3-5", "ch3", "Grand Build", 5, "Expert", 6, 7, 14)
    ]
  }
];

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
