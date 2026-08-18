import { GoogleGenAI } from '@google/genai';

export interface EvaluationResult {
  isCorrect: boolean;
  accuracyScore: number;
  feedbackBn: string;
  suggestedVersion: string;
  grammarExplanationBn?: string;
}

export async function evaluateSentenceDirectly(
  apiKey: string,
  params: {
    patternId: number;
    structure: string;
    promptBn: string;
    userSentence: string;
  }
): Promise<EvaluationResult> {
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a strict yet encouraging English Grammar and Fluency Evaluator for Bengali learners practicing the English Master Key (300 Speaking Patterns).

TASK:
Evaluate if the learner correctly applied the target structure:
- Pattern / Formula: ${params.structure}
- Intended Bengali Meaning: "${params.promptBn}"
- Learner's English Sentence: "${params.userSentence}"

EVALUATION CRITERIA:
1. Target Pattern Application: Did they follow "${params.structure}"?
2. Grammar & Tense: Are the verb forms, pronouns, and auxiliaries accurate?
3. Meaning Correspondence: Does it convey the intended Bengali sentence?

OUTPUT FORMAT:
Return a valid JSON object strictly matching this schema:
{
  "isCorrect": true/false (true if grammatically sound and matches pattern),
  "accuracyScore": number between 0 and 100,
  "feedbackBn": "Clear, direct, helpful feedback in Bengali. If wrong, kindly explain the mistake in Bengali.",
  "suggestedVersion": "Natural, native-sounding correct English sentence",
  "grammarExplanationBn": "Short explanation in Bengali of the formula used"
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const text = response.text || "{}";
  const parsed = JSON.parse(text);
  return {
    isCorrect: !!parsed.isCorrect,
    accuracyScore: typeof parsed.accuracyScore === 'number' ? parsed.accuracyScore : (parsed.isCorrect ? 90 : 40),
    feedbackBn: parsed.feedbackBn || "আপনার বাক্যটি মূল্যায়ন করা হয়েছে।",
    suggestedVersion: parsed.suggestedVersion || params.userSentence,
    grammarExplanationBn: parsed.grammarExplanationBn || ""
  };
}
