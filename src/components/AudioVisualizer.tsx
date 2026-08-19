import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Mic, Volume2, Bot, Flame } from 'lucide-react';

export type TutorState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'dancing';

interface AudioVisualizerProps {
  audioLevel?: number;
  state?: TutorState;
  tutorState?: TutorState;
  callActive?: boolean;
  userSpeaking?: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioLevel = 0,
  state,
  tutorState,
  callActive = false,
  userSpeaking = false,
}) => {
  const currentState = tutorState || state || 'idle';
  const bars = 19;
  const isSpeaking = currentState === 'speaking' || currentState === 'dancing';
  const isListening = currentState === 'listening';
  const isThinking = currentState === 'thinking';

  // 10 Eye-friendly spectral neon color pairs across the visualizer
  const spectrumColors = [
    ['#f43f5e', '#fb7185'], // 🔴 Ruby Red
    ['#f97316', '#fdba74'], // 🟠 Sunset Orange
    ['#eab308', '#fde047'], // 🟡 Solar Gold
    ['#10b981', '#6ee7b7'], // 🟢 Emerald Green
    ['#06b6d4', '#67e8f9'], // 🔵 Cyan Blue
    ['#0ea5e9', '#7dd3fc'], // 🔵 Ocean Sky
    ['#6366f1', '#a5b4fc'], // 🟣 Indigo Violet
    ['#8b5cf6', '#c4b5fd'], // 🟣 Royal Purple
    ['#ec4899', '#f472b6'], // 🩷 Neon Pink
    ['#a27b5c', '#d6b89e'], // 🟤 Warm Bronze
  ];

  return (
    <div className="relative w-full max-w-md mx-auto flex flex-col items-center justify-center space-y-4">
      {/* Dynamic Status Badge */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#080d1a]/95 border border-slate-700/80 text-xs font-bold text-slate-200 shadow-xl backdrop-blur-xl">
        {userSpeaking ? (
          <>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400">আপনি কথা বলছেন...</span>
          </>
        ) : isSpeaking ? (
          <>
            <Volume2 className="w-4 h-4 text-pink-400 animate-pulse" />
            <span className="text-pink-300">Air (AI কোচ) কথা বলছে...</span>
          </>
        ) : isThinking ? (
          <>
            <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
            <span className="text-purple-300">Air চিন্তা করছে...</span>
          </>
        ) : isListening && callActive ? (
          <>
            <Mic className="w-4 h-4 text-sky-400 animate-pulse" />
            <span className="text-sky-300">Air শুনছে... আপনার পালা বলুন</span>
          </>
        ) : (
          <>
            <Bot className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400">Air প্রস্তুত (কল শুরু করুন)</span>
          </>
        )}
      </div>

      {/* 10-Color Spectral Sound Wave Bars */}
      <div className="relative w-full h-[180px] flex items-center justify-center gap-1.5 sm:gap-2 px-4">
        {Array.from({ length: bars }).map((_, i) => {
          const centerDist = Math.abs(i - Math.floor(bars / 2));
          const peakFactor = Math.max(0.2, 1 - (centerDist / (bars / 2)));
          const rand = Math.random();

          let heights: number[] = [14, 14];
          let duration = 1.5;
          let delay = 0;

          if (isSpeaking) {
            const activeHeight = 28 + (audioLevel * 240 * peakFactor * (rand * 0.4 + 0.6));
            heights = [18, Math.max(24, activeHeight), 18];
            duration = 0.18 + (rand * 0.08);
          } else if (userSpeaking) {
            const userHeight = 22 + (60 * peakFactor * (rand * 0.5 + 0.5));
            heights = [16, userHeight, 16];
            duration = 0.25;
            delay = i * 0.02;
          } else if (isListening) {
            heights = [16, 16 + (32 * peakFactor), 16];
            duration = 1.0;
            delay = i * 0.06;
          } else if (isThinking) {
            heights = [14, 14 + (24 * peakFactor), 14];
            duration = 0.6;
            delay = peakFactor * 0.35;
          } else {
            heights = [10, 10 + (8 * peakFactor), 10];
            duration = 2.0 + (rand * 0.8);
          }

          // Cycle through the 10 vibrant spectrum colors
          const colorPair = spectrumColors[i % spectrumColors.length];

          return (
            <motion.div
              key={i}
              className="w-2.5 sm:w-3.5 rounded-full opacity-95 transition-all"
              style={{
                background: `linear-gradient(to top, ${colorPair[0]}, ${colorPair[1]})`,
                boxShadow: callActive ? `0 0 16px ${colorPair[0]}50` : 'none',
              }}
              animate={{
                height: heights,
              }}
              transition={{
                repeat: Infinity,
                duration: duration,
                ease: 'easeInOut',
                delay: delay,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
