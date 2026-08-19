import React from 'react';
import { UserStats } from '../types';
import { Sparkles, Flame, Bookmark, BookOpen, Key, Check, Database, Cloud, User as UserIcon } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface NavbarProps {
  stats: UserStats;
  onOpenRoadmap: () => void;
  onOpenBookmarks: () => void;
  showingBookmarks: boolean;
  totalLevels: number;
  hasApiKey: boolean;
  onOpenApiKeyModal: () => void;
  currentUser: User | null;
  onOpenAuthSyncModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  onOpenRoadmap,
  onOpenBookmarks,
  showingBookmarks,
  totalLevels,
  hasApiKey,
  onOpenApiKeyModal,
  currentUser,
  onOpenAuthSyncModal
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
          {/* Dovashi Official Logo */}
          <div className="relative w-11 h-11 rounded-2xl p-[2px] bg-gradient-to-br from-violet-600 via-indigo-500 to-amber-400 shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-all duration-300">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center p-1 overflow-hidden relative shadow-inner">
              <img 
                src="/logo.svg" 
                alt="Dovashi Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
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
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-center font-['Hind_Siliguri',sans-serif]">
          
          {/* Supabase Cloud Account & Sync Button */}
          <button
            id="navbar-auth-sync-btn"
            onClick={onOpenAuthSyncModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              currentUser
                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-300 shadow-sm'
                : 'bg-gradient-to-r from-teal-500/15 to-emerald-500/15 hover:from-teal-500/25 hover:to-emerald-500/25 border-emerald-500/30 text-emerald-300'
            }`}
            title={currentUser ? `লগইনকৃত: ${currentUser.email} (ক্লাউড সিঙ্ক চালু)` : 'Supabase ডাটাবেজ ব্যাকআপ ও অ্যাকাউন্ট'}
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span className="max-w-[130px] truncate">
              {currentUser ? (currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'ক্লাউড সিঙ্ক') : 'ক্লাউড ব্যাকআপ'}
            </span>
            {currentUser && <Check className="w-3 h-3 text-emerald-400" />}
          </button>

          {/* API Key Connection Button */}
          <button
            id="navbar-api-key-btn"
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              hasApiKey
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border-amber-500/40 text-amber-300 animate-pulse'
            }`}
            title={hasApiKey ? 'Gemini API Key সংযুক্ত আছে' : 'Gemini API Key যোগ করুন'}
          >
            <Key className={`w-3.5 h-3.5 ${hasApiKey ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>{hasApiKey ? 'API Key' : 'API Key দিন'}</span>
            {hasApiKey && <Check className="w-3 h-3 text-emerald-400" />}
          </button>

          {/* Daily Streak */}
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500/15 to-amber-500/15 border border-orange-500/30 text-orange-300 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm backdrop-blur-sm">
            <Flame className="w-4 h-4 text-orange-400 fill-orange-400 animate-pulse" />
            <span>{stats.streakDays} দিন</span>
          </div>

          {/* XP Badge */}
          <div className="flex items-center gap-1.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-indigo-400 fill-indigo-400" />
            <span className="font-['Plus_Jakarta_Sans',sans-serif]">{stats.totalXp} XP</span>
          </div>

          {/* Completed Progress */}
          <div 
            onClick={onOpenRoadmap}
            className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all hover:border-slate-600"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>{completedCount}/{totalLevels}</span>
            <div className="w-12 h-2 bg-slate-950 rounded-full overflow-hidden hidden sm:block p-[1px] border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${Math.max(5, progressPercent)}%` }}
              />
            </div>
          </div>

          {/* Bookmarks Toggle */}
          <button
            onClick={onOpenBookmarks}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              showingBookmarks
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-lg shadow-amber-500/25'
                : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-300'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${showingBookmarks ? 'fill-slate-950' : 'text-amber-400'}`} />
            <span className="font-['Plus_Jakarta_Sans',sans-serif]">({stats.bookmarkedLevelIds.length})</span>
          </button>
        </div>
      </div>
    </header>
  );
};

