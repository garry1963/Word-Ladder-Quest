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
      <div className="bg-gradient-to-tr from-rose-500/20 via-orange-500/10 to-transparent border border-rose-500/20 backdrop-blur-md rounded-[2rem] p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="relative z-10 space-y-2 max-w-xl">
          <span className="bg-rose-500/20 text-rose-300 font-mono text-[9px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full border border-rose-500/25">
            Speed Arena
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-white">Time Attack Flash</h2>
          <p className="text-slate-300 text-xs sm:text-sm font-bold leading-relaxed">
            Sprint through as many word transformations as possible before the hourglass drains out! Every correct mutation buys you precious seconds.
          </p>
        </div>

        <div className="mt-4 sm:mt-0 relative z-10 bg-slate-950/40 border border-white/10 p-4 rounded-2xl shrink-0 self-stretch sm:self-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center font-mono">
          <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">High Score Record</div>
          <div className="text-xl font-black text-amber-400 flex items-center mt-1">
            <Zap className="w-4 h-4 mr-1 text-amber-500 fill-amber-500 animate-pulse" />
            <span>{highScore} PTS</span>
          </div>
        </div>
      </div>

      {/* Game Layout logic */}
      {!isPlaying && arcadeStatus === "active" ? (
        
        // Intro Screen
        <div className="max-w-xl mx-auto bg-white/5 backdrop-blur-lg border border-white/10 rounded-[2rem] p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <Zap className="w-8 h-8 fill-rose-500/10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Commence Speedrun Session</h3>
            <p className="text-xs text-slate-405 font-medium leading-relaxed max-w-sm mx-auto">
              Select your master word length. Each valid intermediate mutation yields +15 score points and +4s clock time. Hitting the final target word rewards another massive +100 points!
            </p>
          </div>

          {/* Word Length Selector */}
          <div className="flex justify-center space-x-3">
            {[3, 4, 5].map((len) => (
              <button
                key={len}
                onClick={() => setWordLength(len)}
                className={`py-2.5 px-5 rounded-xl text-xs font-black font-mono transition-all active:translate-y-0.5 cursor-pointer ${
                  wordLength === len 
                    ? "bg-indigo-600 text-white border border-indigo-400/30 shadow-lg font-bold" 
                    : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"
                }`}
                id={`arcade-len-${len}`}
              >
                {len} Letters
              </button>
            ))}
          </div>

          <button
            onClick={handleStartGame}
            className="w-full bg-rose-600 hover:bg-rose-550 border border-rose-400/20 transition-all font-mono uppercase text-white font-black py-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            id="start-arcade-btn"
          >
            <Play className="w-4 h-4 fill-white text-white" />
            <span>Enter the Speed Arena</span>
          </button>
        </div>

      ) : !isPlaying && arcadeStatus === "gameover" ? (

        // Game Over Screen
        <div className="max-w-xl mx-auto bg-white/5 backdrop-blur-lg border border-white/10 rounded-[2rem] p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-2xl font-black text-white uppercase">Hourglass Exhausted</h3>
            <p className="text-xs text-slate-400 font-semibold">Your lightning run has concluded.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 py-4 px-6 bg-slate-950/40 border border-white/15 rounded-2xl max-w-sm mx-auto font-mono">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Achieved Score</p>
              <p className="text-2xl font-black text-white mt-1">{currentScore}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Ladders Cleared</p>
              <p className="text-2xl font-black text-white mt-1">{completedLaddersCount}</p>
            </div>
          </div>

          {currentScore >= highScore && currentScore > 0 && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center space-x-2 text-xs text-amber-300 font-semibold max-w-sm mx-auto animate-pulse uppercase">
              <Award className="w-4 h-4 text-amber-400 fill-amber-500/20" />
              <span>🎉 NEW CONCORD RECORD EARNED!</span>
            </div>
          )}

          <div className="flex space-x-3 max-w-sm mx-auto">
            <button
              onClick={() => {
                setArcadeStatus("active");
                setIsPlaying(false);
              }}
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold uppercase text-xs py-3.5 rounded-xl transition cursor-pointer"
              id="arcade-exit-btn"
            >
              Exit Arena
            </button>
            <button
              onClick={handleStartGame}
              className="flex-1 bg-rose-600 hover:bg-rose-550 border border-rose-400/20 text-white py-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center space-x-1.5 shadow-lg cursor-pointer font-mono"
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
          <div className="lg:col-span-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 shadow-xl flex flex-col justify-between space-y-6">
            
            {/* Header info */}
            <div className="flex justify-between items-center bg-slate-950/45 border border-white/5 px-4 py-3.5 rounded-2xl">
              <div className="flex items-center space-x-1.5 font-mono text-xs text-slate-250">
                <Clock className="w-4 h-4 text-rose-455 animate-spin-slow" />
                <span className="font-semibold text-white text-sm">{timeLeft}s remaining</span>
              </div>
              <div className="font-mono text-xs font-black text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-xl border border-emerald-500/15">
                SCORE: {currentScore} PTS
              </div>
            </div>

            {/* Simulated Word Ladder view */}
            <div className="space-y-4 py-2 flex flex-col items-center">
              
              {/* TARGET */}
              <div className="w-full max-w-xs flex items-center justify-between border border-dashed border-amber-500/30 bg-amber-500/10 rounded-xl px-4 py-2.5 font-black font-mono text-xs tracking-wider">
                <div className="flex items-center space-x-1.5 text-amber-300">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-500/10" />
                  <span>TARGET TARGET </span>
                </div>
                <span className="text-amber-400 tracking-wider">{targetWord}</span>
              </div>

              {/* Ladder steps trail rendering */}
              <div className="space-y-2 w-full max-w-xs overflow-y-auto max-h-[180px] pr-1 py-1 flex flex-col items-center">
                {ladderSteps.map((step, idx) => (
                  <div 
                    key={idx}
                    className="w-full py-2 px-4 bg-slate-950/35 rounded-xl text-center font-mono font-black text-xs tracking-widest text-white border border-white/5 flex justify-between items-center"
                  >
                    <span className="text-[10px] text-slate-500 font-mono">#{idx+1}</span>
                    <span>{step}</span>
                    <span className="text-emerald-400 text-xs font-mono">✔</span>
                  </div>
                ))}

                {/* Input slot */}
                <div 
                  className={`w-full p-2.5 bg-indigo-500/10 border-2 rounded-xl text-white font-mono font-black tracking-widest flex justify-between items-center transition ${
                    invalidFlash ? "border-rose-500 bg-rose-500/10 text-rose-400 animate-bounce" : "border-indigo-500/20"
                  }`}
                >
                  <span className="text-[10px] text-indigo-300 font-mono">Active</span>
                  
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
                              ? "bg-indigo-650/30 border border-indigo-400 text-indigo-300 animate-pulse" 
                              : "bg-slate-950/50 border border-white/5 text-white"
                          }`}
                        >
                          {char}
                        </span>
                      );
                    })}
                  </div>

                  <span className="text-indigo-400 text-xs font-mono">⚡</span>
                </div>
              </div>

              {/* START */}
              <div className="w-full max-w-xs flex items-center justify-between border border-white/5 bg-slate-955/40 rounded-xl px-4 py-2.5 font-bold font-mono text-xs tracking-wider">
                <span className="text-slate-500">START KEYWORD</span>
                <span className="text-sky-400">{startWord}</span>
              </div>

            </div>

            {/* Quick Helper */}
            <p className="text-[10px] text-slate-500 text-center italic font-mono font-semibold leading-relaxed">
              Find a chain to mutate "{startWord}" into "{targetWord}". Enter valid 1-letter changes.
            </p>
          </div>

          {/* Interactive Keyboard */}
          <div className="lg:col-span-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 shadow-xl flex flex-col justify-center space-y-4">
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
                    className="flex-1 py-3.5 bg-slate-950/50 hover:bg-slate-900/60 border border-white/10 h-10 flex items-center justify-center active:scale-95 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-black uppercase transition-all duration-100 cursor-pointer"
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
                    className="flex-1 py-3.5 bg-slate-950/50 hover:bg-slate-900/60 border border-white/10 h-10 flex items-center justify-center active:scale-95 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-black uppercase transition-all duration-100 cursor-pointer"
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
                      className={`py-3.5 h-10 flex items-center justify-center rounded-xl uppercase text-[10px] sm:text-xs font-black active:scale-95 transition-all duration-100 cursor-pointer ${
                        k === "BACK" 
                          ? "px-3 bg-rose-600/30 text-rose-350 border border-rose-500/30 flex-2" 
                          : k === "ENTER"
                          ? "px-3 bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex-2"
                          : "flex-1 bg-slate-950/50 hover:bg-slate-900/60 border border-white/10 text-slate-200 hover:text-white"
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
            <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-500 mt-4 pt-2 border-t border-white/5">
              <span>Ladders Completed: {completedLaddersCount} done</span>
              <span>+15s target completion award</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
