import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { RoadmapMap } from './components/RoadmapMap';
import { LevelLearningView } from './components/LevelLearningView';
import { ApiKeyModal } from './components/ApiKeyModal';
import { getAll300Patterns } from './data/masterPatternsData';
import { getStoredUserStats, recordLevelProgress, toggleLevelBookmark, getUserApiKey } from './utils/storage';
import { useLiveCall } from './hooks/useLiveCall';
import { Pattern, UserStats } from './types';

export default function App() {
  const [stats, setStats] = useState<UserStats>(() => getStoredUserStats());
  const [currentLevelId, setCurrentLevelId] = useState<number>(stats.currentLevelId || 1);
  const [currentView, setCurrentView] = useState<'roadmap' | 'level'>('roadmap');
  const [showingBookmarksOnly, setShowingBookmarksOnly] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(() => !!getUserApiKey());

  // Load all 300 patterns
  const allPatterns: Pattern[] = useMemo(() => getAll300Patterns(), []);

  // Current active pattern
  const activePattern = useMemo(() => {
    return allPatterns.find(p => p.id === currentLevelId) || allPatterns[0];
  }, [allPatterns, currentLevelId]);

  const handleOpenApiKeyModal = useCallback(() => {
    setIsApiKeyModalOpen(true);
  }, []);

  // Real-time Gemini Live voice tutor
  const {
    callActive,
    tutorState,
    audioLevel,
    currentSubtitle,
    userSpeaking,
    connectionStatus,
    errorMessage,
    startCall,
    stopCall
  } = useLiveCall(handleOpenApiKeyModal);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, currentLevelId]);

  // Select level from Roadmap
  const handleSelectLevel = (levelId: number) => {
    setCurrentLevelId(levelId);
    setCurrentView('level');
  };

  // Next level navigation
  const handleNextLevel = () => {
    if (currentLevelId < 300) {
      if (callActive) stopCall();
      setCurrentLevelId(prev => prev + 1);
    }
  };

  // Previous level navigation
  const handlePrevLevel = () => {
    if (currentLevelId > 1) {
      if (callActive) stopCall();
      setCurrentLevelId(prev => prev - 1);
    }
  };

  // Bookmark toggle handler
  const handleToggleBookmark = (levelId: number) => {
    const updated = toggleLevelBookmark(levelId);
    setStats(updated);
  };

  // Record user progress & gamification stars
  const handleRecordProgress = (
    stars: number,
    quizScore: number,
    practiceDone: boolean,
    speakingDone: boolean
  ) => {
    const updated = recordLevelProgress(
      currentLevelId,
      stars,
      quizScore,
      practiceDone,
      speakingDone
    );
    setStats(updated);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Background Decorative Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-600/10 via-amber-500/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl" />
      </div>

      {/* Top Persistent Header */}
      <Navbar
        stats={stats}
        totalLevels={300}
        hasApiKey={hasApiKey}
        onOpenApiKeyModal={handleOpenApiKeyModal}
        showingBookmarks={showingBookmarksOnly}
        onOpenRoadmap={() => {
          if (callActive) stopCall();
          setCurrentView('roadmap');
        }}
        onOpenBookmarks={() => {
          if (callActive) stopCall();
          setShowingBookmarksOnly(prev => !prev);
          setCurrentView('roadmap');
        }}
      />

      {/* Main App Container */}
      <main className="flex-1 z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {currentView === 'roadmap' ? (
          <RoadmapMap
            patterns={allPatterns}
            stats={stats}
            onSelectLevel={handleSelectLevel}
            onToggleBookmark={handleToggleBookmark}
            showingBookmarksOnly={showingBookmarksOnly}
            onClearBookmarksFilter={() => setShowingBookmarksOnly(false)}
          />
        ) : (
          <LevelLearningView
            pattern={activePattern}
            stats={stats}
            onBackToRoadmap={() => {
              if (callActive) stopCall();
              setCurrentView('roadmap');
            }}
            onNextLevel={handleNextLevel}
            onPrevLevel={handlePrevLevel}
            onToggleBookmark={handleToggleBookmark}
            onRecordProgress={handleRecordProgress}
            onOpenApiKeyModal={handleOpenApiKeyModal}
            callActive={callActive}
            tutorState={tutorState}
            audioLevel={audioLevel}
            currentSubtitle={currentSubtitle}
            userSpeaking={userSpeaking}
            connectionStatus={connectionStatus}
            errorMessage={errorMessage}
            onStartCall={startCall}
            onStopCall={stopCall}
          />
        )}
      </main>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeySaved={(key) => setHasApiKey(!!key)}
      />

      {/* Persistent Audio Indicator if calling while in background */}
      {callActive && currentView === 'roadmap' && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900/95 border border-emerald-500/40 rounded-2xl p-4 shadow-2xl flex items-center gap-3 backdrop-blur-md animate-bounce">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          <div className="text-xs font-bold text-slate-200">
            লাইভ স্পিকিং কোচ চালু আছে (Level {currentLevelId})
          </div>
          <button
            onClick={() => setCurrentView('level')}
            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs"
          >
            ফিরে যান
          </button>
          <button
            onClick={stopCall}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs"
          >
            বন্ধ করুন
          </button>
        </div>
      )}
    </div>
  );
}

