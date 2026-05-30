/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  BookOpen, 
  ChevronRight, 
  Star, 
  Lock, 
  Play, 
  CheckCircle2, 
  Info,
  Trophy
} from "lucide-react";
import { CHAPTERS } from "../data/levels";
import { Level, PlayerStats, Chapter } from "../types";

interface LevelSelectorProps {
  stats: PlayerStats;
  onSelectLevel: (level: Level) => void;
}

export default function LevelSelector({ stats, onSelectLevel }: LevelSelectorProps) {
  const [selectedChapterId, setSelectedChapterId] = useState<string>("ch1");

  // Determine if a chapter is unlocked
  const isChapterUnlocked = (chapter: Chapter): boolean => {
    if (chapter.id === "ch1") return true;

    // To unlock Chapter 2, need at least 3 levels solved in Chapter 1
    if (chapter.id === "ch2") {
      const ch1LevelsSolved = CHAPTERS[0].levels.filter(
        (lvl) => stats.completedLevels[lvl.id] !== undefined
      ).length;
      return ch1LevelsSolved >= 3;
    }

    // To unlock Chapter 3, need at least 3 levels solved in Chapter 2
    if (chapter.id === "ch3") {
      const ch2LevelsSolved = CHAPTERS[1].levels.filter(
        (lvl) => stats.completedLevels[lvl.id] !== undefined
      ).length;
      return ch2LevelsSolved >= 3;
    }

    return false;
  };

  // Render chapters and levels inside active chapter
  const activeChapter = CHAPTERS.find((ch) => ch.id === selectedChapterId) || CHAPTERS[0];

  return (
    <div className="w-full py-6 px-4 max-w-7xl mx-auto animate-fade-in" id="level-selector-view">
      
      {/* Hero Welcome banner */}
      <div className="bg-gradient-to-tr from-slate-50 via-slate-100 to-indigo-50/40 border border-slate-200/80 rounded-[2rem] p-6 sm:p-8 text-slate-800 mb-8 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl" />
        
        <div className="relative z-10 space-y-2 max-w-xl">
          <span className="bg-rose-500/10 text-rose-600 font-mono text-[9px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full border border-rose-200">
            Adventure Map
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-slate-900">The Scribe's Journey</h2>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-semibold">
            Travel through progressive dimensions of word alchemy. Mutate one character at a time to complete the sacred word ladders. Solve within Par to claim 3 Gold Stars!
          </p>
        </div>

        <div className="mt-4 sm:mt-0 relative z-10 bg-white/80 backdrop-blur-md border border-slate-200/80 p-4 rounded-2xl flex items-center space-x-3.5 shrink-0 self-stretch sm:self-center shadow-sm">
          <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center font-bold border border-amber-205">
            <Trophy className="w-6 h-6 fill-amber-500/10 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">MUTATION LEVEL</p>
            <p className="text-lg font-black text-slate-800">
              {Object.keys(stats.completedLevels).length} / {CHAPTERS.reduce((acc, ch) => acc + ch.levels.length, 0)} Solved
            </p>
          </div>
        </div>
      </div>

      {/* Chapters Tabs Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {CHAPTERS.map((chapter) => {
          const unlocked = isChapterUnlocked(chapter);
          const isSelected = selectedChapterId === chapter.id;

          // Calculate completed percentage for this chapter
          const completedCount = chapter.levels.filter(
            (lvl) => stats.completedLevels[lvl.id] !== undefined
          ).length;
          const starsEarnedInChapter = chapter.levels.reduce((acc, lvl) => {
            const levelSave = stats.completedLevels[lvl.id];
            return acc + (levelSave ? levelSave.stars : 0);
          }, 0);

          return (
            <button
              key={chapter.id}
              onClick={() => unlocked && setSelectedChapterId(chapter.id)}
              disabled={!unlocked}
              className={`text-left p-5 rounded-[2rem] border transition-all duration-300 relative outline-none select-none flex flex-col justify-between h-44 group ${
                isSelected
                  ? "border-violet-400 bg-violet-500/10 shadow-md shadow-violet-500/5 text-slate-900 font-extrabold"
                  : unlocked
                  ? "border-slate-205 bg-white hover:bg-slate-50 hover:border-slate-350 cursor-pointer shadow-md text-slate-805"
                  : "border-slate-150 bg-slate-50/50 cursor-not-allowed opacity-45 text-slate-400"
              }`}
              id={`chapter-card-${chapter.id}`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg ${
                    isSelected ? "bg-violet-500/20 text-violet-750 border border-violet-500/30" : "bg-slate-100 text-slate-655"
                  }`}>
                    {chapter.levels[0].startWord.length} Letter Keys
                  </span>
                  {!unlocked ? (
                    <Lock className="w-4 h-4 text-slate-400" />
                  ) : completedCount === chapter.levels.length ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50 text-emerald-600" />
                  ) : null}
                </div>

                <h3 className="font-black text-slate-850 mt-2.5 uppercase text-sm sm:text-base group-hover:text-indigo-650 transition-colors">
                  {chapter.title}
                </h3>
                <p className="text-slate-500 text-xs mt-1.5 font-medium line-clamp-2">
                  {chapter.description}
                </p>
              </div>

              <div className="mt-4 flex justify-between items-center w-full">
                {unlocked ? (
                  <>
                    <div className="flex items-center space-x-2 text-xs font-bold">
                      <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{completedCount}/{chapter.levels.length} Solved</span>
                      <span className="text-slate-350">•</span>
                      <span className="flex items-center text-amber-550 font-black">
                        ★ {starsEarnedInChapter}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </>
                ) : (
                  <span className="text-[9px] text-[#FF6B6B] font-mono font-black uppercase">
                    Unlocks after Chapter {chapter.id === "ch2" ? "1" : "2"}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Levels Grid under Active Chapter */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Active Stage: {activeChapter.title}</h3>
            <p className="text-xs text-slate-500 font-semibold font-semibold">Transform the words one letter at a time within Par limits.</p>
          </div>
          <span className="text-[10px] bg-white border border-slate-205 text-indigo-750 px-2.5 py-1 rounded-md font-mono uppercase font-black shadow-sm">
            {activeChapter.levels.length} Stages
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeChapter.levels.map((level, index) => {
            const record = stats.completedLevels[level.id];
            const isSolved = record !== undefined;
            const stars = record ? record.stars : 0;

            let difficultyColor = "bg-emerald-50 text-emerald-700 border-emerald-200 font-extrabold";
            if (level.difficulty === "Medium") difficultyColor = "bg-sky-550/10 text-sky-700 border-sky-200 font-extrabold";
            else if (level.difficulty === "Hard") difficultyColor = "bg-orange-55/15 text-orange-700 border-orange-200 font-extrabold";
            else if (level.difficulty === "Expert") difficultyColor = "bg-rose-50 text-rose-700 border-rose-200 font-extrabold";

            return (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                className="flex flex-col justify-between bg-white border border-slate-200 shadow-sm rounded-3xl p-5 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md transition-all duration-300 relative group"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-lg border ${difficultyColor}`}>
                      {level.difficulty}
                    </span>
                    <span className="text-slate-500 text-xs font-mono font-black">PAR: {level.par} STEPS</span>
                  </div>

                  <h4 className="font-extrabold text-slate-800 text-base uppercase tracking-tight">{level.title}</h4>

                  {/* Start -> Target previews */}
                  <div className="mt-3.5 py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between font-mono text-xs font-bold">
                    <span className="text-indigo-650 tracking-widest">{level.startWord}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                    <span className="text-rose-500 tracking-widest">{level.targetWord}</span>
                  </div>

                  {/* Star indicators */}
                  <div className="flex space-x-1.5 mt-4">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-5 h-5 ${
                          s <= stars ? "fill-amber-400 text-amber-500 animate-bounce" : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  {isSolved ? (
                    <div className="text-xs text-emerald-600 font-extrabold font-mono">
                      BEST: {record.bestMoves} STEP{record.bestMoves > 1 ? "S" : ""}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">UNSOLVED</div>
                  )}

                  <button
                    onClick={() => onSelectLevel(level)}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer uppercase select-none font-mono shadow-md shadow-indigo-600/15 border border-indigo-400/20"
                    id={`play-level-${level.id}`}
                  >
                    <Play className="w-3 h-3 fill-white text-white" />
                    <span>{isSolved ? "Replay" : "Begin"}</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
