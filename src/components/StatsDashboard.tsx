/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  BarChart2, 
  Award, 
  BookMarked,
  Search, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Star, 
  Flame, 
  HelpCircle,
  Hash,
  Heart,
  ChevronRight,
  Sparkles,
  Compass,
  Crown,
  Zap,
  Calendar,
  BookOpen,
  Type
} from "lucide-react";
import { PlayerStats } from "../types";
import { ACHIEVEMENTS } from "../data/levels";
import { OFFLINE_DICTIONARY, ALL_WORDS_SET } from "../utils/dictionary";
import { isSoundEnabled, setSoundEnabled } from "../utils/audio";

interface StatsDashboardProps {
  stats: PlayerStats;
  onResetData: () => void;
  dyslexicFont: boolean;
  setDyslexicFont: (val: boolean) => void;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  Compass: Compass,
  Star: Star,
  Award: Award,
  BookOpen: BookOpen,
  Crown: Crown,
  Zap: Zap,
  Calendar: Calendar,
};

export default function StatsDashboard({ 
  stats, 
  onResetData,
  dyslexicFont,
  setDyslexicFont
}: StatsDashboardProps) {
  const [dictionarySearch, setDictionarySearch] = useState<string>("");
  const [soundOn, setSoundOn] = useState<boolean>(isSoundEnabled());
  const [resetConfirm, setResetConfirm] = useState<boolean>(false);

  // Toggle sound setting
  const handleToggleSound = () => {
    const nextVal = !soundOn;
    setSoundOn(nextVal);
    setSoundEnabled(nextVal);
  };

  // Perform dictionary lookup
  const searchNormalized = dictionarySearch.toLowerCase().trim();
  const foundDefinition = searchNormalized ? OFFLINE_DICTIONARY[searchNormalized] : null;
  const isWordInDict = searchNormalized ? ALL_WORDS_SET.has(searchNormalized) : false;

  // Total stars count
  const totalStars = Object.values(stats.completedLevels).reduce((acc, curr) => acc + curr.stars, 0);

  return (
    <div className="w-full py-6 px-4 max-w-7xl mx-auto space-y-8 animate-fade-in" id="scribe-vault-view">
      
      {/* 1. Header & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex items-center space-x-4 shadow-xl">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/15">
            <Star className="w-6 h-6 fill-amber-450/10 text-amber-400" />
          </div>
          <div>
            <p className="text-indigo-300 text-[11px] font-mono uppercase tracking-wider">Total Stars</p>
            <p className="text-2xl font-black text-white">{totalStars}</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex items-center space-x-4 shadow-xl">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/15">
            <Flame className="w-6 h-6 fill-rose-455/10 text-rose-400 animate-pulse" />
          </div>
          <div>
            <p className="text-indigo-300 text-[11px] font-mono uppercase tracking-wider">Active Streak</p>
            <p className="text-2xl font-black text-white">{stats.dailyStreaks} days</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex items-center space-x-4 shadow-xl">
          <div className="p-3 bg-indigo-500/10 text-indigo-300 rounded-xl border border-indigo-500/15">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <p className="text-indigo-300 text-[11px] font-mono uppercase tracking-wider">Solve Ratio</p>
            <p className="text-2xl font-black text-white">{stats.totalPuzzlesSolved} solved</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex items-center space-x-4 shadow-xl">
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/15">
            <Zap className="w-6 h-6 text-sky-450" />
          </div>
          <div>
            <p className="text-indigo-300 text-[11px] font-mono uppercase tracking-wider">Arcade Record</p>
            <p className="text-2xl font-black text-white">{stats.arcadeHighScore} pts</p>
          </div>
        </div>
      </div>

      {/* 2. Main split panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Achievements Hall */}
        <div className="lg:col-span-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center space-x-2 border-b border-white/5 pb-4">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-white text-lg">Alchemist Accomplishments</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ACHIEVEMENTS.map((ach) => {
              const isUnlocked = stats.unlockedAchievements.includes(ach.id);
              const IconComponent = iconMap[ach.icon] || Award;

              return (
                <div 
                  key={ach.id} 
                  className={`flex space-x-4 p-4 rounded-2xl border transition duration-200 ${
                    isUnlocked 
                      ? "bg-slate-950/40 border-white/10 text-white shadow-md shadow-black/15" 
                      : "bg-white/5 border-dashed border-white/5 opacity-40 text-slate-400"
                  }`}
                  id={`ach-card-${ach.id}`}
                >
                  <div className={`p-3 rounded-xl shrink-0 ${
                    isUnlocked ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-white/5 text-slate-500"
                  }`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white flex items-center space-x-1.5">
                      <span>{ach.title}</span>
                      {isUnlocked && <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold">Earned</span>}
                    </h4>
                    <p className="text-slate-300 text-xs mt-1 leading-relaxed">{ach.description}</p>
                    <p className="text-[10px] font-mono text-indigo-300 mt-2 italic border-t border-white/5 pt-1.5">
                      Cond: {ach.condition}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Archive Glossary & settings */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Dictionary search */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
              <BookMarked className="w-5 h-5 text-indigo-400" />
              <h3 className="font-extrabold text-white text-base">Scribe Glossary</h3>
            </div>
            <p className="text-xs text-slate-400">Search words from the level dictionary to learn active definitions.</p>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Type e.g. COLD, CAT, SHARK..."
                value={dictionarySearch}
                onChange={(e) => setDictionarySearch(e.target.value.toUpperCase())}
                className="w-full bg-slate-950/60 border border-white/10 text-white rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-mono tracking-wider focus:outline-none focus:border-indigo-400/40 transition"
                id="glossary-search-input"
              />
            </div>

            {dictionarySearch && (
              <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl text-xs space-y-1">
                {foundDefinition ? (
                  <div className="space-y-1.5">
                    <p className="font-bold font-mono text-indigo-200 uppercase tracking-widest text-sm flex items-center justify-between">
                      <span>{dictionarySearch}</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15">VALID WORD</span>
                    </p>
                    <p className="text-slate-300 leading-relaxed italic">{foundDefinition}</p>
                  </div>
                ) : isWordInDict ? (
                  <div>
                    <p className="font-bold font-mono text-indigo-200 uppercase">{dictionarySearch}</p>
                    <p className="text-slate-400 leading-relaxed italic mt-1">This word is valid in-game, but no offline explanation is cached yet. Try another!</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold font-mono text-slate-400 uppercase">{dictionarySearch}</p>
                    <p className="text-rose-400 leading-relaxed font-mono text-[11px] mt-1">🚫 Word not present in our Ladder dictionary.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Setting panel drawer */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-extrabold text-white text-base border-b border-white/5 pb-3">Tome Settings</h3>
            
            {/* Audio Toggle */}
            <button
              onClick={handleToggleSound}
              className="flex justify-between items-center w-full py-2.5 px-3 hover:bg-white/5 rounded-xl transition text-left outline-none cursor-pointer"
              id="toggle-sound-settings-btn"
            >
              <div className="flex items-center space-x-2.5">
                {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-550" />}
                <span className="text-xs sm:text-sm font-medium text-slate-300">Synthesizer Sound FX</span>
              </div>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-sm ${
                soundOn ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-950/40 text-slate-400"
              }`}>
                {soundOn ? "ON" : "OFF"}
              </span>
            </button>

            {/* Dyslexia / Accessibility font scale toggle */}
            <button
              onClick={() => setDyslexicFont(!dyslexicFont)}
              className="flex justify-between items-center w-full py-2.5 px-3 hover:bg-white/5 rounded-xl transition text-left outline-none cursor-pointer"
              id="toggle-dyslexic-font-btn"
            >
              <div className="flex items-center space-x-2.5">
                <Type className="w-4 h-4 text-indigo-450" />
                <span className="text-xs sm:text-sm font-medium text-slate-300">Clean Weighted Font</span>
              </div>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-sm ${
                dyslexicFont ? "bg-indigo-550/15 text-indigo-300 border border-indigo-500/20" : "bg-slate-955/40 text-slate-400"
              }`}>
                {dyslexicFont ? "ACTIVE" : "DEFAULT"}
              </span>
            </button>

            {/* Reset Stats buttons */}
            <div className="border-t border-white/5 pt-3.5 space-y-2">
              {!resetConfirm ? (
                <button
                  onClick={() => setResetConfirm(true)}
                  className="flex items-center space-x-2 w-full py-2.5 px-3 hover:bg-rose-500/10 text-rose-455 rounded-xl transition text-left outline-none text-xs sm:text-sm font-medium cursor-pointer"
                  id="reset-stats-btn"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Wipe Archives Data</span>
                </button>
              ) : (
                <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-2xl space-y-2 text-xs">
                  <p className="font-bold text-rose-300">Are you absolutely sure?</p>
                  <p className="text-slate-400 text-[11px]">All stars, streaks, unlocked badges, and custom workshop logs will be deleted forever.</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={onResetData}
                      className="bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                      id="confirm-reset-btn"
                    >
                      Delete Forever
                    </button>
                    <button
                      onClick={() => setResetConfirm(false)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                      id="cancel-reset-btn"
                    >
                      Keep It
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
