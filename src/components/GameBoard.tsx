/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  HelpCircle, 
  Star, 
  RotateCcw, 
  Zap, 
  ChevronRight, 
  Sparkles,
  Award,
  BookOpen,
  X,
  Volume2,
  VolumeX,
  Lightbulb
} from "lucide-react";
import { Level, PlayerStats } from "../types";
import { 
  getSmartHint, 
  findShortestPath, 
  areWordsOneLetterApart 
} from "../utils/helpers";
import { ALL_WORDS_SET, OFFLINE_DICTIONARY } from "../utils/dictionary";
import { 
  playKeyTapSound, 
  playDeleteSound, 
  playSuccessStepSound, 
  playErrorSound, 
  playLevelVictorySound,
  playHintSound
} from "../utils/audio";

interface GameBoardProps {
  level: Level;
  onBack: () => void;
  onSaveProgress: (levelId: string, stars: number, moves: number) => void;
  onNextLevel?: () => void;
  stats: PlayerStats;
}

export default function GameBoard({ 
  level, 
  onBack, 
  onSaveProgress, 
  onNextLevel,
  stats
}: GameBoardProps) {
  const wordLength = level.startWord.length;

  // Active steps registered along the ladder (starts with startWord)
  const [ladder, setLadder] = useState<string[]>([level.startWord.toUpperCase()]);
  
  // The word the user is currently typing in the active input slot
  const [currentInput, setCurrentInput] = useState<string>("");

  // Error state for validation buzzers
  const [errorFlash, setErrorFlash] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Hint tracker state
  const [activeHint, setActiveHint] = useState<{
    nextWord: string;
    explanation: string;
    letterIndex: number;
  } | null>(null);
  const [revealHint, setRevealHint] = useState<boolean>(false);
  const [didUseHintOnThisLevel, setDidUseHintOnThisLevel] = useState<boolean>(false);

  // Victory state
  const [isVictor, setIsVictor] = useState<boolean>(false);
  const [finalStarsCount, setFinalStarsCount] = useState<number>(3);

  // Dictionary active details lookups
  const [activeDefinitionWord, setActiveDefinitionWord] = useState<string | null>(null);

  // Restart level
  const handleResetLevel = () => {
    playDeleteSound();
    setLadder([level.startWord.toUpperCase()]);
    setCurrentInput("");
    setErrorFlash(false);
    setErrorMessage("");
    setActiveHint(null);
    setRevealHint(false);
    setIsVictor(false);
    setDidUseHintOnThisLevel(false);
  };

  // Keyboard handle
  const handleKeyTap = (char: string) => {
    if (isVictor) return;

    if (char === "BACK") {
      playDeleteSound();
      setCurrentInput((prev) => prev.slice(0, -1));
      setErrorFlash(false);
      setErrorMessage("");
    } else if (char === "ENTER") {
      handleValidateStep();
    } else {
      if (currentInput.length < wordLength) {
        playKeyTapSound();
        setCurrentInput((prev) => prev + char);
        setErrorFlash(false);
        setErrorMessage("");
      }
    }
  };

  // Intermediate step validation
  const handleValidateStep = () => {
    if (isVictor) return;

    const candidate = currentInput.trim().toUpperCase();
    const currentAnchor = ladder[ladder.length - 1];

    if (candidate.length !== wordLength) {
      triggerError("Word is incomple.");
      return;
    }

    if (candidate === currentAnchor) {
      triggerError("That is the identical word!");
      return;
    }

    // Check if separating step is exactly one letter changed
    const stepValid = areWordsOneLetterApart(currentAnchor, candidate);
    if (!stepValid) {
      triggerError("You must change EXACTLY one character from the active step.");
      return;
    }

    // Check if legitimate word
    const inDict = ALL_WORDS_SET.has(candidate.toLowerCase());
    if (!inDict) {
      triggerError(`"${candidate}" is not present in our level vocabulary directory.`);
      return;
    }

    // Safe! Update ladder list
    playSuccessStepSound();
    const nextLadder = [...ladder, candidate];
    setLadder(nextLadder);
    setCurrentInput("");
    setActiveHint(null);
    setRevealHint(false);

    // Check if target word is hit!
    if (candidate === level.targetWord.toUpperCase()) {
      handleLevelWin(nextLadder);
    }
  };

  const triggerError = (msg: string) => {
    playErrorSound();
    setErrorFlash(true);
    setErrorMessage(msg);
    setTimeout(() => {
      setErrorFlash(false);
    }, 450);
  };

  // Handle victory completion
  const handleLevelWin = (finalPath: string[]) => {
    setIsVictor(true);
    playLevelVictorySound();

    // Star calculation:
    // Moves = finalPath.length - 1
    // Par is the BFS shortest path length - 1 (preconfigured on level)
    const totalMovesMade = finalPath.length - 1;
    let earnedStars = 1;

    if (totalMovesMade <= level.par) {
      earnedStars = 3;
    } else if (totalMovesMade === level.par + 1) {
      earnedStars = 2;
    }

    // Check if they skipped hints on harder tiers
    setFinalStarsCount(earnedStars);
    onSaveProgress(level.id, earnedStars, totalMovesMade);
  };

  // Delete latest step
  const handleUndoStep = () => {
    if (ladder.length > 1) {
      playDeleteSound();
      const updated = [...ladder];
      updated.pop();
      setLadder(updated);
      setCurrentInput("");
      setActiveHint(null);
      setRevealHint(false);
    }
  };

  // Request Oracle Hint
  const handleRequestHint = () => {
    const currentAnchor = ladder[ladder.length - 1];
    const hint = getSmartHint(currentAnchor, level.targetWord, ALL_WORDS_SET);

    if (hint) {
      playHintSound();
      setDidUseHintOnThisLevel(true);
      setActiveHint(hint);
      setRevealHint(true);
    } else {
      triggerError("Oracle cannot find a pathway from here. Try deleting a step!");
    }
  };

  // Keyboard render arrays
  const keysRow1 = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
  const keysRow2 = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
  const keysRow3 = ["BACK", "Z", "X", "C", "V", "B", "N", "M", "ENTER"];

  // Click on active word to see glossary definition
  const handleShowWordDefinition = (word: string) => {
    const definition = OFFLINE_DICTIONARY[word.toLowerCase().trim()];
    if (definition) {
      setActiveDefinitionWord(word);
    } else {
      setActiveDefinitionWord(null);
    }
  };

  // Render stats progress meters
  const currentMoves = ladder.length - 1;
  const starsExpectancy = currentMoves <= level.par ? 3 : currentMoves === level.par + 1 ? 2 : 1;

  return (
    <div className="w-full py-6 px-4 max-w-7xl mx-auto flex flex-col items-center" id="active-playboard">
      
      {/* HUD Navigation */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl hover:bg-white/10 transition font-bold text-xs sm:text-sm text-slate-300 shadow-sm cursor-pointer"
          id="back-btn"
        >
          <ArrowLeft className="w-4 h-4 text-rose-400" />
          <span>Exit Maps</span>
        </button>

        <div className="text-center">
          <h3 className="font-extrabold text-white text-sm sm:text-base uppercase tracking-wider">{level.title}</h3>
          <p className="text-[10px] font-mono text-indigo-300 font-bold uppercase">Stage ID: {level.id}</p>
        </div>

        <button
          onClick={handleResetLevel}
          className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 px-3.5 py-2 rounded-xl transition font-bold text-xs sm:text-sm shadow-xs cursor-pointer"
          id="level-reset-btn"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restart</span>
        </button>
      </div>

      {/* Main Split Layout: Ladder on left, Touch pad / helper on right */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: The Interactive Word Ladder representation */}
        <div className="md:col-span-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 shadow-xl flex flex-col items-center space-y-5">
          
          {/* Par and Target specs inside custom pill */}
          <div className="flex justify-between items-center w-full bg-slate-950/40 border border-white/5 px-4 py-3 rounded-2xl text-xs backdrop-blur-sm text-slate-300">
            <span className="font-mono text-slate-400 font-bold">PAR: <strong className="text-white font-black">{level.par} steps</strong></span>
            <span className="text-slate-600 font-black">•</span>
            <span className="font-mono text-slate-400 font-bold">MOVES: <strong className="text-sky-400 font-black">{currentMoves}</strong></span>
            <span className="text-slate-600 font-black">•</span>
            <div className="flex items-center gap-1 font-bold text-amber-400 font-mono">
              ★ {starsExpectancy} STAR{starsExpectancy > 1 ? "S" : ""}
            </div>
          </div>

          <div className="space-y-1 w-full flex flex-col items-center relative py-2">
            
            {/* 1. START WORD (Locked individual character tiles) */}
            <div className="flex flex-col items-center w-full">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-indigo-300 mb-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> START WORD
              </span>
              <div 
                onClick={() => handleShowWordDefinition(level.startWord)}
                className="flex gap-2 cursor-help select-none bg-slate-900/60 hover:bg-slate-900/80 p-2.5 rounded-2xl border border-white/10 transition"
                id="start-word-box"
                title="Tap for glossary definition"
              >
                {level.startWord.toUpperCase().split("").map((letter, idx) => (
                  <div key={idx} className="w-11 h-14 sm:w-12 sm:h-15 bg-slate-950/80 rounded-xl flex items-center justify-center text-white text-xl sm:text-2xl font-black border border-white/10 shadow-lg shadow-black/45">
                    {letter}
                  </div>
                ))}
              </div>
            </div>

            {/* Path lines connection connector */}
            <div className="w-[2px] h-6 bg-indigo-500/40 shadow-[0_0_10px_rgba(99,102,241,0.5)] rounded-full my-1" />

            {/* 2. SUBMITTED WORD STEPS IN LADDER */}
            {ladder.slice(1).map((step, idx) => {
              const isLatestSubmittedStep = idx === ladder.length - 2;
              return (
                <div key={idx} className="flex flex-col items-center w-full relative">
                  <div className="flex items-center justify-center w-full relative">
                    <div 
                      onClick={() => handleShowWordDefinition(step)}
                      className="flex gap-2 cursor-help select-none bg-slate-900/40 hover:bg-slate-900/60 p-2.5 rounded-2xl border border-white/5 transition"
                      id={`ladder-step-${idx}`}
                      title="Tap for glossary definition"
                    >
                      {step.toUpperCase().split("").map((letter, letterIdx) => {
                        // Find if this letter mutated from the previous step anchor
                        const previousAnchor = idx === 0 ? level.startWord.toUpperCase() : ladder[idx];
                        const isMutated = previousAnchor[letterIdx] !== letter;
                        return (
                          <div 
                            key={letterIdx} 
                            className={`w-11 h-14 sm:w-12 sm:h-15 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-black border transition ${
                              isMutated 
                                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.4)]" 
                                : "bg-white/10 text-white border-white/10 shadow-sm"
                            }`}
                          >
                            {letter}
                          </div>
                        );
                      })}
                    </div>

                    {/* Undo button floated to side */}
                    {isLatestSubmittedStep && !isVictor && (
                      <button
                        onClick={handleUndoStep}
                        className="absolute -right-4 translate-x-full p-2.5 bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/25 rounded-xl transition cursor-pointer font-black text-xs shadow-md"
                        title="Delete latest step"
                        id="undo-step-btn"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="w-[2px] h-6 bg-indigo-500/40 shadow-[0_0_10px_rgba(99,102,241,0.5)] rounded-full my-1" />
                </div>
              );
            })}

            {/* 3. ACTIVE LETTER INPUT SLOT */}
            {!isVictor && (
              <div className="flex flex-col items-center w-full">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 mb-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span> ACTIVE STEP
                </span>
                
                <div 
                  className={`flex gap-2 p-2.5 bg-[#0c1223]/80 rounded-2xl border border-indigo-500/20 transition ${
                    errorFlash ? "animate-shake border-rose-500/50 bg-rose-950/20" : ""
                  }`}
                  id="active-input-slot"
                >
                  {Array.from({ length: wordLength }).map((_, charIdx) => {
                    const char = currentInput[charIdx] || "";
                    const isActiveCursor = charIdx === currentInput.length;
                    return (
                      <div 
                        key={charIdx} 
                        className={`w-11 h-14 sm:w-12 sm:h-15 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-black border transition ${
                          isActiveCursor 
                            ? "bg-violet-600/15 border-violet-400 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.5)] animate-pulse" 
                            : char 
                            ? "bg-indigo-500/10 text-white border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]" 
                            : "bg-white/5 border-dashed border-white/10 text-slate-500"
                        }`}
                      >
                        {char || "?"}
                      </div>
                    );
                  })}
                </div>
                <div className="w-[2px] h-6 bg-indigo-500/40 shadow-[0_0_10px_rgba(99,102,241,0.5)] rounded-full my-1" />
              </div>
            )}

            {/* 4. TARGET WORD (Locked at bottom) */}
            <div className="flex flex-col items-center w-full">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#FF6B6B] bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 mb-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> TARGET WORD
              </span>
              <div 
                onClick={() => handleShowWordDefinition(level.targetWord)}
                className="flex gap-2 cursor-help select-none bg-rose-950/15 hover:bg-rose-950/25 p-2.5 rounded-2xl border border-rose-500/20 transition"
                id="target-word-box"
                title="Tap for glossary definition"
              >
                {level.targetWord.toUpperCase().split("").map((letter, idx) => (
                  <div key={idx} className="w-11 h-14 sm:w-12 sm:h-15 bg-gradient-to-tr from-rose-500 to-[#FF6B6B] rounded-xl flex items-center justify-center text-white text-xl sm:text-2xl font-black border border-rose-400/30 shadow-[0_0_15px_rgba(239,68,68,0.25)]">
                    {letter}
                  </div>
                ))}
              </div>
            </div>

          </div>

          <p className="text-[10px] text-slate-500 text-center leading-relaxed">
            * Complete word mutations by changing 1 letter. Target definitions are clickable!
          </p>
        </div>

        {/* RIGHT COLUMN: Touch Pad Keyboard and Smart Hint Box */}
        <div className="md:col-span-6 space-y-6">
          
          {/* Victory Overlay if Solved! */}
          {isVictor ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900/60 backdrop-blur-xl border border-emerald-500/30 p-6 rounded-[2rem] text-center space-y-5 shadow-2xl shadow-emerald-500/5 text-slate-100"
              id="victory-congratulations"
            >
              <div className="w-16 h-16 bg-amber-500/10 text-amber-300 border border-amber-500/25 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-amber-500/5">
                <Star className="w-8 h-8 fill-amber-400/20 text-amber-400" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-tight bg-gradient-to-r from-amber-400 to-emerald-300 bg-clip-text text-transparent uppercase">Tome Engraved!</h3>
                <p className="text-slate-400 text-xs font-semibold">Mutations completed with absolute precision.</p>
              </div>

              {/* Star display rating */}
              <div className="flex justify-center space-x-2">
                {[1, 2, 3].map((s) => (
                  <Star 
                    key={s} 
                    className={`w-9 h-9 ${
                      s <= finalStarsCount ? "fill-amber-400 text-amber-500" : "text-slate-700"
                    }`}
                  />
                ))}
              </div>

              <div className="py-3 px-4 bg-slate-950/50 border border-white/5 rounded-2xl max-w-sm mx-auto font-mono text-xs">
                <div className="flex justify-between items-center text-slate-400 font-bold">
                  <span>Completed Count:</span>
                  <span className="text-white font-black">{ladder.length - 1} transitions</span>
                </div>
                <div className="flex justify-between items-center text-slate-400 mt-1.5 font-bold">
                  <span>Objective Par Limit:</span>
                  <span className="text-white font-black">{level.par} steps</span>
                </div>
              </div>

              {/* Path sequence review */}
              <div className="space-y-1.5 text-left border-t border-white/5 pt-4 px-1">
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Chronological Corridor:</p>
                <p className="text-sm font-mono text-sky-400 font-black leading-relaxed">
                  {ladder.join(" → ")}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleResetLevel}
                  className="flex-1 bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 py-3 rounded-xl text-xs font-black transition cursor-pointer uppercase shadow-xs active:translate-y-0.5"
                  id="victory-replay-btn"
                >
                  Replay Level
                </button>
                {onNextLevel && level.chapterId !== "custom" && level.chapterId !== "daily" && (
                  <button
                    onClick={onNextLevel}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-550 text-white py-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 border border-emerald-400/20 uppercase cursor-pointer"
                    id="victory-next-btn"
                  >
                    <span>Next Level</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                {(!onNextLevel || level.chapterId === "custom" || level.chapterId === "daily") && (
                  <button
                    onClick={onBack}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-555 text-white py-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 border border-emerald-400/20 uppercase cursor-pointer"
                    id="victory-exit-btn"
                  >
                    Back to Maps
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            
            // Touchpad Keyboard Controls (Unvictorized state)
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-5 shadow-xl space-y-4">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono text-center mb-1">
                Alchemist Input Board
              </h4>

              <div className="space-y-2">
                <div className="flex justify-center gap-1.5">
                  {keysRow1.map((k) => (
                    <button
                      key={k}
                      onClick={() => handleKeyTap(k)}
                      className="w-10 h-11 bg-slate-950/45 hover:bg-white/10 font-bold text-base rounded-lg border border-white/10 text-white shadow-lg shadow-black/20 transition-colors cursor-pointer select-none"
                      id={`key-${k}`}
                    >
                      {k}
                    </button>
                  ))}
                </div>

                <div className="flex justify-center gap-1.5 max-w-[95%] mx-auto">
                  {keysRow2.map((k) => (
                    <button
                      key={k}
                      onClick={() => handleKeyTap(k)}
                      className="w-10 h-11 bg-slate-950/45 hover:bg-white/10 font-bold text-base rounded-lg border border-white/10 text-white shadow-lg shadow-black/20 transition-colors cursor-pointer select-none"
                      id={`key-${k}`}
                    >
                      {k}
                    </button>
                  ))}
                </div>

                <div className="flex justify-center gap-1.5">
                  {keysRow3.map((k) => {
                    const isBack = k === "BACK";
                    const isEnter = k === "ENTER";
                    return (
                      <button
                        key={k}
                        onClick={() => handleKeyTap(k)}
                        className={`h-11 rounded-lg text-xs font-black uppercase select-none transition cursor-pointer ${
                          isBack 
                            ? "w-16 bg-rose-600/20 text-rose-300 hover:bg-rose-600/35 border border-rose-500/30 font-bold" 
                            : isEnter 
                            ? "w-20 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/20 font-bold" 
                            : "w-10 bg-slate-950/45 hover:bg-white/10 text-white border border-white/10 text-base"
                        }`}
                        id={`key-${k}`}
                      >
                        {k === "BACK" ? "Undo" : k === "ENTER" ? "OK" : k}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Smart Hints Buttons */}
              <div className="pt-3.5 border-t border-white/5 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-mono font-bold">Stuck at "{ladder[ladder.length - 1]}"?</span>
                <button
                  onClick={handleRequestHint}
                  className="flex items-center gap-1.5 text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 px-4 py-2 rounded-xl transition cursor-pointer text-xs font-extrabold shadow-xs"
                  id="ask-hint-btn"
                >
                  <Lightbulb className="w-4 h-4 text-amber-400 fill-amber-300/10" />
                  <span>Use Hint</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Smart Hint Popup disclosure */}
          {revealHint && activeHint && !isVictor && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-sky-500/15 backdrop-blur-md border border-sky-400/30 rounded-2xl p-4 text-white space-y-2 shadow-sky-500/5 relative"
              id="hint-oracle-display"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-widest text-[#FDF6E3]">
                  <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400/10 animate-pulse" />
                  <span className="text-sky-300">Oracle Suggestion</span>
                </div>
                <button 
                  onClick={() => {
                    setRevealHint(false);
                    setActiveHint(null);
                  }}
                  className="text-white hover:opacity-80 transition cursor-pointer"
                  id="close-hint-display-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-200 text-xs sm:text-sm font-medium leading-relaxed">
                {activeHint.explanation}
              </p>
              <p className="text-[9px] font-mono text-sky-400 font-bold">
                * Seeking hints increases step calculations but guides you to victory!
              </p>
            </motion.div>
          )}

          {/* Dictionary Lookups drawer panel */}
          {activeDefinitionWord && (
            <div className="p-5 bg-slate-900/90 backdrop-blur-xl text-slate-100 border border-white/10 rounded-[2rem] space-y-2.5 relative shadow-2xl">
              <button 
                onClick={() => setActiveDefinitionWord(null)}
                className="absolute right-4.5 top-4.5 text-slate-400 hover:text-white transition cursor-pointer"
                id="close-definition-btn"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold font-mono uppercase tracking-wider">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Glossary Codex</span>
              </div>
              <h4 className="font-semibold text-lg font-mono uppercase tracking-widest text-white">
                {activeDefinitionWord}
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed italic bg-black/20 p-3.5 rounded-xl border border-white/5">
                "{OFFLINE_DICTIONARY[activeDefinitionWord.toLowerCase().trim()]}"
              </p>
            </div>
          )}

          {/* If there's an error displayed */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl flex items-center gap-2 text-xs">
              <span className="text-rose-400 font-black text-sm flex-shrink-0">⚠️</span>
              <p className="font-semibold">{errorMessage}</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
