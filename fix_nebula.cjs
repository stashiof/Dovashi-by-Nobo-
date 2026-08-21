const fs = require('fs');
let code = fs.readFileSync('src/components/NebulaCharacter.tsx', 'utf8');

code = code.replace(
  /\\`translate\(\\\$\{moveX\}px, \\\$\{moveY\}px\)\\`/g,
  "`translate(${moveX}px, ${moveY}px)`"
);

fs.writeFileSync('src/components/NebulaCharacter.tsx', code);
