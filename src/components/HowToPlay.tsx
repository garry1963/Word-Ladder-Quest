/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  BookOpen, 
  HelpCircle, 
  ArrowRight, 
  CheckCircle2, 
  ShieldAlert, 
  Star,
  Compass,
  Trophy,
  Volume2
} from "lucide-react";

export default function HowToPlay() {
  return (
    <div className="w-full py-6 px-4 max-w-4xl mx-auto space-y-8 animate-fade-in" id="how-to-play-view">
      
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="p-3 bg-amber-500/10 text-amber-600 rounded-full inline-block border border-amber-200 shadow-md">
          <BookOpen className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-2.5xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase">
          The Alchemist's Codex
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto font-semibold">
          Familiarize yourself with the sacred laws of single-character word mutations.
        </p>
      </div>

      {/* Interactive Core Rule showcase */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
        <h3 className="font-extrabold text-slate-800 text-base border-b border-slate-105 pb-3 flex items-center space-x-2">
          <span>The Law of Mutation</span>
        </h3>
        
        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-semibold">
          A <strong className="text-amber-650 font-extrabold">Word Ladder</strong> is a puzzle where you must transform a Starting Word into a Target Word of the same length, changing exactly one letter at a time. Every word in the ladder must be a valid English word!
        </p>

        {/* Visual pipeline */}
        <div className="space-y-3.5 max-w-sm mx-auto pt-2">
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs">
            <span className="text-slate-500 font-sans font-bold">1. START WORD:</span>
            <span className="text-indigo-600 font-black tracking-widest">C O L D</span>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="w-4 h-4 text-slate-400 rotate-90" />
          </div>

          <div className="flex justify-between items-center bg-indigo-50/50 border border-indigo-200 p-3 rounded-xl font-mono text-xs text-indigo-700">
            <span className="text-indigo-600 font-sans font-bold">Mutate position 3 (L→R):</span>
            <span className="text-slate-800 font-black tracking-widest">C O <em className="text-indigo-600 not-italic uppercase font-black underline decoration-2">R</em> D</span>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="w-4 h-4 text-slate-400 rotate-90" />
          </div>

          <div className="flex justify-between items-center bg-indigo-50/50 border border-indigo-200 p-3 rounded-xl font-mono text-xs text-indigo-700">
            <span className="text-indigo-600 font-sans font-bold">Mutate position 4 (D→N):</span>
            <span className="text-slate-800 font-black tracking-widest">C O R <em className="text-indigo-600 not-italic uppercase font-black underline decoration-2">N</em></span>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="w-4 h-4 text-slate-405 rotate-90" />
          </div>

          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs">
            <span className="text-slate-500 font-sans font-bold">2. TARGET REACHED:</span>
            <span className="text-emerald-600 font-black tracking-widest">W A R M</span>
          </div>
        </div>
      </div>

      {/* Rules bullet details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-4">
          <h4 className="font-extrabold text-slate-800 text-sm flex items-center space-x-1.5 pb-2 border-b border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Alchemist Rules Checklist</span>
          </h4>
          <ul className="space-y-3.5 text-xs text-slate-600 font-semibold leading-relaxed list-disc list-inside">
            <li>Each ladder step must alter exactly one character.</li>
            <li>Words must remain the standard length (3, 4, or 5).</li>
            <li>You cannot alter word sizes mid-way.</li>
            <li>Each intermediate candidate must exist in our offline lexicon.</li>
            <li>Completing within <strong className="text-indigo-600">PAR Limit</strong> earns the supreme 3 Stars rating!</li>
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-4">
          <h4 className="font-extrabold text-slate-800 text-sm flex items-center space-x-1.5 pb-2 border-b border-slate-100">
            <Compass className="w-4 h-4 text-amber-500" />
            <span>Gameplay Mechanisms</span>
          </h4>
          <ul className="space-y-3.5 text-xs text-slate-600 font-semibold leading-relaxed list-disc list-inside">
            <li><strong className="text-amber-600 font-extrabold">Scribe Vault Glossary</strong>: Tap any word blocks to inspect dictionary explanations! Great for vocabulary learning.</li>
            <li><strong className="text-amber-600 font-extrabold">Oracle Guidance hint</strong>: Stuck in an isolated corridor? Tap hint for step recommendation.</li>
            <li><strong className="text-amber-600 font-extrabold">Sandbox DIY Workshops</strong>: Test arbitrary starting and target words, calculate corridors, and save level logs!</li>
            <li><strong className="text-amber-600 font-extrabold">100% Offline Gameplay</strong>: Zero internet connection is required by the solver. Ideal for planes, subways, and remote expeditions!</li>
          </ul>
        </div>

      </div>

    </div>
  );
}
