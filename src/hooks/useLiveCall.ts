import { useState, useEffect, useRef, useCallback } from 'react';
import { Pattern } from '../types';
import { getUserApiKey } from '../utils/storage';

export interface LiveChatMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  timestamp: number;
}

// Helper: Convert Float32 [-1, 1] to 16-bit PCM Little Endian ArrayBuffer
function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const output = new DataView(new ArrayBuffer(input.length * 2));
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return output.buffer;
}

// Helper: ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper: Convert base64 PCM 24kHz to AudioBuffer
function base64PcmToAudioBuffer(base64: string, ctx: AudioContext): AudioBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const int16Array = new Int16Array(bytes.buffer);
  const audioBuffer = ctx.createBuffer(1, int16Array.length, 24000);
  const channelData = audioBuffer.getChannelData(0);
  for (let i = 0; i < int16Array.length; i++) {
    channelData[i] = int16Array[i] / 32768.0;
  }
  return audioBuffer;
}

export function useLiveCall(onRequireApiKey?: () => void) {
  const [callActive, setCallActive] = useState(false);
  const [tutorState, setTutorState] = useState<'idle' | 'listening' | 'thinking' | 'speaking' | 'dancing'>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [errorMessage, setErrorMessage] = useState('');
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const isCallActiveRef = useRef<boolean>(false);
  const nextPlayTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isAiSpeakingRef = useRef<boolean>(false);

  // VAD and Speech Window Management (Prevents Network Congestion)
  const isUserSpeakingRef = useRef<boolean>(false);
  const speechTrailingFramesRef = useRef<number>(0);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stop pending audio and clear queue
  const clearAudioQueue = useCallback(() => {
    activeSourcesRef.current.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
    isAiSpeakingRef.current = false;
    if (outputAudioCtxRef.current) {
      nextPlayTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
  }, []);

  const stopCall = useCallback(() => {
    isCallActiveRef.current = false;
    clearAudioQueue();

    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close(1000, "User hung up");
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
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
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

    setCallActive(false);
    setConnectionStatus('disconnected');
    setTutorState('idle');
    setAudioLevel(0);
    setUserSpeaking(false);
    setCurrentSubtitle('');
  }, [clearAudioQueue]);

  // Send typed or manual text message to Gemini Live
  const sendManualMessage = useCallback((text: string) => {
    if (!text.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    clearAudioQueue();
    const cleanText = text.trim();
    setCurrentSubtitle(`আপনি: "${cleanText}"`);
    setTutorState('thinking');
    setUserSpeaking(false);

    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), sender: 'user', text: cleanText, timestamp: Date.now() }
    ]);

    wsRef.current.send(JSON.stringify({
      text: cleanText
    }));
  }, [clearAudioQueue]);

  const startCall = useCallback(async (currentPattern?: Pattern) => {
    try {
      setConnectionStatus('connecting');
      setErrorMessage('');
      setMessages([]);
      isCallActiveRef.current = true;
      isAiSpeakingRef.current = false;
      isUserSpeakingRef.current = false;
      speechTrailingFramesRef.current = 0;

      // 1. Initialize High-Precision Audio Contexts
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      
      // Input context for recording mic (16kHz standard for Gemini Live)
      const inputAudioCtx = new AudioCtx({ sampleRate: 16000 });
      if (inputAudioCtx.state === 'suspended') {
        await inputAudioCtx.resume();
      }
      inputAudioCtxRef.current = inputAudioCtx;

      // Output context for playback (24kHz native Gemini Live output)
      const outputAudioCtx = new AudioCtx({ sampleRate: 24000 });
      if (outputAudioCtx.state === 'suspended') {
        await outputAudioCtx.resume();
      }
      outputAudioCtxRef.current = outputAudioCtx;
      nextPlayTimeRef.current = outputAudioCtx.currentTime;

      // 2. Request clean, continuous mic stream with full echo cancellation & noise suppression
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      mediaStreamRef.current = stream;

      const userApiKey = getUserApiKey();
      const pId = currentPattern?.id || 1;
      const struct = encodeURIComponent(currentPattern?.structure || "Subject + want(s) + to + Verb");
      const meaning = encodeURIComponent(currentPattern?.bengaliMeaning || "কেউ কোনো কিছু করতে চায়");
      const topic = encodeURIComponent(currentPattern?.speakingTask?.topic || currentPattern?.categoryTag || "Daily Life");
      const sampleEn1 = encodeURIComponent(currentPattern?.sentenceBuilding?.[0]?.en || "I want to learn English");
      const sampleBn1 = encodeURIComponent(currentPattern?.sentenceBuilding?.[0]?.bn || "আমি ইংরেজি শিখতে চাই");

      // 3. Connect to App Live WebSocket Proxy
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const proxyUrl = `${protocol}//${window.location.host}/live?patternId=${pId}&structure=${struct}&meaning=${meaning}&topic=${topic}&sampleEn1=${sampleEn1}&sampleBn1=${sampleBn1}${userApiKey ? `&apiKey=${encodeURIComponent(userApiKey.trim())}` : ''}`;

      const ws = new WebSocket(proxyUrl);
      wsRef.current = ws;

      const playAudioChunk = (base64Data: string) => {
        if (!isCallActiveRef.current || !outputAudioCtxRef.current) return;
        const ctx = outputAudioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const audioBuf = base64PcmToAudioBuffer(base64Data, ctx);
        const sourceNode = ctx.createBufferSource();
        sourceNode.buffer = audioBuf;
        sourceNode.connect(ctx.destination);

        const now = ctx.currentTime;
        if (nextPlayTimeRef.current < now) {
          nextPlayTimeRef.current = now + 0.015;
        }

        sourceNode.start(nextPlayTimeRef.current);
        nextPlayTimeRef.current += audioBuf.duration;

        activeSourcesRef.current.push(sourceNode);
        isAiSpeakingRef.current = true;
        setTutorState('speaking');
        setAudioLevel(0.4 + Math.random() * 0.45);

        sourceNode.onended = () => {
          activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== sourceNode);
          if (activeSourcesRef.current.length === 0 && isCallActiveRef.current) {
            isAiSpeakingRef.current = false;
            setTutorState('listening');
            setAudioLevel(0);
          }
        };
      };

      ws.onopen = () => {
        if (!isCallActiveRef.current) return;
        setConnectionStatus('connected');
        setCallActive(true);
        setTutorState('speaking');
        setCurrentSubtitle("Air লাইভ যুক্ত হয়েছে! শুনুন...");
      };

      ws.onmessage = (event) => {
        if (!isCallActiveRef.current) return;
        try {
          const data = JSON.parse(event.data);

          if (data.requireApiKey) {
            if (onRequireApiKey) onRequireApiKey();
            setErrorMessage(data.error || "Gemini API Key প্রয়োজন।");
            stopCall();
            return;
          }

          if (data.error) {
            console.error("Live message error:", data.error);
            return;
          }

          if (data.interrupted) {
            clearAudioQueue();
            setTutorState('listening');
            return;
          }

          if (data.hangUp) {
            if (data.text) {
              setCurrentSubtitle(data.text);
              setMessages(prev => [
                ...prev,
                { id: Date.now().toString(), sender: 'tutor', text: data.text, timestamp: Date.now() }
              ]);
            }
            setTimeout(() => {
              stopCall();
            }, 2200);
            return;
          }

          if (data.text) {
            const txt = data.text.trim();
            // Filter internal reasoning metadata from subtitles
            if (!txt.startsWith("**") && !txt.startsWith("Thinking") && !txt.includes("Choosing a Response") && !txt.includes("I've decided")) {
              setCurrentSubtitle(txt);
              setTutorState('speaking');
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last && last.sender === 'tutor' && Date.now() - last.timestamp < 3000) {
                  return [...prev.slice(0, -1), { ...last, text: `${last.text} ${txt}`.trim() }];
                }
                return [...prev, { id: Date.now().toString(), sender: 'tutor', text: txt, timestamp: Date.now() }];
              });
            }
          }

          if (data.audio) {
            playAudioChunk(data.audio);
          }

          if (data.turnComplete) {
            if (activeSourcesRef.current.length === 0) {
              isAiSpeakingRef.current = false;
              setTutorState('listening');
            }
          }
        } catch (e) {
          console.error("Error processing live message:", e);
        }
      };

      ws.onerror = (err) => {
        console.error("Live WebSocket Error:", err);
      };

      ws.onclose = (event) => {
        console.log("Live WebSocket closed:", event.code, event.reason);
        if (isCallActiveRef.current) {
          if (event.code === 1008 && event.reason?.includes("API key")) {
            if (onRequireApiKey) onRequireApiKey();
            setErrorMessage("AI কোচের সাথে কথা বলতে অনুগ্রহ করে আপনার Gemini API Key যুক্ত করুন।");
          }
          stopCall();
        }
      };

      // 4. Clean 4096-sample (~250ms) buffer with Smart Voice Activity Gating
      // This sends audio ONLY when the user speaks, eliminating WebSocket buffer lag completely!
      const source = inputAudioCtx.createMediaStreamSource(stream);
      const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!isCallActiveRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);

        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          if (!isAiSpeakingRef.current) {
            const hasVoice = rms > 0.013;

            if (hasVoice) {
              // User is speaking actively
              isUserSpeakingRef.current = true;
              speechTrailingFramesRef.current = 2; // Keep 2 trailing frames (500ms) of natural decay
              setUserSpeaking(true);
              setAudioLevel(Math.min(1, rms * 7));
              setTutorState('listening');

              if (pauseTimerRef.current) {
                clearTimeout(pauseTimerRef.current);
                pauseTimerRef.current = null;
              }

              // Send audio frame immediately
              const pcm16 = floatTo16BitPCM(inputData);
              const base64Audio = arrayBufferToBase64(pcm16);
              wsRef.current.send(JSON.stringify({ audio: base64Audio }));

            } else if (speechTrailingFramesRef.current > 0) {
              // Send trailing frame for natural tailing of words
              speechTrailingFramesRef.current--;
              const pcm16 = floatTo16BitPCM(inputData);
              const base64Audio = arrayBufferToBase64(pcm16);
              wsRef.current.send(JSON.stringify({ audio: base64Audio }));

              if (speechTrailingFramesRef.current === 0 && isUserSpeakingRef.current) {
                setUserSpeaking(false);
                setAudioLevel(0);
                
                // User finished sentence — commit speech to Gemini Live
                if (!pauseTimerRef.current) {
                  pauseTimerRef.current = setTimeout(() => {
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && isCallActiveRef.current) {
                      wsRef.current.send(JSON.stringify({ endOfSpeech: true }));
                      setTutorState('thinking');
                    }
                    isUserSpeakingRef.current = false;
                    pauseTimerRef.current = null;
                  }, 400); // 400ms ultra-fast turn trigger
                }
              }
            } else {
              // Complete silence: Do NOT send audio to prevent network congestion
              setUserSpeaking(false);
              setAudioLevel(0);
            }
          } else {
            // Air is currently speaking — check for Barge-in Interruption (loud speech)
            if (rms > 0.08) {
              clearAudioQueue();
              setTutorState('listening');
              setUserSpeaking(true);
              isUserSpeakingRef.current = true;
              speechTrailingFramesRef.current = 2;

              const pcm16 = floatTo16BitPCM(inputData);
              const base64Audio = arrayBufferToBase64(pcm16);
              wsRef.current.send(JSON.stringify({ audio: base64Audio }));
            }
          }
        }
      };

      source.connect(processor);
      processor.connect(inputAudioCtx.destination);

    } catch (err: any) {
      console.error("Start call error:", err);
      setConnectionStatus('error');
      setErrorMessage(err.message || "মাইক্রোফোন চালু করতে সমস্যা হয়েছে। ব্রাউজার পারমিশন চেক করুন।");
      stopCall();
    }
  }, [clearAudioQueue, onRequireApiKey, stopCall]);

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
    messages,
    startCall,
    stopCall,
    sendManualMessage,
  };
}
