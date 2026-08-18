import{G as i}from"./index-Xq67XRBP.js";async function l(t,n){const r=new i({apiKey:t}),a=`You are a strict yet encouraging English Grammar and Fluency Evaluator for Bengali learners practicing the English Master Key (300 Speaking Patterns).

TASK:
Evaluate if the learner correctly applied the target structure:
- Pattern / Formula: ${n.structure}
- Intended Bengali Meaning: "${n.promptBn}"
- Learner's English Sentence: "${n.userSentence}"

EVALUATION CRITERIA:
1. Target Pattern Application: Did they follow "${n.structure}"?
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
}`,c=(await r.models.generateContent({model:"gemini-2.0-flash",contents:[{role:"user",parts:[{text:a}]}],config:{responseMimeType:"application/json",temperature:.2}})).text||"{}",e=JSON.parse(c);return{isCorrect:!!e.isCorrect,accuracyScore:typeof e.accuracyScore=="number"?e.accuracyScore:e.isCorrect?90:40,feedbackBn:e.feedbackBn||"আপনার বাক্যটি মূল্যায়ন করা হয়েছে।",suggestedVersion:e.suggestedVersion||n.userSentence,grammarExplanationBn:e.grammarExplanationBn||""}}export{l as evaluateSentenceDirectly};
