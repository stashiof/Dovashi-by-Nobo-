import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Mic, Volume2, Bot } from 'lucide-react';

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
  const bars = 17;
  const isSpeaking = currentState === 'speaking' || currentState === 'dancing';
  const isListening = currentState === 'listening';
  const isThinking = currentState === 'thinking';

  return (
    <div className="relative w-full max-w-md mx-auto flex flex-col items-center justify-center space-y-4">
      {/* Air State Indicator Badge */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300 shadow-inner">
        {userSpeaking ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400">আপনি কথা বলছেন...</span>
          </>
        ) : isSpeaking ? (
          <>
            <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-amber-300">Air কথা বলছে...</span>
          </>
        ) : isThinking ? (
          <>
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
            <span className="text-indigo-300">Air চিন্তা করছে...</span>
          </>
        ) : isListening && callActive ? (
          <>
            <Mic className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span className="text-sky-300">Air শুনছে... আপনার পালা</span>
          </>
        ) : (
          <>
            <Bot className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Air প্রস্তুত (কল শুরু করুন)</span>
          </>
        )}
      </div>

      {/* Dynamic Sound Wave Bars */}
      <div className="relative w-full h-[180px] flex items-center justify-center gap-1.5 sm:gap-2 px-4">
        {Array.from({ length: bars }).map((_, i) => {
          const centerDist = Math.abs(i - Math.floor(bars / 2));
          const peakFactor = Math.max(0.15, 1 - (centerDist / (bars / 2)));
          const rand = Math.random();

          let heights: number[] = [12, 12];
          let duration = 1.5;
          let delay = 0;

          if (isSpeaking) {
            const activeHeight = 24 + (audioLevel * 220 * peakFactor * (rand * 0.4 + 0.6));
            heights = [16, Math.max(20, activeHeight), 16];
            duration = 0.18 + (rand * 0.08);
          } else if (userSpeaking) {
            const userHeight = 20 + (50 * peakFactor * (rand * 0.5 + 0.5));
            heights = [14, userHeight, 14];
            duration = 0.25;
            delay = i * 0.02;
          } else if (isListening) {
            heights = [14, 14 + (28 * peakFactor), 14];
            duration = 1.1;
            delay = i * 0.08;
          } else if (isThinking) {
            heights = [12, 12 + (18 * peakFactor), 12];
            duration = 0.7;
            delay = peakFactor * 0.4;
          } else {
            heights = [8, 8 + (6 * peakFactor), 8];
            duration = 2.2 + (rand * 0.8);
          }

          // Subtle Emerald to Amber gradient across bars
          const hue = 160 + (i * 6);
          const color1 = isSpeaking 
            ? `hsl(${40 + i * 2}, 95%, 60%)` 
            : userSpeaking 
            ? `hsl(150, 90%, 55%)` 
            : `hsl(${hue}, 85%, 60%)`;
          const color2 = isSpeaking 
            ? `hsl(${25 + i * 2}, 95%, 55%)` 
            : userSpeaking 
            ? `hsl(170, 90%, 50%)` 
            : `hsl(${hue + 30}, 80%, 55%)`;

          return (
            <motion.div
              key={i}
              className="w-2.5 sm:w-3.5 rounded-full opacity-90 transition-all"
              style={{
                background: `linear-gradient(to top, ${color1}, ${color2})`,
                boxShadow: callActive ? `0 0 16px ${color1}40` : 'none',
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
