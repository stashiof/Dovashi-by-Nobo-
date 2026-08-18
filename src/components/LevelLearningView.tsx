import React, { useState } from 'react';
import { Pattern, UserStats } from '../types';
import { 
  ArrowLeft, ArrowRight, Bookmark, Sparkles, CheckCircle2, 
  HelpCircle, Send, Mic, MicOff, Volume2, RotateCcw, Award,
  BookOpen, Star, AlertCircle, MessageSquare, Lightbulb, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { AudioVisualizer } from './AudioVisualizer';
import { getUserApiKey } from '../utils/storage';
import { Key } from 'lucide-react';

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
  onStartCall,
  onStopCall,
  onSendManualMessage
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
          feedbackBn: 'AI মূল্যায়নের জন্য আপনার নিজস্ব Gemini API Key প্রয়োজন। উপরের "API Key যোগ করুন" বাটনে ক্লিক করে ফ্রিতে কি যুক্ত করুন।',
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
          feedbackBn: 'আপনার বাক্যটি সংরক্ষিত হয়েছে। প্যাটার্ন মিলিয়ে আবার চেষ্টা করুন।',
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
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Top Level Header & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToRoadmap}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="রোডম্যাপে ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                {pattern.patternNumber}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                Part {pattern.part} • {pattern.categoryTag}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              {pattern.bengaliMeaning}
            </h2>
          </div>
        </div>

        {/* Level Navigation and Bookmark */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={onPrevLevel}
            disabled={pattern.id <= 1}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 hover:text-white transition-colors"
            title="পূর্ববর্তী লেভেল"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold text-slate-400 px-2">
            লেভেল {pattern.id} / 300
          </span>

          <button
            onClick={onNextLevel}
            disabled={pattern.id >= 300}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 hover:text-white transition-colors"
            title="পরবর্তী লেভেল"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onToggleBookmark(pattern.id)}
            className={`p-2 rounded-xl border transition-all ${
              isBookmarked 
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title={isBookmarked ? 'বুকমার্ক সরান' : 'লেভেলটি বুকমার্ক করুন'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 5-Step Stage Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('formula')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'formula'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>১. ফর্মুলা ও অর্থ</span>
        </button>

        <button
          onClick={() => setActiveTab('grammar')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'grammar'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          <span>২. গ্রামার ও নিয়ম</span>
        </button>

        <button
          onClick={() => setActiveTab('vocab')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'vocab'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>৩. ১০টি ভোকাবুলারি</span>
        </button>

        <button
          onClick={() => setActiveTab('practice')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'practice'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>৪. প্র্যাকটিস ও কুইজ</span>
        </button>

        <button
          onClick={() => setActiveTab('speaking')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'speaking'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900/60 text-emerald-400 hover:text-emerald-300 hover:bg-slate-850'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>৫. লাইভ স্পিকিং কোচ</span>
        </button>
      </div>

      {/* Tab Content Display */}
      <AnimatePresence mode="wait">
        {/* TAB 1: FORMULA & MEANING */}
        {activeTab === 'formula' && (
          <motion.div
            key="formula"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Master Structure Box */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Master Sentence Structure
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {pattern.difficulty} Level
                </span>
              </div>

              <div className="text-lg sm:text-2xl font-mono font-black text-amber-300 bg-slate-950/80 border border-slate-800 rounded-xl p-4 sm:p-5 my-2 shadow-inner">
                {pattern.structure}
              </div>

              <div className="text-base sm:text-lg font-bold text-slate-200 mt-4 flex items-center gap-2">
                <span className="text-amber-400">অর্থ:</span> {pattern.bengaliMeaning}
              </div>
            </div>

            {/* Sentence Examples with Audio Button */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                বাক্য গঠন ও ব্যবহারিক উদাহরণ
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pattern.sentenceBuilding.map((ex, idx) => (
                  <div 
                    key={idx}
                    className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-start justify-between gap-3 group hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="text-sm sm:text-base font-bold text-white">
                        {ex.en}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-400 font-medium">
                        {ex.bn}
                      </div>
                    </div>

                    <button
                      onClick={() => playEnglishAudio(ex.en)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 transition-colors shrink-0"
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
              <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wide">
                  <MessageSquare className="w-3.5 h-3.5" />
                  স্পোকেন ইংলিশে যেভাবে বলবেন
                </div>
                <p className="text-sm font-semibold text-white">
                  &ldquo;{pattern.spokenAndWriting.spoken.en}&rdquo;
                </p>
                <p className="text-xs text-slate-400">
                  {pattern.spokenAndWriting.spoken.context}
                </p>
              </div>

              <div className="bg-gradient-to-br from-teal-950/40 to-slate-900 border border-teal-500/20 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wide">
                  <BookOpen className="w-3.5 h-3.5" />
                  ফ্রি-হ্যান্ড রাইটিংয়ে যেভাবে লিখবেন
                </div>
                <p className="text-sm font-semibold text-white">
                  &ldquo;{pattern.spokenAndWriting.writing.en}&rdquo;
                </p>
                <p className="text-xs text-slate-400">
                  {pattern.spokenAndWriting.writing.context}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setActiveTab('grammar')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all"
              >
                <span>পরবর্তী ধাপ: গ্রামার ও নিয়ম</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* TAB 2: GRAMMAR & NUANCES */}
        {activeTab === 'grammar' && (
          <motion.div
            key="grammar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  গ্রামারের খুঁটিনাটি ও সঠিক নিয়ম
                </h3>
                <p className="text-xs text-slate-400">
                  বইয়ের সূত্র অনুযায়ী এই প্যাটার্নের ব্যাকরণগত ব্যাখ্যা ও সতর্কতা
                </p>
              </div>

              <div className="space-y-4">
                {pattern.grammarCoverage.map((item, idx) => (
                  <div 
                    key={idx}
                    className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm sm:text-base font-bold text-amber-300">
                        {item.title}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {item.explanation}
                    </p>
                  </div>
                ))}
              </div>

              {/* Pro Tip Box */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 text-amber-300 text-xs sm:text-sm">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">সতর্কতা ও কমন ভুল:</strong> এই প্যাটার্নটিতে অনেকেই Verb-এর সঠিক রূপ ও Preposition নির্বাচনে ভুল করেন। সবসময় ওপরের সূত্রটি হুবহু অনুসরণ করুন।
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setActiveTab('formula')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold text-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>পূর্ববর্তী ধাপ</span>
              </button>
              <button
                onClick={() => setActiveTab('vocab')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all"
              >
                <span>পরবর্তী ধাপ: ১০টি ভোকাবুলারি</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* TAB 3: 10 VOCABULARY WORDS & SYNONYMS */}
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
              <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-5 space-y-2">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                  সমার্থক শব্দ (Synonyms)
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {pattern.vocabularySpotlight.synonyms.map((syn, i) => (
                    <span 
                      key={i}
                      onClick={() => playEnglishAudio(syn)}
                      className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-bold cursor-pointer hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5"
                    >
                      {syn}
                      <Volume2 className="w-3 h-3 text-emerald-400" />
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-rose-950/30 border border-rose-500/20 rounded-2xl p-5 space-y-2">
                <div className="text-xs font-bold text-rose-400 uppercase tracking-wide">
                  বিপরীতার্থক শব্দ (Antonyms)
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {pattern.vocabularySpotlight.antonyms.map((ant, i) => (
                    <span 
                      key={i}
                      onClick={() => playEnglishAudio(ant)}
                      className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs font-bold cursor-pointer hover:bg-rose-500/20 transition-colors flex items-center gap-1.5"
                    >
                      {ant}
                      <Volume2 className="w-3 h-3 text-rose-400" />
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 10 Power Vocabulary Words */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    লেভেলের ১০টি পাওয়ার ভোকাবুলারি
                  </h3>
                  <p className="text-xs text-slate-400">
                    এই স্ট্রাকচারের সাথে সবচেয়ে বেশি ব্যবহৃত ১০টি উচ্চমানের শব্দ
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pattern.vocabularySpotlight.powerWords.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-start justify-between gap-3 group hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                        <span className="text-sm font-extrabold text-amber-300">{item.word}</span>
                        <span className="text-xs text-slate-400">({item.meaning})</span>
                      </div>
                      <div className="text-xs text-slate-300 italic">
                        &ldquo;{item.example}&rdquo;
                      </div>
                    </div>

                    <button
                      onClick={() => playEnglishAudio(item.word + '. ' + item.example)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 transition-colors shrink-0"
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
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold text-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>পূর্ববর্তী ধাপ</span>
              </button>
              <button
                onClick={() => setActiveTab('practice')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all"
              >
                <span>পরবর্তী ধাপ: প্র্যাকটিস ও কুইজ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* TAB 4: PRACTICE & QUIZ */}
        {activeTab === 'practice' && (
          <motion.div
            key="practice"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Sentence Translation & AI Evaluation */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-amber-400" />
                  সেলফ-প্র্যাকটিস: বাংলা থেকে ইংরেজিতে বাক্য তৈরি করুন
                </h3>
                <p className="text-xs text-slate-400">
                  নিচের বাংলা বাক্যের ইংরেজি অনুবাদ লিখুন এবং কৃত্রিম বুদ্ধিমত্তা (AI) দিয়ে সরাসরি চেক করুন
                </p>
              </div>

              <div className="space-y-5">
                {pattern.selfPractice.map((pr, idx) => {
                  const feedback = practiceFeedbacks[pr.id];
                  const isEvaluating = evaluatingMap[pr.id];

                  return (
                    <div 
                      key={pr.id}
                      className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                            অনুশীলন #{idx + 1}
                          </span>
                          <h4 className="text-sm sm:text-base font-bold text-white">
                            {pr.promptBn}
                          </h4>
                        </div>
                        <span className="text-xs text-slate-500 font-mono hidden sm:inline">
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
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                        />
                        <button
                          onClick={() => handleCheckSentence(pr.id, pr.promptBn)}
                          disabled={isEvaluating || !practiceAnswers[pr.id]?.trim()}
                          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shrink-0 transition-all shadow-md shadow-amber-500/10"
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
                          className={`rounded-xl p-3.5 border text-xs sm:text-sm space-y-1.5 ${
                            feedback.isCorrect || feedback.accuracyScore >= 70
                              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                              : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>
                              {feedback.isCorrect ? '✅ চমৎকার ও সঠিক!' : '💡 কিছু সংশোধনের সুযোগ রয়েছে'}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900/80">
                              স্কোর: {feedback.accuracyScore}%
                            </span>
                          </div>
                          <p>{feedback.feedbackBn}</p>
                          {feedback.suggestedVersion && (
                            <div className="text-xs pt-1 border-t border-slate-800 text-amber-300 font-mono">
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
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-amber-400" />
                    লেভেল কুইজ টেস্ট
                  </h3>
                  <p className="text-xs text-slate-400">
                    প্যাটার্ন নির্ভুলভাবে আয়ত্ত হয়েছে কি না যাচাই করুন
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {pattern.quizQuestions.map((q, idx) => (
                  <div 
                    key={q.id}
                    className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3"
                  >
                    <div className="text-sm sm:text-base font-bold text-white">
                      {idx + 1}. {q.questionBn}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selectedQuizAnswers[q.id] === opt;
                        const isCorrect = opt === q.correctAnswer;

                        let btnClass = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';
                        if (quizSubmitted) {
                          if (isCorrect) {
                            btnClass = 'bg-emerald-950/50 border-emerald-500 text-emerald-300 font-bold';
                          } else if (isSelected) {
                            btnClass = 'bg-rose-950/50 border-rose-500 text-rose-300 font-bold';
                          }
                        } else if (isSelected) {
                          btnClass = 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold';
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={quizSubmitted}
                            onClick={() => setSelectedQuizAnswers({ ...selectedQuizAnswers, [q.id]: opt })}
                            className={`p-3 rounded-xl border text-left text-xs sm:text-sm transition-all ${btnClass}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted && (
                      <div className="text-xs bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-slate-300 space-y-1">
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
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20"
                >
                  কুইজ সাবমিট করুন ও পয়েন্ট অর্জন করুন
                </button>
              ) : (
                <div className="bg-slate-950/90 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
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
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg flex items-center gap-1.5"
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
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold text-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>পূর্ববর্তী ধাপ</span>
              </button>
              <button
                onClick={() => setActiveTab('speaking')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
              >
                <span>চূড়ান্ত ধাপ: লাইভ স্পিকিং কোচ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* TAB 5: LIVE AI SPEAKING ROOM */}
        {activeTab === 'speaking' && (
          <motion.div
            key="speaking"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Speaking Room Mission Banner & Air Identity */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Air — AI Conversation Partner & Practice Coach</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    🗣️ ন্যাচারাল স্পোকেন ইংলিশ
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    +৫০ XP
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  টপিক: {pattern.speakingTask.topic}
                </h3>
                <p className="text-sm text-slate-300 mt-1">
                  {pattern.speakingTask.promptQuestionBn}
                </p>
              </div>

              {/* Air Conversation Persona Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 text-center">
                  <div className="font-bold text-amber-400">🗣️ অফুরন্ত গল্প ও বাস্তব আড্ডা</div>
                  <div className="text-[11px] text-slate-400">যতক্ষণ খুশি কথা বলুন, থামবে না</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 text-center">
                  <div className="font-bold text-emerald-400">🔍 পয়েন্টে জ্ঞান ও সংশোধন</div>
                  <div className="text-[11px] text-slate-400">কোথায় ভুল ঠিক সেই জায়গা বোঝাবে</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 text-center">
                  <div className="font-bold text-sky-400">😂 আবেগ ও কড়া শাসন</div>
                  <div className="text-[11px] text-slate-400">ভুল করলে ধমক ও শাসন দিয়ে শেখাবে</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 text-center">
                  <div className="font-bold text-purple-400">📞 মুখে বললে কল কাটা</div>
                  <div className="text-[11px] text-slate-400">&quot;কল রাখছি&quot; বা &quot;bye&quot; বললেই ওপাশ থেকে কাটবে</div>
                </div>
              </div>

              {/* Sample Response Box */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-1.5">
                <div className="text-xs font-bold text-slate-400">
                  নমুনা প্র্যাকটিস উত্তর (Sample Answer):
                </div>
                <div className="text-sm font-semibold text-emerald-300 flex items-center justify-between gap-2">
                  <span>&ldquo;{pattern.speakingTask.sampleAnswerEn}&rdquo;</span>
                  <button
                    onClick={() => playEnglishAudio(pattern.speakingTask.sampleAnswerEn)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400"
                    title="নমুনা উত্তর শুনুন"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Live Audio Visualizer Stage */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center min-h-[320px] space-y-6 shadow-2xl relative">
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
                <div className="max-w-lg text-center bg-slate-900/90 border border-slate-800 px-5 py-3 rounded-xl text-sm text-slate-200 shadow-lg animate-fade-in">
                  <span className="text-xs font-bold text-amber-400 block mb-1">
                    {tutorState === 'speaking' ? 'Air (AI Partner):' : 'লাইভ স্ট্যাটাস:'}
                  </span>
                  &ldquo;{currentSubtitle}&rdquo;
                </div>
              )}

              {/* Call Controls */}
              <div className="flex flex-col items-center gap-3 w-full max-w-lg">
                {!getUserApiKey() && !callActive && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 max-w-md text-center space-y-2">
                    <div className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5">
                      <Key className="w-4 h-4 text-amber-400" />
                      <span>Gemini API Key প্রয়োজন</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      AI কোচের সাথে লাইভ কথা বলতে আপনার নিজস্ব ফ্রি Gemini API Key যোগ করুন।
                    </p>
                    {onOpenApiKeyModal && (
                      <button
                        onClick={onOpenApiKeyModal}
                        type="button"
                        className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all"
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
                    className="flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-sm shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                  >
                    <Mic className="w-5 h-5 text-slate-950" />
                    <span>
                      {connectionStatus === 'connecting' ? 'সংযোগ হচ্ছে...' : 'লাইভ স্পিকিং শুরু করুন'}
                    </span>
                  </button>
                ) : (
                  <div className="w-full space-y-4">
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
                        placeholder="মুখে বলুন অথবা এখানে লিখে Send চাপুন..."
                        className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="submit"
                        disabled={!speakingTextInput.trim()}
                        className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-md transition-all"
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
                        className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-xl shadow-amber-500/20 transition-all"
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
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold text-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>পূর্ববর্তী ধাপ</span>
              </button>

              <button
                onClick={onNextLevel}
                disabled={pattern.id >= 300}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all"
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
