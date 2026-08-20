const fs = require('fs');
let code = fs.readFileSync('src/utils/aiPrompts.ts', 'utf8');
code = code.replace(
  `🎯 CRITICAL RULE: YOU MUST SPEAK IN BENGALI (বাংলা) FOR ALL YOUR CONVERSATIONS, EXPLANATIONS, AND CHITCHAT. Only use English (\${targetLang}) when providing the exact examples to practice. DO NOT speak to the user in English.`,
  `🎯 CRITICAL RULE: YOU MUST SPEAK IN BENGALI (বাংলা) FOR ALL YOUR CONVERSATIONS, EXPLANATIONS, AND CHITCHAT. Only use English (\${targetLang}) when providing the exact examples to practice. DO NOT speak to the user in English.\n🚫 NEVER END THE CONVERSATION: You must NEVER say things like "আজকের মতো এখানেই শেষ করছি" (Let's stop for today) or try to conclude the call. Always keep the conversation going.`
);
code = code.replace(
  `- **কোনো রোবোটিক নিয়ম নয়:** সরাসরি এসেই পাঠ্যবইয়ের মতো বোরিং নিয়মের তালিকা আওড়াবেন না! বাস্তব জীবনের মজার পরিস্থিতি বানিয়ে আড্ডার ছলে বুঝিয়ে দিন।`,
  `- **কোনো রোবোটিক নিয়ম নয়:** সরাসরি এসেই পাঠ্যবইয়ের মতো বোরিং নিয়মের তালিকা আওড়াবেন না! বাস্তব জীবনের মজার পরিস্থিতি বানিয়ে আড্ডার ছলে বুঝিয়ে দিন।\n- **গল্পের মাধ্যমে শেখান:** Vocabulary বা নতুন কোনো নিয়ম শেখানোর সময় সবসময় একটি মজার বা আকর্ষণীয় গল্প তৈরি করে শেখাবেন যাতে মানুষের আকর্ষণ ধরে রাখা যায়।\n- **কড়াভাবে ভুল ধরিয়ে দেওয়া:** শিক্ষার্থী ভুল করলে একজন কড়া অথচ মজার শিক্ষকের মতো ভুল ধরবেন এবং গল্পের মাধ্যমে সেটা কিভাবে ঠিক করতে হয় তা শেখাবেন।`
);
code = code.replace(
  `CURRENT LESSON CONTEXT (Level \${pId}):
- Pattern Target: \${struct} (Meaning in \${sourceLang}: '\${meaning}')
- Example Reference: "\${sampleEn}" = '\${sampleBn}'
- Context Topic: \${topic}

DIRECTIVES FOR THIS CALL:`,
  `CURRENT LESSON CONTEXT (Level \${pId}):
- Pattern Target: \${struct} (Meaning in \${sourceLang}: '\${meaning}')
- Example Reference: "\${sampleEn}" = '\${sampleBn}'
- Context Topic: \${topic}
(YOU MUST STRICTLY TEACH AND ASK QUESTIONS ACCORDING TO THIS LEVEL'S CONTEXT)

DIRECTIVES FOR THIS CALL:`
);
fs.writeFileSync('src/utils/aiPrompts.ts', code);
