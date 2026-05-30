/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Level {
  id: string;
  chapterId: string;
  title: string;
  startWord: string;
  targetWord: string;
  par: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  wordLength: number;
  levels: Level[];
}

export interface PlayerStats {
  completedLevels: Record<string, { stars: number; bestMoves: number; solvedDate: string }>;
  dailyStreaks: number;
  lastDailySolvedDate: string | null;
  dailyStreakExpiry: string | null;
  totalPuzzlesSolved: number;
  totalMovesMade: number;
  hintsUsed: number;
  unlockedAchievements: string[];
  arcadeHighScore: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: string;
}

export interface CustomPuzzle {
  id: string;
  title: string;
  startWord: string;
  targetWord: string;
  par: number;
  createdDate: string;
}
