/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Level, PlayerStats, CustomPuzzle } from "./types";
import { CHAPTERS, ACHIEVEMENTS } from "./data/levels";
import Menu from "./components/Menu";
import LevelSelector from "./components/LevelSelector";
import GameBoard from "./components/GameBoard";
import StatsDashboard from "./components/StatsDashboard";
import PuzzleCreator from "./components/PuzzleCreator";
import DailyChallenge from "./components/DailyChallenge";
import HowToPlay from "./components/HowToPlay";
import ArcadeMode from "./components/ArcadeMode";
import { Sparkles, X, Award } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const LOCAL_STORAGE_KEY_STATS = "wordladder_player_stats_v1";
const LOCAL_STORAGE_KEY_PUZZLES = "wordladder_custom_puzzles_v1";
const LOCAL_STORAGE_KEY_DYSLEXIC = "wordladder_dyslexic_font_v1";

const INITIAL_STATS: PlayerStats = {
  completedLevels: {},
  dailyStreaks: 0,
  lastDailySolvedDate: null,
  dailyStreakExpiry: null,
  totalPuzzlesSolved: 0,
  totalMovesMade: 0,
  hintsUsed: 0,
  unlockedAchievements: [],
  arcadeHighScore: 0
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("adventure");
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);

  // States
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
  const [customPuzzles, setCustomPuzzles] = useState<CustomPuzzle[]>([]);
  const [dyslexicFont, setDyslexicFont] = useState<boolean>(false);

  // Notification overlays
  const [newAchievementUnlocked, setNewAchievementUnlocked] = useState<string | null>(null);

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    try {
      const storedStats = localStorage.getItem(LOCAL_STORAGE_KEY_STATS);
      if (storedStats) {
        let loadedStats = JSON.parse(storedStats) as PlayerStats;
        loadedStats = checkAndUpdateDailyStreak(loadedStats);
        setStats(loadedStats);
      } else {
        setStats(INITIAL_STATS);
      }

      const storedPuzzles = localStorage.getItem(LOCAL_STORAGE_KEY_PUZZLES);
      if (storedPuzzles) {
        setCustomPuzzles(JSON.parse(storedPuzzles));
      }

      const storedFont = localStorage.getItem(LOCAL_STORAGE_KEY_DYSLEXIC);
      if (storedFont) {
        setDyslexicFont(JSON.parse(storedFont));
      }
    } catch (e) {
      console.error("Failed to restore progress data", e);
    }
  }, []);

  // Sync back to local storage
  const syncStats = (updated: PlayerStats) => {
    setStats(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY_STATS, JSON.stringify(updated));
  };

  // Evaluate Daily Streak maintenance
  const checkAndUpdateDailyStreak = (statsObj: PlayerStats): PlayerStats => {
    const todayStr = new Date().toDateString();
    if (statsObj.lastDailySolvedDate === todayStr) {
      return statsObj;
    }

    if (statsObj.lastDailySolvedDate) {
      const lastDate = new Date(statsObj.lastDailySolvedDate);
      const today = new Date();
      
      // Calculate date diff values
      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 1) {
        statsObj.dailyStreaks = 0; // Streak broken
      }
    } else {
      statsObj.dailyStreaks = 0;
    }
    return statsObj;
  };

  // Trigger evaluation whenever a puzzle is finished
  const handleSaveProgress = (levelId: string, stars: number, moves: number) => {
    const todayStr = new Date().toDateString();
    const isDaily = levelId.startsWith("daily-");

    const updatedCompletedLevels = { ...stats.completedLevels };
    const existed = updatedCompletedLevels[levelId];
    
    // Track best moves & stars
    const previousStars = existed ? existed.stars : 0;
    const bestMoves = existed ? Math.min(existed.bestMoves, moves) : moves;
    const bestStars = Math.max(previousStars, stars);

    updatedCompletedLevels[levelId] = {
      stars: bestStars,
      bestMoves,
      solvedDate: todayStr
    };

    let updatedStreak = stats.dailyStreaks;
    let lastDailyDate = stats.lastDailySolvedDate;

    if (isDaily && lastDailyDate !== todayStr) {
      if (lastDailyDate) {
        const lastDate = new Date(lastDailyDate);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - lastDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 1) {
          updatedStreak += 1;
        } else {
          updatedStreak = 1;
        }
      } else {
        updatedStreak = 1;
      }
      lastDailyDate = todayStr;
    }

    const totalPuzzlesSolved = Object.keys(updatedCompletedLevels).length;
    
    let updatedStats: PlayerStats = {
      ...stats,
      completedLevels: updatedCompletedLevels,
      dailyStreaks: updatedStreak,
      lastDailySolvedDate: lastDailyDate,
      totalPuzzlesSolved: stats.totalPuzzlesSolved + (existed ? 0 : 1),
      totalMovesMade: stats.totalMovesMade + moves
    };

    // Evaluate newly unlocked accomplishments
    updatedStats = evaluateAchievements(updatedStats, levelId, bestStars);
    syncStats(updatedStats);
  };

  // Dynamic Badges Validator
  const evaluateAchievements = (currentStats: PlayerStats, completedLevelId: string, earnedStars: number): PlayerStats => {
    const unlocked = [...currentStats.unlockedAchievements];
    const triggerUnlock = (achId: string) => {
      if (!unlocked.includes(achId)) {
        unlocked.push(achId);
        setNewAchievementUnlocked(achId);
      }
    };

    // Achievement 1: Scribe Initiate
    triggerUnlock("ach-first-solve");

    // Achievement 2: Perfect Alchemist (3 Gold stars)
    if (earnedStars === 3) {
      triggerUnlock("ach-three-stars");
    }

    // Chapter 1 fully cleared checking
    const ch1Levels = CHAPTERS[0].levels.map(l => l.id);
    const ch1ClearedAll = ch1Levels.every(id => currentStats.completedLevels[id] !== undefined);
    if (ch1ClearedAll) {
      triggerUnlock("ach-ch1-clear");
    }

    // Chapter 2 fully cleared checking
    const ch2Levels = CHAPTERS[1].levels.map(l => l.id);
    const ch2ClearedAll = ch2Levels.every(id => currentStats.completedLevels[id] !== undefined);
    if (ch2ClearedAll) {
      triggerUnlock("ach-ch2-clear");
    }

    // Chapter 3 fully cleared checking
    const ch3Levels = CHAPTERS[2].levels.map(l => l.id);
    const ch3ClearedAll = ch3Levels.every(id => currentStats.completedLevels[id] !== undefined);
    if (ch3ClearedAll) {
      triggerUnlock("ach-ch3-clear");
    }

    // Daily streak 2 days checking
    if (currentStats.dailyStreaks >= 2) {
      triggerUnlock("ach-daily-streak");
    }

    return {
      ...currentStats,
      unlockedAchievements: unlocked
    };
  };

  // Arcade score sync
  const handleUpdateHighScore = (score: number) => {
    const updated: PlayerStats = {
      ...stats,
      arcadeHighScore: Math.max(stats.arcadeHighScore, score)
    };
    syncStats(updated);
  };

  // Custom Puzzles
  const handleSavePuzzle = (p: CustomPuzzle) => {
    const updated = [p, ...customPuzzles];
    setCustomPuzzles(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY_PUZZLES, JSON.stringify(updated));
  };

  const handleDeletePuzzle = (id: string) => {
    const updated = customPuzzles.filter((p) => p.id !== id);
    setCustomPuzzles(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY_PUZZLES, JSON.stringify(updated));
  };

  // Reset Progress Data
  const handleResetData = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY_STATS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_PUZZLES);
    setStats(INITIAL_STATS);
    setCustomPuzzles([]);
    setActiveTab("adventure");
    setSelectedLevel(null);
  };

  // Dyslexic Class syncing
  const handleToggleDyslexic = (val: boolean) => {
    setDyslexicFont(val);
    localStorage.setItem(LOCAL_STORAGE_KEY_DYSLEXIC, JSON.stringify(val));
  };

  // Progress Calculations
  const totalChaptersStars = Object.keys(stats.completedLevels).reduce((acc, currId) => {
    // Only count standard chapters levels (not custom or daily)
    if (currId.startsWith("ch")) {
      return acc + stats.completedLevels[currId].stars;
    }
    return acc;
  }, 0);

  // Play next levels in lists helper
  const handlePlayNextLevel = () => {
    if (!selectedLevel) return;
    
    // Find active chapter
    const currentChapter = CHAPTERS.find(ch => ch.id === selectedLevel.chapterId);
    if (!currentChapter) return;

    const currentIndex = currentChapter.levels.findIndex(l => l.id === selectedLevel.id);
    if (currentIndex !== -1 && currentIndex < currentChapter.levels.length - 1) {
      setSelectedLevel(currentChapter.levels[currentIndex + 1]);
    } else {
      // Completed chapter, head back
      setSelectedLevel(null);
      setActiveTab("adventure");
    }
  };

  // Find active badge descriptors
  const activeUnlcokedBadge = ACHIEVEMENTS.find(a => a.id === newAchievementUnlocked);

  const typographyClassName = dyslexicFont 
    ? "font-sans tracking-wide leading-relaxed font-semibold transition-all text-slate-900" 
    : "font-sans leading-normal text-slate-700 transition-all";

  return (
    <div className={`min-h-screen bg-white bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/20 flex flex-col justify-between text-slate-800 ${typographyClassName} relative overflow-hidden`}>
      {/* Aurora blur elements in background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] animate-pulse" style={{ animationDuration: "12s" }} />
        <div className="absolute top-[40%] right-[10%] w-[40%] h-[40%] rounded-full bg-violet-500/5 blur-[130px] opacity-10 animate-pulse" style={{ animationDuration: "9s" }} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen justify-between w-full">
        {/* 1. Main Navigation Header */}
        {selectedLevel === null && (
          <Menu 
            activeTab={activeTab} 
            setActiveTab={(tab) => {
              setActiveTab(tab);
              setSelectedLevel(null);
            }}
            stats={stats}
            totalChaptersStars={totalChaptersStars}
          />
        )}

        {/* 2. Central Interactive Game Containers */}
        <main className="flex-1 w-full flex flex-col justify-start pb-16">
          
          {/* Playboard mode */}
          {selectedLevel !== null ? (
            <GameBoard 
              level={selectedLevel}
              onBack={() => {
                setSelectedLevel(null);
                // Switch appropriate tab for daily or custom
                if (selectedLevel.chapterId === "daily") {
                  setActiveTab("daily");
                } else if (selectedLevel.chapterId === "custom") {
                  setActiveTab("workshop");
                } else {
                  setActiveTab("adventure");
                }
              }}
              onSaveProgress={handleSaveProgress}
              onNextLevel={handlePlayNextLevel}
              stats={stats}
            />
          ) : (
            /* Normal menu pane display */
            <>
              {activeTab === "adventure" && (
                <LevelSelector 
                  stats={stats} 
                  onSelectLevel={(level) => setSelectedLevel(level)} 
                />
              )}

              {activeTab === "daily" && (
                <DailyChallenge 
                  stats={stats}
                  onPlayDaily={(level) => setSelectedLevel(level)}
                />
              )}

              {activeTab === "arcade" && (
                <ArcadeMode highScore={stats.arcadeHighScore} onUpdateHighScore={handleUpdateHighScore} />
              )}

              {activeTab === "workshop" && (
                <PuzzleCreator 
                  customPuzzles={customPuzzles}
                  onSavePuzzle={handleSavePuzzle}
                  onDeletePuzzle={handleDeletePuzzle}
                  onPlayCustom={(level) => setSelectedLevel(level)}
                />
              )}

              {activeTab === "stats" && (
                <StatsDashboard stats={stats} onResetData={handleResetData} dyslexicFont={dyslexicFont} setDyslexicFont={handleToggleDyslexic} />
              )}

              {activeTab === "howtoplay" && (
                <HowToPlay />
              )}
            </>
          )}
        </main>

        {/* 3. Global footer */}
        <footer className="w-full bg-white/70 backdrop-blur-md border-t border-slate-200/80 py-6 text-center text-xs font-mono text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>Word Ladder Quest v1.2 • Offline Alchemist Engine</span>
            <span className="text-[10px] text-slate-400">Ambient Light Glass Edition • Responsive Layout</span>
          </div>
        </footer>

        {/* 4. Newly Unlocked Badge Popup Dialogue */}
        <AnimatePresence>
          {newAchievementUnlocked && activeUnlcokedBadge && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 text-center max-w-sm w-full space-y-4 shadow-2xl border border-slate-200"
                id="achievement-alert-dialog"
              >
                <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-amber-500/5">
                  <Award className="w-8 h-8 fill-amber-500/20 animate-bounce" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-600 font-bold">
                    ACCOMPLISHMENT UNLOCKED
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    {activeUnlcokedBadge.title}
                  </h3>
                  <p className="text-slate-650 text-xs leading-relaxed">
                    {activeUnlcokedBadge.description}
                  </p>
                </div>

                <button
                  onClick={() => setNewAchievementUnlocked(null)}
                  className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow-md"
                  id="close-achievement-alert-btn"
                >
                  Engrave Accomplishment
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
