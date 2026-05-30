/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Crown, 
  Flame, 
  Map, 
  Calendar, 
  Zap, 
  PlusCircle, 
  BarChart2, 
  Settings, 
  HelpCircle 
} from "lucide-react";
import { PlayerStats } from "../types";

interface MenuProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  stats: PlayerStats;
  totalChaptersStars: number;
}

export default function Menu({ activeTab, setActiveTab, stats, totalChaptersStars }: MenuProps) {
  // Navigation links
  const navItems = [
    { id: "adventure", label: "Quest Mode", icon: Map, color: "text-amber-500 bg-amber-50" },
    { id: "daily", label: "Daily Run", icon: Calendar, color: "text-emerald-500 bg-emerald-50" },
    { id: "arcade", label: "Time Attack", icon: Zap, color: "text-indigo-500 bg-indigo-50" },
    { id: "workshop", label: "Sand Workshop", icon: PlusCircle, color: "text-purple-500 bg-purple-50" },
    { id: "stats", label: "Scribe Vault", icon: BarChart2, color: "text-teal-500 bg-teal-50" },
  ];

  return (
    <header className="w-full bg-white/95 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-40 transition-all shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo Brand */}
          <button 
            onClick={() => setActiveTab("adventure")}
            className="flex items-center space-x-3 text-left group transition outline-none cursor-pointer"
            id="brand-logo-btn"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-tr from-rose-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.15)] group-hover:scale-105 transition-transform duration-200 shrink-0 border border-indigo-200">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight uppercase">
                Word Ladder <span className="bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">Quest</span>
              </h1>
              <p className="text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-widest hidden sm:block">
                ALCHEMIST CHRONICLES
              </p>
            </div>
          </button>

          {/* Quick HUD Metrics */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Daily Streak Badge */}
            <div 
              className="flex items-center font-bold bg-rose-50 border border-rose-200 text-rose-600 rounded-full px-3 py-1.5 text-xs shadow-sm backdrop-blur-sm"
              title="Daily Streak Tracker"
            >
              <Flame className="w-3.5 h-3.5 mr-1 fill-rose-500 text-rose-50 animate-pulse" />
              <span>{stats.dailyStreaks}d streak</span>
            </div>

            {/* Total Stars Badge */}
            <div 
              className="flex items-center font-bold bg-amber-50 border border-amber-200 text-amber-750 rounded-full px-3 py-1.5 text-xs shadow-sm backdrop-blur-sm"
              title="Adventure Stars Earned"
            >
              <span className="text-amber-500 mr-1 text-sm">★</span>
              <span>{totalChaptersStars} stars</span>
            </div>

            {/* Tutorial Button */}
            <button
              onClick={() => setActiveTab("howtoplay")}
              className={`p-2 rounded-xl border transition duration-150 cursor-pointer active:translate-y-0.5 ${
                activeTab === "howtoplay" 
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-sm" 
                  : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600"
              }`}
              title="How to Play Guidelines"
              id="help-btn"
            >
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex space-x-2 overflow-x-auto pb-3 pt-1 scrollbar-none scroll-smooth">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-200 shrink-0 outline-none select-none relative uppercase cursor-pointer border ${
                  isSelected 
                    ? "bg-indigo-600 text-white border-indigo-500/40 shadow-md shadow-indigo-500/15 backdrop-blur-sm" 
                    : "bg-slate-100/90 text-slate-600 border-slate-200 hover:bg-slate-200 hover:border-slate-350"
                }`}
                id={`nav-tab-${item.id}`}
              >
                <IconComponent className={`w-3.5 h-3.5 ${isSelected ? "text-amber-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
