const fs = require('fs');
let code = fs.readFileSync('src/hooks/useLiveCall.ts', 'utf8');

const refsToAdd = `  const isProcessingTurnRef = useRef<boolean>(false);
  
  // Ringing Tone Refs
  const ringIntervalRef = useRef<any>(null);
  const ringGainRef = useRef<GainNode | null>(null);
  const playRingTone = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const play = () => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.frequency.value = 440;
        osc2.frequency.value = 480;
        gain.gain.value = 0.05;
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start();
        setTimeout(() => {
          try { osc1.stop(); osc2.stop(); } catch(e){}
        }, 2000);
        ringGainRef.current = gain;
      };
      play();
      ringIntervalRef.current = setInterval(play, 4000);
    } catch(e){}
  }, []);
  
  const stopRingTone = useCallback(() => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (ringGainRef.current) {
      try { ringGainRef.current.gain.value = 0; } catch(e){}
    }
  }, []);
`;

code = code.replace(`  const isProcessingTurnRef = useRef<boolean>(false);`, refsToAdd);
fs.writeFileSync('src/hooks/useLiveCall.ts', code);
