import { useState, useEffect, useRef, useCallback } from 'react';
import { Pattern } from '../types';
import { getUserApiKey } from '../utils/storage';
import { getWebSocketUrl } from '../config';

export function useLiveCall(onRequireApiKey?: () => void) {
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
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isCallActiveRef = useRef<boolean>(false);
  const subtitleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
    const output = new DataView(new ArrayBuffer(input.length * 2));
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return output.buffer;
  }

  function base64FromArrayBuffer(arrayBuffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(arrayBuffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  function base64ToAudioBuffer(
    base64: string,
    ctx: AudioContext,
    sampleRate = 24000
  ): AudioBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const int16Array = new Int16Array(bytes.buffer);
    const audioBuffer = ctx.createBuffer(1, int16Array.length, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < int16Array.length; i++) {
      channelData[i] = int16Array[i] / 32768.0;
    }
    return audioBuffer;
  }

  const clearAudioQueue = useCallback(() => {
    activeSourcesRef.current.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextPlayTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
  }, []);

  const stopCall = useCallback(() => {
    isCallActiveRef.current = false;
    clearAudioQueue();

    if (wsRef.current) {
      try {
        wsRef.current.close(1000, "User disconnected");
      } catch (e) {}
      wsRef.current = null;
    }

    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch (e) {}
      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {}
      mediaStreamRef.current = null;
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

    if (subtitleTimeoutRef.current) {
      clearTimeout(subtitleTimeoutRef.current);
      subtitleTimeoutRef.current = null;
    }

    setCallActive(false);
    setConnectionStatus('disconnected');
    setTutorState('idle');
    setAudioLevel(0);
    setUserSpeaking(false);
    setCurrentSubtitle('');
  }, [clearAudioQueue]);

  const startCall = useCallback(async (currentPattern?: Pattern) => {
    const userApiKey = getUserApiKey();
    if (!userApiKey) {
      if (onRequireApiKey) onRequireApiKey();
      setErrorMessage("AI কোচের সাথে কথা বলতে অনুগ্রহ করে আপনার Gemini API Key যুক্ত করুন।");
      return;
    }

    try {
      setConnectionStatus('connecting');
      setErrorMessage('');
      isCallActiveRef.current = true;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioCtx({ sampleRate: 16000 });
      const outputCtx = new AudioCtx({ sampleRate: 24000 });
      
      await inputCtx.resume();
      await outputCtx.resume();

      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;
      nextPlayTimeRef.current = outputCtx.currentTime;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      mediaStreamRef.current = stream;

      const pId = currentPattern?.id || 1;
      const struct = currentPattern?.structure || "Subject + want(s) + to + Verb";
      const meaning = currentPattern?.bengaliMeaning || "কেউ কোনো কিছু করতে চায়";
      const sampleEn = currentPattern?.sentenceBuilding?.[0]?.en || "";
      const sampleBn = currentPattern?.sentenceBuilding?.[0]?.bn || "";
      const grammarNote = currentPattern?.grammarCoverage?.[0]?.explanation || "";
      const powerWord = currentPattern?.vocabularySpotlight?.powerWords?.[0]?.word || "";
      const topic = currentPattern?.speakingTask?.topic || "Daily Life";

      const queryParams = new URLSearchParams({
        apiKey: userApiKey,
        patternId: String(pId),
        structure: struct,
        meaning: meaning,
        sampleEn1: sampleEn,
        sampleBn1: sampleBn,
        grammarNote: grammarNote,
        powerWord: powerWord,
        topic: topic,
      });

      // Construct WS URL using getWebSocketUrl to work seamlessly in web preview and Android APK
      const baseWsUrl = getWebSocketUrl('/live');
      const wsUrl = `${baseWsUrl}?${queryParams.toString()}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isCallActiveRef.current) return;
        setConnectionStatus('connected');
        setCallActive(true);
        setTutorState('speaking');
        setCurrentSubtitle("সংযোগ হয়েছে! Air কথা বলছে...");

        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (!isCallActiveRef.current) return;
          const inputData = e.inputBuffer.getChannelData(0);

          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += Math.abs(inputData[i]);
          }
          const avg = sum / inputData.length;
          const isSpeaking = avg > 0.015;

          if (isSpeaking) {
            setAudioLevel(Math.min(1, avg * 5));
            setUserSpeaking(true);
            setTutorState('listening');
          } else {
            setUserSpeaking(false);
          }

          if (ws.readyState === WebSocket.OPEN) {
            const pcmBuffer = floatTo16BitPCM(inputData);
            const base64Audio = base64FromArrayBuffer(pcmBuffer);
            ws.send(JSON.stringify({ audio: base64Audio }));
          }
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);
      };

      ws.onmessage = (event) => {
        if (!isCallActiveRef.current) return;
        try {
          const msg = JSON.parse(event.data);

          if (msg.requireApiKey || (msg.error && msg.error.includes("API Key"))) {
            setErrorMessage(msg.error || "Gemini API Key প্রয়োজন।");
            if (onRequireApiKey) onRequireApiKey();
            stopCall();
            return;
          } else if (msg.error) {
            console.error("Live API error received from server:", msg.error);
            setErrorMessage(`Error: ${msg.error}`);
            stopCall();
            return;
          }

          if (msg.interrupted) {
            clearAudioQueue();
            setTutorState('listening');
            return;
          }

          if (msg.text) {
            setCurrentSubtitle(msg.text);
            setTutorState('speaking');
            if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
            subtitleTimeoutRef.current = setTimeout(() => {
              if (isCallActiveRef.current) {
                setTutorState('listening');
              }
            }, 4000);
          }

          if (msg.audio && outputAudioCtxRef.current) {
            const outCtx = outputAudioCtxRef.current;
            const audioBuf = base64ToAudioBuffer(msg.audio, outCtx, 24000);
            
            const source = outCtx.createBufferSource();
            source.buffer = audioBuf;
            source.connect(outCtx.destination);

            const now = outCtx.currentTime;
            if (nextPlayTimeRef.current < now) {
              nextPlayTimeRef.current = now;
            }

            source.start(nextPlayTimeRef.current);
            nextPlayTimeRef.current += audioBuf.duration;

            activeSourcesRef.current.push(source);
            source.onended = () => {
              activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
              if (activeSourcesRef.current.length === 0 && isCallActiveRef.current) {
                setTutorState('listening');
              }
            };

            setTutorState('speaking');
            setAudioLevel(0.4 + Math.random() * 0.4);
          }

          if (msg.hangUp) {
            setCurrentSubtitle(msg.reason || "কথা শেষ! চমৎকার প্র্যাকটিস হলো!");
            setTimeout(() => {
              stopCall();
            }, 2500);
          }

        } catch (e) {
          console.error("Failed to parse incoming WS message:", e);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        setConnectionStatus('error');
        setErrorMessage("লাইভ অডিও সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      };

      ws.onclose = (e) => {
        console.log("Live WebSocket closed:", e.code, e.reason);
        if (isCallActiveRef.current) {
          if (e.code === 1008) {
            setErrorMessage("Gemini API Key সঠিক নয়। অনুগ্রহ করে সঠিক কি দিন।");
            if (onRequireApiKey) onRequireApiKey();
          }
          stopCall();
        }
      };

    } catch (err: any) {
      console.error("Start call error:", err);
      setConnectionStatus('error');
      setErrorMessage(err.message || "মাইক্রোফোন চালু করতে সমস্যা হয়েছে। ব্রাউজার পারমিশন চেক করুন।");
      stopCall();
    }
  }, [clearAudioQueue, onRequireApiKey, stopCall]);

  const sendManualMessage = useCallback((text: string) => {
    if (!callActive || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }
    wsRef.current.send(JSON.stringify({ text }));
  }, [callActive]);

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
    stopCall,
    sendManualMessage,
  };
}

