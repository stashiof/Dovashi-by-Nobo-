import { useState, useEffect, useRef, useCallback } from 'react';
import { Pattern } from '../types';
import { getUserApiKey } from '../utils/storage';

// Helper: Float32Array (from 16kHz Mic) to 16-bit Linear PCM Base64
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

// Helper: 16-bit PCM Base64 to AudioBuffer at 24000Hz (Gemini Live Audio Output)
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

// Base Prompt for AI English Coach "Air"
const AIR_BASE_PROMPT = `You are "Air" — an extremely witty, hilarious, emotionally expressive, and sharp Bengali-medium AI English Speaking Coach for "The English Master Key: 300 Patterns Mastery Course" (by Fahim Miya).

🎯 AIR-এর আসল পরিচয় ও দৃষ্টিভঙ্গি (Ultra-Realistic, Witty & Humorous Bengali Coach):
- আপনি একজন বাস্তব রক্ত-মাংসের মজাদার বড় ভাই বা বন্ধু—যে হাসায়, খোঁচায়, মিষ্টি বকা দেয় এবং আড্ডার ছলে ইংরেজি শিখিয়ে ছাড়ে!
- **হাস্যরস ও বাস্তব সিচুয়েশনের ছোট গল্প (Humorous Daily Life Scenarios):**
  - কথা শুরুর সময় ও কথার মাঝে মাঝে ছোট ছোট মজার কাল্পনিক গল্প বলবেন (যেমন: রেস্তোরাঁয় খাবার অর্ডার, বাসে ট্রাভেল, চায়ের দোকানে আড্ডা, ইন্টারভিউ, বন্ধুদের খোঁচা দেওয়া)।
  - গল্প বলে সাথে সাথে বলবেন: "এবার এই অবস্থায় তুমি যদি প্যাটার্নটা দিয়ে বলতে চাও, তাহলে ইংরেজিতে কেমনে বলবা বলো দেখি!"
- **কোনো তাড়াহুড়ো নেই (Endless Natural Banter):** ৩-৪টি প্রশ্নের পরেই কখনোই "পরের লেভেলে যাই" বলে আড্ডা থামাবেন না। শিক্ষার্থী যতক্ষণ কথা বলবে, আপনি একের পর এক মজার সিচুয়েশন এনে আড্ডা চালিয়ে যাবেন।

🔥 ভাষা ব্যবহারের নিয়ম (Bilingual Bengali-First Method):
1. **মূল ভাষা হবে রসালো ও স্পষ্ট বাংলা।** আপনি বাংলায় পরিস্থিতি তৈরি করবেন, প্যাটার্ন সহজ করে বুঝিয়ে দেবেন এবং বাংলায় প্রশ্ন করে ইংরেজি বাক্য জানতে চাইবেন।
2. **শিক্ষার্থী ইংরেজিতে বা বাংলায় যা-ই বলবে, সাথে সাথে রেসপন্স দিন।**
3. **ঝটপট ও সংক্ষিপ্ত উত্তর (Quick & Snappy Response):** লম্বা কোনো বক্তৃতা দেবেন না। ১–২টি মজার ও প্রাণবন্ত বাক্য বলে সাথে সাথে শিক্ষার্থীর কোর্টে বল পাঠিয়ে দিন।

😂 AIR-এর প্রাণবন্ত মানবিক আবেগ (Emotions & Affectionate Strict Scolding):
1. **সঠিক উত্তর দিলে (আনন্দ ও তুমুল বাহবা):** দারুণ উল্লাস প্রকাশ করুন! ("আরে সাবাশ বাঘের বাচ্চা! এক চান্সে পুরা আগুন!", "ওয়াও! চমৎকার হয়েছে!", "ফাটিয়ে দিয়েছ বস!")।
2. **ভুল করলে (হাসি-মজা ও সুনির্দিষ্ট জায়গায় জ্ঞান দেওয়া):**
   - যেখানে ভুল হয়েছে ঠিক সেই জায়গাটা ধরুন: "আরে ধুর ভাই! 'I want go' বললে হবে? want-এর পর একটা 'to' দিতে হবে না? সঠিকটা হলো: 'I want to go'। এবার বলো তো দেখি!"
3. **বারবার একই ভুল করলে (কড়া ও মিষ্টি শাসন / বলদ বলে হাসানো):**
   - মনোযোগ ধরে রাখতে কড়া শাসন করুন: "আরে বলদ নাকি? একটু আগেই না তোমারে বুঝালাম! কান খোলো, চোখ খোলো! বলো: I want to..."
4. **সংশোধন নিশ্চিত করা:** ভুল হলে তাকে দিয়ে সঠিক বাক্যটা আবারও মুখ দিয়ে বলিয়ে নেবেন।

📞 কল কেটে দেওয়ার নিয়ম (Hanging Up the Call):
- শিক্ষার্থী যখনই মুখে বলবে: "আজকের মতো থাক", "কল কেটে দাও", "রাখছি", "bye Air", "পরে কথা বলব", "call disconnect করো" — তখন আপনি সাথে সাথে 'hangUpCall' টুল কল করবেন এবং মিষ্টি বিদায় জানিয়ে ফোন কেটে দেবেন!`;

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
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const subtitleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSetupCompleteRef = useRef<boolean>(false);

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
    isSetupCompleteRef.current = false;

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

  // Start live voice call directly to Google Gemini Multimodal Live WebSocket
  const startCall = useCallback(async (currentPattern?: Pattern) => {
    const userApiKey = getUserApiKey();
    if (!userApiKey) {
      if (onRequireApiKey) {
        onRequireApiKey();
      }
      setErrorMessage("কথা বলতে অনুগ্রহ করে আগে আপনার Gemini API Key যোগ করুন।");
      setCurrentSubtitle("🔑 Gemini API Key প্রয়োজন! উপরের বাটনে ক্লিক করে ফ্রিতে কি যোগ করুন।");
      return;
    }

    try {
      setConnectionStatus('connecting');
      setErrorMessage('');
      setCurrentSubtitle('Connecting to Gemini AI English Coach...');

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

      // 3. Request Microphone Access
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

      // Highpass filter to eliminate background fan hum / AC rumble (< 95Hz)
      const highpassFilter = inputCtx.createBiquadFilter();
      highpassFilter.type = 'highpass';
      highpassFilter.frequency.setValueAtTime(95, inputCtx.currentTime);

      source.connect(highpassFilter);
      highpassFilter.connect(inAnalyser);

      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      highpassFilter.connect(processor);
      processor.connect(inputCtx.destination);

      // 4. Build Dynamic System Instructions with Pattern Context
      const patternId = currentPattern?.id || 1;
      const patternStructure = currentPattern?.structure || "Subject + want(s) + to + Verb";
      const patternMeaning = currentPattern?.bengaliMeaning || "কেউ কোনো কিছু করতে চায়";
      const topic = currentPattern?.speakingTask?.topic || "Daily Life";
      const sampleEn1 = currentPattern?.sentenceBuilding?.[0]?.en || "I want to learn English";
      const sampleBn1 = currentPattern?.sentenceBuilding?.[0]?.bn || "আমি ইংরেজি শিখতে চাই";
      const grammarNote = currentPattern?.grammarCoverage?.[0]?.explanation || "Right forms of verb & accurate auxiliary structure";
      const powerWord = currentPattern?.vocabularySpotlight?.powerWords?.[0]?.word || "";

      const dynamicSystemInstruction = `${AIR_BASE_PROMPT}

CURRENT PATTERN PRACTICE SESSION DETAILS:
- Level / Pattern ID: Level ${patternId}
- Structure (ফর্মুলা): ${patternStructure}
- Bengali Meaning (প্যাটার্নের অর্থ): ${patternMeaning}
- Topic: ${topic}
- Core Grammar Rule to Enforce: ${grammarNote}
- Example Target Sentence: "${sampleEn1}" (${sampleBn1})
- Suggested Vocabulary: ${powerWord ? powerWord : "relevant daily words"}

AIR-এর বাস্তবমুখী কথপোকথন ও আড্ডার নিয়মাবলী:
1. **শুরুতে পরিচয় ও স্পষ্ট বাংলায় বুঝিয়ে দেওয়া:**
   - প্রাণবন্ত গলায় বলুন: "স্বাগতম লেভেল ${patternId}-এ! আজকে আমাদের প্যাটার্ন হলো: **${patternStructure}**—মানে '${patternMeaning}'। যেমন: '${sampleBn1}' এর ইংরেজি হলো '${sampleEn1}'।"
   - এরপরই একটি বাস্তব জীবনের পরিস্থিতির ছোট গল্প বানিয়ে টেস্ট করুন: "যেমন ধরুন আপনি বন্ধুদের সাথে আড্ডায় বসেছেন, আর বলতে চান—'আমি এক কাপ চা খেতে চাই', তাহলে ইংরেজিতে কীভাবে বলবেন?"
2. **বাস্তব জীবনের ছোট ছোট গল্প ও সিচুয়েশন তৈরি (Storytelling & Scenarios):**
   - রোবটের মতো একটানা শুধু প্রশ্ন করবেন না! কথার ফাঁকে ফাঁকে মজার ছোট ছোট গল্প বা সিচুয়েশন বানিয়ে বলবেন।
   - শিক্ষার্থীর প্রতিটি উত্তরের সাথে এক লাইনের স্বাভাবিক মানবিক প্রতিক্রিয়া দেখাবেন।
3. **ভুল করলে সাথে সাথে স্পটে বুঝিয়ে দেওয়া ও শাসন:**
   - যদি ভুল করে: সাথে সাথে মজা করে ভুলটা ধরে শুদ্ধ করে বুঝিয়ে দিন এবং তাকে দিয়ে শুদ্ধ বাক্যটা বলিয়ে নিন।
4. **কল কেটে দেওয়া (Hang Up):**
   - যখন শিক্ষার্থী মুখে বলবে "আজকের মতো থাক", "কল কেটে দাও", "রাখছি", "bye Air" — তখন আপনি সাথে সাথে 'hangUpCall' টুল কল করবেন এবং মিষ্টি বিদায় জানিয়ে ফোন কেটে দেবেন!`;

      // 5. Connect DIRECTLY to Google Gemini Multimodal Live WebSocket
      const geminiLiveWsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(userApiKey)}`;
      const ws = new WebSocket(geminiLiveWsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Send Gemini Multimodal Live Setup message
        const setupMessage = {
          setup: {
            model: "models/gemini-2.0-flash-exp",
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
              parts: [
                { text: dynamicSystemInstruction }
              ]
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
      };

      // Stream mic audio over WebSocket (16-bit PCM 16kHz)
      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN || !isSetupCompleteRef.current) return;

        const inputData = e.inputBuffer.getChannelData(0);
        
        // Calculate RMS for UI speaking indicator
        let sumSquares = 0;
        for (let i = 0; i < inputData.length; i++) {
          sumSquares += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sumSquares / inputData.length);
        setUserSpeaking(rms > 0.008);

        // Send PCM audio stream to Gemini Live
        const base64Audio = floatTo16BitPCMBase64(inputData);
        const realtimeInputMessage = {
          realtimeInput: {
            mediaChunks: [
              {
                mimeType: "audio/pcm;rate=16000",
                data: base64Audio
              }
            ]
          }
        };

        ws.send(JSON.stringify(realtimeInputMessage));
      };

      // Handle incoming messages from Gemini Live API
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          // 1. Initial Setup Complete
          if (msg.setupComplete !== undefined) {
            isSetupCompleteRef.current = true;
            setCallActive(true);
            setConnectionStatus('connected');
            setTutorState('listening');
            setCurrentSubtitle(`Connected to Coach! Let's practice Level ${patternId}.`);
            return;
          }

          // 2. Server Content (Audio, Subtitles, Interruption)
          if (msg.serverContent) {
            // User interrupted AI while speaking
            if (msg.serverContent.interrupted) {
              stopAllActiveAudio();
            }

            // Model turn parts (Audio PCM chunks & Text transcripts)
            if (msg.serverContent.modelTurn?.parts) {
              for (const part of msg.serverContent.modelTurn.parts) {
                // Text subtitles
                if (part.text) {
                  setCurrentSubtitle(part.text);
                  if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
                  subtitleTimeoutRef.current = setTimeout(() => {
                    setCurrentSubtitle('');
                  }, 12000);
                }

                // Audio PCM chunks (24000Hz)
                if (part.inlineData?.data && outputAudioCtxRef.current) {
                  const ctx = outputAudioCtxRef.current;
                  if (ctx.state === 'suspended') {
                    ctx.resume();
                  }

                  const audioBuffer = base64ToAudioBuffer(part.inlineData.data, ctx);
                  const sourceNode = ctx.createBufferSource();
                  sourceNode.buffer = audioBuffer;

                  if (outputAnalyserRef.current) {
                    sourceNode.connect(outputAnalyserRef.current);
                    outputAnalyserRef.current.connect(ctx.destination);
                  } else {
                    sourceNode.connect(ctx.destination);
                  }

                  const now = ctx.currentTime;
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
              }
            }

            // Turn complete
            if (msg.serverContent.turnComplete) {
              if (activeSourcesRef.current.length === 0) {
                setTutorState('listening');
              }
            }
          }

          // 3. Tool Call Handling (e.g. hangUpCall)
          if (msg.toolCall?.functionCalls) {
            for (const call of msg.toolCall.functionCalls) {
              if (call.name === "hangUpCall") {
                const farewell = (call.args as any)?.farewellReason || "আচ্ছা, ঠিক আছে! আজকের মতো রাখছি। খুব ভালো প্র্যাকটিস হলো!";
                setCurrentSubtitle(`📞 ${farewell}`);
                setTimeout(() => {
                  stopCall();
                }, 2600);
                return;
              }
            }
          }

        } catch (err) {
          console.error("Error handling Gemini Live message:", err);
        }
      };

      ws.onerror = (e: any) => {
        console.error("Gemini Live WebSocket error:", e);
        setConnectionStatus('error');
        setErrorMessage("লাইভ সেশন কানেক্ট করা যায়নি। আপনার Gemini API Key এবং ইন্টারনেট চেক করুন।");
      };

      ws.onclose = (e) => {
        console.log("Gemini Live WebSocket closed:", e.code, e.reason);
        if (e.code === 1008 || e.code === 400 || (e.reason && e.reason.includes("API key"))) {
          setErrorMessage("ভুল বা মেয়াদোত্তীর্ণ Gemini API Key। অনুগ্রহ করে সঠিক কি যুক্ত করুন।");
          if (onRequireApiKey) onRequireApiKey();
        }
        setCallActive(false);
        setConnectionStatus('disconnected');
        setTutorState('idle');
      };

      startAudioMonitoring();

    } catch (err: any) {
      console.error("Failed to start live session:", err);
      setConnectionStatus('error');
      setErrorMessage(err.message || "মাইক্রোফোন অথবা সংযোগ চালু করতে সমস্যা হয়েছে।");
      stopCall();
    }
  }, [startAudioMonitoring, stopAllActiveAudio, stopCall, onRequireApiKey]);

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
