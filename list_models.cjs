const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const response = await ai.models.list();
    for (const model of response.models) {
      if (model.name.includes('live') || model.name.includes('flash') || model.name.includes('2.0')) {
        console.log(model.name);
      }
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}
run();
