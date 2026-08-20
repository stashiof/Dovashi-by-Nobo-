const fs = require('fs');
let code = fs.readFileSync('src/utils/aiPrompts.ts', 'utf8');
code = code.replace(
  `DIRECTIVES FOR THIS CALL:\n1. Greet as a warm, lively friend in \${sourceLang}. Greet freshly and creatively every time!\n2. Casually introduce the practice idea of expressing "\${meaning}" through fun daily-life scenarios.\n3. Keep turns short, snappy, and interactive. When the user speaks, listen actively and respond immediately!\`;`,
  `DIRECTIVES FOR THIS CALL:\n1. Greet as a warm, lively friend entirely in \${sourceLang} (e.g. Bengali). Greet freshly and creatively every time! Use human-like sounds (like "Umm...", "Uff", or *cough*) naturally in your voice.\n2. Explain the concept and chat ONLY in \${sourceLang}. DO NOT speak English unless you are giving an exact example sentence for them to practice.\n3. Casually introduce the practice idea of expressing "\${meaning}" through fun daily-life scenarios.\n4. Keep turns short, snappy, and interactive. When the user speaks, listen actively and respond immediately!\`;`
);
fs.writeFileSync('src/utils/aiPrompts.ts', code);
