const { GoogleGenAI, Modality } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: 'abc' });
global.WebSocket = require('ws');
async function run() {
  try {
    const ws = await ai.live.connect({
      model: 'models/gemini-2.0-flash-exp',
      config: {
        systemInstruction: { parts: [{ text: "hello" }] }
      }
    });
    console.log('Success', ws);
  } catch (e) {
    console.log('Error:', e.message);
  }
}
run();
