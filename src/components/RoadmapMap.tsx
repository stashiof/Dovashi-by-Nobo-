import React, { useState, useMemo } from 'react';
import { Pattern, UserStats, CategoryPart } from '../types';
import { Search, Star, CheckCircle2, Bookmark, ArrowRight, Sparkles, Filter, Award, BookOpen, Volume2 } from 'lucide-react';
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
    <div className="space-y-6 pb-20">
      {/* Hero Dovashi Master Key Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-950 border border-indigo-500/25 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-gradient-to-bl from-amber-500/15 via-rose-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-80 h-80 bg-gradient-to-tr from-violet-600/15 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 to-violet-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Dovashi (দোভাষী) • ৩০০টি মাস্টার প্যাটার্ন ও এআই লাইভ কোচ</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              ইংরেজি শেখার সবচেয়ে আধুনিক ও ইন্টারেক্টিভ রোডম্যাপ
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-['Hind_Siliguri',sans-serif]">
              প্রতিটি প্যাটার্ন ৫টি পূর্ণাঙ্গ ধাপে সাজানো: <strong className="text-amber-300">১. ফর্মুলা ও অর্থ</strong>, <strong className="text-indigo-300">২. সহজ গ্রামার ব্যাখ্যা</strong>, <strong className="text-emerald-300">৩. পাওয়ার ভোকাবুলারি</strong>, <strong className="text-sky-300">৪. সেলফ-প্র্যাকটিস ও কুইজ</strong>, এবং <strong className="text-rose-300">৫. রিয়েল-টাইম এআই স্পিকিং কল</strong>!
            </p>
          </div>

          <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-5 flex flex-col items-center justify-center min-w-[220px] text-center shadow-xl backdrop-blur-md">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">সামগ্রিক অগ্রগতি</span>
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200">
              {stats.completedLevelIds.length} <span className="text-base font-bold text-slate-500">/ 300</span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1 font-['Hind_Siliguri',sans-serif]">লেভেল সম্পন্ন হয়েছে</p>
            <div className="w-full bg-slate-900 h-2.5 rounded-full mt-3 overflow-hidden p-[2px] border border-slate-800">
              <div 
                className="bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-400 h-full rounded-full transition-all duration-700 shadow-md shadow-amber-500/30"
                style={{ width: `${Math.max(3, (stats.completedLevelIds.length / 300) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-4 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="প্যাটার্ন নম্বর, শব্দ বা অর্থ দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 placeholder:text-slate-500"
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

          {/* Part Selection Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => { setSelectedPart('all'); if (showingBookmarksOnly) onClearBookmarksFilter(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedPart === 'all' && !showingBookmarksOnly
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              সবগুলো (১ - ৩০০)
            </button>
            <button
              onClick={() => { setSelectedPart(1); if (showingBookmarksOnly) onClearBookmarksFilter(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedPart === 1 && !showingBookmarksOnly
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Part 1 (001-100)
            </button>
            <button
              onClick={() => { setSelectedPart(2); if (showingBookmarksOnly) onClearBookmarksFilter(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedPart === 2 && !showingBookmarksOnly
                  ? 'bg-blue-500 text-slate-950 font-bold shadow-md shadow-blue-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Part 2 (101-200)
            </button>
            <button
              onClick={() => { setSelectedPart(3); if (showingBookmarksOnly) onClearBookmarksFilter(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedPart === 3 && !showingBookmarksOnly
                  ? 'bg-purple-500 text-slate-950 font-bold shadow-md shadow-purple-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Part 3 (201-300)
            </button>
          </div>
        </div>

        {/* Showing Filter Results Notice */}
        {showingBookmarksOnly && (
          <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3.5 py-2 rounded-lg text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <Bookmark className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              আপনার সংরক্ষিত প্যাটার্নগুলো দেখানো হচ্ছে ({filteredPatterns.length}টি)
            </span>
            <button
              onClick={onClearBookmarksFilter}
              className="text-amber-400 hover:text-white underline font-semibold"
            >
              সব দেখুন
            </button>
          </div>
        )}
      </div>

      {/* Grid of 300 Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredPatterns.map((pattern) => {
            const isCompleted = stats.completedLevelIds.includes(pattern.id);
            const isBookmarked = stats.bookmarkedLevelIds.includes(pattern.id);
            const levelProgress = stats.levelProgressMap[pattern.id];
            const stars = levelProgress?.stars || 0;

            const partBadgeColor = 
              pattern.part === 1 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : pattern.part === 2 
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                : 'bg-purple-500/10 border-purple-500/30 text-purple-400';

            return (
              <motion.div
                key={pattern.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`relative group rounded-xl border p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 ${
                  isCompleted
                    ? 'bg-slate-900/90 border-amber-500/40 hover:border-amber-400 shadow-md hover:shadow-amber-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                {/* Top bar with level, tag, and bookmark */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center text-xs font-extrabold text-amber-400 group-hover:scale-105 transition-transform">
                      {pattern.id}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-300">
                        {pattern.patternNumber}
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${partBadgeColor}`}>
                        {pattern.categoryTag}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Stars */}
                    <div className="flex items-center">
                      {[1, 2, 3].map((starIdx) => (
                        <Star
                          key={starIdx}
                          className={`w-3.5 h-3.5 ${
                            starIdx <= stars
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Bookmark toggle button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(pattern.id);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                      title={isBookmarked ? 'সংরক্ষণ মুছে ফেলুন' : 'সংরক্ষণ করুন'}
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Structure & Formula Box */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 my-2 space-y-1.5">
                  <div className="text-[11px] font-mono font-bold text-amber-300 line-clamp-2">
                    {pattern.structure}
                  </div>
                  <div className="text-xs text-slate-300 font-medium">
                    {pattern.bengaliMeaning}
                  </div>
                </div>

                {/* Sample Sentence Preview */}
                <div className="text-xs text-slate-400 italic mb-4 line-clamp-1">
                  &ldquo;{pattern.sentenceBuilding[0]?.en}&rdquo;
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        সম্পন্ন
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">
                        {pattern.difficulty}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectLevel(pattern.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/10 hover:shadow-amber-500/20 group-hover:translate-x-0.5 transition-all"
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
        <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-2xl p-8 space-y-3">
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
            className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
          >
            সব প্যাটার্ন রিস্টোর করুন
          </button>
        </div>
      )}
    </div>
  );
};
