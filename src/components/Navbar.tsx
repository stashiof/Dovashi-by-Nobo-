import React from 'react';
import { UserStats } from '../types';
import { Sparkles, Flame, Bookmark, Key, BookOpen, Volume2 } from 'lucide-react';

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
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Subtitle */}
        <div 
          onClick={onOpenRoadmap}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Key className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-white font-extrabold text-base sm:text-lg tracking-tight flex items-center gap-1.5">
                The English Master Key
              </h1>
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                300 Patterns
              </span>
            </div>
            <p className="text-slate-400 text-xs font-medium">
              By Fahim Miya • স্পোকেন ও ফ্রি-হ্যান্ড রাইটিং মাস্টারকোর্স
            </p>
          </div>
        </div>

        {/* Stats & Gamification Badges */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
          {/* Daily Streak */}
          <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-bounce" />
            <span>{stats.streakDays} দিন স্ট্রিক</span>
          </div>

          {/* XP Badge */}
          <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-400 fill-indigo-400" />
            <span>{stats.totalXp} XP</span>
          </div>

          {/* Completed Progress */}
          <div 
            onClick={onOpenRoadmap}
            className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>{completedCount}/{totalLevels} লেভেল</span>
            <div className="w-12 h-2 bg-slate-700 rounded-full overflow-hidden hidden sm:block">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, progressPercent)}%` }}
              />
            </div>
            <span className="text-[11px] text-emerald-400 font-bold hidden sm:inline">{progressPercent}%</span>
          </div>

          {/* Bookmarks Toggle */}
          <button
            onClick={onOpenBookmarks}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              showingBookmarks
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${showingBookmarks ? 'fill-slate-950' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">সংরক্ষিত</span>
            <span>({stats.bookmarkedLevelIds.length})</span>
          </button>
        </div>
      </div>
    </header>
  );
};
