import React from 'react';
import { UserStats } from '../types';
import { Sparkles, Flame, Bookmark, BookOpen, Key, Check, User as UserIcon, Palette } from 'lucide-react';
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
  onChangeCourse?: () => void;
  onOpenAuthSyncModal,
  onChangeCourse: () => void;
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
  onOpenAuthSyncModal,
  onChangeCourse
}) => {
  const completedCount = stats.completedLevelIds.length;
  const progressPercent = Math.round((completedCount / totalLevels) * 100);

  return (
    <header className="sticky top-0 z-40 bg-[#050811]/90 backdrop-blur-2xl border-b border-slate-800/90 px-3 sm:px-6 py-2.5 shadow-2xl transition-all">
      {/* 10-Color Spectral Ambient Top Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] spectrum-border opacity-90" />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-3">
        {/* Brand & Subtitle */}
        <div 
          onClick={onOpenRoadmap}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          {/* Dovashi Official Logo with Spectral Halo */}
          <div className="relative w-11 h-11 rounded-2xl p-[2px] spectrum-border shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all duration-300">
            <div className="w-full h-full bg-[#0a0f1d] rounded-[14px] flex items-center justify-center p-1.5 overflow-hidden relative shadow-inner">
              <img 
                src="/logo.svg" 
                alt="Dovashi Logo" 
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
            {/* 🟢 Emerald Live Status Dot */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-[#050811] shadow-sm shadow-emerald-400" />
          </div>

          <div>
            <div className="flex items-center gap-2">
            {onChangeCourse && (
              <button
                onClick={onChangeCourse}
                title="Change Course"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700/50 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"
              >
                Change Course
              </button>
            )}
              <h1 className="text-white font-black text-lg sm:text-xl tracking-tight flex items-center gap-1.5 font-['Plus_Jakarta_Sans',sans-serif]">
                Dovashi <span className="text-xs font-bold text-amber-400 font-['Hind_Siliguri',sans-serif]">(দোভাষী)</span>
              </h1>
              {/* 🟣 Royal Violet Pattern Badge */}
              <span className="bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-amber-500/20 text-purple-200 border border-purple-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                300 Patterns
              </span>
            </div>
            <p className="text-slate-400 text-[11px] sm:text-xs font-medium font-['Hind_Siliguri',sans-serif] flex items-center gap-1.5">
              {/* 🟤 Warm Mocha / Bronze Accent */}
              <span className="text-[#C89D7C] font-semibold">A Nobo Brand</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300">Developed by Fahim Miya</span>
            </p>
          </div>
        </div>

        {/* 10-Color Gamification & Action Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center font-['Hind_Siliguri',sans-serif]">
          
          {/* 🟢 Emerald / Jade Profile & Auth Button */}
          <button
            id="navbar-auth-sync-btn"
            onClick={onOpenAuthSyncModal,
  onChangeCourse}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              currentUser
                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10'
                : 'bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/40 text-emerald-300'
            }`}
            title={currentUser ? `লগইনকৃত: ${currentUser.email}` : 'লগইন বা সাইন আপ করুন'}
          >
            <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span className="max-w-[110px] sm:max-w-[140px] truncate">
              {currentUser ? (currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'প্রোফাইল') : 'লগইন'}
            </span>
            {currentUser && <Check className="w-3 h-3 text-emerald-400" />}
          </button>

          {/* 🔴 / 🟡 API Key Modal Button (Ruby or Gold) */}
          <button
            id="navbar-api-key-btn"
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              hasApiKey
                ? 'bg-teal-500/15 hover:bg-teal-500/25 border-teal-500/40 text-teal-300'
                : 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/40 text-rose-300 animate-pulse'
            }`}
            title={hasApiKey ? 'Gemini API Key সংযুক্ত আছে' : 'Gemini API Key দিন'}
          >
            <Key className={`w-3.5 h-3.5 ${hasApiKey ? 'text-teal-400' : 'text-rose-400'}`} />
            <span>{hasApiKey ? 'API Key' : 'API Key দিন'}</span>
            {hasApiKey && <Check className="w-3 h-3 text-teal-400" />}
          </button>

          {/* 🟠 Sunset Orange Streak Badge */}
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/40 text-orange-300 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm shadow-orange-500/10">
            <Flame className="w-4 h-4 text-orange-400 fill-orange-400 animate-pulse" />
            <span>{stats.streakDays} দিন</span>
          </div>

          {/* 🟡 Solar Gold XP Badge */}
          <div className="flex items-center gap-1.5 bg-yellow-500/15 border border-yellow-500/40 text-yellow-300 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm shadow-yellow-500/10">
            <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="font-['Plus_Jakarta_Sans',sans-serif]">{stats.totalXp} XP</span>
          </div>

          {/* 🔵 Ocean Blue Completed Levels Progress */}
          <div 
            onClick={onOpenRoadmap}
            className="flex items-center gap-2 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-200 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all"
            title="সম্পূর্ণ অগ্রগতি"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>{completedCount}/{totalLevels}</span>
            <div className="w-10 sm:w-14 h-2 bg-slate-950 rounded-full overflow-hidden p-[1px] border border-sky-500/30">
              <div 
                className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, progressPercent)}%` }}
              />
            </div>
          </div>

          {/* 🩷 Neon Pink Bookmarks Toggle */}
          <button
            onClick={onOpenBookmarks}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              showingBookmarks
                ? 'bg-pink-500 text-white border-pink-400 font-bold shadow-lg shadow-pink-500/30'
                : 'bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/30 text-pink-300'
            }`}
            title="সংরক্ষিত প্যাটার্ন"
          >
            <Bookmark className={`w-3.5 h-3.5 ${showingBookmarks ? 'fill-white text-white' : 'text-pink-400 fill-pink-400/40'}`} />
            <span className="font-['Plus_Jakarta_Sans',sans-serif]">({stats.bookmarkedLevelIds.length})</span>
          </button>
        </div>
      </div>
    </header>
  );
};
