/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
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
  Type,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  Plus,
  X
} from "lucide-react";
import { PlayerStats } from "../types";
import { ACHIEVEMENTS } from "../data/levels";
import { 
  OFFLINE_DICTIONARY, 
  ALL_WORDS_SET, 
  getVerifiedCustomWords, 
  addVerifiedCustomWord, 
  removeVerifiedCustomWord, 
  isVerifiedCustomWord 
} from "../utils/dictionary";
import { lookupCollinsDefinition, CollinsDefinitionResult } from "../utils/collinsClient";
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

  // Custom Verified Wordlist states
  const [customVerifiedWords, setCustomVerifiedWords] = useState<string[]>(() => getVerifiedCustomWords());
  const [newCustomWordInput, setNewCustomWordInput] = useState<string>("");
  const [customWordMessage, setCustomWordMessage] = useState<string>("");

  const handleAddCustomWord = (wordToAdd: string) => {
    const clean = wordToAdd.trim().toUpperCase();
    if (!clean || clean.length < 3 || clean.length > 6) {
      setCustomWordMessage("Words must be between 3 and 6 letters.");
      return;
    }
    addVerifiedCustomWord(clean);
    setCustomVerifiedWords(getVerifiedCustomWords());
    setNewCustomWordInput("");
    setCustomWordMessage(`"${clean}" added to your verified wordlist!`);
    setTimeout(() => setCustomWordMessage(""), 3500);
  };

  const handleRemoveCustomWord = (wordToRemove: string) => {
    removeVerifiedCustomWord(wordToRemove);
    setCustomVerifiedWords(getVerifiedCustomWords());
  };

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

  const [collinsDefResult, setCollinsDefResult] = useState<CollinsDefinitionResult | null>(null);
  const [isSearchingCollins, setIsSearchingCollins] = useState<boolean>(false);

  useEffect(() => {
    const trimmed = dictionarySearch.trim();
    if (!trimmed) {
      setCollinsDefResult(null);
      return;
    }

    let isCurrent = true;
    const timer = setTimeout(async () => {
      setIsSearchingCollins(true);
      try {
        const res = await lookupCollinsDefinition(trimmed);
        if (isCurrent) {
          setCollinsDefResult(res);
        }
      } catch {
        if (isCurrent) {
          setCollinsDefResult(null);
        }
      } finally {
        if (isCurrent) {
          setIsSearchingCollins(false);
        }
      }
    }, 350);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [dictionarySearch]);

  // Total stars count
  const totalStars = Object.values(stats.completedLevels).reduce((acc, curr) => acc + curr.stars, 0);

  return (
    <div className="w-full py-6 px-4 max-w-7xl mx-auto space-y-8 animate-fade-in" id="scribe-vault-view">
      
      {/* 1. Header & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center space-x-4 shadow-sm">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-200">
            <Star className="w-6 h-6 fill-amber-500/10 text-amber-500" />
          </div>
          <div>
            <p className="text-slate-450 text-[11px] font-mono uppercase tracking-wider">Total Stars</p>
            <p className="text-2xl font-black text-slate-800">{totalStars}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center space-x-4 shadow-sm">
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-205">
            <Flame className="w-6 h-6 fill-rose-500/10 text-rose-500 animate-pulse" />
          </div>
          <div>
            <p className="text-slate-450 text-[11px] font-mono uppercase tracking-wider">Active Streak</p>
            <p className="text-2xl font-black text-slate-800">{stats.dailyStreaks} days</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center space-x-4 shadow-sm">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-xl border border-indigo-200">
            <Sparkles className="w-6 h-6 text-indigo-505" />
          </div>
          <div>
            <p className="text-slate-450 text-[11px] font-mono uppercase tracking-wider">Solve Ratio</p>
            <p className="text-2xl font-black text-slate-800">{stats.totalPuzzlesSolved} solved</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center space-x-4 shadow-sm">
          <div className="p-3 bg-sky-500/10 text-sky-600 rounded-xl border border-sky-200">
            <Zap className="w-6 h-6 text-sky-550" />
          </div>
          <div>
            <p className="text-slate-450 text-[11px] font-mono uppercase tracking-wider">Arcade Record</p>
            <p className="text-2xl font-black text-slate-800">{stats.arcadeHighScore} pts</p>
          </div>
        </div>
      </div>

      {/* 2. Main split panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Achievements Hall */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
            <Award className="w-5 h-5 text-amber-500 animate-pulse" />
            <h3 className="font-extrabold text-slate-800 text-lg">Alchemist Accomplishments</h3>
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
                      ? "bg-slate-50/50 border-slate-200 text-slate-800 shadow-sm" 
                      : "bg-slate-50/30 border-dashed border-slate-200 opacity-60 text-slate-400"
                  }`}
                  id={`ach-card-${ach.id}`}
                >
                  <div className={`p-3 rounded-xl shrink-0 ${
                    isUnlocked ? "bg-amber-500/10 text-amber-600 border border-amber-200" : "bg-slate-100 text-slate-402"
                  }`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center space-x-1.5">
                      <span>{ach.title}</span>
                      {isUnlocked && <span className="text-[10px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded font-mono font-bold">Earned</span>}
                    </h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed font-semibold">{ach.description}</p>
                    <p className="text-[10px] font-mono text-indigo-600 mt-2 italic border-t border-slate-100 pt-1.5">
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
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <BookMarked className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Collins English Dictionary Glossary</h3>
                <p className="text-[10px] text-indigo-600 font-mono font-bold">Official Dictionary API</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-semibold">Search words to view verified definitions directly from the Collins English Dictionary API.</p>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Type e.g. COLD, CAT, SHARK..."
                value={dictionarySearch}
                onChange={(e) => setDictionarySearch(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-205 text-slate-805 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-mono tracking-wider focus:outline-none focus:border-indigo-400 transition shadow-inner"
                id="glossary-search-input"
              />
            </div>

            {dictionarySearch && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2.5">
                {isSearchingCollins ? (
                  <div className="space-y-1.5 py-1">
                    <div className="h-3 bg-slate-200 animate-pulse rounded-md w-full"></div>
                    <div className="h-3 bg-slate-200 animate-pulse rounded-md w-4/5"></div>
                  </div>
                ) : collinsDefResult && !collinsDefResult.isOfflineFallback ? (
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between flex-wrap gap-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold font-mono text-indigo-700 uppercase tracking-widest text-sm">{dictionarySearch}</span>
                        {collinsDefResult.phonetic && (
                          <span className="text-[11px] text-slate-500 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{collinsDefResult.phonetic}</span>
                        )}
                        {collinsDefResult.partOfSpeech && (
                          <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 font-bold uppercase">{collinsDefResult.partOfSpeech}</span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">COLLINS VERIFIED</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed italic bg-white p-3 rounded-xl border border-slate-200">{collinsDefResult.definition}</p>
                    {collinsDefResult.entryUrl && (
                      <div className="pt-1 flex justify-end">
                        <a 
                          href={collinsDefResult.entryUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline font-mono font-bold"
                        >
                          View Collins Dictionary Entry →
                        </a>
                      </div>
                    )}
                  </div>
                ) : foundDefinition ? (
                  <div className="space-y-1.5">
                    <p className="font-bold font-mono text-indigo-650 uppercase tracking-widest text-sm flex items-center justify-between">
                      <span>{dictionarySearch}</span>
                      <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">VALID WORD</span>
                    </p>
                    <p className="text-slate-600 leading-relaxed italic font-medium">{foundDefinition}</p>
                  </div>
                ) : isWordInDict ? (
                  <div>
                    <p className="font-bold font-mono text-indigo-650 uppercase">{dictionarySearch}</p>
                    <p className="text-slate-500 leading-relaxed italic mt-1 font-semibold">This word is valid in-game! Try using it during your ladders.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-bold font-mono text-slate-401 uppercase">{dictionarySearch}</p>
                    <p className="text-rose-500 leading-relaxed font-mono text-[11px] font-bold">🚫 Word not found in Collins English Dictionary.</p>
                    {dictionarySearch.length >= 3 && dictionarySearch.length <= 6 && (
                      <button
                        onClick={() => handleAddCustomWord(dictionarySearch)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                        id="glossary-add-override-btn"
                      >
                        <PlusCircle className="w-4 h-4 text-indigo-200" />
                        <span>Override & Add to Verified List</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Custom Verified Wordlist Manager */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-slate-800 text-base">Verified Wordlist Override</h3>
            </div>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Add valid custom or rare words to your personal verified wordlist to override dictionary validation.
            </p>

            {/* Quick add custom word */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="ADD WORD (E.G. ZEBU)..."
                value={newCustomWordInput}
                maxLength={6}
                onChange={(e) => setNewCustomWordInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCustomWordInput.trim()) {
                    handleAddCustomWord(newCustomWordInput);
                  }
                }}
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono tracking-wider focus:outline-none focus:border-indigo-500 transition"
                id="custom-word-input"
              />
              <button
                onClick={() => handleAddCustomWord(newCustomWordInput)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition select-none"
                id="add-custom-word-btn"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            {customWordMessage && (
              <p className="text-xs font-mono font-bold text-indigo-650 bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl">
                {customWordMessage}
              </p>
            )}

            {/* Custom wordlist chips */}
            <div className="space-y-2 pt-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex justify-between">
                <span>Verified Custom Words</span>
                <span>{customVerifiedWords.length} entries</span>
              </div>

              {customVerifiedWords.length === 0 ? (
                <div className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl text-center border border-dashed border-slate-200">
                  No custom verified overrides added yet.
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
                  {customVerifiedWords.map((w) => (
                    <span
                      key={w}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg text-xs font-mono font-black"
                    >
                      <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                      <span>{w.toUpperCase()}</span>
                      <button
                        onClick={() => handleRemoveCustomWord(w)}
                        className="text-indigo-400 hover:text-rose-600 transition cursor-pointer ml-0.5"
                        title="Remove from override list"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Setting panel drawer */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-base border-b border-slate-100 pb-3">Tome Settings</h3>
            
            {/* Audio Toggle */}
            <button
              onClick={handleToggleSound}
              className="flex justify-between items-center w-full py-2.5 px-3 hover:bg-slate-50 rounded-xl transition text-left outline-none cursor-pointer"
              id="toggle-sound-settings-btn"
            >
              <div className="flex items-center space-x-2.5">
                {soundOn ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-slate-405" />}
                <span className="text-xs sm:text-sm font-semibold text-slate-700">Synthesizer Sound FX</span>
              </div>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded border transition ${
                soundOn ? "bg-emerald-50 text-emerald-600 border-emerald-200 font-bold" : "bg-slate-100 text-slate-450 border-slate-200"
              }`}>
                {soundOn ? "ON" : "OFF"}
              </span>
            </button>

            {/* Dyslexia / Accessibility font scale toggle */}
            <button
              onClick={() => setDyslexicFont(!dyslexicFont)}
              className="flex justify-between items-center w-full py-2.5 px-3 hover:bg-slate-50 rounded-xl transition text-left outline-none cursor-pointer"
              id="toggle-dyslexic-font-btn"
            >
              <div className="flex items-center space-x-2.5">
                <Type className="w-4 h-4 text-indigo-505" />
                <span className="text-xs sm:text-sm font-semibold text-slate-700">Clean Weighted Font</span>
              </div>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded border transition ${
                dyslexicFont ? "bg-indigo-50 text-indigo-650 border border-indigo-200 font-bold" : "bg-slate-100 text-slate-450 border-slate-200"
              }`}>
                {dyslexicFont ? "ACTIVE" : "DEFAULT"}
              </span>
            </button>

            {/* Reset Stats buttons */}
            <div className="border-t border-slate-100 pt-3.5 space-y-2">
              {!resetConfirm ? (
                <button
                  onClick={() => setResetConfirm(true)}
                  className="flex items-center space-x-2 w-full py-2.5 px-3 hover:bg-rose-50/50 text-rose-600 rounded-xl transition text-left outline-none text-xs sm:text-sm font-semibold cursor-pointer"
                  id="reset-stats-btn"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Wipe Archives Data</span>
                </button>
              ) : (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-xs">
                  <p className="font-bold text-rose-700">Are you absolutely sure?</p>
                  <p className="text-slate-500 text-[11px] font-semibold leading-relaxed">All stars, streaks, unlocked badges, and custom workshop logs will be deleted forever.</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={onResetData}
                      className="bg-rose-600 hover:bg-rose-500 border border-rose-400 border-opacity-30 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                      id="confirm-reset-btn"
                    >
                      Delete Forever
                    </button>
                    <button
                      onClick={() => setResetConfirm(false)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors"
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
