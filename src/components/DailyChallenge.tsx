/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Calendar, 
  Flame, 
  Play, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Trophy,
  Star
} from "lucide-react";
import { Level, PlayerStats } from "../types";
import { ALL_WORDS_SET } from "../utils/dictionary";
import { getSeededSolvablePair } from "../utils/helpers";

interface DailyChallengeProps {
  stats: PlayerStats;
  onPlayDaily: (level: Level) => void;
}

export default function DailyChallenge({ stats, onPlayDaily }: DailyChallengeProps) {
  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  
  // Date seed calculation (YYYYMMDD)
  const todaySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

  // Generate 3 date-seeded daily levels with varying difficulty and length
  const easyPair = getSeededSolvablePair(3, ALL_WORDS_SET, todaySeed + 100, 3, 3);
  const mediumPair = getSeededSolvablePair(4, ALL_WORDS_SET, todaySeed + 200, 3, 4);
  const hardPair = getSeededSolvablePair(5, ALL_WORDS_SET, todaySeed + 300, 4, 5);

  const easyPar = easyPair.path.length - 1;
  const mediumPar = mediumPair.path.length - 1;
  const hardPar = hardPair.path.length - 1;

  const dailyId = `daily-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

  // Define the set of 3 daily quests
  const quests = [
    {
      id: `${dailyId}-easy`,
      title: "Novice Scribe's Trial",
      start: easyPair.start,
      target: easyPair.end,
      par: easyPar,
      difficulty: "Easy" as const,
      description: "A fast-paced 3-letter sequence to warm up your linguistic engines.",
      badge: "Scribe"
    },
    {
      id: `${dailyId}-medium`,
      title: "Adept Alchemist's Trial",
      start: mediumPair.start,
      target: mediumPair.end,
      par: mediumPar,
      difficulty: "Medium" as const,
      description: "The classic 4-letter corridor shift. Requires smooth planning.",
      badge: "Alchemist"
    },
    {
      id: `${dailyId}-hard`,
      title: "Archmage Scholar's Trial",
      start: hardPair.start,
      target: hardPair.end,
      par: hardPar,
      difficulty: "Hard" as const,
      description: "Elite 5-letter navigation space. Only true word-craft scholars conquer this.",
      badge: "Scholar"
    }
  ];

  // Selected quest tab (default to Medium/Adept)
  const [selectedQuestIdx, setSelectedQuestIdx] = useState<number>(1);
  const activeQuest = quests[selectedQuestIdx];

  // Specific completion checking
  const activeQuestSolved = stats.completedLevels[activeQuest.id] !== undefined;
  const activeRecord = stats.completedLevels[activeQuest.id];

  // Total daily trials solved today helper
  const solvedCountToday = quests.filter(q => stats.completedLevels[q.id] !== undefined).length;

  const handlePlay = () => {
    const dailyLevel: Level = {
      id: activeQuest.id,
      chapterId: "daily",
      title: `Daily Challenge: ${activeQuest.title}`,
      startWord: activeQuest.start,
      targetWord: activeQuest.target,
      par: activeQuest.par,
      difficulty: activeQuest.difficulty
    };
    onPlayDaily(dailyLevel);
  };

  // Check if daily streak is safe
  const isStreakHot = stats.dailyStreaks > 0;

  return (
    <div className="w-full py-6 px-4 max-w-7xl mx-auto space-y-6 animate-fade-in" id="daily-challenge-view">
      
      {/* Dynamic welcome header */}
      <div className="bg-gradient-to-tr from-rose-500/10 via-rose-500/5 to-transparent border border-rose-300 backdrop-blur-md rounded-[2rem] p-6 sm:p-8 text-slate-800 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="relative z-10 space-y-2">
          <span className="bg-rose-500/10 text-rose-600 font-mono text-[9px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full border border-rose-200">
            Chronology Corridor
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-rose-950">Daily Scribe's Trial Set</h2>
          <p className="text-rose-600 text-xs sm:text-sm font-extrabold">{dateString}</p>
          <p className="text-slate-600 text-xs sm:text-sm max-w-xl leading-relaxed mt-2 font-medium">
            Every 24 hours, three custom date-seeded quests of Easy, Medium, and Hard tiers are refreshed. Keep your alchemist flame alive by engineering your daily word mutations!
          </p>
        </div>
      </div>

      {/* Grid containing selector tabs, active trial panel, and streak tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Active daily card & selector tabs */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Quest Tier Selectors */}
          <div className="grid grid-cols-3 gap-3">
            {quests.map((q, idx) => {
              const solved = stats.completedLevels[q.id] !== undefined;
              const isSelected = selectedQuestIdx === idx;
              
              let tierColor = "border-slate-200 hover:border-slate-350 bg-white";
              if (isSelected) {
                if (idx === 0) tierColor = "border-emerald-400 bg-emerald-500/5 text-emerald-800 shadow-sm shadow-emerald-500/10";
                if (idx === 1) tierColor = "border-indigo-400 bg-indigo-500/5 text-indigo-800 shadow-sm shadow-indigo-500/10";
                if (idx === 2) tierColor = "border-rose-450 bg-rose-500/5 text-rose-800 shadow-sm shadow-rose-500/10";
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setSelectedQuestIdx(idx)}
                  className={`p-4 rounded-2xl border transition-all text-left relative flex flex-col justify-between h-28 cursor-pointer select-none outline-none ${tierColor}`}
                  id={`quest-tier-tab-${idx}`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className={`text-[9px] font-black font-mono uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      q.difficulty === "Easy" ? "bg-emerald-100 text-emerald-700" :
                      q.difficulty === "Medium" ? "bg-indigo-100 text-indigo-700" :
                      "bg-rose-100 text-rose-700"
                    }`}>
                      {q.difficulty}
                    </span>
                    {solved && <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50" />}
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm tracking-tight truncate uppercase">
                      {q.badge} Quest
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono font-bold mt-1">
                      {q.start.length} LETTERS • PAR {q.par}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Quest Panel */}
          <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-md flex flex-col justify-between animate-fade-in min-h-[300px]">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">
                  Active Mission Dashboard
                </span>
                {activeQuestSolved ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-black bg-emerald-500/10 border border-emerald-200 px-2.5 py-1 rounded-full uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Engraved</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-rose-600 font-black bg-rose-500/10 border border-rose-200 px-2.5 py-1 rounded-full uppercase">
                    <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                    <span>Awaiting Initiation</span>
                  </span>
                )}
              </div>

              <div>
                <span className="text-xs font-mono font-black text-rose-500 uppercase tracking-wider">
                  TODAY'S TIER: {activeQuest.difficulty} ({activeQuest.start.length} letters)
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 uppercase">
                  {activeQuest.title}
                </h3>
                <p className="text-slate-500 text-xs mt-1.5 font-medium leading-relaxed max-w-xl">
                  {activeQuest.description}
                </p>
              </div>

              {/* Mutation Box */}
              <div className="py-4 px-6 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center font-mono font-black text-lg text-slate-805 max-w-sm">
                <span className="text-indigo-600 tracking-widest">{activeQuest.start}</span>
                <ArrowRight className="w-5 h-5 text-slate-400" />
                <span className="text-rose-500 tracking-widest">{activeQuest.target}</span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed font-semibold max-w-md">
                Find the route with the fewest words. Every step must mutate exactly one character. Parsed optimal score is <strong className="text-slate-800 font-extrabold">{activeQuest.par} steps</strong>.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-100 mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {activeQuestSolved ? (
                <div className="space-y-0.5">
                  <p className="text-[10px] font-mono text-slate-400 font-bold uppercase">Your Engraving Record</p>
                  <p className="text-xs sm:text-sm font-black text-emerald-600 flex items-center gap-1.5">
                    Completed in {activeRecord?.bestMoves} transitions 
                    <span className="flex items-center text-amber-500">
                      {"★".repeat(activeRecord?.stars || 3)}
                    </span>
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-slate-450 font-mono font-bold uppercase">
                  * Streak updates automatically upon any daily trial solve.
                </p>
              )}

              <button
                onClick={handlePlay}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-550 border border-emerald-400/20 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer font-mono select-none"
                id="begin-daily-btn"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>{activeQuestSolved ? "Replay Stage" : "Begin Trial"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Streaks & Calendar tracker panel */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-md flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-2">
              <Flame className="w-5 h-5 text-rose-500 fill-rose-500/20 animate-pulse" />
              <span>Streak Chronology Log</span>
            </h3>

            <div className="flex items-center space-x-4 py-4 px-5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="text-3xl text-amber-500 font-black tracking-tighter shrink-0">
                {stats.dailyStreaks}d
              </div>
              <div>
                <p className="text-[9px] font-mono text-indigo-600 uppercase tracking-widest font-black">ACTIVE FLAME</p>
                <p className="text-xs text-slate-500 mt-0.5 font-bold leading-relaxed">
                  {isStreakHot 
                    ? "Alchemist flame is roaring! Solve today's tasks to keep it burning hot!" 
                    : "The flame rests. Complete your daily trial mutations to get back on track!"
                  }
                </p>
              </div>
            </div>

            {/* Trial Almanac Calendar */}
            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-black">Trial Almanac Calendar</p>
              <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-mono">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <span key={i} className="text-indigo-600 font-black">{d}</span>
                ))}
                
                {/* Spacers for month start weekday offset */}
                {Array.from({ length: new Date(today.getFullYear(), today.getMonth(), 1).getDay() }).map((_, idx) => (
                  <span key={`empty-${idx}`} className="py-1.5" />
                ))}

                {Array.from({ length: new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const isToday = dayNum === today.getDate();
                  const checkDailyId = `daily-${today.getFullYear()}-${today.getMonth() + 1}-${dayNum}`;
                  
                  // Highlight solved calendar block if ANY of the three tier daily challenges or older base daily level is completed
                  const solved = 
                    stats.completedLevels[checkDailyId] !== undefined ||
                    stats.completedLevels[`${checkDailyId}-easy`] !== undefined ||
                    stats.completedLevels[`${checkDailyId}-medium`] !== undefined ||
                    stats.completedLevels[`${checkDailyId}-hard`] !== undefined;

                  return (
                    <span 
                      key={dayNum} 
                      className={`py-1.5 rounded-md font-bold border transition-all ${
                        solved 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-300 font-black shadow-sm" 
                          : isToday 
                          ? "bg-rose-500 text-white border border-rose-450 font-black animate-pulse" 
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}
                    >
                      {dayNum}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-5 flex justify-between text-[9px] font-mono text-slate-400 font-bold uppercase">
            <span>Completed Today: {solvedCountToday}/3</span>
            <span>Efficiency: {solvedCountToday > 0 ? `${Math.round((solvedCountToday / 3) * 100)}%` : "0%"}</span>
          </div>
        </div>

      </div>

    </div>
  );
}
