/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Zap, 
  Clock, 
  Star, 
  RefreshCw, 
  Play, 
  RotateCcw,
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Flame,
  Award
} from "lucide-react";
import { getRandomSolvablePair, areWordsOneLetterApart } from "../utils/helpers";
import { ALL_WORDS_SET } from "../utils/dictionary";
import { playSuccessStepSound, playErrorSound, playLevelVictorySound } from "../utils/audio";

interface ArcadeModeProps {
  highScore: number;
  onUpdateHighScore: (score: number) => void;
}

export default function ArcadeMode({ highScore, onUpdateHighScore }: ArcadeModeProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [wordLength, setWordLength] = useState<number>(4);

  // Active random mini-ladder state
  const [startWord, setStartWord] = useState<string>("");
  const [targetWord, setTargetWord] = useState<string>("");
  const [ladderSteps, setLadderSteps] = useState<string[]>([]);
  const [activeInput, setActiveInput] = useState<string>("");
  const [invalidFlash, setInvalidFlash] = useState<boolean>(false);

  // Status logs
  const [arcadeStatus, setArcadeStatus] = useState<"active" | "gameover">("active");
  const [completedLaddersCount, setCompletedLaddersCount] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start arcade session
  const handleStartGame = () => {
    setIsPlaying(true);
    setCurrentScore(0);
    setTimeLeft(60);
    setCompletedLaddersCount(0);
    setArcadeStatus("active");
    loadNewMiniLadder(wordLength);
  };

  // Loads a brand new random solvable ladder pair
  const loadNewMiniLadder = (len: number) => {
    const pair = getRandomSolvablePair(len, ALL_WORDS_SET, 2, 4);
    if (pair) {
      setStartWord(pair.start);
      setTargetWord(pair.end);
      setLadderSteps([pair.start]);
      setActiveInput("");
    }
  };

  // Tick Timer ticking
  useEffect(() => {
    if (isPlaying && arcadeStatus === "active") {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Game Over
            if (timerRef.current) clearInterval(timerRef.current);
            setArcadeStatus("gameover");
            setIsPlaying(false);
            if (currentScore > highScore) {
              onUpdateHighScore(currentScore);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, arcadeStatus, currentScore, highScore]);

  // Handle keyboard key triggers in arcade
  const handleKeyPress = (key: string) => {
    if (arcadeStatus !== "active") return;
    
    if (key === "BACK") {
      setActiveInput((prev) => prev.slice(0, -1));
    } else if (key === "ENTER") {
      validateArcadeStep();
    } else {
      if (activeInput.length < wordLength) {
        setActiveInput((prev) => prev + key);
      }
    }
  };

  // Validate the intermediate step
  const validateArcadeStep = () => {
    const candidate = activeInput.trim().toUpperCase();
    const currentAnchor = ladderSteps[ladderSteps.length - 1];

    if (candidate.length !== wordLength) {
      triggerErrorFlash();
      return;
    }

    // Must be exactly one letter different from current anchor
    const isOneApart = areWordsOneLetterApart(currentAnchor, candidate);
    const inDict = ALL_WORDS_SET.has(candidate.toLowerCase());

    if (!isOneApart || !inDict) {
      triggerErrorFlash();
      return;
    }

    // Success! Log the step
    playSuccessStepSound();
    const updatedSteps = [...ladderSteps, candidate];
    setLadderSteps(updatedSteps);
    setActiveInput("");
    setCurrentScore((prev) => prev + 15); // +15 points for solid 1-letter step
    setTimeLeft((prev) => Math.min(prev + 4, 90)); // add 4 seconds bonus, max 90 secs

    // Checked if target word reached!
    if (candidate === targetWord) {
      playLevelVictorySound();
      setCurrentScore((prev) => prev + 100); // Massive +100 points completion award!
      setTimeLeft((prev) => Math.min(prev + 15, 90)); // Massive +15 seconds bonus!
      setCompletedLaddersCount((prev) => prev + 1);
      
      // Flash success visual before loading next
      setTimeout(() => {
        loadNewMiniLadder(wordLength);
      }, 350);
    }
  };

  const triggerErrorFlash = () => {
    playErrorSound();
    setInvalidFlash(true);
    setTimeout(() => {
      setInvalidFlash(false);
    }, 400);
  };

  // Key array for screen keyboard
  const keysRow1 = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
  const keysRow2 = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
  const keysRow3 = ["BACK", "Z", "X", "C", "V", "B", "N", "M", "ENTER"];

  return (
    <div className="w-full py-6 px-4 max-w-7xl mx-auto space-y-6 animate-fade-in" id="arcade-mode-view">
      
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 text-slate-800 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-slate-100 rounded-full blur-3xl animate-pulse" />
        <div className="relative z-10 space-y-2 max-w-xl">
          <span className="bg-rose-50 text-rose-700 font-mono text-[9px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full border border-rose-200">
            SPEED RUN ARENA
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-slate-850">Time Attack Flash</h2>
          <p className="text-slate-600 text-xs sm:text-sm font-semibold leading-relaxed">
            Sprint through as many word transformations as possible before the hourglass drains out! Every correct mutation buys you precious seconds.
          </p>
        </div>

        <div className="mt-4 sm:mt-0 relative z-10 bg-slate-50 border border-slate-201 p-4 rounded-2xl shrink-0 self-stretch sm:self-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center font-mono shadow-inner">
          <div className="text-[10px] font-mono text-slate-500 font-extrabold uppercase tracking-wider">High Score Record</div>
          <div className="text-xl font-black text-amber-600 flex items-center mt-1">
            <Zap className="w-4 h-4 mr-1 text-amber-500 fill-amber-500 animate-pulse" />
            <span>{highScore} PTS</span>
          </div>
        </div>
      </div>

      {/* Game Layout logic */}
      {!isPlaying && arcadeStatus === "active" ? (
        
        // Intro Screen
        <div className="max-w-xl mx-auto bg-white border border-slate-205 rounded-[2rem] p-8 text-center space-y-6 shadow-md">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 border border-rose-200 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Zap className="w-8 h-8 fill-rose-100/50" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Commence Speedrun Session</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-sm mx-auto">
              Select your master word length. Each valid intermediate mutation yields +15 score points and +4s clock time. Hitting the final target word rewards another massive +100 points!
            </p>
          </div>

          {/* Word Length Selector */}
          <div className="flex justify-center space-x-3">
            {[3, 4, 5].map((len) => (
              <button
                key={len}
                onClick={() => setWordLength(len)}
                className={`py-2.5 px-5 rounded-xl text-xs font-black font-mono transition-all active:translate-y-0.5 cursor-pointer border ${
                  wordLength === len 
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-md font-bold" 
                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                }`}
                id={`arcade-len-${len}`}
              >
                {len} Letters
              </button>
            ))}
          </div>

          <button
            onClick={handleStartGame}
            className="w-full bg-rose-650 hover:bg-rose-550 border border-rose-400/20 transition-all font-mono uppercase text-white font-black py-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer text-sm"
            id="start-arcade-btn"
          >
            <Play className="w-4 h-4 fill-white text-white" />
            <span>Enter the Speed Arena</span>
          </button>
        </div>

      ) : !isPlaying && arcadeStatus === "gameover" ? (

        // Game Over Screen
        <div className="max-w-xl mx-auto bg-white border border-slate-205 rounded-[2rem] p-8 text-center space-y-6 shadow-md">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 border border-rose-200 rounded-full flex items-center justify-center mx-auto shadow-sm animate-bounce">
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-2xl font-black text-rose-650 uppercase">Hourglass Exhausted</h3>
            <p className="text-xs text-slate-500 font-bold">Your lightning run has concluded.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 py-4 px-6 bg-slate-50 border border-slate-200 rounded-2xl max-w-sm mx-auto font-mono shadow-inner">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Achieved Score</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{currentScore}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Ladders Cleared</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{completedLaddersCount}</p>
            </div>
          </div>

          {currentScore >= highScore && currentScore > 0 && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-300 rounded-2xl flex items-center justify-center space-x-2 text-xs text-amber-705 font-bold max-w-sm mx-auto animate-pulse uppercase">
              <Award className="w-4 h-4 text-amber-605 fill-amber-500/10" />
              <span>🎉 NEW CONCORD RECORD EARNED!</span>
            </div>
          )}

          <div className="flex space-x-3 max-w-sm mx-auto">
            <button
              onClick={() => {
                setArcadeStatus("active");
                setIsPlaying(false);
              }}
              className="flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-205 text-slate-700 font-bold uppercase text-xs py-3.5 rounded-xl transition cursor-pointer"
              id="arcade-exit-btn"
            >
              Exit Arena
            </button>
            <button
              onClick={handleStartGame}
              className="flex-1 bg-rose-650 hover:bg-rose-555 border border-rose-450/20 text-white py-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center space-x-1.5 shadow-md cursor-pointer font-mono text-sm"
              id="arcade-retry-btn"
            >
              <RotateCcw className="w-3.5 h-3.5 animate-spin-slow" />
              <span>Retry Session</span>
            </button>
          </div>
        </div>
      ) : (

        // Active Gameplay Screen!
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Active Grid ladder and steps */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-[2rem] p-6 shadow-md flex flex-col justify-between space-y-6">
            
            {/* Header info */}
            <div className="flex justify-between items-center bg-slate-50 border border-slate-150 px-4 py-3.5 rounded-2xl shadow-inner">
              <div className="flex items-center space-x-1.5 font-mono text-xs text-slate-705">
                <Clock className="w-4 h-4 text-rose-500 animate-spin-slow" />
                <span className="font-extrabold text-slate-850 text-sm">{timeLeft}s remaining</span>
              </div>
              <div className="font-mono text-xs font-black text-emerald-600 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200 shadow-sm">
                SCORE: {currentScore} PTS
              </div>
            </div>

            {/* Simulated Word Ladder view */}
            <div className="space-y-4 py-2 flex flex-col items-center">
              
              {/* TARGET */}
              <div className="w-full max-w-xs flex items-center justify-between border border-dashed border-amber-300 bg-amber-50 rounded-xl px-4 py-2.5 font-black font-mono text-xs tracking-wider shadow-sm">
                <div className="flex items-center space-x-1.5 text-amber-705">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500/10" />
                  <span>TARGET TARGET </span>
                </div>
                <span className="text-amber-600 tracking-wider font-extrabold">{targetWord}</span>
              </div>

              {/* Ladder steps trail rendering */}
              <div className="space-y-2 w-full max-w-xs overflow-y-auto max-h-[180px] pr-1 py-1 flex flex-col items-center">
                {ladderSteps.map((step, idx) => (
                  <div 
                    key={idx}
                    className="w-full py-2 px-4 bg-slate-50 rounded-xl text-center font-mono font-black text-xs tracking-widest text-slate-800 border border-slate-200 flex justify-between items-center shadow-xs"
                  >
                    <span className="text-[10px] text-slate-400 font-mono">#{idx+1}</span>
                    <span>{step}</span>
                    <span className="text-emerald-500 text-xs font-mono">✔</span>
                  </div>
                ))}

                {/* Input slot */}
                <div 
                  className={`w-full p-2.5 bg-indigo-50 border-2 rounded-xl text-slate-800 font-mono font-black tracking-widest flex justify-between items-center transition ${
                    invalidFlash ? "border-rose-500 bg-rose-50 text-rose-600 animate-bounce" : "border-indigo-200"
                  }`}
                >
                  <span className="text-[10px] text-indigo-600 font-mono">Active</span>
                  
                  {/* Styled Box-slots */}
                  <div className="flex space-x-1">
                    {Array.from({ length: wordLength }).map((_, charIdx) => {
                      const char = activeInput[charIdx] || "";
                      const isActiveSlot = charIdx === activeInput.length;
                      return (
                        <span 
                          key={charIdx} 
                          className={`w-7 h-8 rounded border flex items-center justify-center text-xs font-black uppercase ${
                            isActiveSlot 
                              ? "bg-indigo-100 border border-indigo-400 text-indigo-705 animate-pulse" 
                              : "bg-white border border-slate-200 text-slate-800"
                          }`}
                        >
                          {char}
                        </span>
                      );
                    })}
                  </div>

                  <span className="text-indigo-500 text-xs font-mono">⚡</span>
                </div>
              </div>

              {/* START */}
              <div className="w-full max-w-xs flex items-center justify-between border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 font-bold font-mono text-xs tracking-wider shadow-sm">
                <span className="text-slate-500">START KEYWORD</span>
                <span className="text-indigo-650 font-extrabold">{startWord}</span>
              </div>

            </div>

            {/* Quick Helper */}
            <p className="text-[10px] text-slate-500 text-center italic font-mono font-semibold leading-relaxed">
              Find a chain to mutate "{startWord}" into "{targetWord}". Enter valid 1-letter changes.
            </p>
          </div>

          {/* Interactive Keyboard */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-[2rem] p-6 shadow-md flex flex-col justify-center space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono text-center mb-1">
              Arcade Touchpad Console
            </h4>

            {/* Render rows and keys */}
            <div className="space-y-1.5">
              <div className="flex justify-center space-x-1.5">
                {keysRow1.map((k) => (
                  <button
                    key={k}
                    onClick={() => handleKeyPress(k)}
                    className="flex-1 py-3.5 bg-slate-100/95 hover:bg-slate-200 border border-slate-200 h-10 flex items-center justify-center active:scale-95 text-slate-705 hover:text-slate-900 rounded-xl text-xs sm:text-sm font-black uppercase transition-all duration-100 cursor-pointer shadow-xs"
                    id={`arcade-key-${k}`}
                  >
                    {k}
                  </button>
                ))}
              </div>

              <div className="flex justify-center space-x-1.5 max-w-[95%] mx-auto">
                {keysRow2.map((k) => (
                  <button
                    key={k}
                    onClick={() => handleKeyPress(k)}
                    className="flex-1 py-3.5 bg-slate-100/95 hover:bg-slate-200 border border-slate-200 h-10 flex items-center justify-center active:scale-95 text-slate-705 hover:text-slate-900 rounded-xl text-xs sm:text-sm font-black uppercase transition-all duration-100 cursor-pointer shadow-xs"
                    id={`arcade-key-${k}`}
                  >
                    {k}
                  </button>
                ))}
              </div>

              <div className="flex justify-center space-x-1.5">
                {keysRow3.map((k) => {
                  return (
                    <button
                      key={k}
                      onClick={() => handleKeyPress(k)}
                      className={`py-3.5 h-10 flex items-center justify-center rounded-xl uppercase text-[10px] sm:text-xs font-black active:scale-95 transition-all duration-100 cursor-pointer shadow-xs ${
                        k === "BACK" 
                          ? "px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex-2" 
                          : k === "ENTER"
                          ? "px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex-2"
                          : "flex-1 bg-slate-100/95 hover:bg-slate-200 border border-slate-200 text-slate-705 hover:text-slate-900"
                      }`}
                      id={`arcade-key-${k}`}
                    >
                      {k}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sound alerts block */}
            <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-500 mt-4 pt-2 border-t border-slate-100">
              <span>Ladders Completed: {completedLaddersCount} done</span>
              <span>+15s target completion award</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
