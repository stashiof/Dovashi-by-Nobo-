import { useState, useEffect, useRef, useCallback } from 'react';
import { Pattern } from '../types';
import { getUserApiKey } from '../utils/storage';
import { GoogleGenAI, Modality, Type } from '@google/genai';

export interface LiveChatMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  timestamp: number;
}

// Helper: Linear Resampler from any device hardware sample rate (e.g. 48kHz / 44.1kHz on Android) to 16kHz
function downsampleTo16kHz(buffer: Float32Array, sampleRate: number): Float32Array {
  if (sampleRate === 16000) return buffer;
  const ratio = sampleRate / 16000;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : buffer[offsetBuffer];
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
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

  // Direct Live Session Ref & WebSocket Ref
  const directSessionRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const isCallActiveRef = useRef<boolean>(false);
  const nextPlayTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isAiSpeakingRef = useRef<boolean>(false);

  // VAD & Turn Management
  const isUserSpeakingRef = useRef<boolean>(false);
  const speechTrailingFramesRef = useRef<number>(0);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stop pending audio sources immediately
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

    if (directSessionRef.current) {
      try {
        directSessionRef.current.close();
      } catch (e) {}
      directSessionRef.current = null;
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

  // Send typed text message
  const sendManualMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    clearAudioQueue();
    const cleanText = text.trim();
    setCurrentSubtitle(`আপনি: "${cleanText}"`);
    setTutorState('thinking');
    setUserSpeaking(false);

    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), sender: 'user', text: cleanText, timestamp: Date.now() }
    ]);

    if (directSessionRef.current) {
      directSessionRef.current.sendClientContent({
        turns: [{ role: 'user', parts: [{ text: cleanText }] }],
        turnComplete: true
      });
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: cleanText }));
    }
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

      const userApiKey = getUserApiKey();
      if (!userApiKey) {
        if (onRequireApiKey) onRequireApiKey();
        setConnectionStatus('error');
        setErrorMessage("AI কোচের সাথে লাইভ কথা বলতে অনুগ্রহ করে আপনার Gemini API Key যুক্ত করুন।");
        isCallActiveRef.current = false;
        return;
      }

      // 1. Initialize Audio Contexts with Hardware Fallbacks (Android Friendly)
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      let inputAudioCtx: AudioContext;
      try {
        inputAudioCtx = new AudioCtx({ sampleRate: 16000 });
      } catch (e) {
        inputAudioCtx = new AudioCtx();
      }

      if (inputAudioCtx.state === 'suspended') {
        await inputAudioCtx.resume();
      }
      inputAudioCtxRef.current = inputAudioCtx;

      let outputAudioCtx: AudioContext;
      try {
        outputAudioCtx = new AudioCtx({ sampleRate: 24000 });
      } catch (e) {
        outputAudioCtx = new AudioCtx();
      }

      if (outputAudioCtx.state === 'suspended') {
        await outputAudioCtx.resume();
      }
      outputAudioCtxRef.current = outputAudioCtx;
      nextPlayTimeRef.current = outputAudioCtx.currentTime;

      // 2. Microphone Stream with Echo Cancellation & Noise Suppression
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      mediaStreamRef.current = stream;

      const pId = currentPattern?.id || 1;
      const struct = currentPattern?.structure || "Subject + want(s) + to + Verb";
      const meaning = currentPattern?.bengaliMeaning || "কেউ কোনো কিছু করতে চায়";
      const topic = currentPattern?.speakingTask?.topic || currentPattern?.categoryTag || "Daily Life";
      const sampleEn1 = currentPattern?.sentenceBuilding?.[0]?.en || "I want to learn English";
      const sampleBn1 = currentPattern?.sentenceBuilding?.[0]?.bn || "আমি ইংরেজি শিখতে চাই";

      const systemInstruction = `You are "Air", an ultra-interactive, energetic spoken English practice coach and conversation partner on the "Dovashi" app.
CURRENT PATTERN: Level #${pId} — Structure: "${struct}" (Bengali: "${meaning}").
TOPIC: "${topic}".
SAMPLE SENTENCE: "${sampleEn1}" (${sampleBn1}).

CORE DIRECTIVES:
1. Speak in clean, natural English. You may use a few encouraging Bengali words (e.g. "দারুণ!", "আবার বলো!") if helpful.
2. Keep every turn SHORT (1-2 sentences). Ask ONE engaging question to keep the conversation flowing.
3. If the user makes a grammar mistake with "${struct}", gently correct them with passion and ask them to repeat the correct sentence.
4. If the user says goodbye or wants to end the call, call the 'hangUpCall' tool.
5. NO internal monologues or reasoning headers. Start directly with friendly spoken voice.`;

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

      // 3. Connect DIRECTLY to Google Gemini Live API from Phone/Browser via Official Google GenAI SDK!
      console.log("Connecting directly to Google Gemini Live API...");
      const ai = new GoogleGenAI({ apiKey: userApiKey.trim() });

      const session = await ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Puck'
              }
            }
          },
          systemInstruction,
          tools: [{
            functionDeclarations: [{
              name: 'hangUpCall',
              description: 'Call this function to hang up the phone call when user says goodbye or wants to exit.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  farewellMessage: { type: Type.STRING, description: 'Final goodbye sentence' }
                }
              }
            }]
          }]
        },
        callbacks: {
          onmessage: (msg: any) => {
            if (!isCallActiveRef.current) return;

            // Handle server audio parts
            if (msg.serverContent?.modelTurn?.parts) {
              for (const part of msg.serverContent.modelTurn.parts) {
                if (part.inlineData && part.inlineData.data) {
                  playAudioChunk(part.inlineData.data);
                }
                if (part.text) {
                  const txt = part.text.trim();
                  if (!txt.startsWith("**") && !txt.startsWith("Thinking") && !txt.includes("Choosing a Response")) {
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
              }
            }

            // Handle Tool Call (Hang up call)
            if (msg.toolCall?.functionCalls) {
              for (const call of msg.toolCall.functionCalls) {
                if (call.name === 'hangUpCall') {
                  const byeMsg = (call.args as any)?.farewellMessage || "Goodbye! Keep practicing!";
                  setCurrentSubtitle(byeMsg);
                  setMessages(prev => [
                    ...prev,
                    { id: Date.now().toString(), sender: 'tutor', text: byeMsg, timestamp: Date.now() }
                  ]);
                  setTimeout(() => {
                    stopCall();
                  }, 2000);
                }
              }
            }

            if (msg.serverContent?.interrupted) {
              clearAudioQueue();
              setTutorState('listening');
            }

            if (msg.serverContent?.turnComplete) {
              if (activeSourcesRef.current.length === 0) {
                isAiSpeakingRef.current = false;
                setTutorState('listening');
              }
            }
          },
          onerror: (err: any) => {
            console.error("Direct Live Error:", err);
            setErrorMessage(`ত্রুটি: ${err.message || 'কানেকশন ড্রপ করেছে'}`);
          },
          onclose: () => {
            console.log("Direct Live Session Closed");
            if (isCallActiveRef.current) {
              stopCall();
            }
          }
        }
      });

      directSessionRef.current = session;
      setConnectionStatus('connected');
      setCallActive(true);
      setTutorState('speaking');
      setCurrentSubtitle("Air লাইভ যুক্ত হয়েছে! শুনুন...");

      // Send initial greeting trigger
      session.sendClientContent({
        turns: [{
          role: 'user',
          parts: [{
            text: `[SYSTEM: The user just started the call for Level ${pId} on "${struct}". Give a cheerful 1-sentence welcome and ask them your first practice question!]`
          }]
        }],
        turnComplete: true
      });

      // 4. Audio Input Stream via ScriptProcessor with Hardware Resampling
      const actualSampleRate = inputAudioCtx.sampleRate || 16000;
      const bufferSize = actualSampleRate >= 44100 ? 4096 : 2048;
      const source = inputAudioCtx.createMediaStreamSource(stream);
      const processor = inputAudioCtx.createScriptProcessor(bufferSize, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!isCallActiveRef.current || !directSessionRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);

        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);

        if (!isAiSpeakingRef.current) {
          const hasVoice = rms > 0.013;

          if (hasVoice) {
            isUserSpeakingRef.current = true;
            speechTrailingFramesRef.current = 2;
            setUserSpeaking(true);
            setAudioLevel(Math.min(1, rms * 7));
            setTutorState('listening');

            if (pauseTimerRef.current) {
              clearTimeout(pauseTimerRef.current);
              pauseTimerRef.current = null;
            }

            const resampled16k = downsampleTo16kHz(inputData, actualSampleRate);
            const pcm16 = floatTo16BitPCM(resampled16k);
            const base64Audio = arrayBufferToBase64(pcm16);

            directSessionRef.current.sendRealtimeInput([{
              mimeType: 'audio/pcm;rate=16000',
              data: base64Audio
            }]);

          } else if (speechTrailingFramesRef.current > 0) {
            speechTrailingFramesRef.current--;
            const resampled16k = downsampleTo16kHz(inputData, actualSampleRate);
            const pcm16 = floatTo16BitPCM(resampled16k);
            const base64Audio = arrayBufferToBase64(pcm16);

            directSessionRef.current.sendRealtimeInput([{
              mimeType: 'audio/pcm;rate=16000',
              data: base64Audio
            }]);

            if (speechTrailingFramesRef.current === 0 && isUserSpeakingRef.current) {
              setUserSpeaking(false);
              setAudioLevel(0);

              if (!pauseTimerRef.current) {
                pauseTimerRef.current = setTimeout(() => {
                  if (directSessionRef.current && isCallActiveRef.current) {
                    setTutorState('thinking');
                  }
                  isUserSpeakingRef.current = false;
                  pauseTimerRef.current = null;
                }, 400);
              }
            }
          } else {
            setUserSpeaking(false);
            setAudioLevel(0);
          }
        } else {
          // Barge-in Interruption detection
          if (rms > 0.08) {
            clearAudioQueue();
            setTutorState('listening');
            setUserSpeaking(true);
            isUserSpeakingRef.current = true;
            speechTrailingFramesRef.current = 2;

            const resampled16k = downsampleTo16kHz(inputData, actualSampleRate);
            const pcm16 = floatTo16BitPCM(resampled16k);
            const base64Audio = arrayBufferToBase64(pcm16);

            directSessionRef.current.sendRealtimeInput([{
              mimeType: 'audio/pcm;rate=16000',
              data: base64Audio
            }]);
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
