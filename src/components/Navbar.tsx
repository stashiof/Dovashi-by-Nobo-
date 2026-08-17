import React from 'react';
import { UserStats } from '../types';
import { Sparkles, Flame, Bookmark, MessageSquare, BookOpen } from 'lucide-react';

interface NavbarProps {
  stats: UserStats;
  onOpenRoadmap: () => void;
  onOpenBookmarks: () => void;
  showingBookmarks: boolean;
  totalLevels: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  onOpenRoadmap,
  onOpenBookmarks,
  showingBookmarks,
  totalLevels
}) => {
  const completedCount = stats.completedLevelIds.length;
  const progressPercent = Math.round((completedCount / totalLevels) * 100);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 sm:px-6 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Subtitle */}
        <div 
          onClick={onOpenRoadmap}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          {/* Dovashi Stylized Logo Avatar */}
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-500 to-amber-400 p-[2px] shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-all duration-300">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-amber-400/10" />
              <span className="font-black text-xl bg-gradient-to-r from-violet-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent tracking-tighter">
                D
              </span>
              <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-white font-black text-lg sm:text-xl tracking-tight flex items-center gap-1.5 font-['Plus_Jakarta_Sans',sans-serif]">
                Dovashi <span className="text-xs font-semibold text-amber-400 font-['Hind_Siliguri',sans-serif]">(দোভাষী)</span>
              </h1>
              <span className="bg-gradient-to-r from-indigo-500/20 to-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                300 Patterns
              </span>
            </div>
            <p className="text-slate-400 text-xs font-medium font-['Hind_Siliguri',sans-serif]">
              A Nobo Brand • Developed by Fahim Miya
            </p>
          </div>
        </div>

        {/* Stats & Gamification Badges */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center font-['Hind_Siliguri',sans-serif]">
          {/* Daily Streak */}
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500/15 to-amber-500/15 border border-orange-500/30 text-orange-300 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm backdrop-blur-sm">
            <Flame className="w-4 h-4 text-orange-400 fill-orange-400 animate-pulse" />
            <span>{stats.streakDays} দিন স্ট্রিক</span>
          </div>

          {/* XP Badge */}
          <div className="flex items-center gap-1.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-indigo-400 fill-indigo-400" />
            <span className="font-['Plus_Jakarta_Sans',sans-serif]">{stats.totalXp} XP</span>
          </div>

          {/* Completed Progress */}
          <div 
            onClick={onOpenRoadmap}
            className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all hover:border-slate-600"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>{completedCount}/{totalLevels} লেভেল</span>
            <div className="w-14 h-2 bg-slate-950 rounded-full overflow-hidden hidden sm:block p-[1px] border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${Math.max(5, progressPercent)}%` }}
              />
            </div>
            <span className="text-[11px] text-emerald-400 font-bold hidden sm:inline font-['Plus_Jakarta_Sans',sans-serif]">{progressPercent}%</span>
          </div>

          {/* Bookmarks Toggle */}
          <button
            onClick={onOpenBookmarks}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              showingBookmarks
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-lg shadow-amber-500/25'
                : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-300'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${showingBookmarks ? 'fill-slate-950' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">সংরক্ষিত</span>
            <span className="font-['Plus_Jakarta_Sans',sans-serif]">({stats.bookmarkedLevelIds.length})</span>
          </button>
        </div>
      </div>
    </header>
  );
};
