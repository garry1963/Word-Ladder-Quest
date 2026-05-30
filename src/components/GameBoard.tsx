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
  const [errorMessage, setErrorMessage] = useState<string>( "");
  const [isValidatingWord, setIsValidatingWord] = useState<boolean>(false);

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
  const [isFetchingDefinition, setIsFetchingDefinition] = useState<boolean>(false);
  const [fetchedDefinition, setFetchedDefinition] = useState<{
    definition: string;
    phonetic?: string;
    partOfSpeech?: string;
  } | null>(null);

  const [dictionarySearchQuery, setDictionarySearchQuery] = useState<string>("");

  const [isFetchingHintDefinition, setIsFetchingHintDefinition] = useState<boolean>(false);
  const [hintDefinition, setHintDefinition] = useState<{
    definition: string;
    phonetic?: string;
    partOfSpeech?: string;
  } | null>(null);

  // Auto-fetch definition from English Dictionary API whenever user clicks a word to inspect
  useEffect(() => {
    if (!activeDefinitionWord) {
      setFetchedDefinition(null);
      return;
    }

    const fetchDefinition = async () => {
      setIsFetchingDefinition(true);
      try {
        const wordClean = activeDefinitionWord.toLowerCase().trim();
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(wordClean)}`);
        if (!res.ok) {
          throw new Error("Definition not found");
        }
        const data = await res.json();
        if (data && data[0]) {
          const entry = data[0];
          const phonetic = entry.phonetic || (entry.phonetics && entry.phonetics.find((p: any) => p.text)?.text);
          let definition = "No definition found.";
          let partOfSpeech = undefined;
          if (entry.meanings && entry.meanings[0]) {
            partOfSpeech = entry.meanings[0].partOfSpeech;
            if (entry.meanings[0].definitions && entry.meanings[0].definitions[0]) {
              definition = entry.meanings[0].definitions[0].definition;
            }
          }
          setFetchedDefinition({
            definition,
            phonetic,
            partOfSpeech,
          });
        } else {
          setFetchedDefinition(null);
        }
      } catch (err) {
        // Fallback to offline dictionary
        const wordClean = activeDefinitionWord.toLowerCase().trim();
        const offlineDef = OFFLINE_DICTIONARY[wordClean];
        if (offlineDef) {
          setFetchedDefinition({
            definition: offlineDef,
            partOfSpeech: "common",
          });
        } else {
          setFetchedDefinition({
            definition: "A valid English Scrabble word with no offline definition available.",
            partOfSpeech: "Scrabble Word",
          });
        }
      } finally {
        setIsFetchingDefinition(false);
      }
    };

    fetchDefinition();
  }, [activeDefinitionWord]);

  // Auto-fetch definition of hint word so the user gets an rich context-aware dictionary clue
  useEffect(() => {
    if (!activeHint) {
      setHintDefinition(null);
      return;
    }

    const fetchHintDef = async () => {
      setIsFetchingHintDefinition(true);
      try {
        const wordClean = activeHint.nextWord.toLowerCase().trim();
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(wordClean)}`);
        if (!res.ok) {
          throw new Error("Hint definition not found");
        }
        const data = await res.json();
        if (data && data[0]) {
          const entry = data[0];
          const phonetic = entry.phonetic || (entry.phonetics && entry.phonetics.find((p: any) => p.text)?.text);
          let definition = "No definition definition found.";
          let partOfSpeech = undefined;
          if (entry.meanings && entry.meanings[0]) {
            partOfSpeech = entry.meanings[0].partOfSpeech;
            if (entry.meanings[0].definitions && entry.meanings[0].definitions[0]) {
              definition = entry.meanings[0].definitions[0].definition;
            }
          }
          setHintDefinition({
            definition,
            phonetic,
            partOfSpeech,
          });
        } else {
          setHintDefinition(null);
        }
      } catch (err) {
        const wordClean = activeHint.nextWord.toLowerCase().trim();
        const offlineDef = OFFLINE_DICTIONARY[wordClean];
        if (offlineDef) {
          setHintDefinition({
            definition: offlineDef,
            partOfSpeech: "common",
          });
        } else {
          setHintDefinition({
            definition: "A valid English word.",
            partOfSpeech: "Scrabble Word",
          });
        }
      } finally {
        setIsFetchingHintDefinition(false);
      }
    };

    fetchHintDef();
  }, [activeHint]);

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
  const handleValidateStep = async () => {
    if (isVictor || isValidatingWord) return;

    const candidate = currentInput.trim().toUpperCase();
    const currentAnchor = ladder[ladder.length - 1];

    if (candidate.length !== wordLength) {
      triggerError("Word is incomplete.");
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
    const lowercaseCandidate = candidate.toLowerCase();
    let inDict = ALL_WORDS_SET.has(lowercaseCandidate);

    if (!inDict) {
      setIsValidatingWord(true);
      try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${lowercaseCandidate}`);
        if (response.status === 200) {
          // Dynamically record to Set directory so the dictionary accepts it in active memory paths too
          ALL_WORDS_SET.add(lowercaseCandidate);
          inDict = true;
        }
      } catch (err) {
        console.warn("Unable to contact validation API, default to strict offline check", err);
      } finally {
        setIsValidatingWord(false);
      }
    }

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
    if (word && word.trim() !== "") {
      setActiveDefinitionWord(word.trim().toUpperCase());
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
          className="flex items-center gap-1.5 bg-white border border-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-50 transition font-bold text-xs sm:text-sm text-slate-600 shadow-sm cursor-pointer"
          id="back-btn"
        >
          <ArrowLeft className="w-4 h-4 text-rose-500" />
          <span>Exit Maps</span>
        </button>

        <div className="text-center">
          <h3 className="font-extrabold text-slate-800 text-sm sm:text-base uppercase tracking-wider">{level.title}</h3>
          <p className="text-[10px] font-mono text-indigo-650 font-bold uppercase">Stage ID: {level.id}</p>
        </div>

        <button
          onClick={handleResetLevel}
          className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 px-3.5 py-2 rounded-xl transition font-bold text-xs sm:text-sm shadow-xs cursor-pointer"
          id="level-reset-btn"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restart</span>
        </button>
      </div>

      {/* Main Split Layout: Ladder on left, Touch pad / helper on right */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: The Interactive Word Ladder representation */}
        <div className="md:col-span-6 bg-white border border-slate-220 rounded-[2rem] p-6 shadow-sm flex flex-col items-center space-y-5">
          
          {/* Par and Target specs inside custom pill */}
          <div className="flex justify-between items-center w-full bg-slate-50 border border-slate-150 px-4 py-3 rounded-2xl text-xs text-slate-700 shadow-inner">
            <span className="font-mono text-slate-550 font-bold">PAR: <strong className="text-slate-805 font-black">{level.par} steps</strong></span>
            <span className="text-slate-300 font-black">•</span>
            <span className="font-mono text-slate-550 font-bold">MOVES: <strong className="text-indigo-600 font-black">{currentMoves}</strong></span>
            <span className="text-slate-300 font-black">•</span>
            <div className="flex items-center gap-1 font-extrabold text-amber-600 font-mono">
              ★ {starsExpectancy} STAR{starsExpectancy > 1 ? "S" : ""}
            </div>
          </div>

          <div className="space-y-1 w-full flex flex-col items-center relative py-2">
            
            {/* 1. START WORD (Locked individual character tiles) */}
            <div className="flex flex-col items-center w-full">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-150 mb-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> START WORD
              </span>
              <div 
                onClick={() => handleShowWordDefinition(level.startWord)}
                className="flex gap-2 cursor-help select-none bg-slate-50 hover:bg-slate-100 p-2.5 rounded-2xl border border-slate-200 transition"
                id="start-word-box"
                title="Tap for glossary definition"
              >
                {level.startWord.toUpperCase().split("").map((letter, idx) => (
                  <div key={idx} className="w-11 h-14 sm:w-12 sm:h-15 bg-white rounded-xl flex items-center justify-center text-slate-800 text-xl sm:text-2xl font-black border border-slate-220 shadow-sm">
                    {letter}
                  </div>
                ))}
              </div>
            </div>

            {/* Path lines connection connector */}
            <div className="w-[2px] h-6 bg-indigo-200 rounded-full my-1" />

            {/* 2. SUBMITTED WORD STEPS IN LADDER */}
            {ladder.slice(1).map((step, idx) => {
              const isLatestSubmittedStep = idx === ladder.length - 2;
              return (
                <div key={idx} className="flex flex-col items-center w-full relative">
                  <div className="flex items-center justify-center w-full relative">
                    <div 
                      onClick={() => handleShowWordDefinition(step)}
                      className="flex gap-2 cursor-help select-none bg-slate-50/50 hover:bg-slate-100 p-2.5 rounded-2xl border border-slate-150 transition"
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
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-xs font-black" 
                                : "bg-white text-slate-700 border-slate-200 shadow-xs font-extrabold"
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
                        className="absolute -right-4 translate-x-full p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer font-black text-xs shadow-sm"
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
                {isValidatingWord ? (
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#4F46E5] bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 mb-1.5 flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> VERIFYING WORDS...
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-250 mb-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> ACTIVE STEP
                  </span>
                )}
                
                <div 
                  className={`flex gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl transition ${
                    errorFlash ? "animate-shake border-rose-500 bg-rose-50" : ""
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
                            ? "bg-indigo-50 border-indigo-400 text-indigo-700 animate-pulse" 
                            : char 
                            ? "bg-white text-slate-800 border-slate-300 shadow-sm" 
                            : "bg-white border-dashed border-slate-200 text-slate-400"
                        }`}
                      >
                        {char || "?"}
                      </div>
                    );
                  })}
                </div>
                <div className="w-[2px] h-6 bg-indigo-200 rounded-full my-1" />
              </div>
            )}

            {/* 4. TARGET WORD (Locked at bottom) */}
            <div className="flex flex-col items-center w-full">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 mb-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> TARGET WORD
              </span>
              <div 
                onClick={() => handleShowWordDefinition(level.targetWord)}
                className="flex gap-2 cursor-help select-none bg-rose-50/50 hover:bg-rose-100 p-2.5 rounded-2xl border border-rose-200 transition"
                id="target-word-box"
                title="Tap for glossary definition"
              >
                {level.targetWord.toUpperCase().split("").map((letter, idx) => (
                  <div key={idx} className="w-11 h-14 sm:w-12 sm:h-15 bg-gradient-to-tr from-rose-600 to-rose-400 rounded-xl flex items-center justify-center text-white text-xl sm:text-2xl font-black border border-rose-400 shadow-xs">
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
              className="bg-white border border-emerald-200 p-6 rounded-[2rem] text-center space-y-5 shadow-xs text-slate-850"
              id="victory-congratulations"
            >
              <div className="w-16 h-16 bg-amber-50 text-amber-500 border border-amber-200 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <Star className="w-8 h-8 fill-amber-400/25 text-amber-500" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-tight text-amber-500 uppercase">Tome Engraved!</h3>
                <p className="text-slate-500 text-xs font-semibold">Mutations completed with absolute precision.</p>
              </div>

              {/* Star display rating */}
              <div className="flex justify-center space-x-2">
                {[1, 2, 3].map((s) => (
                  <Star 
                    key={s} 
                    className={`w-9 h-9 ${
                      s <= finalStarsCount ? "fill-amber-400 text-amber-500" : "text-slate-200"
                    }`}
                  />
                ))}
              </div>

              <div className="py-3 px-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-sm mx-auto font-mono text-xs">
                <div className="flex justify-between items-center text-slate-500 font-bold">
                  <span>Completed Count:</span>
                  <span className="text-slate-800 font-black">{ladder.length - 1} transitions</span>
                </div>
                <div className="flex justify-between items-center text-slate-550 mt-1.5 font-bold">
                  <span>Objective Par Limit:</span>
                  <span className="text-slate-800 font-black">{level.par} steps</span>
                </div>
              </div>

              {/* Path sequence review */}
              <div className="space-y-1.5 text-left border-t border-slate-100 pt-4 px-1">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Chronological Corridor:</p>
                <p className="text-sm font-mono text-indigo-650 font-black leading-relaxed">
                  {ladder.join(" → ")}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleResetLevel}
                  className="flex-1 bg-slate-100 border border-slate-200 text-slate-650 hover:bg-slate-200 py-3 rounded-xl text-xs font-black transition cursor-pointer uppercase shadow-xs active:translate-y-0.5"
                  id="victory-replay-btn"
                >
                  Replay Level
                </button>
                {onNextLevel && level.chapterId !== "custom" && level.chapterId !== "daily" && (
                  <button
                    onClick={onNextLevel}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-555 text-white py-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 border border-emerald-400/20 uppercase cursor-pointer"
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
            <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-xs space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono text-center mb-1">
                Alchemist Input Board
              </h4>

              <div className="space-y-2.5">
                <div className="flex justify-center gap-1 sm:gap-2">
                  {keysRow1.map((k) => (
                    <button
                      key={k}
                      onClick={() => handleKeyTap(k)}
                      className="w-9 h-11 sm:w-11 sm:h-13 md:w-9 md:h-11 lg:w-11 lg:h-12 xl:w-13 xl:h-14 bg-slate-100 hover:bg-slate-200 font-extrabold text-sm sm:text-lg md:text-sm lg:text-base xl:text-xl rounded-xl border border-slate-200 text-slate-800 shadow-xs hover:scale-[1.02] active:scale-95 transition-all cursor-pointer select-none"
                      id={`key-${k}`}
                    >
                      {k}
                    </button>
                  ))}
                </div>

                <div className="flex justify-center gap-1 sm:gap-2 max-w-[95%] mx-auto">
                  {keysRow2.map((k) => (
                    <button
                      key={k}
                      onClick={() => handleKeyTap(k)}
                      className="w-9 h-11 sm:w-11 sm:h-13 md:w-9 md:h-11 lg:w-11 lg:h-12 xl:w-13 xl:h-14 bg-slate-100 hover:bg-slate-200 font-extrabold text-sm sm:text-lg md:text-sm lg:text-base xl:text-xl rounded-xl border border-slate-200 text-slate-800 shadow-xs hover:scale-[1.02] active:scale-95 transition-all cursor-pointer select-none"
                      id={`key-${k}`}
                    >
                      {k}
                    </button>
                  ))}
                </div>

                <div className="flex justify-center gap-1 sm:gap-2">
                  {keysRow3.map((k) => {
                    const isBack = k === "BACK";
                    const isEnter = k === "ENTER";
                    return (
                      <button
                        key={k}
                        onClick={() => handleKeyTap(k)}
                        className={`h-11 sm:h-13 md:h-11 lg:h-12 xl:h-14 rounded-xl text-xs sm:text-sm md:text-xs xl:text-base font-black uppercase select-none active:scale-95 transition-all cursor-pointer ${
                          isBack 
                            ? "w-14 sm:w-20 md:w-16 lg:w-20 xl:w-24 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 hover:scale-[1.02]" 
                            : isEnter 
                            ? "w-18 sm:w-24 md:w-20 lg:w-24 xl:w-28 bg-indigo-650 hover:bg-indigo-700 text-white border border-indigo-400 hover:scale-[1.02]" 
                            : "w-9 sm:w-11 md:w-9 lg:w-11 xl:w-13 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-205 hover:scale-[1.02]"
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
              <div className="pt-3.5 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-550 font-mono font-bold">Stuck at "{ladder[ladder.length - 1]}"?</span>
                <button
                  onClick={handleRequestHint}
                  className="flex items-center gap-1.5 text-indigo-650 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 px-4 py-2 rounded-xl transition cursor-pointer text-xs font-extrabold shadow-sm"
                  id="ask-hint-btn"
                >
                  <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-300/10" />
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
              className="bg-sky-50 border border-sky-150 rounded-2xl p-4 text-[#0369a1] space-y-3 shadow-xs relative w-full text-left"
              id="hint-oracle-display"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-widest text-[#0369a1]">
                  <Sparkles className="w-4 h-4 text-sky-600 animate-pulse" />
                  <span>Oracle Suggestion</span>
                </div>
                <button 
                  onClick={() => {
                    setRevealHint(false);
                    setActiveHint(null);
                  }}
                  className="text-sky-700 hover:opacity-80 transition cursor-pointer"
                  id="close-hint-display-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sky-905 text-xs sm:text-sm font-bold leading-relaxed bg-sky-100/50 p-3 rounded-xl border border-sky-200/50">
                {activeHint.explanation}
              </p>

              {/* Dynamic Dictionary Hint Content */}
              <div className="bg-white/95 p-3.5 rounded-xl border border-sky-200/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] text-sky-700 font-mono font-bold uppercase tracking-wider">
                  <BookOpen className="w-3.5 h-3.5 text-sky-500" />
                  <span>Dynamic Context Clue</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono font-black text-sm text-sky-900 uppercase tracking-widest">{activeHint.nextWord}</span>
                  {hintDefinition?.phonetic && <span className="text-[10px] text-sky-600 font-mono italic">{hintDefinition.phonetic}</span>}
                  {hintDefinition?.partOfSpeech && <span className="text-[9px] font-mono bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-widest">{hintDefinition.partOfSpeech}</span>}
                </div>
                {isFetchingHintDefinition ? (
                  <div className="space-y-1.5 py-1">
                    <div className="h-3 bg-sky-100 animate-pulse rounded-md w-full"></div>
                    <div className="h-3 bg-sky-100 animate-pulse rounded-md w-5/6"></div>
                  </div>
                ) : (
                  <p className="text-sky-800 text-xs leading-relaxed italic">
                    "{hintDefinition?.definition || "A valid target vocabulary transition step."}"
                  </p>
                )}
              </div>

              <p className="text-[9px] font-mono text-sky-600 font-bold">
                * Seeking hints increases step calculations but guides you to victory!
              </p>
            </motion.div>
          )}

          {/* Dictionary Lookups drawer panel */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-xs space-y-4 w-full text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] text-amber-600 font-bold font-mono uppercase tracking-wider">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <span>Glossary Codex Scanner</span>
              </div>
              {activeDefinitionWord && (
                <button 
                  onClick={() => {
                    setActiveDefinitionWord(null);
                    setDictionarySearchQuery("");
                  }}
                  className="text-[10px] text-rose-500 hover:underline font-mono uppercase tracking-wider cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Quick search input lookup feature */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Scan any word..."
                value={dictionarySearchQuery}
                maxLength={6}
                onChange={(e) => setDictionarySearchQuery(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && dictionarySearchQuery.trim()) {
                    handleShowWordDefinition(dictionarySearchQuery.trim());
                  }
                }}
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono tracking-widest uppercase focus:outline-hidden focus:ring-1 focus:ring-amber-500 transition"
              />
              <button
                onClick={() => {
                  if (dictionarySearchQuery.trim()) {
                    handleShowWordDefinition(dictionarySearchQuery.trim());
                  }
                }}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase cursor-pointer transition select-none"
              >
                Scan
              </button>
            </div>

            {activeDefinitionWord && (
              <div className="p-4 bg-amber-50/40 border border-amber-200/60 rounded-2xl space-y-2.5 relative animate-fade-in">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h4 className="font-bold text-base font-mono uppercase tracking-widest text-slate-800">
                    {activeDefinitionWord}
                  </h4>
                  {fetchedDefinition?.phonetic && (
                    <span className="text-xs text-slate-500 font-mono bg-white border border-slate-100 px-1.5 py-0.5 rounded-md">{fetchedDefinition.phonetic}</span>
                  )}
                  {fetchedDefinition?.partOfSpeech && (
                    <span className="text-[9px] font-mono bg-amber-100 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">{fetchedDefinition.partOfSpeech}</span>
                  )}
                </div>

                {isFetchingDefinition ? (
                  <div className="space-y-1.5 py-1">
                    <div className="h-3 bg-slate-250 animate-pulse rounded-md w-full"></div>
                    <div className="h-3 bg-slate-250 animate-pulse rounded-md w-5/6"></div>
                  </div>
                ) : (
                  <p className="text-slate-700 text-xs leading-relaxed italic bg-white p-3 rounded-xl border border-slate-150">
                    "{fetchedDefinition?.definition || "A valid English Scrabble word."}"
                  </p>
                )}
                <p className="text-[8px] font-mono text-slate-400">
                  * Dynamic lookup resolved live via Scrabble Standard Dictionary API.
                </p>
              </div>
            )}
          </div>

          {/* If there's an error displayed */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-250 text-rose-700 rounded-2xl flex items-center gap-2 text-xs font-bold animate-shake">
              <span className="text-rose-500 font-black text-sm flex-shrink-0">⚠️</span>
              <p className="font-semibold">{errorMessage}</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
