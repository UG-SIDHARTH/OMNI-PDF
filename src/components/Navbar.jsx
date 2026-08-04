import React from 'react';
import { ShieldCheck, Sparkles, Search, Layers, Clock } from 'lucide-react';

export default function Navbar({ onSelectCategory, onHome, searchQuery, setSearchQuery, activeTool, setActiveTool }) {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo */}
          <div 
            onClick={onHome} 
            className="flex items-center gap-3 cursor-pointer group flex-shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-600/20 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Omni<span className="text-rose-500">PDF</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-rose-400 border border-slate-700">
                PRO
              </span>
            </div>
          </div>

          {/* Search bar */}
          {!activeTool && (
            <div className="flex-1 max-w-md hidden md:block">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search 30+ PDF & Image tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700/60 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm placeholder-slate-500 outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Security & Privacy Banner */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Files automatically deleted in <strong>3h</strong></span>
            </div>

            {activeTool && (
              <button
                onClick={onHome}
                className="text-xs font-medium px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                ← All Tools
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
