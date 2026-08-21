const fs = require('fs');
let code = fs.readFileSync('src/hooks/useLiveCall.ts', 'utf8');

code = code.replace("voiceName: 'Aoede'", "voiceName: 'Kore'");

fs.writeFileSync('src/hooks/useLiveCall.ts', code);
