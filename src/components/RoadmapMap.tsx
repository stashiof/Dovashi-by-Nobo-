import React, { useState, useMemo } from 'react';
import { Pattern, UserStats } from '../types';
import { Search, Star, CheckCircle2, Bookmark, ArrowRight, Sparkles, Filter, Award, BookOpen, Volume2, Flame, Zap, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RoadmapMapProps {
  patterns: Pattern[];
  stats: UserStats;
  onSelectLevel: (levelId: number) => void;
  onToggleBookmark: (levelId: number) => void;
  showingBookmarksOnly: boolean;
  onClearBookmarksFilter: () => void;
}

export const RoadmapMap: React.FC<RoadmapMapProps> = ({
  patterns,
  stats,
  onSelectLevel,
  onToggleBookmark,
  showingBookmarksOnly,
  onClearBookmarksFilter
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPart, setSelectedPart] = useState<number | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'Beginner' | 'Intermediate' | 'Advanced'>('all');

  const filteredPatterns = useMemo(() => {
    return patterns.filter(p => {
      // Bookmark filter
      if (showingBookmarksOnly && !stats.bookmarkedLevelIds.includes(p.id)) {
        return false;
      }

      // Part filter
      if (selectedPart !== 'all' && p.part !== selectedPart) {
        return false;
      }

      // Difficulty filter
      if (selectedDifficulty !== 'all' && p.difficulty !== selectedDifficulty) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inId = String(p.id).includes(query);
        const inPatternNum = p.patternNumber.toLowerCase().includes(query);
        const inStructure = p.structure.toLowerCase().includes(query);
        const inMeaning = p.bengaliMeaning.toLowerCase().includes(query);
        const inTag = p.categoryTag.toLowerCase().includes(query);
        return inId || inPatternNum || inStructure || inMeaning || inTag;
      }

      return true;
    });
  }, [patterns, stats.bookmarkedLevelIds, showingBookmarksOnly, selectedPart, selectedDifficulty, searchQuery]);

  return (
    <div className="space-y-6 pb-20 font-['Hind_Siliguri',sans-serif]">
      {/* 10-Color Modern Master Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b0f1d] via-[#101528] to-[#060913] border border-slate-700/60 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
        {/* Colorful Multi-Glow Background Halos */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-gradient-to-bl from-pink-500/20 via-purple-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-72 h-72 bg-gradient-to-tr from-emerald-500/20 via-sky-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3.5 max-w-2xl">
            {/* Spectral Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-md">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              <span className="text-xs font-bold text-white tracking-wide ml-1">
                Dovashi • ৩০০টি স্পোকেন মাস্টার প্যাটার্ন
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight font-['Plus_Jakarta_Sans',sans-serif]">
              সহজ ও আধুনিক উপায়ে <span className="spectrum-text">ইংরেজিতে কথা বলুন</span>
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              প্রতিটি লেভেলে ৫টি বিশেষ ধাপ: <strong className="text-yellow-300">১. ফর্মুলা ও অর্থ</strong>, <strong className="text-purple-300">২. সহজ নিয়ম</strong>, <strong className="text-emerald-300">৩. পাওয়ার ভোকাবুলারি</strong>, <strong className="text-sky-300">৪. সেলফ-প্র্যাকটিস</strong>, এবং <strong className="text-pink-300">৫. রিয়েল-টাইম এআই স্পিকিং কোচ</strong>!
            </p>

            {/* 10-Color Palette Feature Highlights */}
            <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                🟢 ৩০০০+ বাক্য
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold flex items-center gap-1">
                🔵 অডিও উচ্চারণ
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold flex items-center gap-1">
                🟣 গ্রামার লজিক
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-pink-500/15 text-pink-300 border border-pink-500/30 font-semibold flex items-center gap-1">
                🩷 এআই লাইভ কল
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1">
                🟡 কুইজ ও XP
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#C89D7C]/15 text-[#C89D7C] border border-[#C89D7C]/30 font-semibold flex items-center gap-1">
                🟤 বিজনেস ইংলিশ
              </span>
            </div>
          </div>

          {/* Progress Tracker Card */}
          <div className="bg-[#080d1a]/90 border border-slate-700/80 rounded-3xl p-5 sm:p-6 flex flex-col items-center justify-center min-w-[240px] text-center shadow-2xl backdrop-blur-xl shrink-0">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-yellow-400" />
              আপনার সামগ্রিক অগ্রগতি
            </span>
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-300 font-['Plus_Jakarta_Sans',sans-serif]">
              {stats.completedLevelIds.length} <span className="text-base font-bold text-slate-500">/ 300</span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">লেভেল সম্পন্ন হয়েছে</p>
            <div className="w-full bg-slate-950 h-3 rounded-full mt-3 overflow-hidden p-[2px] border border-slate-800">
              <div 
                className="spectrum-border h-full rounded-full transition-all duration-700 shadow-md"
                style={{ width: `${Math.max(4, (stats.completedLevelIds.length / 300) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modern Filter & Search Bar */}
      <div className="bg-[#0a0f1d]/85 border border-slate-800/90 rounded-2xl p-4 space-y-4 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="প্যাটার্ন নম্বর, শব্দ বা অর্থ খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#050811] border border-slate-700/80 text-slate-100 pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-amber-400/80 placeholder:text-slate-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* 10-Color Category & Part Selection Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => { setSelectedPart('all'); if (showingBookmarksOnly) onClearBookmarksFilter(); }}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedPart === 'all' && !showingBookmarksOnly
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              সবগুলো (১ - ৩০০)
            </button>
            
            {/* 🟢 Part 1: Beginner Foundation (Emerald Green) */}
            <button
              onClick={() => { setSelectedPart(1); if (showingBookmarksOnly) onClearBookmarksFilter(); }}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedPart === 1 && !showingBookmarksOnly
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40 border border-emerald-500/30'
              }`}
            >
              🟢 Part 1 (001-100)
            </button>

            {/* 🔵 Part 2: Spoken Fluency (Ocean Blue) */}
            <button
              onClick={() => { setSelectedPart(2); if (showingBookmarksOnly) onClearBookmarksFilter(); }}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedPart === 2 && !showingBookmarksOnly
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'bg-sky-950/30 text-sky-300 hover:bg-sky-900/40 border border-sky-500/30'
              }`}
            >
              🔵 Part 2 (101-200)
            </button>

            {/* 🟣 Part 3: Advanced Mastery (Royal Purple) */}
            <button
              onClick={() => { setSelectedPart(3); if (showingBookmarksOnly) onClearBookmarksFilter(); }}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedPart === 3 && !showingBookmarksOnly
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                  : 'bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 border border-purple-500/30'
              }`}
            >
              🟣 Part 3 (201-300)
            </button>
          </div>
        </div>

        {/* Bookmarks Alert */}
        {showingBookmarksOnly && (
          <div className="flex items-center justify-between bg-pink-500/10 border border-pink-500/30 text-pink-300 px-4 py-2.5 rounded-xl text-xs">
            <span className="flex items-center gap-2 font-medium">
              <Bookmark className="w-4 h-4 fill-pink-400 text-pink-400" />
              সংরক্ষিত প্যাটার্নগুলো দেখা হচ্ছে ({filteredPatterns.length}টি)
            </span>
            <button
              onClick={onClearBookmarksFilter}
              className="text-pink-400 hover:text-white underline font-bold"
            >
              সবগুলো প্যাটার্ন দেখুন
            </button>
          </div>
        )}
      </div>

      {/* Grid of 300 Modern Multi-Colored Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredPatterns.map((pattern) => {
            const isCompleted = stats.completedLevelIds.includes(pattern.id);
            const isBookmarked = stats.bookmarkedLevelIds.includes(pattern.id);
            const levelProgress = stats.levelProgressMap[pattern.id];
            const stars = levelProgress?.stars || 0;

            // Harmonious 10-Color Palette per Level Category
            let theme = {
              badgeBorder: 'border-emerald-500/40',
              badgeBg: 'bg-emerald-500/10',
              badgeText: 'text-emerald-400',
              numberBg: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
              accentColor: 'text-emerald-400',
              cardBorder: isCompleted ? 'border-emerald-500/60 shadow-emerald-950/30' : 'border-slate-800/90 hover:border-emerald-500/40',
              btnGradient: 'from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300'
            };

            if (pattern.part === 2) {
              theme = {
                badgeBorder: 'border-sky-500/40',
                badgeBg: 'bg-sky-500/10',
                badgeText: 'text-sky-400',
                numberBg: 'bg-sky-950/60 border-sky-500/40 text-sky-300',
                accentColor: 'text-sky-400',
                cardBorder: isCompleted ? 'border-sky-500/60 shadow-sky-950/30' : 'border-slate-800/90 hover:border-sky-500/40',
                btnGradient: 'from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400'
              };
            } else if (pattern.part === 3) {
              theme = {
                badgeBorder: 'border-purple-500/40',
                badgeBg: 'bg-purple-500/10',
                badgeText: 'text-purple-400',
                numberBg: 'bg-purple-950/60 border-purple-500/40 text-purple-300',
                accentColor: 'text-purple-400',
                cardBorder: isCompleted ? 'border-purple-500/60 shadow-purple-950/30' : 'border-slate-800/90 hover:border-purple-500/40',
                btnGradient: 'from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400'
              };
            }

            // Warm Mocha / Bronze Accent for Business / Professional Tags
            if (pattern.categoryTag.toLowerCase().includes('business') || pattern.categoryTag.toLowerCase().includes('work') || pattern.categoryTag.toLowerCase().includes('formal')) {
              theme.badgeBg = 'bg-[#A27B5C]/15';
              theme.badgeBorder = 'border-[#C89D7C]/40';
              theme.badgeText = 'text-[#C89D7C]';
            }

            return (
              <motion.div
                key={pattern.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`relative group rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 bg-[#0a0f1d]/90 shadow-lg hover:shadow-2xl ${theme.cardBorder}`}
              >
                {/* Card Header: Level ID, Category Badge, Stars & Bookmark */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    {/* Level Number Box */}
                    <span className={`w-9 h-9 rounded-xl border flex items-center justify-center text-xs font-black group-hover:scale-105 transition-transform font-['Plus_Jakarta_Sans',sans-serif] ${theme.numberBg}`}>
                      {pattern.id}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">
                        {pattern.patternNumber}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme.badgeBg} ${theme.badgeBorder} ${theme.badgeText}`}>
                        {pattern.categoryTag}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* 🟡 Solar Gold Stars */}
                    <div className="flex items-center">
                      {[1, 2, 3].map((starIdx) => (
                        <Star
                          key={starIdx}
                          className={`w-3.5 h-3.5 ${
                            starIdx <= stars
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-slate-800'
                          }`}
                        />
                      ))}
                    </div>

                    {/* 🩷 Neon Pink Bookmark Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(pattern.id);
                      }}
                      className="p-1 rounded-lg text-slate-500 hover:text-pink-400 hover:bg-slate-800/80 transition-colors"
                      title={isBookmarked ? 'বুকমার্ক সরান' : 'বুকমার্ক করুন'}
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-pink-400 text-pink-400' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Structure & Formula Box with Deep Obsidian Canvas */}
                <div className="bg-[#050811]/90 border border-slate-800/90 rounded-xl p-3.5 my-2 space-y-1.5">
                  <div className={`text-[12px] font-mono font-bold line-clamp-2 ${theme.accentColor}`}>
                    {pattern.structure}
                  </div>
                  <div className="text-xs text-slate-200 font-medium leading-relaxed">
                    {pattern.bengaliMeaning}
                  </div>
                </div>

                {/* Sample Sentence Preview */}
                <div className="text-xs text-slate-400 italic mb-4 line-clamp-1">
                  &ldquo;{pattern.sentenceBuilding[0]?.en}&rdquo;
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-xs">
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        সম্পন্ন
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">
                        {pattern.difficulty} Level
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectLevel(pattern.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r ${theme.btnGradient} text-slate-950 font-bold text-xs shadow-md group-hover:translate-x-0.5 transition-all`}
                  >
                    <span>লেভেলে প্রবেশ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredPatterns.length === 0 && (
        <div className="text-center py-16 bg-[#0a0f1d]/60 border border-slate-800 rounded-3xl p-8 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">কোনো প্যাটার্ন পাওয়া যায়নি</h3>
          <p className="text-sm text-slate-400">
            অনুগ্রহ করে অন্য শব্দ বা ফিল্টার দিয়ে চেষ্টা করুন।
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedPart('all');
              onClearBookmarksFilter();
            }}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold rounded-xl text-xs"
          >
            সব প্যাটার্ন রিস্টোর করুন
          </button>
        </div>
      )}
    </div>
  );
};
