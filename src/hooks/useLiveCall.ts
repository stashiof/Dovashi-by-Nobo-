import { useState, useEffect, useRef, useCallback } from 'react';
import { Pattern } from '../types';

// Helper: Float32Array to 16-bit PCM Base64
function floatTo16BitPCMBase64(float32Array: Float32Array): string {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); // Little endian
  }
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper: 16-bit PCM Base64 to AudioBuffer at 24000Hz
function base64ToAudioBuffer(base64: string, ctx: AudioContext): AudioBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768.0;
  }
  const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
  audioBuffer.getChannelData(0).set(float32);
  return audioBuffer;
}

export function useLiveCall() {
  const [callActive, setCallActive] = useState(false);
  const [tutorState, setTutorState] = useState<'idle' | 'listening' | 'thinking' | 'speaking' | 'dancing'>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [errorMessage, setErrorMessage] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const subtitleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stop currently playing audio on interruption
  const stopAllActiveAudio = useCallback(() => {
    activeSourcesRef.current.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
    setTutorState('listening');
  }, []);

  // Cleanup & stop call
  const stopCall = useCallback(() => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {}
      wsRef.current = null;
    }

    stopAllActiveAudio();

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
      } catch (e) {}
      streamRef.current = null;
    }

    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch (e) {}
      processorRef.current = null;
    }

    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') {
      try {
        inputAudioCtxRef.current.close().catch(() => {});
      } catch (e) {}
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current && outputAudioCtxRef.current.state !== 'closed') {
      try {
        outputAudioCtxRef.current.close().catch(() => {});
      } catch (e) {}
      outputAudioCtxRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (subtitleTimeoutRef.current) {
      clearTimeout(subtitleTimeoutRef.current);
      subtitleTimeoutRef.current = null;
    }

    setCallActive(false);
    setConnectionStatus('disconnected');
    setTutorState('idle');
    setAudioLevel(0);
    setUserSpeaking(false);
  }, [stopAllActiveAudio]);

  // Audio level monitoring loop
  const startAudioMonitoring = useCallback(() => {
    const updateLevels = () => {
      let currentMaxLevel = 0;

      // 1. Check AI output level
      if (outputAnalyserRef.current) {
        const data = new Uint8Array(outputAnalyserRef.current.frequencyBinCount);
        outputAnalyserRef.current.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          sum += data[i];
        }
        const avg = sum / data.length;
        const normalized = Math.min(1, avg / 128);
        if (normalized > currentMaxLevel) {
          currentMaxLevel = normalized;
        }

        if (normalized > 0.05) {
          setTutorState('speaking');
        }
      }

      // 2. Check User mic input level
      if (inputAnalyserRef.current) {
        const data = new Uint8Array(inputAnalyserRef.current.frequencyBinCount);
        inputAnalyserRef.current.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          sum += data[i];
        }
        const avg = sum / data.length;
        const userLevel = Math.min(1, avg / 128);

        if (userLevel > 0.12) {
          setUserSpeaking(true);
          if (currentMaxLevel < userLevel) currentMaxLevel = userLevel;
        } else {
          setUserSpeaking(false);
        }
      }

      setAudioLevel(currentMaxLevel);
      animationFrameRef.current = requestAnimationFrame(updateLevels);
    };

    animationFrameRef.current = requestAnimationFrame(updateLevels);
  }, []);

  // Start live voice call
  const startCall = useCallback(async (currentPattern?: Pattern) => {
    try {
      setConnectionStatus('connecting');
      setErrorMessage('');
      setCurrentSubtitle('Connecting to your AI English Coach...');

      // 1. Initialize Audio Contexts
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioCtx({ sampleRate: 16000 });
      const outputCtx = new AudioCtx({ sampleRate: 24000 });

      await inputCtx.resume();
      await outputCtx.resume();

      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      // 2. Analyser nodes & Audio Filter
      const outAnalyser = outputCtx.createAnalyser();
      outAnalyser.fftSize = 256;
      outAnalyser.smoothingTimeConstant = 0.5;
      outputAnalyserRef.current = outAnalyser;

      const inAnalyser = inputCtx.createAnalyser();
      inAnalyser.fftSize = 256;
      inAnalyser.smoothingTimeConstant = 0.5;
      inputAnalyserRef.current = inAnalyser;

      // 3. Request Microphone Access with strong voice clarity constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;

      const source = inputCtx.createMediaStreamSource(stream);

      // Highpass filter (cuts off room hum, fan rumble, AC vibration < 95Hz)
      const highpassFilter = inputCtx.createBiquadFilter();
      highpassFilter.type = 'highpass';
      highpassFilter.frequency.setValueAtTime(95, inputCtx.currentTime);

      source.connect(highpassFilter);
      highpassFilter.connect(inAnalyser);

      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      highpassFilter.connect(processor);
      processor.connect(inputCtx.destination);

      // Connect WebSocket to Gemini Live with pattern context
      const isMobileApp = window.location.protocol === 'file:' || 
                          window.location.protocol.startsWith('capacitor') || 
                          window.location.protocol.startsWith('ionic');
      
      const serverHost = isMobileApp 
        ? ((import.meta as any).env?.VITE_BACKEND_HOST || 'ais-pre-fo3owuqjpczzsi5hj5eyh3-348785349910.asia-southeast1.run.app')
        : window.location.host;

      const protocol = (window.location.protocol === 'https:' || isMobileApp) ? 'wss:' : 'ws:';
      let wsUrl = `${protocol}//${serverHost}/live`;
      if (currentPattern) {
        const queryParams = new URLSearchParams({
          patternId: String(currentPattern.id),
          structure: currentPattern.structure,
          meaning: currentPattern.bengaliMeaning,
          topic: currentPattern.speakingTask.topic,
          promptQuestion: currentPattern.speakingTask.promptQuestionBn || '',
          sampleAnswer: currentPattern.speakingTask.sampleAnswerEn || '',
          sampleBn1: currentPattern.sentenceBuilding?.[0]?.bn || '',
          sampleEn1: currentPattern.sentenceBuilding?.[0]?.en || '',
          powerWord: currentPattern.vocabularySpotlight?.powerWords?.[0]?.word || '',
          powerWordMeaning: currentPattern.vocabularySpotlight?.powerWords?.[0]?.meaning || '',
          grammarNote: currentPattern.grammarCoverage?.[0]?.explanation || ''
        });
        wsUrl += `?${queryParams.toString()}`;
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setCallActive(true);
        setConnectionStatus('connected');
        setTutorState('listening');
        setCurrentSubtitle(`Connected to Coach! Let's practice Level ${currentPattern?.id || 1}.`);
      };

      // Stream mic audio over WebSocket reliably (continuous PCM16)
      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        
        // Calculate RMS for UI speaking indicator & background noise threshold
        let sumSquares = 0;
        for (let i = 0; i < inputData.length; i++) {
          sumSquares += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sumSquares / inputData.length);

        if (rms > 0.008) {
          setUserSpeaking(true);
        } else {
          setUserSpeaking(false);
        }

        // Send PCM audio stream continuously so Gemini Live's upstream VAD can track and respond across all conversation turns
        const base64Audio = floatTo16BitPCMBase64(inputData);
        ws.send(JSON.stringify({ audio: base64Audio }));
      };

      // Handle incoming messages
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.error) {
            console.error("Server Live Error:", msg.error);
            setErrorMessage(msg.error);
            setCurrentSubtitle(msg.error);
            return;
          }

          if (msg.hangUp) {
            const farewellText = msg.reason || msg.text || "Air কল কেটে দিয়েছে। ভালো থাকবেন!";
            setCurrentSubtitle(`📞 ${farewellText}`);
            setTimeout(() => {
              stopCall();
            }, 2600);
            return;
          }

          if (msg.interrupted) {
            stopAllActiveAudio();
            return;
          }

          if (msg.text) {
            setCurrentSubtitle(msg.text);
            if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
            subtitleTimeoutRef.current = setTimeout(() => {
              setCurrentSubtitle('');
            }, 12000);
          }

          if (msg.audio && outputAudioCtxRef.current) {
            const ctx = outputAudioCtxRef.current;
            if (ctx.state === 'suspended') {
              ctx.resume();
            }
            const audioBuffer = base64ToAudioBuffer(msg.audio, ctx);
            const sourceNode = ctx.createBufferSource();
            sourceNode.buffer = audioBuffer;

            if (outputAnalyserRef.current) {
              sourceNode.connect(outputAnalyserRef.current);
              outputAnalyserRef.current.connect(ctx.destination);
            } else {
              sourceNode.connect(ctx.destination);
            }

            const now = ctx.currentTime;
            // If previous audio finished more than 100ms ago, reset to current time to eliminate accumulated lag
            const startAt = nextStartTimeRef.current < now ? now : Math.max(now, nextStartTimeRef.current);
            sourceNode.start(startAt);
            nextStartTimeRef.current = startAt + audioBuffer.duration;

            activeSourcesRef.current.push(sourceNode);
            setTutorState('speaking');

            sourceNode.onended = () => {
              activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== sourceNode);
              if (activeSourcesRef.current.length === 0) {
                setTutorState('listening');
              }
            };
          }

          if (msg.turnComplete) {
            // Turn completed by AI
            if (activeSourcesRef.current.length === 0) {
              setTutorState('listening');
            }
          }
        } catch (err) {
          console.error("Error handling Live message:", err);
        }
      };

      ws.onerror = (e) => {
        console.error("WebSocket client error:", e);
        setConnectionStatus('error');
        setErrorMessage("Connection to live audio session failed.");
      };

      ws.onclose = () => {
        setCallActive(false);
        setConnectionStatus('disconnected');
        setTutorState('idle');
      };

      startAudioMonitoring();

    } catch (err: any) {
      console.error("Failed to start live session:", err);
      setConnectionStatus('error');
      setErrorMessage(err.message || "Failed to initialize microphone or connection.");
      stopCall();
    }
  }, [startAudioMonitoring, stopAllActiveAudio, stopCall]);

  useEffect(() => {
    return () => {
      stopCall();
    };
  }, [stopCall]);

  return {
    callActive,
    tutorState,
    audioLevel,
    currentSubtitle,
    userSpeaking,
    connectionStatus,
    errorMessage,
    startCall,
    stopCall
  };
}
