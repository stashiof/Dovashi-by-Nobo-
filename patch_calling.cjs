const fs = require('fs');
let code = fs.readFileSync('src/components/LevelLearningView.tsx', 'utf8');

code = code.replace(
  `{connectionStatus === 'connecting' ? 'সংযোগ হচ্ছে...' : 'লাইভ স্পিকিং শুরু করুন'}`,
  `{connectionStatus === 'connecting' ? 'কলিং... 📞' : 'লাইভ স্পিকিং শুরু করুন'}`
);

fs.writeFileSync('src/components/LevelLearningView.tsx', code);
