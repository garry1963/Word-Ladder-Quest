/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  PlusCircle, 
  Play, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  Dna,
  ArrowRight,
  Eye,
  EyeOff
} from "lucide-react";
import { findShortestPath } from "../utils/helpers";
import { ALL_WORDS_SET } from "../utils/dictionary";
import { CustomPuzzle, Level } from "../types";
import { playSuccessStepSound, playErrorSound } from "../utils/audio";

interface PuzzleCreatorProps {
  customPuzzles: CustomPuzzle[];
  onSavePuzzle: (puzzle: CustomPuzzle) => void;
  onDeletePuzzle: (id: string) => void;
  onPlayCustom: (level: Level) => void;
}

export default function PuzzleCreator({ 
  customPuzzles, 
  onSavePuzzle, 
  onDeletePuzzle,
  onPlayCustom
}: PuzzleCreatorProps) {
  const [startInput, setStartInput] = useState<string>("");
  const [targetInput, setTargetInput] = useState<string>("");
  const [puzzleTitle, setPuzzleTitle] = useState<string>("");
  
  const [feedback, setFeedback] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    optimalPath?: string[];
  }>({ status: 'idle', message: "" });

  const [showSolution, setShowSolution] = useState<boolean>(false);

  // Validate the inputs
  const handleVerify = () => {
    const start = startInput.trim().toUpperCase();
    const target = targetInput.trim().toUpperCase();

    if (!start || !target) {
      playErrorSound();
      setFeedback({ status: 'error', message: "Please enter both Start Word and Target Word." });
      return;
    }

    if (start.length !== target.length) {
      playErrorSound();
      setFeedback({ status: 'error', message: `Word lengths must match! Currently: '${start}' is ${start.length} letters, but '${target}' is ${target.length} letters.` });
      return;
    }

    if (start.length < 3 || start.length > 5) {
      playErrorSound();
      setFeedback({ status: 'error', message: "Only 3, 4, or 5-letter word mutations are supported by the active dictionary." });
      return;
    }

    // Verify words are in dictionary
    const startValid = ALL_WORDS_SET.has(start.toLowerCase());
    const targetValid = ALL_WORDS_SET.has(target.toLowerCase());

    if (!startValid && !targetValid) {
      playErrorSound();
      setFeedback({ status: 'error', message: `Neither "${start}" nor "${target}" are in the dictionary. You can still save this custom link, but we might not have paths for them!` });
    } else if (!startValid) {
      playErrorSound();
      setFeedback({ status: 'error', message: `"${start}" is not in our dictionary. Mutating might be difficult!` });
    } else if (!targetValid) {
      playErrorSound();
      setFeedback({ status: 'error', message: `"${target}" is not in our dictionary.` });
    }

    // Solve path
    const path = findShortestPath(start.toLowerCase(), target.toLowerCase(), ALL_WORDS_SET);
    
    if (path) {
      playSuccessStepSound();
      const uppercasePath = path.map(w => w.toUpperCase());
      setFeedback({
        status: 'success',
        message: `Hooray! A valid transformation exists from "${start}" to "${target}".`,
        optimalPath: uppercasePath
      });
    } else {
      playErrorSound();
      setFeedback({
        status: 'error',
        message: `Isolations Detected! No valid word-ladder step sequence can connect "${start}" to "${target}" within our offline alchemist guide.`
      });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const start = startInput.trim().toUpperCase();
    const target = targetInput.trim().toUpperCase();
    const title = puzzleTitle.trim() || `${start} to ${target} Quest`;

    // Re-verify shortest path for safety par score
    const path = findShortestPath(start.toLowerCase(), target.toLowerCase(), ALL_WORDS_SET);
    const calculatedPar = path ? path.length - 1 : 4; // default par is moves steps

    const newPuzzle: CustomPuzzle = {
      id: `custom-${Date.now()}`,
      title,
      startWord: start,
      targetWord: target,
      par: calculatedPar,
      createdDate: new Date().toLocaleDateString()
    };

    onSavePuzzle(newPuzzle);
    playSuccessStepSound();

    // Reset fields
    setStartInput("");
    setTargetInput("");
    setPuzzleTitle("");
    setFeedback({ status: 'idle', message: "" });
    setShowSolution(false);
  };

  return (
    <div className="w-full py-6 px-4 max-w-7xl mx-auto space-y-8 animate-fade-in" id="puzzle-creator-view">
      
      {/* Overview Banner */}
      <div className="bg-gradient-to-tr from-purple-500/20 via-indigo-500/10 to-transparent border border-purple-500/20 backdrop-blur-md rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl animate-bounce" />
        <div className="relative z-10 space-y-2">
          <span className="bg-purple-500/20 text-purple-300 font-mono text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border border-purple-500/35 animate-pulse">
            Sandbox Workshop
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">Linguistic Sandbox Creator</h2>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed font-medium">
            Unleash your inner puzzle smith! Craft custom start-to-end words. The local alchemist solver checks immediately if a valid corridor exists, scores the Par rating, and compiles it as a playable stage!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Creator Panel */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-6">
          <h3 className="font-extrabold text-white text-lg flex items-center space-x-2 border-b border-white/5 pb-3">
            <PlusCircle className="w-5 h-5 text-purple-400" />
            <span>Engrave New Ladder</span>
          </h3>

          <div className="space-y-4">
            
            {/* Word inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1.5 font-mono">
                  Start Word
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={startInput}
                  onChange={(e) => setStartInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                  placeholder="e.g. COLD"
                  className="w-full bg-slate-950/60 border border-white/10 text-white rounded-xl px-4 py-3 text-sm font-mono font-bold tracking-widest focus:outline-none focus:border-purple-400 transition"
                  id="custom-start-word-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1.5 font-mono">
                  Target Word
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                  placeholder="e.g. WARM"
                  className="w-full bg-slate-950/60 border border-white/10 text-white rounded-xl px-4 py-3 text-sm font-mono font-bold tracking-widest focus:outline-none focus:border-purple-400 transition"
                  id="custom-target-word-input"
                />
              </div>
            </div>

            {/* Optional Title input */}
            <div>
              <label className="block text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1.5 font-mono">
                Custom Stage Title <span className="text-slate-500 font-sans italic lowercase">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Thermal Expansion"
                value={puzzleTitle}
                onChange={(e) => setPuzzleTitle(e.target.value)}
                className="w-full bg-slate-950/60 border border-white/10 text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-purple-400 transition"
                id="custom-puzzle-title-input"
              />
            </div>

            {/* Actions for validation */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleVerify}
                className="w-full bg-indigo-600 hover:bg-indigo-550 border border-indigo-400/25 transition-all text-white font-bold py-3.5 rounded-xl text-xs sm:text-sm shadow-md cursor-pointer"
                id="validate-pair-btn"
              >
                Assemble & Verify Corridor
              </button>
            </div>

            {/* Verification feedback box */}
            {feedback.status !== 'idle' && (
              <div className={`p-4 rounded-2xl border flex flex-col space-y-3 ${
                feedback.status === 'success' 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" 
                  : "bg-rose-500/10 border-rose-500/20 text-rose-300"
              }`}>
                <div className="flex items-start space-x-2.5">
                  {feedback.status === 'success' 
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> 
                    : <AlertCircle className="w-5 h-5 text-rose-450 shrink-0 mt-0.5" />
                  }
                  <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                    {feedback.message}
                  </p>
                </div>

                {feedback.status === 'success' && feedback.optimalPath && (
                  <div className="pt-3.5 border-t border-white/5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-emerald-400">
                        Solution Par: {feedback.optimalPath.length - 1} steps
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowSolution(!showSolution)}
                        className="flex items-center space-x-1.5 text-[11px] font-semibold hover:underline text-indigo-300 cursor-pointer"
                        id="toggle-solution-btn"
                      >
                        {showSolution ? <EyeOff className="w-3.5 h-3.5 animate-pulse" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showSolution ? "Hide Solution" : "Inspect Solution"}</span>
                      </button>
                    </div>

                    {showSolution && (
                      <div className="flex flex-wrap items-center bg-slate-950/45 rounded-xl p-3 border border-white/5 gap-2 font-mono text-xs font-bold text-white animate-slide-in">
                        {feedback.optimalPath.map((word, idx) => (
                          <React.Fragment key={idx}>
                            <span className="px-2.5 py-1 bg-slate-950/60 border border-white/10 rounded shadow-sm text-slate-200">
                              {word}
                            </span>
                            {idx < feedback.optimalPath!.length - 1 && (
                              <ArrowRight className="w-3 h-3 text-slate-500" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    )}

                    <form onSubmit={handleSave} className="pt-2">
                      <button
                        type="submit"
                        className="w-full bg-purple-600 hover:bg-purple-550 border border-purple-400/20 text-white font-bold py-3 rounded-xl text-xs sm:text-sm shadow-lg cursor-pointer"
                        id="save-puzzle-btn"
                      >
                        Engrave as Playable Stage
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Playable Stage Shelf */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-extrabold text-white text-lg flex items-center space-x-2 border-b border-white/5 pb-3">
              <Dna className="w-5 h-5 text-indigo-400" />
              <span>Engraved Stage Shelf</span>
            </h3>

            {customPuzzles.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3.5 border border-dashed border-white/10 bg-slate-950/40 rounded-2xl">
                <HelpCircle className="w-8 h-8 text-slate-500 mx-auto animate-bounce" />
                <h4 className="font-bold text-slate-400 text-sm">Shelf is currently empty</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Engrave starting and ending keywords on the left. Once confirmed solvable, save them here to challenge your friends!
                </p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                {customPuzzles.map((puz) => (
                  <div
                    key={puz.id}
                    className="flex justify-between items-center bg-slate-955/40 border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all group"
                    id={`custom-level-${puz.id}`}
                  >
                    <div>
                      <h4 className="font-bold text-white text-sm">{puz.title}</h4>
                      <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-405 mt-1">
                        <span className="text-purple-400 font-bold">{puz.startWord}</span>
                        <span>→</span>
                        <span className="text-amber-400 font-bold">{puz.targetWord}</span>
                        <span>•</span>
                        <span>Par: {puz.par}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2.5">
                      <button
                        onClick={() => onDeletePuzzle(puz.id)}
                        className="p-1 px-1.5 hover:bg-rose-500/10 text-rose-400 hover:text-rose-500 rounded-md transition outline-none cursor-pointer"
                        title="Delete custom level"
                        id={`delete-custom-level-${puz.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          const customLvl: Level = {
                            id: puz.id,
                            chapterId: "custom",
                            title: puz.title,
                            startWord: puz.startWord,
                            targetWord: puz.targetWord,
                            par: puz.par,
                            difficulty: puz.par <= 2 ? "Easy" : puz.par <= 4 ? "Medium" : "Hard"
                          };
                          onPlayCustom(customLvl);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-550 border border-indigo-400/20 text-white p-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
                        id={`play-custom-level-${puz.id}`}
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span className="hidden sm:inline">Play</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/5 text-[11px] font-mono text-slate-500 italic">
            * Custom stages are saved locally on your cache for offline replayability!
          </div>

        </div>

      </div>

    </div>
  );
}
