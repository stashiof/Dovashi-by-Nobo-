import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { CourseSelectionScreen } from './components/CourseSelectionScreen';
import { COURSES } from './data/courses';
import { RoadmapMap } from './components/RoadmapMap';
import { LevelLearningView } from './components/LevelLearningView';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AuthSyncModal } from './components/AuthSyncModal';
import { getAll300Patterns } from './data/masterPatternsData';
import {
  getStoredUserStats,
  recordLevelProgress,
  toggleLevelBookmark,
  getUserApiKey,
  saveUserApiKey,
  saveUserStats
} from './utils/storage';
import {
  getSupabaseClient,
  fetchUserDataFromSupabase,
  syncUserDataToSupabase
} from './utils/supabase';
import { useLiveCall } from './hooks/useLiveCall';
import { Pattern, UserStats } from './types';
import { User } from '@supabase/supabase-js';

export default function App() {
  const [stats, setStats] = useState<UserStats>(() => getStoredUserStats());
  const [currentLevelId, setCurrentLevelId] = useState<number>(stats.currentLevelId || 1);
  const [currentView, setCurrentView] = useState<'roadmap' | 'level'>('roadmap');
  const [showingBookmarksOnly, setShowingBookmarksOnly] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isAuthSyncModalOpen, setIsAuthSyncModalOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(() => !!getUserApiKey());
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const currentUserRef = useRef<User | null>(null);
  currentUserRef.current = currentUser;

  // Supabase Auth Listener & Initial Cloud Sync
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(session.user);
        // Pull latest profile
        const profileRes = await fetchUserDataFromSupabase(session.user.id);
        if (profileRes.success && profileRes.data) {
          if (profileRes.data.gemini_api_key) {
            saveUserApiKey(profileRes.data.gemini_api_key);
            setHasApiKey(true);
          }
          if (profileRes.data.stats_data) {
            // Merge with local to avoid losing currentCourseId if Supabase doesn't have it yet
            const localStats = getStoredUserStats();
            const mergedStats = {
              ...profileRes.data.stats_data,
              currentCourseId: profileRes.data.stats_data.currentCourseId || localStats.currentCourseId,
              joinedCourseIds: profileRes.data.stats_data.joinedCourseIds || localStats.joinedCourseIds
            };
            saveUserStats(mergedStats);
            setStats(mergedStats);
            if (mergedStats.currentLevelId) {
              setCurrentLevelId(mergedStats.currentLevelId);
            }
          }
        }
      }
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load all 300 patterns
  const allPatterns: Pattern[] = useMemo(() => getAll300Patterns(), []);

  // Current active pattern
  const activePattern = useMemo(() => {
    return allPatterns.find(p => p.id === currentLevelId) || allPatterns[0];
  }, [allPatterns, currentLevelId]);

  const activeCourse = COURSES.find(c => c.id === stats.currentCourseId) || COURSES[0];
  const handleJoinCourse = (courseId: string) => {
    const newStats = { ...stats, currentCourseId: courseId, joinedCourseIds: [...(stats.joinedCourseIds || []), courseId] };
    setStats(newStats);
    saveUserStats(newStats);
    if (currentUserRef.current) {
      const apiKey = getUserApiKey();
      syncUserDataToSupabase(currentUserRef.current, newStats, apiKey);
    }
  };
  const handleOpenApiKeyModal = useCallback(() => {
    setIsApiKeyModalOpen(true);
  }, []);

  const handleOpenAuthSyncModal = useCallback(() => {
    setIsAuthSyncModalOpen(true);
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
    messages,
    startCall,
    stopCall,
    sendManualMessage
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
      const nextId = currentLevelId + 1;
      setCurrentLevelId(nextId);
      // Auto save currentLevelId
      const updated = { ...stats, currentLevelId: nextId };
      setStats(updated);
      saveUserStats(updated);
      if (currentUserRef.current) {
        syncUserDataToSupabase(currentUserRef.current, updated, getUserApiKey());
      }
    }
  };

  // Previous level navigation
  const handlePrevLevel = () => {
    if (currentLevelId > 1) {
      if (callActive) stopCall();
      const prevId = currentLevelId - 1;
      setCurrentLevelId(prevId);
      const updated = { ...stats, currentLevelId: prevId };
      setStats(updated);
      saveUserStats(updated);
      if (currentUserRef.current) {
        syncUserDataToSupabase(currentUserRef.current, updated, getUserApiKey());
      }
    }
  };

  // Bookmark toggle handler
  const handleToggleBookmark = (levelId: number) => {
    const updated = toggleLevelBookmark(levelId);
    setStats(updated);
    if (currentUserRef.current) {
      syncUserDataToSupabase(currentUserRef.current, updated, getUserApiKey());
    }
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
    // Background cloud sync to Supabase
    if (currentUserRef.current) {
      syncUserDataToSupabase(currentUserRef.current, updated, getUserApiKey());
    }
  };

  const handleApiKeySaved = (key: string) => {
    setHasApiKey(!!key);
    if (currentUserRef.current) {
      syncUserDataToSupabase(currentUserRef.current, stats, key);
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col font-['Hind_Siliguri',sans-serif] selection:bg-amber-400 selection:text-slate-950">
      {/* 10-Color Modern Ambient Mesh Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Violet & Pink top glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-purple-600/10 via-pink-500/5 to-transparent rounded-full blur-3xl" />
        {/* Emerald bottom left glow */}
        <div className="absolute bottom-10 left-0 w-80 h-80 bg-emerald-600/8 rounded-full blur-3xl" />
        {/* Ocean Sky & Amber bottom right glow */}
        <div className="absolute bottom-20 right-0 w-80 h-80 bg-sky-600/8 rounded-full blur-3xl" />
      </div>

      {/* Top Persistent Header */}
      {!stats.currentCourseId ? (
        <div className="flex-1 z-10 relative">
          <CourseSelectionScreen onJoinCourse={handleJoinCourse} />
        </div>
      ) : (
        <>
      <Navbar
        onChangeCourse={() => {
          const newStats = { ...stats, currentCourseId: undefined };
          setStats(newStats);
          saveUserStats(newStats);
        }}
        stats={stats}
        totalLevels={300}
        hasApiKey={hasApiKey}
        onOpenApiKeyModal={handleOpenApiKeyModal}
        currentUser={currentUser}
        onOpenAuthSyncModal={handleOpenAuthSyncModal}
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
      <main className="flex-1 z-10 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-5">
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
            messages={messages}
            onStartCall={(pattern) => startCall(pattern, activeCourse.sourceLanguage, activeCourse.targetLanguage)}
            onStopCall={stopCall}
            onSendManualMessage={sendManualMessage}
          />
        )}
      </main>

      </>
      )}
      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeySaved={handleApiKeySaved}
      />

      {/* Supabase Cloud Auth & Sync Modal */}
      <AuthSyncModal
        isOpen={isAuthSyncModalOpen}
        onClose={() => setIsAuthSyncModalOpen(false)}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        userStats={stats}
        setUserStats={setStats}
        onApiKeyUpdated={() => setHasApiKey(!!getUserApiKey())}
      />

      {/* Persistent Audio Indicator if calling while in background */}
      {callActive && currentView === 'roadmap' && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#090d1a]/95 border border-emerald-500/50 rounded-2xl p-4 shadow-2xl flex items-center gap-3 backdrop-blur-xl animate-bounce">
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
