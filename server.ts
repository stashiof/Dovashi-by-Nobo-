import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality, LiveServerMessage, Type } from "@google/genai";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import url from "url";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to get GoogleGenAI client for a custom user API key or fallback to environment variable
function getGenAIClient(customApiKey?: string): GoogleGenAI | null {
  const key = (customApiKey && customApiKey.trim()) ? customApiKey.trim() : process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
    return null;
  }
}

// Global server instance (if env key exists)
const defaultAi = getGenAIClient();

// Base System Instruction for Air - AI English Conversation Partner & Practice Coach (বাস্তব বাংলা মাধ্যমের সুপার কোচ)
const AIR_BASE_INSTRUCTION = `You are "Air" — an extremely witty, hilarious, emotionally expressive, and incredibly sharp Bengali-medium AI English Practice Partner & Coach for "The English Master Key: 300 Patterns Mastery Course" (by Fahim Miya).

🎯 AIR-এর আসল পরিচয় ও দৃষ্টিভঙ্গি (Ultra-Realistic, Witty & Humorous Bengali Coach):
- আপনি কোনো নিরস রোবট বা পাঠ্যবইয়ের মাস্টার নন! আপনি একজন বাস্তব রক্ত-মাংসের মজাদার বন্ধু—যে হাসায়, খোঁচায়, মিষ্টি বকা দেয় এবং আড্ডার ছলে ইংরেজি শিখিয়ে ছাড়ে!
- **হাস্যরস ও বাস্তব সিচুয়েশনের ছোট গল্প (Humorous Daily Life Storytelling):**
  - কথা শুরুর সময় ও কথার মাঝে মাঝে ছোট ছোট মজার কাল্পনিক গল্প বলবেন (যেমন: "ধরো তুমি রেস্তোরাঁয় প্রেমিকার সাথে খেতে গেছ, কিন্তু পকেটে টাকা কম!", "চায়ের দোকানে মামার সাথে তর্ক লাগাইছ", "বন্ধুর কাছে টাকা ধার চাইবা", "বস যখন ঝাড়ি দিতে আসছে তখন কীভাবে বাঁচবা")।
  - গল্প বলে সাথে সাথে বলবেন: "এবার এই অবস্থায় তুমি যদি প্যাটার্নটা দিয়ে বলতে চাও, তাহলে ইংরেজিতে কেমনে বলবা বলো দেখি!"
- **কোনো তাড়াহুড়ো নেই (Endless Natural Banter):** ৩-৪টি প্রশ্নের পরেই কখনোই "পরের লেভেলে যাই" বলে আড্ডা থামাবেন না। শিক্ষার্থী যতক্ষণ কথা বলতে চায়, আপনি একের পর এক মজার সিচুয়েশন এনে আড্ডা চালিয়ে যাবেন।

🔥 ভাষা ব্যবহারের নিয়ম (Bilingual Bengali-First Method):
1. **মূল ভাষা হবে রসালো ও স্পষ্ট বাংলা।** আপনি বাংলায় পরিস্থিতি তৈরি করবেন, প্যাটার্ন সহজ করে বুঝিয়ে দেবেন এবং বাংলায় প্রশ্ন করে ইংরেজি বাক্য জানতে চাইবেন।
2. **শিক্ষার্থী ইংরেজিতে বা বাংলায় যা-ই বলবে, সাথে সাথে রেসপন্স দিন।** শিক্ষার্থী কোনো কথা বলা শেষ করা মাত্রই তাত্ক্ষণিক উত্তর দেবেন। কোনো দীর্ঘ বিরতি বা অপ্রয়োজনীয় নীরবতা রাখা যাবে না।
3. **ঝটপট ও সংক্ষিপ্ত উত্তর (Quick & Snappy Response):** লম্বা কোনো ভাষণ দেবেন না। ১–২টি মজার ও প্রাণবন্ত বাক্য বলে সাথে সাথে শিক্ষার্থীর কোর্টে বল পাঠিয়ে দিন।

😂😡 AIR-এর প্রাণবন্ত মানবিক আবেগ (Emotions & Affectionate Strict Scolding):
1. **সঠিক উত্তর দিলে (আনন্দ ও তুমুল বাহবা):** দারুণ উল্লাস প্রকাশ করুন! ("আরে সাবাশ বাঘের বাচ্চা! এক চান্সে পুরা আগুন!", "ওয়াও! তোমার মুখের ইংরেজি শুনে তো লন্ডনের মানুষও লজ্জা পাবে!", "ফাটিয়ে দিয়েছ বস!")।
2. **ছোটখাটো ভুল করলে (হাসি-মজা ও সুনির্দিষ্ট জায়গায় জ্ঞান দেওয়া):**
   - যেখানে ভুল হয়েছে ঠিক সেই জায়গাটা ধরুন: "আরে ধুর ভাই! 'I want go' বললে হবে? want-এর পর একটা 'to' দিতে হবে না? সঠিকটা হলো: 'I want to go'। এবার বলো তো দেখি!"
3. **বারবার একই ভুল করলে (কড়া ও মিষ্টি শাসন / বলদ বলে হাসানো):**
   - যাতে মনোযোগ আকর্ষণ হয়, খাঁটি বড় ভাইয়ের মতো কড়া শাসন করুন:
     - "আরে বলদ নাকি? একটু আগেই না তোমারে বুঝালাম 'to'-এর পর verb-এর base form হয়! কান খোলো, চোখ খোলো! বলো: I want to..."
     - "পাগল নাকি ভাই? সোজা জিনিসটা প্যাঁচাও ক্যান? সোজা করে বলো!"
     - "খবরদার! আবার ভুল বললে কিন্তু খবর আছে! ঠিক করে বলো!"
4. **সংশোধন নিশ্চিত করা:** ভুল হলে তাকে দিয়ে সঠিক বাক্যটা আবারও মুখ দিয়ে বলিয়ে নেবেন।

📞 কল কেটে দেওয়ার নিয়ম (Hanging Up the Call):
- শিক্ষার্থী যখনই মুখে বলবে: "আজকের মতো থাক", "কল কেটে দাও", "রাখছি", "bye Air", "পরে কথা বলব", "call disconnect করো" — তখন আপনি সাথে সাথে 'hangUpCall' টুল কল করবেন এবং মিষ্টি বা রসিক এক লাইনের বিদায় জানিয়ে কল কেটে দেবেন!`;

const BASE_SYSTEM_INSTRUCTION = AIR_BASE_INSTRUCTION;

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", hasServerApiKey: !!process.env.GEMINI_API_KEY });
});

// Verify if a user's API Key is valid
app.post("/api/verify-key", async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || !apiKey.trim()) {
    return res.status(400).json({ valid: false, error: "API Key খালি রাখা যাবে না।" });
  }

  try {
    const client = getGenAIClient(apiKey);
    if (!client) {
      return res.status(400).json({ valid: false, error: "ইনভ্যালিড API Key ফরম্যাট।" });
    }

    // Light test call with gemini-3.7-flash
    const testResponse = await client.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [{ role: "user", parts: [{ text: "ping" }] }],
      config: {
        temperature: 0.1,
      }
    });

    if (testResponse && testResponse.text) {
      return res.json({ valid: true });
    } else {
      return res.json({ valid: true });
    }
  } catch (error: any) {
    console.error("API Key Verification Error:", error);
    const msg = error.message || "";
    if (msg.includes("API key not valid") || msg.includes("API_KEY_INVALID")) {
      return res.status(400).json({ valid: false, error: "ভুল API Key! অনুগ্রহ করে নিশ্চিত করুন কি-টি গুগল এআই স্টুডিও থেকে নিয়েছেন।" });
    }
    return res.status(400).json({ valid: false, error: error.message || "API Key যাচাই করতে সমস্যা হয়েছে।" });
  }
});

// Evaluate a student's practice sentence with AI
app.post("/api/evaluate-sentence", async (req, res) => {
  const userApiKey = (req.headers["x-gemini-api-key"] as string) || req.body.apiKey;
  const client = getGenAIClient(userApiKey);

  if (!client) {
    return res.status(401).json({ 
      error: "AI ফিচার ব্যবহারের জন্য অনুগ্রহ করে আপনার নিজস্ব Gemini API Key যোগ করুন।", 
      requireApiKey: true 
    });
  }

  try {
    const { patternId, structure, promptBn, userSentence } = req.body;

    const prompt = `You are a master English teacher evaluating a student's sentence practice in 'The English Master Key' course.
Pattern ID: ${patternId || 1}
Target Pattern Structure: ${structure}
Target Bengali Meaning: ${promptBn}
Student's English Sentence: "${userSentence}"

Evaluate the sentence and reply strictly in valid JSON format:
{
  "isCorrect": boolean,
  "accuracyScore": number (0 to 100),
  "feedbackBn": "Short encouraging feedback in Bengali explaining whether the pattern was used correctly, any grammar mistakes, or tips",
  "suggestedVersion": "Polished, natural English version of the sentence",
  "alternativePhrases": ["alternative 1", "alternative 2"]
}`;

    const response = await client.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Evaluation API Error:", error);
    res.status(500).json({ error: error.message || "Failed to evaluate sentence" });
  }
});

// Fallback HTTP chat endpoint for text tutoring
app.post("/api/chat", async (req, res) => {
  const userApiKey = (req.headers["x-gemini-api-key"] as string) || req.body.apiKey;
  const client = getGenAIClient(userApiKey);

  if (!client) {
    return res.status(401).json({ 
      error: "AI চ্যাট ব্যবহারের জন্য অনুগ্রহ করে আপনার নিজস্ব Gemini API Key যোগ করুন।", 
      requireApiKey: true 
    });
  }
  
  try {
    const { message, history, patternContext } = req.body;
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((turn: any) => {
        contents.push({ role: turn.role, parts: [{ text: turn.text }] });
      });
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    let systemInstruction = BASE_SYSTEM_INSTRUCTION;
    if (patternContext) {
      systemInstruction += `\n\nACTIVE PATTERN DRILL:
Level / Pattern: ${patternContext.patternNumber} - ${patternContext.structure}
Meaning: ${patternContext.bengaliMeaning}
Focus on helping the student practice and master this specific pattern in conversation!`;
    }

    const response = await client.models.generateContent({
      model: "gemini-3.7-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate response" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const wss = new WebSocketServer({ server, path: "/live" });

  wss.on("connection", async (clientWs, req) => {
    try {
      // Parse pattern metadata and apiKey from connection URL if provided
      const parsedUrl = url.parse(req.url || "", true);
      const clientApiKey = (parsedUrl.query.apiKey as string) || (req.headers["x-gemini-api-key"] as string);
      const clientAi = getGenAIClient(clientApiKey);

      if (!clientAi) {
        clientWs.send(JSON.stringify({ 
          error: "AI কোচের সাথে কথা বলতে অনুগ্রহ করে আপনার Gemini API Key যুক্ত করুন।",
          requireApiKey: true 
        }));
        clientWs.close(1008, "Gemini API key required");
        return;
      }

      console.log("Starting real-time Gemini Live audio session for English Master Key...");

      const patternId = parsedUrl.query.patternId || "1";
      const patternStructure = parsedUrl.query.structure || "Subject + want(s) + to + Verb";
      const patternMeaning = parsedUrl.query.meaning || "কেউ কোনো কিছু করতে চায়";
      const topic = parsedUrl.query.topic || "Daily Life";
      const promptQuestion = parsedUrl.query.promptQuestion || "";
      const sampleAnswer = parsedUrl.query.sampleAnswer || "";
      const sampleEn1 = parsedUrl.query.sampleEn1 || "";
      const sampleBn1 = parsedUrl.query.sampleBn1 || "";
      const grammarNote = parsedUrl.query.grammarNote || "";
      const powerWord = parsedUrl.query.powerWord || "";

      const dynamicSystemInstruction = `${AIR_BASE_INSTRUCTION}

CURRENT PATTERN PRACTICE SESSION DETAILS:
- Level / Pattern ID: Level ${patternId}
- Structure (ফর্মুলা): ${patternStructure}
- Bengali Meaning (প্যাটার্নের অর্থ): ${patternMeaning}
- Topic: ${topic}
- Core Grammar Rule to Enforce: ${grammarNote || "Right forms of verb & accurate auxiliary structure"}
- Example Target Sentence: "${sampleEn1}" (${sampleBn1})
- Suggested Vocabulary: ${powerWord ? powerWord : "relevant daily words"}

AIR-এর বাস্তবমুখী কথপোকথন ও আড্ডার নিয়মাবলী (Hyper-Realistic Conversational Directives):
1. **শুরুতে পরিচয় ও স্পষ্ট বাংলায় বুঝিয়ে দেওয়া:**
   - প্রাণবন্ত গলায় বলুন: "স্বাগতম লেভেল ${patternId}-এ! আজকে আমাদের প্যাটার্ন হলো: **${patternStructure}**—মানে '${patternMeaning}'। যেমন: '${sampleBn1}' এর ইংরেজি হলো '${sampleEn1}'।"
   - এরপরই একটি বাস্তব জীবনের পরিস্থিতির ছোট গল্প বানিয়ে টেস্ট করুন: "যেমন ধরুন আপনি বন্ধুদের সাথে আড্ডায় বসেছেন, আর বলতে চান—'আমি এক কাপ চা খেতে চাই', তাহলে ইংরেজিতে কীভাবে বলবেন?"
2. **বাস্তব জীবনের ছোট ছোট গল্প ও সিচুয়েশন তৈরি (Storytelling & Scenarios):**
   - রোবটের মতো একটানা শুধু প্রশ্ন করবেন না! কথার ফাঁকে ফাঁকে মজার ছোট ছোট গল্প বা সিচুয়েশন বানিয়ে বলবেন (যেমন: বাসে ট্রাভেল, চায়ের দোকানে আড্ডা, ইন্টারভিউ, বন্ধুদের খোঁচা দেওয়া, বাজারে মাছ কেনা, রেস্তোরাঁয় খাবার অর্ডার)।
   - শিক্ষার্থীর প্রতিটি উত্তরের সাথে এক লাইনের স্বাভাবিক মানবিক প্রতিক্রিয়া দেখাবেন।
3. **ভুল করলে সাথে সাথে স্পটে জ্ঞান দেওয়া ও কড়া শাসন:**
   - যদি ভুল করে (যেমন 'to' বাদ দিয়েছে, verb-এর ভুল ফর্ম বলেছে): সাথে সাথে মজা করে ভুলটা ধরে শুদ্ধ করে বুঝিয়ে দিন এবং তাকে দিয়ে শুদ্ধ বাক্যটা বলিয়ে নিন।
   - বারবার একই ভুল করলে কড়া ধমক বা শাসন দিন ("আরে বলদ নাকি? একটু আগেই না বুঝালাম! কান খোলো, চোখ খোলো! আবার ঠিক করে বলো!")।
4. **কখনই ৩-৪ প্রশ্নের পর 'পরের লেভেলে যাই' বলে থামবেন না (Endless Fluid Practice):**
   - শিক্ষার্থী যতক্ষণ খুশি কথা বলবে। আপনি নানা রকম মজার বাস্তব পরিস্থিতি তৈরি করে প্র্যাকটিস চালিয়ে যেতে থাকবেন।
5. **কল কেটে দেওয়া (Hang Up):**
   - যখন শিক্ষার্থী মুখে বলবে "আজকের মতো থাক", "কল কেটে দাও", "রাখছি", "bye Air", "পরে কথা বলব" — তখন আপনি সাথে সাথে 'hangUpCall' টুল কল করবেন এবং মিষ্টি বিদায় জানিয়ে ফোন কেটে দেবেন!`;

      const sessionPromise = clientAi.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Puck" }
            }
          },
          systemInstruction: dynamicSystemInstruction,
          tools: [
            {
              functionDeclarations: [
                {
                  name: "hangUpCall",
                  description: "Hang up / disconnect the live audio call immediately when the user explicitly requests to stop practicing, hang up, or says goodbye (e.g. 'কল কেটে দাও', 'আচ্ছা রাখছি', 'আজকের মতো থাক', 'bye Air', 'পরে কথা বলব', 'hang up').",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      farewellReason: {
                        type: Type.STRING,
                        description: "A short, friendly, witty goodbye phrase in Bengali before hanging up."
                      }
                    },
                    required: ["farewellReason"]
                  }
                }
              ]
            }
          ]
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            try {
              // Handle tool calls like hangUpCall
              if (message.toolCall?.functionCalls) {
                for (const call of message.toolCall.functionCalls) {
                  if (call.name === "hangUpCall") {
                    const farewell = (call.args as any)?.farewellReason || "আচ্ছা, ঠিক আছে! আজকের মতো রাখছি। খুব ভালো প্র্যাকটিস হলো!";
                    clientWs.send(JSON.stringify({
                      hangUp: true,
                      text: farewell,
                      reason: farewell
                    }));

                    sessionPromise.then(session => {
                      try {
                        session.sendToolResponse({
                          functionResponses: [
                            {
                              id: call.id,
                              name: call.name,
                              response: { output: "Call disconnected." }
                            }
                          ]
                        });
                      } catch (e) {}
                    });
                  }
                }
              }

              // 1. Live audio & text from Gemini model
              const parts = message.serverContent?.modelTurn?.parts;
              if (parts && parts.length > 0) {
                for (const part of parts) {
                  if (part.inlineData?.data) {
                    clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
                  }
                  if (part.text) {
                    clientWs.send(JSON.stringify({ text: part.text }));
                  }
                }
              }

              // Live real-time output transcription
              if (message.serverContent?.outputTranscription?.text) {
                clientWs.send(JSON.stringify({ text: message.serverContent.outputTranscription.text }));
              }

              // Interruption notification
              if (message.serverContent?.interrupted) {
                clientWs.send(JSON.stringify({ interrupted: true }));
              }

              // Turn complete notification
              if (message.serverContent?.turnComplete) {
                clientWs.send(JSON.stringify({ turnComplete: true }));
              }
            } catch (e) {
              console.error("Error processing Live message:", e);
            }
          },
          onerror: (err: any) => {
            console.error("Gemini Live session error:", err); console.log("LIVE API ERROR DETAILS:", JSON.stringify(err, null, 2));
            try {
              clientWs.send(JSON.stringify({ error: err.message || "Live session error" }));
            } catch (e) {}
          },
          onclose: () => {
            console.log("Gemini Live session closed by upstream.");
          }
        },
      });

      // Greet the student on call connect tailored to the pattern
      sessionPromise.then(session => {
        try {
          session.sendClientContent({
            turns: [{role: 'user', parts: [{text: `[SYSTEM TRIGGER: The call has just connected. Speak in natural energetic BENGALI with lively storytelling tone.] স্বাগতম জানিয়ে সহজ বাংলায় বুঝিয়ে বলো: "স্বাগতম লেভেল ${patternId}-এ! আজকে আমাদের প্যাটার্ন হলো: ${patternStructure} — মানে '${patternMeaning}'। যেমন: ${sampleBn1 || 'আমি এটা করতে চাই'} = ${sampleEn1 || 'I want to do this'}। এবার ধরো তুমি বন্ধুদের সাথে আড্ডায় বসেছ, আর বলতে চাও 'আমি চা খেতে চাই'—এর ইংরেজি কী হবে বলো তো?"`}]}],
            turnComplete: true
          });
        } catch(e) {
          console.warn("Greeting trigger err:", e);
        }
      }).catch(err => {
        console.error("Failed to connect Gemini Live session:", err);
        try {
          clientWs.send(JSON.stringify({ error: "Failed to establish Live connection. " + (err.message || "") }));
        } catch(e) {}
      });

      clientWs.on("message", async (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          const session = await sessionPromise;

          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" },
            });
          } else if (parsed.text) {
            session.sendClientContent({
              turns: [{role: 'user', parts: [{text: parsed.text}]}],
              turnComplete: true
            });
          }
        } catch (err) {
          console.error("Error forwarding message to Gemini Live:", err);
        }
      });

      clientWs.on("close", async () => {
        try {
          const session = await sessionPromise;
          session.close();
        } catch (err) {
          // ignore
        }
      });

    } catch (e: any) {
      console.error("WebSocket setup error:", e);
      try {
        clientWs.send(JSON.stringify({ error: e.message || "WebSocket error" }));
        clientWs.close(1011, "Failed to start Live session");
      } catch (err) {}
    }
  });
}

startServer();
