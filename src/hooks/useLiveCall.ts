import { useState, useEffect, useRef, useCallback } from 'react';
import { Pattern } from '../types';
import { getUserApiKey } from '../utils/storage';
import { buildPatternLiveInstruction } from '../utils/aiPrompts';

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
      const sampleEn = currentPattern?.sentenceBuilding?.[0]?.en || "I want to learn English";
      const sampleBn = currentPattern?.sentenceBuilding?.[0]?.bn || "আমি ইংরেজি শিখতে চাই";

      const systemInstruction = buildPatternLiveInstruction(currentPattern);

      // Connect directly to Google's official Gemini Live Multimodal WebSocket Endpoint
      // This works 100% on both Web and Android APK without requiring a Node server on the phone!
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(userApiKey.trim())}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isCallActiveRef.current) return;
        setConnectionStatus('connected');
        setCallActive(true);
        setTutorState('thinking');
        setCurrentSubtitle("সংযোগ হয়েছে! Air রেডি হচ্ছে...");

        // 1. Send Setup Handshake to Gemini Live
        const setupMessage = {
          setup: {
            model: "models/gemini-2.5-flash-native-audio-latest",
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: "Puck"
                  }
                }
              }
            },
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            },
            tools: [
              {
                functionDeclarations: [
                  {
                    name: "hangUpCall",
                    description: "Hang up / disconnect the live audio call immediately when the user explicitly requests to stop practicing, hang up, or says goodbye (e.g. 'কল কেটে দাও', 'আচ্ছা রাখছি', 'আজকের মতো থাক', 'bye Air', 'পরে কথা বলব', 'hang up').",
                    parameters: {
                      type: "OBJECT",
                      properties: {
                        farewellReason: {
                          type: "STRING",
                          description: "A short, friendly, witty goodbye phrase in Bengali before hanging up."
                        }
                      },
                      required: ["farewellReason"]
                    }
                  }
                ]
              }
            ]
          }
        };

        ws.send(JSON.stringify(setupMessage));

        // 2. Start Microphone Audio Capture
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
            
            // Standard Gemini Live realtimeInput format
            const audioPayload = {
              realtimeInput: {
                mediaChunks: [
                  {
                    mimeType: "audio/pcm;rate=16000",
                    data: base64Audio
                  }
                ]
              }
            };
            ws.send(JSON.stringify(audioPayload));
          }
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);
      };

      ws.onmessage = (event) => {
        if (!isCallActiveRef.current) return;
        try {
          const msg = JSON.parse(event.data);

          // A. Setup Complete -> Send Initial Bengali Greeting Trigger
          if (msg.setupComplete) {
            setTutorState('speaking');
            setCurrentSubtitle("Air কথা বলা শুরু করছে...");

            const greetingTrigger = {
              clientContent: {
                turns: [
                  {
                    role: "user",
                    parts: [
                      {
                        text: `[SYSTEM TRIGGER: The call has just connected. Speak in natural energetic BENGALI with lively storytelling tone.] স্বাগতম জানিয়ে সহজ বাংলায় বুঝিয়ে বলো: "স্বাগতম লেভেল ${pId}-এ! আজকে আমাদের প্যাটার্ন হলো: ${struct} — মানে '${meaning}'। যেমন: '${sampleBn}' = '${sampleEn}'। এবার ধরো তুমি বন্ধুদের সাথে আড্ডায় বসেছ, আর বলতে চাও 'আমি চা খেতে চাই'—এর ইংরেজি কী হবে বলো তো?"`
                      }
                    ]
                  }
                ],
                turnComplete: true
              }
            };
            ws.send(JSON.stringify(greetingTrigger));
            return;
          }

          // B. Tool Call (Hang Up function)
          if (msg.toolCall?.functionCalls) {
            for (const call of msg.toolCall.functionCalls) {
              if (call.name === "hangUpCall") {
                const farewell = (call.args as any)?.farewellReason || "আচ্ছা, ঠিক আছে! আজকের মতো রাখছি। খুব ভালো প্র্যাকটিস হলো!";
                setCurrentSubtitle(farewell);
                setTutorState('speaking');

                // Send tool response
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({
                    toolResponse: {
                      functionResponses: [
                        {
                          id: call.id,
                          name: call.name,
                          response: { output: "Call disconnected." }
                        }
                      ]
                    }
                  }));
                }

                setTimeout(() => {
                  stopCall();
                }, 2500);
              }
            }
          }

          // C. Interruption Notification
          if (msg.serverContent?.interrupted) {
            clearAudioQueue();
            setTutorState('listening');
            return;
          }

          // D. Live Audio Output & Subtitle
          const parts = msg.serverContent?.modelTurn?.parts;
          if (parts && parts.length > 0) {
            for (const part of parts) {
              if (part.text) {
                setCurrentSubtitle(part.text);
                setTutorState('speaking');
                if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
                subtitleTimeoutRef.current = setTimeout(() => {
                  if (isCallActiveRef.current) {
                    setTutorState('listening');
                  }
                }, 5000);
              }

              if (part.inlineData?.data && outputAudioCtxRef.current) {
                const outCtx = outputAudioCtxRef.current;
                const audioBuf = base64ToAudioBuffer(part.inlineData.data, outCtx, 24000);
                
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
            }
          }

          // E. Realtime Transcription Text
          if (msg.serverContent?.outputTranscription?.text) {
            setCurrentSubtitle(msg.serverContent.outputTranscription.text);
            setTutorState('speaking');
          }

        } catch (e) {
          console.error("Failed to parse incoming Gemini Live message:", e);
        }
      };

      ws.onerror = (err) => {
        console.error("Gemini Live WebSocket error:", err);
        setConnectionStatus('error');
        setErrorMessage("লাইভ অডিও সংযোগে সমস্যা হয়েছে। অনুগ্রহ করে ইন্টারনেট ও Gemini API Key চেক করুন।");
      };

      ws.onclose = (e) => {
        console.log("Gemini Live WebSocket closed:", e.code, e.reason);
        if (isCallActiveRef.current) {
          if (e.code === 1008) {
            setErrorMessage("Gemini API Key সঠিক নয় বা পারমিশন নেই। অনুগ্রহ করে গুগল এআই স্টুডিও থেকে নতুন কি নিন।");
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
    const messagePayload = {
      clientContent: {
        turns: [
          {
            role: "user",
            parts: [{ text }]
          }
        ],
        turnComplete: true
      }
    };
    wsRef.current.send(JSON.stringify(messagePayload));
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


