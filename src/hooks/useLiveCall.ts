import { useState, useEffect, useRef, useCallback } from 'react';
import { Pattern } from '../types';
import { getUserApiKey } from '../utils/storage';
import { GoogleGenAI, Modality } from '@google/genai';

export interface LiveChatMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  timestamp: number;
}

// Resample audio buffer to 16kHz
function downsampleTo16kHz(buffer: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === 16000) return buffer;
  const ratio = inputSampleRate / 16000;
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

// Convert Float32 [-1, 1] to 16-bit PCM Little-Endian ArrayBuffer
function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const output = new DataView(new ArrayBuffer(input.length * 2));
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return output.buffer;
}

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 24kHz PCM to AudioBuffer
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

  // Session & Audio Nodes
  const liveSessionRef = useRef<any>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const isCallActiveRef = useRef<boolean>(false);
  const nextPlayTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isAiSpeakingRef = useRef<boolean>(false);

  // Audio Buffer Accumulator for Voice Utterances
  const speechPcmChunksRef = useRef<Float32Array[]>([]);
  const hasSpokenVoiceRef = useRef<boolean>(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingTurnRef = useRef<boolean>(false);

  // Stop pending audio sources
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

  // Stop the entire call
  const stopCall = useCallback(() => {
    isCallActiveRef.current = false;
    isProcessingTurnRef.current = false;
    clearAudioQueue();

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (liveSessionRef.current) {
      try {
        liveSessionRef.current.close();
      } catch (e) {}
      liveSessionRef.current = null;
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

    speechPcmChunksRef.current = [];
    hasSpokenVoiceRef.current = false;

    setCallActive(false);
    setConnectionStatus('disconnected');
    setTutorState('idle');
    setAudioLevel(0);
    setUserSpeaking(false);
    setCurrentSubtitle('');
  }, [clearAudioQueue]);

  // Send accumulated voice audio turn to Gemini Live
  const sendSpokenAudioTurn = useCallback(() => {
    if (!isCallActiveRef.current || !liveSessionRef.current || speechPcmChunksRef.current.length === 0) {
      return;
    }

    // Merge chunks
    const chunks = speechPcmChunksRef.current;
    let totalLen = 0;
    for (const c of chunks) totalLen += c.length;

    if (totalLen < 3200) { // Too short (< 0.2s), ignore noise
      speechPcmChunksRef.current = [];
      hasSpokenVoiceRef.current = false;
      return;
    }

    const merged = new Float32Array(totalLen);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.length;
    }

    // Reset accumulator
    speechPcmChunksRef.current = [];
    hasSpokenVoiceRef.current = false;
    isProcessingTurnRef.current = true;

    setTutorState('thinking');
    setUserSpeaking(false);
    setAudioLevel(0.25);
    setCurrentSubtitle("Air শুনছে ও ভাবছে...");

    // Convert to 16-bit PCM base64
    const pcm16 = floatTo16BitPCM(merged);
    const base64Audio = arrayBufferToBase64(pcm16);

    try {
      console.log(`Sending voice turn (${(totalLen / 16000).toFixed(1)}s audio)...`);
      liveSessionRef.current.sendClientContent({
        turns: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'audio/pcm;rate=16000',
                  data: base64Audio
                }
              }
            ]
          }
        ],
        turnComplete: true
      });
    } catch (err) {
      console.error("Failed to send audio turn to Gemini Live:", err);
      isProcessingTurnRef.current = false;
      setTutorState('listening');
    }
  }, []);

  // Send manual typed message
  const sendManualMessage = useCallback((text: string) => {
    if (!text || !text.trim() || !isCallActiveRef.current || !liveSessionRef.current) return;
    const cleanText = text.trim();
    
    clearAudioQueue();
    setCurrentSubtitle(`আপনি: "${cleanText}"`);
    setTutorState('thinking');
    setUserSpeaking(false);
    isProcessingTurnRef.current = true;

    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), sender: 'user', text: cleanText, timestamp: Date.now() }
    ]);

    try {
      liveSessionRef.current.sendClientContent({
        turns: [{ role: 'user', parts: [{ text: cleanText }] }],
        turnComplete: true
      });
    } catch (err) {
      console.error("Failed to send client text:", err);
      isProcessingTurnRef.current = false;
      setTutorState('listening');
    }
  }, [clearAudioQueue]);

  // Start Real-Time Live Conversation (Gemini Live API)
  const startCall = useCallback(async (currentPattern?: Pattern) => {
    try {
      setConnectionStatus('connecting');
      setErrorMessage('');
      setMessages([]);
      isCallActiveRef.current = true;
      isAiSpeakingRef.current = false;
      isProcessingTurnRef.current = false;
      hasSpokenVoiceRef.current = false;
      speechPcmChunksRef.current = [];

      const userApiKey = getUserApiKey();
      if (!userApiKey) {
        if (onRequireApiKey) onRequireApiKey();
        setConnectionStatus('error');
        setErrorMessage("রিয়েল-টাইম লাইভ কথা বলতে অনুগ্রহ করে আপনার Gemini API Key যুক্ত করুন।");
        isCallActiveRef.current = false;
        return;
      }

      // 1. Audio Contexts Setup (Input: hardware rate resampled to 16kHz, Output: 24kHz)
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const inputAudioCtx = new AudioCtx();
      if (inputAudioCtx.state === 'suspended') {
        await inputAudioCtx.resume();
      }
      inputAudioCtxRef.current = inputAudioCtx;

      const outputAudioCtx = new AudioCtx();
      if (outputAudioCtx.state === 'suspended') {
        await outputAudioCtx.resume();
      }
      outputAudioCtxRef.current = outputAudioCtx;
      nextPlayTimeRef.current = outputAudioCtx.currentTime;

      // 2. Microphone Stream
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
      const topic = currentPattern?.speakingTask?.topic || "Daily English Conversation";
      const sampleEn = currentPattern?.sentenceBuilding?.[0]?.en || "I want to speak in English fluently.";
      const sampleBn = currentPattern?.sentenceBuilding?.[0]?.bn || "আমি সাবলীলভাবে ইংরেজিতে কথা বলতে চাই।";

      const systemInstruction = `You are "Air", an enthusiastic, ultra-natural spoken English partner and tutor on the "Dovashi" app.
CURRENT LESSON: Level #${pId} — Structure: "${struct}" (${meaning}).
TOPIC: "${topic}".
SAMPLE SENTENCE: "${sampleEn}" (${sampleBn}).

CONVERSATION PRINCIPLES:
1. Speak in an authentic, friendly voice just like a real phone call with an English coach.
2. Keep responses SHORT, spontaneous, and conversational (1-2 sentences maximum per turn) so the user has lots of speaking time.
3. You can speak primarily in natural English and warmly intersperse encouraging Bengali phrases ("দারুণ!", "খুব সুন্দর!", "বলো আমি শুনছি") just like a native bilingual friend.
4. If the user makes a grammar mistake with "${struct}", warmly give the correct sentence and ask them to try saying it.
5. Keep the conversation going by asking an easy question!`;

      // 3. Audio Chunk Playback Function (24kHz PCM from Gemini Live)
      const playAudioChunk = (base64Data: string) => {
        if (!isCallActiveRef.current || !outputAudioCtxRef.current) return;
        const ctx = outputAudioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        try {
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
          isProcessingTurnRef.current = false;
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
        } catch (e) {
          console.error("Audio playback error:", e);
        }
      };

      // 4. Connect to Gemini Multimodal Live API
      const ai = new GoogleGenAI({ apiKey: userApiKey.trim() });
      const session = await ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Aoede'
              }
            }
          },
          systemInstruction,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (msg: any) => {
            if (!isCallActiveRef.current) return;

            // Handle Incoming Live Voice Chunks
            if (msg.serverContent?.modelTurn?.parts) {
              for (const part of msg.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  playAudioChunk(part.inlineData.data);
                }
              }
            }

            // Real-time AI Output Subtitles
            if (msg.serverContent?.outputTranscription?.text) {
              const txt = msg.serverContent.outputTranscription.text;
              setCurrentSubtitle(prev => (prev.startsWith('Air:') ? `${prev} ${txt}` : `Air: ${txt}`));
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last && last.sender === 'tutor' && Date.now() - last.timestamp < 3500) {
                  return [...prev.slice(0, -1), { ...last, text: `${last.text} ${txt}`.trim() }];
                }
                return [...prev, { id: Date.now().toString(), sender: 'tutor', text: txt, timestamp: Date.now() }];
              });
            }

            // Real-time User Input Transcription
            if (msg.serverContent?.inputTranscription?.text) {
              const txt = msg.serverContent.inputTranscription.text;
              setCurrentSubtitle(`আপনি: "${txt}"`);
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last && last.sender === 'user' && Date.now() - last.timestamp < 3000) {
                  return [...prev.slice(0, -1), { ...last, text: `${last.text} ${txt}`.trim() }];
                }
                return [...prev, { id: Date.now().toString(), sender: 'user', text: txt, timestamp: Date.now() }];
              });
            }

            // User Interrupted the AI (Barge-in)
            if (msg.serverContent?.interrupted) {
              clearAudioQueue();
              setTutorState('listening');
            }

            // Turn Complete
            if (msg.serverContent?.turnComplete) {
              isProcessingTurnRef.current = false;
              if (activeSourcesRef.current.length === 0) {
                isAiSpeakingRef.current = false;
                setTutorState('listening');
                setAudioLevel(0);
              }
            }
          },
          onerror: (err: any) => {
            console.error("Live Session Error:", err);
            setErrorMessage(`ত্রুটি: ${err.message || 'কানেকশন সমস্যা হয়েছে'}`);
            isProcessingTurnRef.current = false;
          },
          onclose: () => {
            console.log("Live Session Closed");
            if (isCallActiveRef.current) {
              stopCall();
            }
          }
        }
      });

      liveSessionRef.current = session;
      setConnectionStatus('connected');
      setCallActive(true);
      setTutorState('speaking');
      setCurrentSubtitle("Air যুক্ত হয়েছে! কথা বলুন...");

      // 5. Initial Call Kickoff Greeting
      session.sendClientContent({
        turns: [{
          role: 'user',
          parts: [{
            text: `[SYSTEM: Start the call for Level ${pId} (${struct}). Say a cheerful, energetic 1-sentence welcome in your natural voice and ask how the user is doing or what they want to practice!]`
          }]
        }],
        turnComplete: true
      });

      // 6. Direct Continuous Microphone Stream with Smart VAD
      const actualSampleRate = inputAudioCtx.sampleRate || 16000;
      const bufferSize = actualSampleRate >= 44100 ? 4096 : 2048;
      const source = inputAudioCtx.createMediaStreamSource(stream);
      const processor = inputAudioCtx.createScriptProcessor(bufferSize, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!isCallActiveRef.current || !liveSessionRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);

        // Calculate RMS volume level
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);

        if (!isAiSpeakingRef.current && !isProcessingTurnRef.current) {
          const resampled16k = downsampleTo16kHz(inputData, actualSampleRate);

          if (rms > 0.018) {
            // User is actively speaking
            setUserSpeaking(true);
            hasSpokenVoiceRef.current = true;
            setAudioLevel(Math.min(1, rms * 6));
            setTutorState('listening');

            // Accumulate speech PCM audio
            speechPcmChunksRef.current.push(new Float32Array(resampled16k));

            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
          } else {
            // User paused / silence
            if (hasSpokenVoiceRef.current) {
              // Keep small trailing buffer
              speechPcmChunksRef.current.push(new Float32Array(resampled16k));

              if (!silenceTimerRef.current) {
                // When 750ms of silence passes after speaking, trigger the AI turn!
                silenceTimerRef.current = setTimeout(() => {
                  setUserSpeaking(false);
                  setAudioLevel(0);
                  sendSpokenAudioTurn();
                  silenceTimerRef.current = null;
                }, 750);
              }
            } else {
              setUserSpeaking(false);
              setAudioLevel(0);
            }
          }
        } else if (isAiSpeakingRef.current) {
          // Barge-in Interruption (if user speaks loudly over AI)
          if (rms > 0.07) {
            clearAudioQueue();
            setUserSpeaking(true);
            hasSpokenVoiceRef.current = true;
            speechPcmChunksRef.current = [new Float32Array(downsampleTo16kHz(inputData, actualSampleRate))];
            setTutorState('listening');
          }
        }
      };

      source.connect(processor);
      processor.connect(inputAudioCtx.destination);

    } catch (err: any) {
      console.error("Start call error:", err);
      setConnectionStatus('error');
      setErrorMessage(err.message || "মাইক্রোফোন চালু করা যায়নি। ব্রাউজার পারমিশন নিশ্চিত করুন।");
      stopCall();
    }
  }, [clearAudioQueue, onRequireApiKey, sendSpokenAudioTurn, stopCall]);

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
    sendSpokenAudioTurn,
  };
}
