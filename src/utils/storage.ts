import { UserStats, LevelProgress } from '../types';

const STORAGE_KEY = 'english_master_key_user_stats_v1';

export function getStoredUserStats(): UserStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: UserStats = JSON.parse(raw);
      return checkAndUpdateStreak(parsed);
    }
  } catch (e) {
    console.error('Failed to load user stats from storage', e);
  }

  const initialStats: UserStats = {
    totalXp: 0,
    streakDays: 1,
    lastActiveDate: new Date().toISOString().split('T')[0],
    completedLevelIds: [],
    bookmarkedLevelIds: [],
    levelProgressMap: {},
    currentLevelId: 1,
    userName: 'English Learner'
  };

  saveUserStats(initialStats);
  return initialStats;
}

export function saveUserStats(stats: UserStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save user stats', e);
  }
}

function checkAndUpdateStreak(stats: UserStats): UserStats {
  const today = new Date().toISOString().split('T')[0];
  const lastDate = stats.lastActiveDate;

  if (lastDate === today) {
    return stats;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak = stats.streakDays;
  if (lastDate === yesterdayStr) {
    newStreak += 1;
  } else if (lastDate < yesterdayStr) {
    newStreak = 1; // Reset streak if missed a day
  }

  const updated: UserStats = {
    ...stats,
    streakDays: newStreak,
    lastActiveDate: today
  };
  saveUserStats(updated);
  return updated;
}

export function recordLevelProgress(
  levelId: number,
  stars: number,
  quizScore: number,
  practiceDone: boolean,
  speakingDone: boolean
): UserStats {
  const current = getStoredUserStats();
  const existing = current.levelProgressMap[levelId] || {
    stars: 0,
    quizScore: 0,
    practiceCompleted: false,
    speakingCompleted: false
  };

  const newStars = Math.max(existing.stars, stars);
  const newQuizScore = Math.max(existing.quizScore, quizScore);
  const newPractice = existing.practiceCompleted || practiceDone;
  const newSpeaking = existing.speakingCompleted || speakingDone;

  const xpEarned = (stars * 10) + (speakingDone ? 30 : 0) + (practiceDone ? 15 : 0);

  const updatedProgress: LevelProgress = {
    stars: newStars,
    quizScore: newQuizScore,
    practiceCompleted: newPractice,
    speakingCompleted: newSpeaking,
    completedAt: new Date().toISOString()
  };

  const completedSet = new Set(current.completedLevelIds);
  if (newStars > 0 || newPractice || newSpeaking) {
    completedSet.add(levelId);
  }

  const updated: UserStats = {
    ...current,
    totalXp: current.totalXp + xpEarned,
    completedLevelIds: Array.from(completedSet),
    levelProgressMap: {
      ...current.levelProgressMap,
      [levelId]: updatedProgress
    }
  };

  saveUserStats(updated);
  return updated;
}

export function toggleLevelBookmark(levelId: number): UserStats {
  const current = getStoredUserStats();
  const bookmarkedSet = new Set(current.bookmarkedLevelIds);
  
  if (bookmarkedSet.has(levelId)) {
    bookmarkedSet.delete(levelId);
  } else {
    bookmarkedSet.add(levelId);
  }

  const updated: UserStats = {
    ...current,
    bookmarkedLevelIds: Array.from(bookmarkedSet)
  };

  saveUserStats(updated);
  return updated;
}
