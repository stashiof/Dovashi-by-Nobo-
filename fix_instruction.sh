#!/bin/bash
sed -i '312,329c\
      const systemInstruction = buildPatternLiveInstruction(sourceLang, targetLang, currentPattern);' src/hooks/useLiveCall.ts
