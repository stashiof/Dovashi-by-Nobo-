export type CategoryPart = 1 | 2 | 3;

export interface PowerWord {
  word: string;
  meaning: string;
  example: string;
}

export interface VocabularySpotlight {
  synonyms: string[];
  antonyms: string[];
  powerWords: PowerWord[];
}

export interface GrammarPoint {
  title: string;
  explanation: string;
  badge?: string;
}

export interface ContextExample {
  context: string; // e.g. "খবরের কাগজে বা পত্রিকায়", "অফিসিয়াল ইমেইলে", "সাক্ষাৎকারে"
  en: string;
  bn: string;
}

export interface QuizQuestion {
  id: string;
  questionBn: string;
  templateSentence?: string;
  options: string[];
  correctAnswer: string;
  explanationBn: string;
}

export interface SelfPracticeItem {
  id: string;
  promptBn: string;
  targetPatternHint: string;
  correctAnswers: string[]; // Variations of acceptable translations
}

export interface SpeakingTask {
  topic: string;
  promptQuestionBn: string;
  promptQuestionEn: string;
  sampleAnswerEn: string;
  coachInstructions: string;
}

export interface Pattern {
  id: number;
  part: CategoryPart;
  partTitle: string;
  patternNumber: string; // e.g. "Pattern 001"
  structure: string;
  bengaliMeaning: string;
  categoryTag: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  sentenceBuilding: Array<{ en: string; bn: string }>;
  grammarCoverage: GrammarPoint[];
  vocabularySpotlight: VocabularySpotlight;
  contextApplications: ContextExample[];
  spokenAndWriting: {
    spoken: { en: string; context?: string };
    writing: { en: string; context?: string };
  };
  selfPractice: SelfPracticeItem[];
  quizQuestions: QuizQuestion[];
  speakingTask: SpeakingTask;
}

export interface LevelProgress {
  stars: number; // 1, 2, 3
  quizScore: number;
  practiceCompleted: boolean;
  speakingCompleted: boolean;
  completedAt?: string;
}

export interface UserStats {
  totalXp: number;
  streakDays: number;
  lastActiveDate: string;
  completedLevelIds: number[];
  bookmarkedLevelIds: number[];
  levelProgressMap: Record<number, LevelProgress>;
  currentLevelId: number;
  userName: string;
}
