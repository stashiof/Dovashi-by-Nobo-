const fs = require('fs');
let code = fs.readFileSync('src/hooks/useLiveCall.ts', 'utf8');
code = code.replace(
  `[SYSTEM: Start the call for Level \${pId} (\${struct}). Say a cheerful, energetic 1-sentence welcome in your natural voice and ask how the user is doing or what they want to practice!]`,
  `[SYSTEM: Start the call for Level \${pId} (\${struct}). Speak ENTIRELY in Bengali! Say a cheerful, energetic 1-sentence welcome. Include a human-like non-verbal sound (like a sigh, *cough*, or "Umm...") and ask how the user is doing or what they want to practice!]`
);
fs.writeFileSync('src/hooks/useLiveCall.ts', code);
