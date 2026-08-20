const fs = require('fs');
let code = fs.readFileSync('src/hooks/useLiveCall.ts', 'utf8');

code = code.replace(
  `[SYSTEM: Start the call for Level \${pId}. Topic: "\${struct}" (Meaning: \${meaning}). Speak ENTIRELY in Bengali! Say a cheerful, energetic welcome. Include a human-like non-verbal sound (like a sigh, *cough*, or "Umm..."). DO NOT ask what they want to practice! Instead, directly introduce the topic "\${struct}" through a short fun real-life story/scenario and ask them a quick engaging question about it to start the practice!]`,
  `[SYSTEM: Start the call for Level \${pId}. Topic: "\${struct}" (Meaning: \${meaning}). Speak ENTIRELY in Bengali! Act as the strict, sarcastic coach. Do NOT overact. Greet them shortly, then IMMEDIATELY give them a Bengali sentence related to "\${struct}" and aggressively ask them to translate it to English! Do NOT tell any stories.]`
);

fs.writeFileSync('src/hooks/useLiveCall.ts', code);
