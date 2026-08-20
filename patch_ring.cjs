const fs = require('fs');
let code = fs.readFileSync('src/hooks/useLiveCall.ts', 'utf8');

const refsToAdd = `  const isProcessingTurnRef = useRef(false);
  
  // Ringing Tone Refs
  const ringIntervalRef = useRef<any>(null);
  const ringGainRef = useRef<GainNode | null>(null);
  const playRingTone = useCallback(() => {
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
  }, []);
  
  const stopRingTone = useCallback(() => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (ringGainRef.current) {
      ringGainRef.current.gain.value = 0;
    }
  }, []);
`;

code = code.replace(`  const isProcessingTurnRef = useRef(false);`, refsToAdd);

code = code.replace(`setConnectionStatus('connecting');`, `setConnectionStatus('connecting');\n      playRingTone();`);
code = code.replace(`setConnectionStatus('connected');`, `setConnectionStatus('connected');\n      stopRingTone();`);
code = code.replace(`setConnectionStatus('error');`, `setConnectionStatus('error');\n      stopRingTone();`);
code = code.replace(`setConnectionStatus('disconnected');`, `setConnectionStatus('disconnected');\n      stopRingTone();`);

fs.writeFileSync('src/hooks/useLiveCall.ts', code);
