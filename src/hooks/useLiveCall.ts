import { useState, useEffect, useRef, useCallback } from 'react';
import { Pattern } from '../types';
import { getUserApiKey } from '../utils/storage';
import { GoogleGenAI } from '@google/genai';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// Global reference to prevent Android Chrome SpeechSynthesis garbage collection bug
let activeUtterance: SpeechSynthesisUtterance | null = null;

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
  const speechSafetyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const waveIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
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
    activeUtterance = null;

    if (waveIntervalRef.current) {
      clearInterval(waveIntervalRef.current);
      waveIntervalRef.current = null;
    }

    if (speechSafetyTimerRef.current) {
      clearTimeout(speechSafetyTimerRef.current);
      speechSafetyTimerRef.current = null;
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Stop audio animation
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
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

  // Text to Speech with Android fix & safety watchdog
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

    let finished = false;
    const finishSpeech = () => {
      if (finished) return;
      finished = true;
      if (speechSafetyTimerRef.current) {
        clearTimeout(speechSafetyTimerRef.current);
        speechSafetyTimerRef.current = null;
      }
      if (waveIntervalRef.current) {
        clearInterval(waveIntervalRef.current);
        waveIntervalRef.current = null;
      }
      setAudioLevel(0);
      activeUtterance = null;
      if (isCallActiveRef.current && onEndCallback) {
        onEndCallback();
      }
    };

    // Calculate approximate speaking duration for safety fallback (average 15 chars per sec)
    const expectedDurationMs = Math.max(2500, Math.min(15000, cleanSpeech.length * 85));
    if (speechSafetyTimerRef.current) clearTimeout(speechSafetyTimerRef.current);
    speechSafetyTimerRef.current = setTimeout(() => {
      finishSpeech();
    }, expectedDurationMs + 1000);

    if (!('speechSynthesis' in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(cleanSpeech);
      activeUtterance = utterance; // Prevent garbage collection bug
      
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Female')));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      
      utterance.rate = 0.95;
      utterance.pitch = 1.05;

      // Animate waveform during voice
      if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
      waveIntervalRef.current = setInterval(() => {
        if (isCallActiveRef.current) {
          setAudioLevel(0.3 + Math.random() * 0.5);
        }
      }, 150);

      utterance.onend = () => {
        finishSpeech();
      };

      utterance.onerror = (e) => {
        console.warn("Speech synthesis error, finishing speech safely:", e);
        finishSpeech();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis exception:", e);
      finishSpeech();
    }
  }, []);

  // Send user message to Gemini and speak response
  const sendToGemini = useCallback(async (userText: string) => {
    if (!isCallActiveRef.current || isGeneratingRef.current) return;
    isGeneratingRef.current = true;

    setTutorState('thinking');
    setCurrentSubtitle(`আপনি: "${userText}" \n\nAir ভাবছে ও উত্তর তৈরি করছে...`);

    const userApiKey = getUserApiKey();
    if (!userApiKey) {
      if (onRequireApiKey) onRequireApiKey();
      setErrorMessage("Gemini API Key প্রয়োজন।");
      isGeneratingRef.current = false;
      return;
    }

    const pattern = currentPatternRef.current;
    const pId = pattern?.id || 1;
    const struct = pattern?.structure || "Subject + want(s) + to + Verb";
    const meaning = pattern?.bengaliMeaning || "কেউ কোনো কিছু করতে চায়";
    const sampleEn = pattern?.sentenceBuilding?.[0]?.en || "I want to learn English";
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
2. Keep your response very concise (1-2 sentences maximum) so the conversation is lively and engaging.
3. If the user made any grammatical mistakes regarding "${struct}", gently explain the fix in 1 simple sentence.
4. If they spoke well, give energetic praise!
5. Always end with a short follow-up question or sentence prompt for the user.
6. If user wants to end the conversation (e.g. says "রাখছি", "আজকের মতো থাক", "বাই", "bye", "goodbye"), say a warm goodbye and append [HANGUP] at the end.`;

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
          maxOutputTokens: 140,
        }
      });

      const reply = response.text?.trim() || `Great job! Now try saying: "${sampleEn}"`;
      chatHistoryRef.current.push({ role: 'model', text: reply });
      isGeneratingRef.current = false;

      const shouldHangup = reply.includes('[HANGUP]');

      speakText(reply, () => {
        if (shouldHangup) {
          setTimeout(() => {
            stopCall();
          }, 1500);
        } else {
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
      } else {
        speakText(`Very good try! Now let's try this: "${sampleEn}". Can you say it?`, () => {
          setTutorState('listening');
          startListening();
        });
      }
    }
  }, [onRequireApiKey, speakText, stopCall]);

  // Speech Recognition listener
  const startListening = useCallback(() => {
    if (!isCallActiveRef.current || isGeneratingRef.current) return;

    setTutorState('listening');

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    try {
      if (recognitionRef.current) {
        try { 
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.abort(); 
        } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let accumulatedText = '';

      recognition.onstart = () => {
        if (isCallActiveRef.current && !isGeneratingRef.current) {
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
          setCurrentSubtitle(`আপনি বলছেন: "${currentText}"`);

          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (isCallActiveRef.current && currentText.length > 0 && !isGeneratingRef.current) {
              setUserSpeaking(false);
              try { 
                recognition.onend = null;
                recognition.abort(); 
              } catch (e) {}
              sendToGemini(currentText);
            }
          }, 1500);
        }
      };

      recognition.onerror = (event: any) => {
        // Suppress benign errors like no-speech or aborted
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn("Speech recognition notice:", event.error);
        }
      };

      recognition.onend = () => {
        if (isCallActiveRef.current && !isGeneratingRef.current && tutorState === 'listening') {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn("Speech recognition initialization notice:", e);
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
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        await audioCtx.resume();
        audioCtxRef.current = audioCtx;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
        mediaStreamRef.current = stream;

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkAudioLevel = () => {
          if (!isCallActiveRef.current) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalized = Math.min(1, avg / 70);
          
          if (tutorState === 'listening') {
            setAudioLevel(normalized);
            setUserSpeaking(normalized > 0.12);
          }

          animFrameRef.current = requestAnimationFrame(checkAudioLevel);
        };
        animFrameRef.current = requestAnimationFrame(checkAudioLevel);
      } catch (micErr) {
        console.warn("Audio Context / Mic visualizer warning (call will still proceed):", micErr);
      }

      setConnectionStatus('connected');
      setCallActive(true);

      // Welcome prompt from Air
      const pId = currentPattern?.id || 1;
      const struct = currentPattern?.structure || "Subject + want(s) + to + Verb";
      const meaning = currentPattern?.bengaliMeaning || "কেউ কোনো কিছু করতে চায়";
      const sampleEn = currentPattern?.sentenceBuilding?.[0]?.en || "I want to speak English";
      const question = currentPattern?.speakingTask?.promptQuestionBn || "আপনি বলুন তো, আপনি কী করতে চান?";

      const welcomeGreeting = `Hello! I am Air. Today we are practicing: "${meaning}" (${struct}). For example: "${sampleEn}". ${question}`;

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

  // Quick manual trigger for user text or suggested answers
  const sendManualMessage = useCallback((text: string) => {
    if (!callActive) {
      if (currentPatternRef.current) {
        startCall(currentPatternRef.current).then(() => {
          setTimeout(() => sendToGemini(text), 1000);
        });
      }
      return;
    }
    if (recognitionRef.current) {
      try { 
        recognitionRef.current.onend = null;
        recognitionRef.current.abort(); 
      } catch (e) {}
    }
    sendToGemini(text);
  }, [callActive, sendToGemini, startCall]);

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
