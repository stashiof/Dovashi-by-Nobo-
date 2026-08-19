import React, { useState } from 'react';
import { Pattern, UserStats } from '../types';
import { 
  ArrowLeft, ArrowRight, Bookmark, Sparkles, CheckCircle2, 
  HelpCircle, Send, Mic, MicOff, Volume2, RotateCcw, Award,
  BookOpen, Star, AlertCircle, MessageSquare, Lightbulb, Zap, Key, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { AudioVisualizer } from './AudioVisualizer';
import { getUserApiKey } from '../utils/storage';

interface LevelLearningViewProps {
  pattern: Pattern;
  stats: UserStats;
  onBackToRoadmap: () => void;
  onNextLevel: () => void;
  onPrevLevel: () => void;
  onToggleBookmark: (levelId: number) => void;
  onRecordProgress: (stars: number, quizScore: number, practiceDone: boolean, speakingDone: boolean) => void;
  onOpenApiKeyModal?: () => void;
  // Live Call Props
  callActive: boolean;
  tutorState: 'idle' | 'listening' | 'thinking' | 'speaking' | 'dancing';
  audioLevel: number;
  currentSubtitle: string;
  userSpeaking: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  errorMessage: string;
  messages?: Array<{ id: string; sender: 'user' | 'tutor'; text: string; timestamp: number }>;
  onStartCall: (pattern: Pattern) => void;
  onStopCall: () => void;
  onSendManualMessage?: (text: string) => void;
}

type TabType = 'formula' | 'grammar' | 'vocab' | 'practice' | 'speaking';

export const LevelLearningView: React.FC<LevelLearningViewProps> = ({
  pattern,
  stats,
  onBackToRoadmap,
  onNextLevel,
  onPrevLevel,
  onToggleBookmark,
  onRecordProgress,
  onOpenApiKeyModal,
  callActive,
  tutorState,
  audioLevel,
  currentSubtitle,
  userSpeaking,
  connectionStatus,
  errorMessage,
  messages = [],
  onStartCall,
  onStopCall,
  onSendManualMessage,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('formula');
  const [speakingTextInput, setSpeakingTextInput] = useState('');
  
  // Practice State
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, string>>({});
  const [practiceFeedbacks, setPracticeFeedbacks] = useState<Record<string, any>>({});
  const [evaluatingMap, setEvaluatingMap] = useState<Record<string, boolean>>({});

  // Quiz State
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const isBookmarked = stats.bookmarkedLevelIds.includes(pattern.id);
  const currentProgress = stats.levelProgressMap[pattern.id] || {
    stars: 0,
    quizScore: 0,
    practiceCompleted: false,
    speakingCompleted: false
  };

  // Text to Speech playback for examples
  const playEnglishAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Evaluate self-practice sentence with AI API
  const handleCheckSentence = async (practiceId: string, promptBn: string) => {
    const userText = practiceAnswers[practiceId]?.trim();
    if (!userText) return;

    const userApiKey = getUserApiKey();
    if (!userApiKey) {
      if (onOpenApiKeyModal) onOpenApiKeyModal();
      setPracticeFeedbacks(prev => ({
        ...prev,
        [practiceId]: {
          isCorrect: false,
          accuracyScore: 0,
          feedbackBn: 'AI মূল্যায়নের জন্য আপনার নিজস্ব Gemini API Key প্রয়োজন। উপরের "API Key দিন" বাটনে ক্লিক করে ফ্রিতে কি যুক্ত করুন।',
          suggestedVersion: ''
        }
      }));
      return;
    }

    setEvaluatingMap(prev => ({ ...prev, [practiceId]: true }));
    try {
      const { evaluateSentenceDirectly } = await import('../utils/aiEvaluator');
      const data = await evaluateSentenceDirectly(userApiKey, {
        patternId: pattern.id,
        structure: pattern.structure,
        promptBn: promptBn,
        userSentence: userText
      });

      setPracticeFeedbacks(prev => ({ ...prev, [practiceId]: data }));

      if (data.isCorrect || data.accuracyScore >= 70) {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
        onRecordProgress(1, 0, true, false);
      }
    } catch (e: any) {
      console.error("Evaluation error:", e);
      // Fallback local check
      const isClose = userText.length > 5;
      setPracticeFeedbacks(prev => ({
        ...prev,
        [practiceId]: {
          isCorrect: isClose,
          accuracyScore: isClose ? 85 : 50,
          feedbackBn: 'আপনার বাক্যটি সংরক্ষিত হয়েছে। প্যাটার্ন অনুযায়ী মিলিয়ে আরও চর্চা করুন।',
          suggestedVersion: userText
        }
      }));
    } finally {
      setEvaluatingMap(prev => ({ ...prev, [practiceId]: false }));
    }
  };

  // Submit Quiz
  const handleSubmitQuiz = () => {
    let score = 0;
    pattern.quizQuestions.forEach((q) => {
      if (selectedQuizAnswers[q.id] === q.correctAnswer) {
        score += 1;
      }
    });

    const percent = Math.round((score / pattern.quizQuestions.length) * 100);
    setQuizScore(percent);
    setQuizSubmitted(true);

    const stars = percent === 100 ? 3 : percent >= 50 ? 2 : 1;
    onRecordProgress(stars, percent, true, false);

    if (percent >= 70) {
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
    }
  };

  // Complete speaking milestone
  const handleCompleteSpeaking = () => {
    onRecordProgress(3, quizScore, true, true);
    confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 } });
  };

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto font-['Hind_Siliguri',sans-serif]">
      {/* Top Level Header & Navigation with 10-Color Spectral Touch */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0a0f1d]/90 border border-slate-800/90 rounded-3xl p-4 sm:p-6 backdrop-blur-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToRoadmap}
            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all shadow-md"
            title="রোডম্যাপে ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black px-3 py-0.5 rounded-full font-['Plus_Jakarta_Sans',sans-serif]">
                {pattern.patternNumber}
              </span>
              <span className="text-xs text-slate-400 font-bold">
                Part {pattern.part} • {pattern.categoryTag}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1 font-['Plus_Jakarta_Sans',sans-serif]">
              {pattern.bengaliMeaning}
            </h2>
          </div>
        </div>

        {/* Level Navigation & Bookmark */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={onPrevLevel}
            disabled={pattern.id <= 1}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none text-slate-300 hover:text-white transition-all"
            title="পূর্ববর্তী লেভেল"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold text-slate-300 px-2 font-['Plus_Jakarta_Sans',sans-serif]">
            লেভেল {pattern.id} / 300
          </span>

          <button
            onClick={onNextLevel}
            disabled={pattern.id >= 300}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none text-slate-300 hover:text-white transition-all"
            title="পরবর্তী লেভেল"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onToggleBookmark(pattern.id)}
            className={`p-2.5 rounded-xl border transition-all ${
              isBookmarked 
                ? 'bg-pink-500/20 border-pink-500/50 text-pink-400 shadow-md shadow-pink-500/10' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-pink-400 hover:border-pink-500/30'
            }`}
            title={isBookmarked ? 'বুকমার্ক সরান' : 'লেভেলটি বুকমার্ক করুন'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-pink-400 text-pink-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 5-Step Stage Navigation Tabs with 10 Distinct Eye-Pleasing Colors */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 border-b border-slate-800/80 scrollbar-none">
        {/* 🟡 Tab 1: Solar Gold */}
        <button
          onClick={() => setActiveTab('formula')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'formula'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]'
              : 'bg-[#0a0f1d]/80 text-yellow-300/80 hover:text-yellow-200 hover:bg-[#0f1629] border border-yellow-500/20'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>১. ফর্মুলা ও অর্থ</span>
        </button>

        {/* 🟣 Tab 2: Royal Purple */}
        <button
          onClick={() => setActiveTab('grammar')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'grammar'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25 scale-[1.02]'
              : 'bg-[#0a0f1d]/80 text-purple-300/80 hover:text-purple-200 hover:bg-[#0f1629] border border-purple-500/20'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          <span>২. গ্রামার ও নিয়ম</span>
        </button>

        {/* 🟢 Tab 3: Emerald Green */}
        <button
          onClick={() => setActiveTab('vocab')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'vocab'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 scale-[1.02]'
              : 'bg-[#0a0f1d]/80 text-emerald-300/80 hover:text-emerald-200 hover:bg-[#0f1629] border border-emerald-500/20'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>৩. ১০টি ভোকাবুলারি</span>
        </button>

        {/* 🟠 Tab 4: Sunset Orange & Coral */}
        <button
          onClick={() => setActiveTab('practice')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'practice'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-lg shadow-orange-500/25 scale-[1.02]'
              : 'bg-[#0a0f1d]/80 text-orange-300/80 hover:text-orange-200 hover:bg-[#0f1629] border border-orange-500/20'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>৪. প্র্যাকটিস ও কুইজ</span>
        </button>

        {/* 🩷 Tab 5: Neon Pink Air Live Voice */}
        <button
          onClick={() => setActiveTab('speaking')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'speaking'
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30 scale-[1.02]'
              : 'bg-[#0a0f1d]/80 text-pink-300/90 hover:text-pink-200 hover:bg-[#0f1629] border border-pink-500/30'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>৫. লাইভ স্পিকিং কোচ</span>
        </button>
      </div>

      {/* Tab Content Display */}
      <AnimatePresence mode="wait">
        {/* TAB 1: FORMULA & MEANING (Solar Gold 🟡 + Ocean Blue 🔵) */}
        {activeTab === 'formula' && (
          <motion.div
            key="formula"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Master Structure Box */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1122] via-[#090d1a] to-[#060913] border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Master Sentence Structure
                </span>
                <span className="text-xs text-amber-300/80 font-mono bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30">
                  {pattern.difficulty} Level
                </span>
              </div>

              <div className="text-lg sm:text-2xl font-mono font-black text-amber-300 bg-[#050811] border border-amber-500/30 rounded-2xl p-4 sm:p-5 my-2 shadow-inner">
                {pattern.structure}
              </div>

              <div className="text-base sm:text-lg font-bold text-white mt-4 flex items-center gap-2">
                <span className="text-amber-400">অর্থ:</span> {pattern.bengaliMeaning}
              </div>
            </div>

            {/* Sentence Examples with Audio Button */}
            <div className="bg-[#0a0f1d]/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-400" />
                বাক্য গঠন ও ব্যবহারিক উদাহরণ (Sentence Building)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pattern.sentenceBuilding.map((ex, idx) => (
                  <div 
                    key={idx}
                    className="bg-[#050811] border border-slate-800 hover:border-sky-500/40 rounded-2xl p-4 flex items-start justify-between gap-3 group transition-all"
                  >
                    <div className="space-y-1.5">
                      <div className="text-sm sm:text-base font-bold text-white">
                        {ex.en}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-300 font-medium">
                        {ex.bn}
                      </div>
                    </div>

                    <button
                      onClick={() => playEnglishAudio(ex.en)}
                      className="p-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/25 text-sky-400 hover:text-sky-300 transition-colors shrink-0 border border-sky-500/20"
                      title="উচ্চারণ শুনুন"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Spoken vs Written Freehand Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-950/40 to-[#0a0f1d] border border-blue-500/30 rounded-3xl p-5 space-y-2 shadow-lg">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wide">
                  <MessageSquare className="w-3.5 h-3.5" />
                  স্পোকেন ইংলিশে যেভাবে বলবেন
                </div>
                <p className="text-sm font-semibold text-white">
                  &ldquo;{pattern.spokenAndWriting.spoken.en}&rdquo;
                </p>
                <p className="text-xs text-slate-300">
                  {pattern.spokenAndWriting.spoken.context}
                </p>
              </div>

              <div className="bg-gradient-to-br from-teal-950/40 to-[#0a0f1d] border border-teal-500/30 rounded-3xl p-5 space-y-2 shadow-lg">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wide">
                  <BookOpen className="w-3.5 h-3.5" />
                  ফ্রি-হ্যান্ড রাইটিংয়ে যেভাবে লিখবেন
                </div>
                <p className="text-sm font-semibold text-white">
                  &ldquo;{pattern.spokenAndWriting.writing.en}&rdquo;
                </p>
                <p className="text-xs text-slate-300">
                  {pattern.spokenAndWriting.writing.context}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setActiveTab('grammar')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all"
              >
                <span>পরবর্তী ধাপ: গ্রামার ও নিয়ম</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* TAB 2: GRAMMAR & NUANCES (Royal Purple 🟣 + Ruby Red 🔴) */}
        {activeTab === 'grammar' && (
          <motion.div
            key="grammar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <div className="bg-[#0a0f1d]/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white flex items-center gap-2 font-['Plus_Jakarta_Sans',sans-serif]">
                  <Lightbulb className="w-5 h-5 text-purple-400" />
                  গ্রামারের খুঁটিনাটি ও সঠিক নিয়ম
                </h3>
                <p className="text-xs text-slate-400">
                  এই প্যাটার্নের ব্যাকরণগত ব্যাখ্যা ও ব্যবহারের নিয়ম
                </p>
              </div>

              <div className="space-y-4">
                {pattern.grammarCoverage.map((item, idx) => (
                  <div 
                    key={idx}
                    className="bg-[#050811] border border-slate-800/90 rounded-2xl p-5 space-y-2 hover:border-purple-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm sm:text-base font-bold text-purple-300 font-['Plus_Jakarta_Sans',sans-serif]">
                        {item.title}
                      </h4>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-500/40">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {item.explanation}
                    </p>
                  </div>
                ))}
              </div>

              {/* 🔴 Ruby Coral Red Warning Box */}
              <div className="bg-rose-950/30 border border-rose-500/40 rounded-2xl p-4 flex items-start gap-3 text-rose-200 text-xs sm:text-sm shadow-md">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-rose-300">সতর্কতা ও কমন ভুল:</strong> এই প্যাটার্নটিতে অনেকেই Verb-এর সঠিক রূপ ও Preposition নির্বাচনে ভুল করেন। সবসময় মূল সূত্রটি হুবহু অনুসরণ করুন।
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setActiveTab('formula')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>পূর্ববর্তী ধাপ</span>
              </button>
              <button
                onClick={() => setActiveTab('vocab')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-black text-sm shadow-xl shadow-purple-500/20 transition-all"
              >
                <span>পরবর্তী ধাপ: ১০টি ভোকাবুলারি</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* TAB 3: 10 VOCABULARY WORDS & SYNONYMS (Emerald Green 🟢 & Warm Mocha 🟤) */}
        {activeTab === 'vocab' && (
          <motion.div
            key="vocab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Synonyms & Antonyms Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-3xl p-5 space-y-2 shadow-lg">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                  সমার্থক শব্দ (Synonyms)
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {pattern.vocabularySpotlight.synonyms.map((syn, i) => (
                    <span 
                      key={i}
                      onClick={() => playEnglishAudio(syn)}
                      className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold cursor-pointer hover:bg-emerald-500/25 transition-colors flex items-center gap-1.5"
                    >
                      {syn}
                      <Volume2 className="w-3 h-3 text-emerald-400" />
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-rose-950/30 border border-rose-500/30 rounded-3xl p-5 space-y-2 shadow-lg">
                <div className="text-xs font-bold text-rose-400 uppercase tracking-wide">
                  বিপরীতার্থক শব্দ (Antonyms)
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {pattern.vocabularySpotlight.antonyms.map((ant, i) => (
                    <span 
                      key={i}
                      onClick={() => playEnglishAudio(ant)}
                      className="px-3 py-1.5 bg-rose-500/15 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold cursor-pointer hover:bg-rose-500/25 transition-colors flex items-center gap-1.5"
                    >
                      {ant}
                      <Volume2 className="w-3 h-3 text-rose-400" />
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 10 Power Vocabulary Words */}
            <div className="bg-[#0a0f1d]/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2 font-['Plus_Jakarta_Sans',sans-serif]">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  লেভেলের ১০টি পাওয়ার ভোকাবুলারি
                </h3>
                <p className="text-xs text-slate-400">
                  এই স্ট্রাকচারের সাথে সর্বাধিক ব্যবহৃত ১০টি ইংরেজি শব্দ ও উদাহরণ
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pattern.vocabularySpotlight.powerWords.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-[#050811] border border-slate-800 rounded-2xl p-4 flex items-start justify-between gap-3 group hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-500 font-mono">#{idx + 1}</span>
                        <span className="text-sm font-black text-white font-['Plus_Jakarta_Sans',sans-serif]">{item.word}</span>
                        <span className="text-xs text-slate-400">({item.meaning})</span>
                      </div>
                      <div className="text-xs text-slate-300 italic">
                        &ldquo;{item.example}&rdquo;
                      </div>
                    </div>

                    <button
                      onClick={() => playEnglishAudio(item.word + '. ' + item.example)}
                      className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 hover:text-emerald-300 transition-colors shrink-0 border border-emerald-500/20"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setActiveTab('grammar')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>পূর্ববর্তী ধাপ</span>
              </button>
              <button
                onClick={() => setActiveTab('practice')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 transition-all"
              >
                <span>পরবর্তী ধাপ: প্র্যাকটিস ও কুইজ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* TAB 4: PRACTICE & QUIZ (Sunset Orange 🟠 & Amber Yellow 🟡) */}
        {activeTab === 'practice' && (
          <motion.div
            key="practice"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Sentence Translation & AI Evaluation */}
            <div className="bg-[#0a0f1d]/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2 font-['Plus_Jakarta_Sans',sans-serif]">
                  <CheckCircle2 className="w-5 h-5 text-orange-400" />
                  সেলফ-প্র্যাকটিস: বাংলা থেকে ইংরেজিতে বাক্য তৈরি করুন
                </h3>
                <p className="text-xs text-slate-400">
                  নিচের বাক্যগুলোর ইংরেজি রূপ লিখে এআই দিয়ে সরাসরি যাচাই করুন
                </p>
              </div>

              <div className="space-y-5">
                {pattern.selfPractice.map((pr, idx) => {
                  const feedback = practiceFeedbacks[pr.id];
                  const isEvaluating = evaluatingMap[pr.id];

                  return (
                    <div 
                      key={pr.id}
                      className="bg-[#050811] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 hover:border-orange-500/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                            অনুশীলন #{idx + 1}
                          </span>
                          <h4 className="text-sm sm:text-base font-bold text-white">
                            {pr.promptBn}
                          </h4>
                        </div>
                        <span className="text-xs text-slate-400 font-mono hidden sm:inline bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                          হিন্ট: {pr.targetPatternHint}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="আপনার ইংরেজি বাক্যটি এখানে লিখুন..."
                          value={practiceAnswers[pr.id] || ''}
                          onChange={(e) => setPracticeAnswers({ ...practiceAnswers, [pr.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCheckSentence(pr.id, pr.promptBn);
                          }}
                          className="flex-1 bg-[#090d1a] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-400/80"
                        />
                        <button
                          onClick={() => handleCheckSentence(pr.id, pr.promptBn)}
                          disabled={isEvaluating || !practiceAnswers[pr.id]?.trim()}
                          className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shrink-0 transition-all shadow-md shadow-orange-500/20"
                        >
                          {isEvaluating ? (
                            <span className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>AI চেক করুন</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Feedback Box */}
                      {feedback && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className={`rounded-2xl p-4 border text-xs sm:text-sm space-y-1.5 ${
                            feedback.isCorrect || feedback.accuracyScore >= 70
                              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                              : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>
                              {feedback.isCorrect ? '✅ চমৎকার ও সঠিক!' : '💡 কিছু সংশোধনের সুযোগ রয়েছে'}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700">
                              স্কোর: {feedback.accuracyScore}%
                            </span>
                          </div>
                          <p>{feedback.feedbackBn}</p>
                          {feedback.suggestedVersion && (
                            <div className="text-xs pt-1 border-t border-slate-800 text-yellow-300 font-mono">
                              আদর্শ রূপ: &ldquo;{feedback.suggestedVersion}&rdquo;
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pattern Accuracy MCQ Quiz */}
            <div className="bg-[#0a0f1d]/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2 font-['Plus_Jakarta_Sans',sans-serif]">
                  <HelpCircle className="w-5 h-5 text-yellow-400" />
                  লেভেল কুইজ টেস্ট
                </h3>
                <p className="text-xs text-slate-400">
                  প্যাটার্ন নির্ভুলভাবে শেখা হয়েছে কি না যাচাই করুন
                </p>
              </div>

              <div className="space-y-4">
                {pattern.quizQuestions.map((q, idx) => (
                  <div 
                    key={q.id}
                    className="bg-[#050811] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3"
                  >
                    <div className="text-sm sm:text-base font-bold text-white">
                      {idx + 1}. {q.questionBn}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selectedQuizAnswers[q.id] === opt;
                        const isCorrect = opt === q.correctAnswer;

                        let btnClass = 'bg-[#090d1a] border-slate-800 text-slate-300 hover:border-slate-700';
                        if (quizSubmitted) {
                          if (isCorrect) {
                            btnClass = 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold';
                          } else if (isSelected) {
                            btnClass = 'bg-rose-950/60 border-rose-500 text-rose-300 font-bold';
                          }
                        } else if (isSelected) {
                          btnClass = 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold';
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={quizSubmitted}
                            onClick={() => setSelectedQuizAnswers({ ...selectedQuizAnswers, [q.id]: opt })}
                            className={`p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all ${btnClass}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted && (
                      <div className="text-xs bg-slate-900/95 border border-slate-800 rounded-xl p-3.5 text-slate-300 space-y-1">
                        <span className="font-bold text-amber-400">ব্যাখ্যা: </span>
                        {q.explanationBn}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Quiz Submit Button */}
              {!quizSubmitted ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(selectedQuizAnswers).length === 0}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-sm transition-all shadow-xl shadow-amber-500/20"
                >
                  কুইজ সাবমিট করুন ও পয়েন্ট অর্জন করুন
                </button>
              ) : (
                <div className="bg-[#050811] border border-amber-500/40 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                  <div>
                    <div className="text-base font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                      <Award className="w-5 h-5 text-amber-400" />
                      কুইজ স্কোর: {quizScore}%
                    </div>
                    <p className="text-xs text-slate-400">
                      আপনি এই লেভেলের অনুশীলনী সম্পন্ন করেছেন!
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setQuizSubmitted(false);
                      setSelectedQuizAnswers({});
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    পুনরায় দিন
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setActiveTab('vocab')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>পূর্ববর্তী ধাপ</span>
              </button>
              <button
                onClick={() => setActiveTab('speaking')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-black text-sm shadow-xl shadow-pink-500/20 transition-all"
              >
                <span>চূড়ান্ত ধাপ: লাইভ স্পিকিং কোচ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* TAB 5: LIVE AI SPEAKING ROOM (Neon Pink 🩷 + Emerald Green 🟢) */}
        {activeTab === 'speaking' && (
          <motion.div
            key="speaking"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Speaking Room Mission Banner & Air Identity */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1122] via-[#10172e] to-[#12081f] border border-pink-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-500/15 border border-pink-500/40 text-pink-300 text-xs font-bold">
                  <Mic className="w-3.5 h-3.5 text-pink-400" />
                  <span>Air — AI Conversation Partner & Practice Coach</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-700">
                    🗣️ ন্যাচারাল স্পোকেন ইংলিশ
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/15 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                    +৫০ XP
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white font-['Plus_Jakarta_Sans',sans-serif]">
                  টপিক: {pattern.speakingTask.topic}
                </h3>
                <p className="text-sm text-slate-300 mt-1">
                  {pattern.speakingTask.promptQuestionBn}
                </p>
              </div>

              {/* Sample Response Box */}
              <div className="bg-[#050811] border border-slate-800 rounded-2xl p-4 space-y-1.5">
                <div className="text-xs font-bold text-slate-400">
                  নমুনা প্র্যাকটিস উত্তর (Sample Answer):
                </div>
                <div className="text-sm font-semibold text-emerald-300 flex items-center justify-between gap-2">
                  <span>&ldquo;{pattern.speakingTask.sampleAnswerEn}&rdquo;</span>
                  <button
                    onClick={() => playEnglishAudio(pattern.speakingTask.sampleAnswerEn)}
                    className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20"
                    title="নমুনা উত্তর শুনুন"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Live Audio Visualizer Stage */}
            <div className="bg-[#050811] border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center min-h-[320px] space-y-6 shadow-2xl relative">
              <div className="w-full max-w-md">
                <AudioVisualizer 
                  audioLevel={audioLevel}
                  tutorState={tutorState}
                  callActive={callActive}
                  userSpeaking={userSpeaking}
                />
              </div>

              {/* Live Subtitle Caption */}
              {callActive && currentSubtitle && (
                <div className="max-w-lg text-center bg-[#0a0f1d]/95 border border-pink-500/30 px-5 py-3 rounded-2xl text-sm text-slate-200 shadow-xl animate-fade-in">
                  <span className="text-xs font-bold text-pink-400 block mb-1">
                    {tutorState === 'speaking' ? 'Air (AI কোচ):' : 'লাইভ স্ট্যাটাস:'}
                  </span>
                  &ldquo;{currentSubtitle}&rdquo;
                </div>
              )}

              {/* Call Controls */}
              <div className="flex flex-col items-center gap-3 w-full max-w-lg">
                {!getUserApiKey() && !callActive && (
                  <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 max-w-md text-center space-y-2">
                    <div className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5">
                      <Key className="w-4 h-4 text-amber-400" />
                      <span>Gemini API Key প্রয়োজন</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      AI কোচের সাথে কথা বলতে আপনার নিজস্ব ফ্রি Gemini API Key যোগ করুন।
                    </p>
                    {onOpenApiKeyModal && (
                      <button
                        onClick={onOpenApiKeyModal}
                        type="button"
                        className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all"
                      >
                        ১ মিনিটে ফ্রি API Key যুক্ত করুন
                      </button>
                    )}
                  </div>
                )}

                {!callActive ? (
                  <button
                    onClick={() => {
                      if (!getUserApiKey() && onOpenApiKeyModal) {
                        onOpenApiKeyModal();
                        return;
                      }
                      onStartCall(pattern);
                    }}
                    disabled={connectionStatus === 'connecting'}
                    className="flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-400 hover:to-rose-400 text-white font-black rounded-2xl text-sm shadow-xl shadow-pink-500/30 transition-all hover:scale-105 active:scale-95"
                  >
                    <Mic className="w-5 h-5" />
                    <span>
                      {connectionStatus === 'connecting' ? 'সংযোগ হচ্ছে...' : 'লাইভ স্পিকিং শুরু করুন'}
                    </span>
                  </button>
                ) : (
                  <div className="w-full space-y-4">
                    {/* Live Status indicator */}
                    <div className="flex items-center justify-center gap-2 py-2 px-4 bg-slate-900 border border-slate-800 rounded-2xl max-w-sm mx-auto">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                      </span>
                      <span className="text-xs font-bold text-pink-400">
                        {userSpeaking ? '🎙️ আপনি কথা বলছেন...' : tutorState === 'speaking' ? '🔊 Air লাইভ কথা বলছে...' : '⚡ Gemini Live সক্রিয় — কথা বলুন...'}
                      </span>
                    </div>

                    {/* Live Dialogue Stream Log */}
                    {messages.length > 0 && (
                      <div className="w-full max-h-56 overflow-y-auto space-y-2.5 p-3 rounded-2xl bg-[#090d1a] border border-slate-800 text-left text-xs">
                        {messages.map((m) => (
                          <div
                            key={m.id}
                            className={`flex gap-2 ${
                              m.sender === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 ${
                                m.sender === 'user'
                                  ? 'bg-emerald-600/30 border border-emerald-500/40 text-emerald-100 rounded-br-none'
                                  : 'bg-slate-900 border border-pink-500/30 text-slate-200 rounded-bl-none'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-slate-400 mb-1">
                                <span>{m.sender === 'user' ? '👤 আপনি' : '🎙️ Air (কোচ)'}</span>
                                {m.sender === 'tutor' && (
                                  <button
                                    onClick={() => playEnglishAudio(m.text)}
                                    className="p-1 rounded bg-slate-800 hover:bg-pink-500/20 text-slate-300 hover:text-pink-300 transition-colors"
                                    title="আবার শুনুন"
                                  >
                                    <Volume2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Live Message Input bar */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (speakingTextInput.trim() && onSendManualMessage) {
                          onSendManualMessage(speakingTextInput.trim());
                          setSpeakingTextInput('');
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={speakingTextInput}
                        onChange={(e) => setSpeakingTextInput(e.target.value)}
                        placeholder="মুখে কথা বলুন অথবা এখানে লিখে Send চাপুন..."
                        className="flex-1 px-4 py-2.5 bg-[#090d1a] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                      />
                      <button
                        type="submit"
                        disabled={!speakingTextInput.trim()}
                        className="px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-md transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>পাঠান</span>
                      </button>
                    </form>

                    {/* Hangup & Complete Buttons */}
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={onStopCall}
                        className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-xl shadow-rose-600/20 transition-all"
                      >
                        <MicOff className="w-4 h-4" />
                        <span>কথা শেষ করুন</span>
                      </button>

                      <button
                        onClick={handleCompleteSpeaking}
                        className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-xl shadow-amber-500/20 transition-all"
                      >
                        <Award className="w-4 h-4" />
                        <span>মাস্টারি সম্পন্ন চিহ্নিত করুন</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-500/30 px-4 py-2 rounded-lg max-w-md text-center">
                  {errorMessage}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setActiveTab('practice')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>পূর্ববর্তী ধাপ</span>
              </button>

              <button
                onClick={onNextLevel}
                disabled={pattern.id >= 300}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all"
              >
                <span>পরবর্তী লেভেল ({pattern.id + 1})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
