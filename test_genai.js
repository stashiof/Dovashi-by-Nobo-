const { GoogleGenAI, Modality } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: 'abc' });
try {
  const ws = ai.live.connect({
    model: 'gemini-3.1-flash-live-preview',
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: 'hello world'
    }
  });
  console.log('Success');
} catch (e) {
  console.log('Error:', e);
}
