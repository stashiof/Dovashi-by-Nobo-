const fs = require('fs');
let code = fs.readFileSync('src/components/LevelLearningView.tsx', 'utf8');

code = code.replace(
  `              {/* Live Subtitle Caption */}`,
  `              {callActive && (
                <div className="absolute top-4 right-4 bg-slate-900/80 border border-slate-700/50 rounded-xl px-3 py-1.5 flex flex-col items-end gap-0.5 text-xs animate-fade-in shadow-lg">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-slate-200 font-bold font-mono">লাইভ সেশন চলছে</span>
                  </div>
                  <span className="text-amber-400/80 text-[10px] font-semibold mt-1 max-w-[120px] text-right leading-tight">API একাউন্ট লিমিট: ফ্রি টিয়ারে প্রতিদিন ১৫-২০ মিনিট</span>
                </div>
              )}
              {/* Live Subtitle Caption */}`
);

fs.writeFileSync('src/components/LevelLearningView.tsx', code);
