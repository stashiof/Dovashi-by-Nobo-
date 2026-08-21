const fs = require('fs');
let code = fs.readFileSync('src/components/LevelLearningView.tsx', 'utf8');

code = code.replace(`import { AudioVisualizer } from './AudioVisualizer';`, `import { NebulaCharacter } from './NebulaCharacter';`);

code = code.replace(
  `<AudioVisualizer 
                  audioLevel={audioLevel}
                  tutorState={tutorState}
                  callActive={callActive}
                  userSpeaking={userSpeaking}
                />`,
  `<NebulaCharacter tutorState={tutorState} audioLevel={audioLevel} />`
);

fs.writeFileSync('src/components/LevelLearningView.tsx', code);
