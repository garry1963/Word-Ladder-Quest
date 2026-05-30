/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Chapter } from "../types";

export const CHAPTERS: Chapter[] = [
  {
    id: "ch1",
    title: "Chapter 1: Three-Letter Sprints",
    description: "Begin your quest with quick, elegant 3-letter word ladders. Warm up your vocabulary engines!",
    wordLength: 3,
    levels: [
      {
        id: "ch1-1",
        chapterId: "ch1",
        title: "Pet Swap",
        startWord: "CAT",
        targetWord: "DOG",
        par: 3,
        difficulty: "Easy"
      },
      {
        id: "ch1-2",
        chapterId: "ch1",
        title: "Sunrise Magic",
        startWord: "SUN",
        targetWord: "TEN",
        par: 3,
        difficulty: "Easy"
      },
      {
        id: "ch1-3",
        chapterId: "ch1",
        title: "Ink Spills",
        startWord: "PEN",
        targetWord: "FIT",
        par: 4,
        difficulty: "Medium"
      },
      {
        id: "ch1-4",
        chapterId: "ch1",
        title: "Field Trip",
        startWord: "BUG",
        targetWord: "RUN",
        par: 4,
        difficulty: "Medium"
      },
      {
        id: "ch1-5",
        chapterId: "ch1",
        title: "Light & Dark",
        startWord: "DAY",
        targetWord: "WET",
        par: 5,
        difficulty: "Hard"
      }
    ]
  },
  {
    id: "ch2",
    title: "Chapter 2: Four-Letter Transitions",
    description: "Expand your mind to 4-letter vocabulary. Discover hidden corridors and optimal step progressions.",
    wordLength: 4,
    levels: [
      {
        id: "ch2-1",
        chapterId: "ch2",
        title: "Climate Shifter",
        startWord: "COLD",
        targetWord: "WARM",
        par: 4,
        difficulty: "Easy"
      },
      {
        id: "ch2-2",
        chapterId: "ch2",
        title: "Library Corner",
        startWord: "BOON",
        targetWord: "BOOK",
        par: 1,
        difficulty: "Easy"
      },
      {
        id: "ch2-3",
        chapterId: "ch2",
        title: "Key & Locker",
        startWord: "SOCK",
        targetWord: "BACK",
        par: 3,
        difficulty: "Medium"
      },
      {
        id: "ch2-4",
        chapterId: "ch2",
        title: "Secret Whisper",
        startWord: "MIND",
        targetWord: "FINE",
        par: 3,
        difficulty: "Hard"
      },
      {
        id: "ch2-5",
        chapterId: "ch2",
        title: "Sovereign Zone",
        startWord: "BARE",
        targetWord: "TONE",
        par: 4,
        difficulty: "Expert"
      }
    ]
  },
  {
    id: "ch3",
    title: "Chapter 3: Five-Letter Expeditions",
    description: "Challenge yourself with the ultimate 5-letter word grids. True test of spatial vocabulary and quick thinking.",
    wordLength: 5,
    levels: [
      {
        id: "ch3-1",
        chapterId: "ch3",
        title: "Ocean Hunter",
        startWord: "SHARK",
        targetWord: "SMART",
        par: 4,
        difficulty: "Easy"
      },
      {
        id: "ch3-2",
        chapterId: "ch3",
        title: "Night Rest",
        startWord: "SLEEP",
        targetWord: "SWEET",
        par: 3,
        difficulty: "Medium"
      },
      {
        id: "ch3-3",
        chapterId: "ch3",
        title: "Cosmic Glow",
        startWord: "SHINE",
        targetWord: "CHORE",
        par: 4,
        difficulty: "Hard"
      },
      {
        id: "ch3-4",
        chapterId: "ch3",
        title: "Slate Canvas",
        startWord: "BLACK",
        targetWord: "STACK",
        par: 2,
        difficulty: "Medium"
      },
      {
        id: "ch3-5",
        chapterId: "ch3",
        title: "Grand Build",
        startWord: "DRAFT",
        targetWord: "PLANT",
        par: 5,
        difficulty: "Expert"
      }
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
