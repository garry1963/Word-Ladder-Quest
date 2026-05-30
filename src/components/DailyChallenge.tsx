/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Calendar, 
  Flame, 
  Play, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Level, PlayerStats } from "../types";

interface DailyChallengeProps {
  stats: PlayerStats;
  onPlayDaily: (level: Level) => void;
}

export default function DailyChallenge({ stats, onPlayDaily }: DailyChallengeProps) {
  // Deterministic daily puzzle based on date
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const dayIndex = today.getDate(); // 1 to 31

  // Set of 10 highly connected 4-letter levels (all easy levels have min 3 steps)
  const dailyPuzzlesList = [
    { start: "COLD", target: "WARM", title: "The Cosmic Shift", par: 4, difficulty: "Medium" as const },
    { start: "SOCK", target: "BACK", title: "Grave Digging", par: 3, difficulty: "Medium" as const },
    { start: "MIND", target: "FINE", title: "Crystalline Logic", par: 3, difficulty: "Hard" as const },
    { start: "BARE", target: "TONE", title: "Sovereign Domain", par: 4, difficulty: "Expert" as const },
    { start: "BOON", target: "COOP", title: "Scholar's Shelf", par: 3, difficulty: "Easy" as const },
    { start: "GATE", target: "LAKE", title: "Temporal Portal", par: 3, difficulty: "Easy" as const },
    { start: "BEAR", target: "HEAL", title: "Clockwork Wilds", par: 3, difficulty: "Easy" as const },
    { start: "ZONE", target: "COPE", title: "Fossilized Sector", par: 3, difficulty: "Easy" as const },
    { start: "WIND", target: "LINE", title: "Sailor's Path", par: 3, difficulty: "Medium" as const },
    { start: "BOAT", target: "BOOK", title: "Voyage Log", par: 3, difficulty: "Hard" as const }
  ];

  // Daily puzzle determination
  const puzzleIndex = dayIndex % dailyPuzzlesList.length;
  const currentDailyPair = dailyPuzzlesList[puzzleIndex];

  // Unique ID for daily challenge, e.g. "daily-2026-05-29"
  const dailyId = `daily-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  const isDailySolved = stats.completedLevels[dailyId] !== undefined;
  const record = stats.completedLevels[dailyId];

  // Check if daily streak is in danger or safe
  const isStreakHot = stats.dailyStreaks > 0;

  const handlePlay = () => {
    const dailyLevel: Level = {
      id: dailyId,
      chapterId: "daily",
      title: `Daily Challenge: ${currentDailyPair.title}`,
      startWord: currentDailyPair.start,
      targetWord: currentDailyPair.target,
      par: currentDailyPair.par,
      difficulty: currentDailyPair.difficulty
    };
    onPlayDaily(dailyLevel);
  };

  return (
    <div className="w-full py-6 px-4 max-w-7xl mx-auto space-y-6 animate-fade-in" id="daily-challenge-view">
      
      {/* Dynamic welcome header */}
      <div className="bg-gradient-to-tr from-rose-500/10 via-rose-500/5 to-transparent border border-rose-300 backdrop-blur-md rounded-[2rem] p-6 sm:p-8 text-slate-800 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 space-y-2">
          <span className="bg-rose-500/10 text-rose-600 font-mono text-[9px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full border border-rose-200">
            Chronology Corridor
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-rose-955">Daily Scribe's Trial</h2>
          <p className="text-rose-650 text-xs sm:text-sm font-extrabold">{dateString}</p>
          <p className="text-slate-600 text-xs sm:text-sm max-w-xl leading-relaxed mt-2 font-medium">
            Engage with a fresh, highly structured chronological challenge every 24 hours. Solve with maximum precision to build a permanent Daily Streak and engrave your calendar!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Active daily card */}
        <div className="md:col-span-7 bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">Active Horizon</span>
              {isDailySolved ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-black bg-emerald-500/10 border border-emerald-200 px-2.5 py-1 rounded-full uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ENGRAVED</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-rose-600 font-black bg-rose-500/10 border border-rose-200 px-2.5 py-1 rounded-full uppercase">
                  <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                  <span>AWAITING COMMENCEMENT</span>
                </span>
              )}
            </div>

            <div>
              <p className="text-xs font-mono font-black text-rose-500 uppercase tracking-wider mt-1">TODAY'S MISSION: {currentDailyPair.difficulty}</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-850 tracking-tight mt-1 uppercase">
                {currentDailyPair.title}
              </h3>
            </div>

            <div className="py-4 px-6 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center font-mono font-black text-lg text-slate-800 max-w-sm">
              <span className="text-indigo-600 tracking-widest">{currentDailyPair.start}</span>
              <ArrowRight className="w-5 h-5 text-slate-400" />
              <span className="text-rose-500 tracking-widest">{currentDailyPair.target}</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-semibold max-w-md">
              Calculate a valid transition using legal single-character alterations. Par for today is optimal at <strong className="text-slate-800 font-extrabold">{currentDailyPair.par} steps</strong>.
            </p>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {isDailySolved ? (
              <div className="space-y-0.5">
                <p className="text-[10px] font-mono text-slate-400 font-bold uppercase">Optimal Solution</p>
                <p className="text-sm font-black text-emerald-600">
                  Completed in {record?.bestMoves} transitions ({record?.stars} ★)
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-slate-450 font-mono font-bold uppercase">
                * Streak multiplies instantly upon completion!
              </p>
            )}

            <button
              onClick={handlePlay}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-550 border border-emerald-400/20 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer font-mono select-none"
              id="begin-daily-btn"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>{isDailySolved ? "Replay Stage" : "Begin Trial"}</span>
            </button>
          </div>
        </div>        {/* Streaks & Calendar card */}
        <div className="md:col-span-5 bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-md flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="font-semibold text-slate-805 text-sm uppercase tracking-wider flex items-center space-x-2">
              <Flame className="w-5 h-5 text-rose-500 fill-rose-500/20 animate-pulse" />
              <span className="text-slate-800">Streak Chronology Log</span>
            </h3>

            <div className="flex items-center space-x-4 py-4 px-5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="text-3xl text-amber-500 font-black tracking-tighter shrink-0">
                {stats.dailyStreaks}d
              </div>
              <div>
                <p className="text-[9px] font-mono text-indigo-600 uppercase tracking-widest font-black">ACTIVE FLAME</p>
                <p className="text-xs text-slate-505 mt-0.5 font-bold leading-relaxed">
                  {isStreakHot 
                    ? "Alchemist flame is roaring! Solve today's task to keep it burning hot!" 
                    : "The fire is resting. Feed the alchemist fire today of your daily progression!"
                  }
                </p>
              </div>
            </div>

            {/* Simulated Calendar Tracker */}
            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-black">Trial Almanac Calendar</p>
              <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-mono">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <span key={i} className="text-indigo-600 font-black">{d}</span>
                ))}
                {Array.from({ length: 28 }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const isToday = dayNum === today.getDate();
                  const solved = isToday && isDailySolved;

                  return (
                    <span 
                      key={idx} 
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
            <span>Server sync: offline-ready</span>
            <span>Efficiency: {isDailySolved ? "100%" : "0%"}</span>
          </div>
        </div>

      </div>

    </div>
  );
}
