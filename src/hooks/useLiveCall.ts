import { useState, useEffect, useRef, useCallback } from 'react';
import { Pattern } from '../types';
import { getUserApiKey } from '../utils/storage';
import { GoogleGenAI } from '@google/genai';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export function useLiveCall(onRequireApiKey?: () => void) {
  const [callActive, setCallActive] = useState(false);
  const [tutorState, setTutorState] = useState<'idle' | 'listening' | 'thinking' | 'speaking' | 'dancing'>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [errorMessage, setErrorMessage] = useState('');

  const isCallActiveRef = useRef<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chatHistoryRef = useRef<ChatMessage[]>([]);
  const currentPatternRef = useRef<Pattern | null>(null);
  const isGeneratingRef = useRef<boolean>(false);
  const lastSpokenTextRef = useRef<string>('');

  // Clean up all resources
  const stopCall = useCallback(() => {
    isCallActiveRef.current = false;
    isGeneratingRef.current = false;

    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }

    // Stop speech synthesis
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    // Stop audio animation
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // Clear silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Stop mic stream
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      } catch (e) {}
      mediaStreamRef.current = null;
    }

    // Close AudioContext
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close().catch(() => {});
      } catch (e) {}
      audioCtxRef.current = null;
    }

    setCallActive(false);
    setConnectionStatus('disconnected');
    setTutorState('idle');
    setAudioLevel(0);
    setUserSpeaking(false);
    setCurrentSubtitle('');
  }, []);

  // Text to Speech with high-quality animated feedback
  const speakText = useCallback((textToSpeak: string, onEndCallback?: () => void) => {
    if (!isCallActiveRef.current) return;

    // Clean any hangup tags from speech
    const cleanSpeech = textToSpeak.replace(/\[HANGUP\]/gi, '').trim();
    if (!cleanSpeech) {
      if (onEndCallback) onEndCallback();
      return;
    }

    setTutorState('speaking');
    setCurrentSubtitle(cleanSpeech);

    if (!('speechSynthesis' in window)) {
      // Fallback if SpeechSynthesis not available
      setTimeout(() => {
        if (isCallActiveRef.current && onEndCallback) onEndCallback();
      }, Math.min(6000, cleanSpeech.length * 70));
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    
    // Choose appropriate voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Female')));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    
    utterance.rate = 0.93;
    utterance.pitch = 1.05;

    // Simulate animated speech waves
    let waveInterval: NodeJS.Timeout | null = setInterval(() => {
      if (isCallActiveRef.current) {
        setAudioLevel(0.25 + Math.random() * 0.55);
      }
    }, 150);

    utterance.onend = () => {
      if (waveInterval) {
        clearInterval(waveInterval);
        waveInterval = null;
      }
      setAudioLevel(0);
      if (isCallActiveRef.current && onEndCallback) {
        onEndCallback();
      }
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis error:", e);
      if (waveInterval) {
        clearInterval(waveInterval);
        waveInterval = null;
      }
      setAudioLevel(0);
      if (isCallActiveRef.current && onEndCallback) {
        onEndCallback();
      }
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // Send user message to Gemini and speak response
  const sendToGemini = useCallback(async (userText: string) => {
    if (!isCallActiveRef.current || isGeneratingRef.current) return;
    isGeneratingRef.current = true;

    setTutorState('thinking');
    setCurrentSubtitle('Air শুনছে ও মূল্যায়ন করছে...');

    const userApiKey = getUserApiKey();
    if (!userApiKey) {
      if (onRequireApiKey) onRequireApiKey();
      setErrorMessage("Gemini API Key প্রয়োজন।");
      stopCall();
      return;
    }

    const pattern = currentPatternRef.current;
    const pId = pattern?.id || 1;
    const struct = pattern?.structure || "Subject + want(s) + to + Verb";
    const meaning = pattern?.bengaliMeaning || "কেউ কোনো কিছু করতে চায়";
    const sampleEn = pattern?.sentenceBuilding?.[0]?.en || "";
    const powerWord = pattern?.vocabularySpotlight?.powerWords?.[0]?.word || "";
    const topic = pattern?.speakingTask?.topic || "Daily Life";
    const grammarRule = pattern?.grammarCoverage?.[0]?.explanation || "";

    // Add user message to history
    chatHistoryRef.current.push({ role: 'user', text: userText });

    const systemPrompt = `You are "Air" (এয়ার), an energetic, friendly, and bilingual (Bengali + English) English speaking tutor in Dovashi (দোভাষী) app.
Current lesson:
- Level ${pId} Pattern: ${struct} (${meaning})
- Key vocabulary: ${powerWord}
- Grammar note: ${grammarRule}
- Context/Topic: ${topic}
- Sample Sentence: "${sampleEn}"

Goal:
1. Speak in a natural, warm, conversational tone (mix of cheerful Bengali guidance and clear English sentences).
2. Keep your response very concise (1-2 sentences maximum) so the voice flow is fast and conversational.
3. If the user made any grammatical mistakes with "${struct}", gently correct them in 1 sentence.
4. If they spoke well, give enthusiastic praise.
5. Always end with a short follow-up question prompting the user to speak or answer using the pattern.
6. If user wants to end the conversation (e.g. says "রাখছি", "আজকের মতো থাক", "বাই", "bye", "goodbye", "call disconnect"), say a warm goodbye and append [HANGUP] at the end.`;

    try {
      const ai = new GoogleGenAI({ apiKey: userApiKey });
      
      const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        ...chatHistoryRef.current.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }))
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents as any,
        config: {
          temperature: 0.7,
          maxOutputTokens: 120,
        }
      });

      const reply = response.text?.trim() || "Great job! Let's make another sentence!";
      chatHistoryRef.current.push({ role: 'model', text: reply });
      isGeneratingRef.current = false;

      const shouldHangup = reply.includes('[HANGUP]');

      speakText(reply, () => {
        if (shouldHangup) {
          setTimeout(() => {
            stopCall();
          }, 1500);
        } else {
          // Re-enable listening
          setTutorState('listening');
          startListening();
        }
      });

    } catch (err: any) {
      console.error("Gemini Live response error:", err);
      isGeneratingRef.current = false;
      const msg = err.message || "";
      if (msg.includes("API key not valid") || msg.includes("API_KEY_INVALID")) {
        setErrorMessage("ভুল API Key! অনুগ্রহ করে সঠিক Gemini API Key যুক্ত করুন।");
        if (onRequireApiKey) onRequireApiKey();
        stopCall();
      } else {
        // Friendly local fallback
        speakText(`Very good try! Now try saying: "${sampleEn}"`, () => {
          setTutorState('listening');
          startListening();
        });
      }
    }
  }, [onRequireApiKey, speakText, stopCall]);

  // Speech Recognition listener
  const startListening = useCallback(() => {
    if (!isCallActiveRef.current) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // If browser has no speech recognition, keep mic visualizer active and offer manual voice tap
      setTutorState('listening');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let accumulatedText = '';

      recognition.onstart = () => {
        if (isCallActiveRef.current) {
          setTutorState('listening');
        }
      };

      recognition.onresult = (event: any) => {
        if (!isCallActiveRef.current || isGeneratingRef.current) return;

        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            accumulatedText += ' ' + transcript;
          } else {
            interim += transcript;
          }
        }

        const currentText = (accumulatedText + ' ' + interim).trim();
        if (currentText && currentText !== lastSpokenTextRef.current) {
          lastSpokenTextRef.current = currentText;
          setUserSpeaking(true);
          setCurrentSubtitle(`আপনি: "${currentText}"`);

          // Reset silence timer - when user stops speaking for 1.6s, process with Gemini
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (isCallActiveRef.current && currentText.length > 1 && !isGeneratingRef.current) {
              setUserSpeaking(false);
              try { recognition.abort(); } catch (e) {}
              sendToGemini(currentText);
            }
          }, 1600);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage("মাইক্রোফোনের পারমিশন দিন যাতে Air আপনার কথা শুনতে পারে।");
        }
      };

      recognition.onend = () => {
        // Auto-restart recognition if call is still active and not speaking/thinking
        if (isCallActiveRef.current && !isGeneratingRef.current && tutorState === 'listening') {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn("Could not start speech recognition:", e);
    }
  }, [sendToGemini, tutorState]);

  // Start Live Speaking Session
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
      currentPatternRef.current = currentPattern || null;
      chatHistoryRef.current = [];
      lastSpokenTextRef.current = '';

      // Initialize Web Audio Context for microphone waveform
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      await audioCtx.resume();
      audioCtxRef.current = audioCtx;

      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      mediaStreamRef.current = stream;

      // Setup audio analyzer
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Monitor audio levels for the visualizer
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkAudioLevel = () => {
        if (!isCallActiveRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1, avg / 80);
        
        if (tutorState === 'listening') {
          setAudioLevel(normalized);
          setUserSpeaking(normalized > 0.12);
        }

        animFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };
      animFrameRef.current = requestAnimationFrame(checkAudioLevel);

      setConnectionStatus('connected');
      setCallActive(true);

      // Welcome prompt from Air
      const pId = currentPattern?.id || 1;
      const struct = currentPattern?.structure || "Subject + want(s) + to + Verb";
      const meaning = currentPattern?.bengaliMeaning || "কেউ কোনো কিছু করতে চায়";
      const sampleEn = currentPattern?.sentenceBuilding?.[0]?.en || "I want to speak English";
      const sampleBn = currentPattern?.sentenceBuilding?.[0]?.bn || "আমি ইংরেজি বলতে চাই";
      const question = currentPattern?.speakingTask?.promptQuestionBn || "আপনি বলুন তো?";

      const welcomeGreeting = `হ্যালো! আমি Air। আজ লেভেল ${pId}-এ আমরা শিখছি: "${meaning}" (${struct})। যেমন: "${sampleEn}" (${sampleBn})। ${question}`;

      speakText(welcomeGreeting, () => {
        setTutorState('listening');
        startListening();
      });

    } catch (err: any) {
      console.error("Start call error:", err);
      setConnectionStatus('error');
      setErrorMessage(err.message || "মাইক্রোফোন চালু করতে সমস্যা হয়েছে। ডিভাইসের পারমিশন চেক করুন।");
      stopCall();
    }
  }, [onRequireApiKey, speakText, startListening, stopCall, tutorState]);

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
  };
}
