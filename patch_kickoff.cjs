const fs = require('fs');
let code = fs.readFileSync('src/hooks/useLiveCall.ts', 'utf8');

code = code.replace(
  `      // 5. Initial Call Kickoff Greeting
      const pId = currentPattern?.id || 1;
      const struct = currentPattern?.structure || "Basic Introduction";
      
      session.sendClientContent({
        turns: [{
          role: 'user',
          parts: [{
            text: \`[SYSTEM: Start the call for Level \${pId} (\${struct}). Speak ENTIRELY in Bengali! Say a cheerful, energetic 1-sentence welcome. Include a human-like non-verbal sound (like a sigh, *cough*, or "Umm...") and ask how the user is doing or what they want to practice!]\`
          }]
        }],
        turnComplete: true
      });`,
  `      // 5. Initial Call Kickoff Greeting
      const pId = currentPattern?.id || 1;
      const struct = currentPattern?.structure || "Basic Introduction";
      const meaning = currentPattern?.bengaliMeaning || "";
      
      setTimeout(() => {
        if (isCallActiveRef.current) {
          session.sendClientContent({
            turns: [{
              role: 'user',
              parts: [{
                text: \`[SYSTEM: Start the call for Level \${pId}. Topic: "\${struct}" (Meaning: \${meaning}). Speak ENTIRELY in Bengali! Say a cheerful, energetic welcome. Include a human-like non-verbal sound (like a sigh, *cough*, or "Umm..."). DO NOT ask what they want to practice! Instead, directly introduce the topic "\${struct}" through a short fun real-life story/scenario and ask them a quick engaging question about it to start the practice!]\`
              }]
            }],
            turnComplete: true
          });
        }
      }, 500);`
);

fs.writeFileSync('src/hooks/useLiveCall.ts', code);
