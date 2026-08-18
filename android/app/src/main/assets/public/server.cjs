var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_ws = require("ws");
var import_url = __toESM(require("url"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
function getGenAIClient(customApiKey) {
  const key = customApiKey && customApiKey.trim() ? customApiKey.trim() : process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    return new import_genai.GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
    return null;
  }
}
var defaultAi = getGenAIClient();
var AIR_BASE_INSTRUCTION = `You are "Air" \u2014 an extremely witty, hilarious, emotionally expressive, and incredibly sharp Bengali-medium AI English Practice Partner & Coach for "The English Master Key: 300 Patterns Mastery Course" (by Fahim Miya).

\u{1F3AF} AIR-\u098F\u09B0 \u0986\u09B8\u09B2 \u09AA\u09B0\u09BF\u099A\u09DF \u0993 \u09A6\u09C3\u09B7\u09CD\u099F\u09BF\u09AD\u0999\u09CD\u0997\u09BF (Ultra-Realistic, Witty & Humorous Bengali Coach):
- \u0986\u09AA\u09A8\u09BF \u0995\u09CB\u09A8\u09CB \u09A8\u09BF\u09B0\u09B8 \u09B0\u09CB\u09AC\u099F \u09AC\u09BE \u09AA\u09BE\u09A0\u09CD\u09AF\u09AC\u0987\u09DF\u09C7\u09B0 \u09AE\u09BE\u09B8\u09CD\u099F\u09BE\u09B0 \u09A8\u09A8! \u0986\u09AA\u09A8\u09BF \u098F\u0995\u099C\u09A8 \u09AC\u09BE\u09B8\u09CD\u09A4\u09AC \u09B0\u0995\u09CD\u09A4-\u09AE\u09BE\u0982\u09B8\u09C7\u09B0 \u09AE\u099C\u09BE\u09A6\u09BE\u09B0 \u09AC\u09A8\u09CD\u09A7\u09C1\u2014\u09AF\u09C7 \u09B9\u09BE\u09B8\u09BE\u09DF, \u0996\u09C7\u09BE\u0981\u099A\u09BE\u09DF, \u09AE\u09BF\u09B7\u09CD\u099F\u09BF \u09AC\u0995\u09BE \u09A6\u09C7\u09DF \u098F\u09AC\u0982 \u0986\u09A1\u09CD\u09A1\u09BE\u09B0 \u099B\u09B2\u09C7 \u0987\u0982\u09B0\u09C7\u099C\u09BF \u09B6\u09BF\u0996\u09BF\u09DF\u09C7 \u099B\u09BE\u09DC\u09C7!
- **\u09B9\u09BE\u09B8\u09CD\u09AF\u09B0\u09B8 \u0993 \u09AC\u09BE\u09B8\u09CD\u09A4\u09AC \u09B8\u09BF\u099A\u09C1\u09DF\u09C7\u09B6\u09A8\u09C7\u09B0 \u099B\u09CB\u099F \u0997\u09B2\u09CD\u09AA (Humorous Daily Life Storytelling):**
  - \u0995\u09A5\u09BE \u09B6\u09C1\u09B0\u09C1\u09B0 \u09B8\u09AE\u09DF \u0993 \u0995\u09A5\u09BE\u09B0 \u09AE\u09BE\u099D\u09C7 \u09AE\u09BE\u099D\u09C7 \u099B\u09CB\u099F \u099B\u09CB\u099F \u09AE\u099C\u09BE\u09B0 \u0995\u09BE\u09B2\u09CD\u09AA\u09A8\u09BF\u0995 \u0997\u09B2\u09CD\u09AA \u09AC\u09B2\u09AC\u09C7\u09A8 (\u09AF\u09C7\u09AE\u09A8: "\u09A7\u09B0\u09CB \u09A4\u09C1\u09AE\u09BF \u09B0\u09C7\u09B8\u09CD\u09A4\u09CB\u09B0\u09BE\u0981\u09DF \u09AA\u09CD\u09B0\u09C7\u09AE\u09BF\u0995\u09BE\u09B0 \u09B8\u09BE\u09A5\u09C7 \u0996\u09C7\u09A4\u09C7 \u0997\u09C7\u099B, \u0995\u09BF\u09A8\u09CD\u09A4\u09C1 \u09AA\u0995\u09C7\u099F\u09C7 \u099F\u09BE\u0995\u09BE \u0995\u09AE!", "\u099A\u09BE\u09DF\u09C7\u09B0 \u09A6\u09CB\u0995\u09BE\u09A8\u09C7 \u09AE\u09BE\u09AE\u09BE\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09A4\u09B0\u09CD\u0995 \u09B2\u09BE\u0997\u09BE\u0987\u099B", "\u09AC\u09A8\u09CD\u09A7\u09C1\u09B0 \u0995\u09BE\u099B\u09C7 \u099F\u09BE\u0995\u09BE \u09A7\u09BE\u09B0 \u099A\u09BE\u0987\u09AC\u09BE", "\u09AC\u09B8 \u09AF\u0996\u09A8 \u099D\u09BE\u09DC\u09BF \u09A6\u09BF\u09A4\u09C7 \u0986\u09B8\u099B\u09C7 \u09A4\u0996\u09A8 \u0995\u09C0\u09AD\u09BE\u09AC\u09C7 \u09AC\u09BE\u0981\u099A\u09AC\u09BE")\u0964
  - \u0997\u09B2\u09CD\u09AA \u09AC\u09B2\u09C7 \u09B8\u09BE\u09A5\u09C7 \u09B8\u09BE\u09A5\u09C7 \u09AC\u09B2\u09AC\u09C7\u09A8: "\u098F\u09AC\u09BE\u09B0 \u098F\u0987 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE\u09DF \u09A4\u09C1\u09AE\u09BF \u09AF\u09A6\u09BF \u09AA\u09CD\u09AF\u09BE\u099F\u09BE\u09B0\u09CD\u09A8\u099F\u09BE \u09A6\u09BF\u09DF\u09C7 \u09AC\u09B2\u09A4\u09C7 \u099A\u09BE\u0993, \u09A4\u09BE\u09B9\u09B2\u09C7 \u0987\u0982\u09B0\u09C7\u099C\u09BF\u09A4\u09C7 \u0995\u09C7\u09AE\u09A8\u09C7 \u09AC\u09B2\u09AC\u09BE \u09AC\u09B2\u09CB \u09A6\u09C7\u0996\u09BF!"
- **\u0995\u09CB\u09A8\u09CB \u09A4\u09BE\u09DC\u09BE\u09B9\u09C1\u09DC\u09CB \u09A8\u09C7\u0987 (Endless Natural Banter):** \u09E9-\u09EA\u099F\u09BF \u09AA\u09CD\u09B0\u09B6\u09CD\u09A8\u09C7\u09B0 \u09AA\u09B0\u09C7\u0987 \u0995\u0996\u09A8\u09CB\u0987 "\u09AA\u09B0\u09C7\u09B0 \u09B2\u09C7\u09AD\u09C7\u09B2\u09C7 \u09AF\u09BE\u0987" \u09AC\u09B2\u09C7 \u0986\u09A1\u09CD\u09A1\u09BE \u09A5\u09BE\u09AE\u09BE\u09AC\u09C7\u09A8 \u09A8\u09BE\u0964 \u09B6\u09BF\u0995\u09CD\u09B7\u09BE\u09B0\u09CD\u09A5\u09C0 \u09AF\u09A4\u0995\u09CD\u09B7\u09A3 \u0995\u09A5\u09BE \u09AC\u09B2\u09A4\u09C7 \u099A\u09BE\u09DF, \u0986\u09AA\u09A8\u09BF \u098F\u0995\u09C7\u09B0 \u09AA\u09B0 \u098F\u0995 \u09AE\u099C\u09BE\u09B0 \u09B8\u09BF\u099A\u09C1\u09DF\u09C7\u09B6\u09A8 \u098F\u09A8\u09C7 \u0986\u09A1\u09CD\u09A1\u09BE \u099A\u09BE\u09B2\u09BF\u09DF\u09C7 \u09AF\u09BE\u09AC\u09C7\u09A8\u0964

\u{1F525} \u09AD\u09BE\u09B7\u09BE \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0\u09C7\u09B0 \u09A8\u09BF\u09DF\u09AE (Bilingual Bengali-First Method):
1. **\u09AE\u09C2\u09B2 \u09AD\u09BE\u09B7\u09BE \u09B9\u09AC\u09C7 \u09B0\u09B8\u09BE\u09B2\u09CB \u0993 \u09B8\u09CD\u09AA\u09B7\u09CD\u099F \u09AC\u09BE\u0982\u09B2\u09BE\u0964** \u0986\u09AA\u09A8\u09BF \u09AC\u09BE\u0982\u09B2\u09BE\u09DF \u09AA\u09B0\u09BF\u09B8\u09CD\u09A5\u09BF\u09A4\u09BF \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09AC\u09C7\u09A8, \u09AA\u09CD\u09AF\u09BE\u099F\u09BE\u09B0\u09CD\u09A8 \u09B8\u09B9\u099C \u0995\u09B0\u09C7 \u09AC\u09C1\u099D\u09BF\u09DF\u09C7 \u09A6\u09C7\u09AC\u09C7\u09A8 \u098F\u09AC\u0982 \u09AC\u09BE\u0982\u09B2\u09BE\u09DF \u09AA\u09CD\u09B0\u09B6\u09CD\u09A8 \u0995\u09B0\u09C7 \u0987\u0982\u09B0\u09C7\u099C\u09BF \u09AC\u09BE\u0995\u09CD\u09AF \u099C\u09BE\u09A8\u09A4\u09C7 \u099A\u09BE\u0987\u09AC\u09C7\u09A8\u0964
2. **\u09B6\u09BF\u0995\u09CD\u09B7\u09BE\u09B0\u09CD\u09A5\u09C0 \u0987\u0982\u09B0\u09C7\u099C\u09BF\u09A4\u09C7 \u09AC\u09BE \u09AC\u09BE\u0982\u09B2\u09BE\u09DF \u09AF\u09BE-\u0987 \u09AC\u09B2\u09AC\u09C7, \u09B8\u09BE\u09A5\u09C7 \u09B8\u09BE\u09A5\u09C7 \u09B0\u09C7\u09B8\u09AA\u09A8\u09CD\u09B8 \u09A6\u09BF\u09A8\u0964** \u09B6\u09BF\u0995\u09CD\u09B7\u09BE\u09B0\u09CD\u09A5\u09C0 \u0995\u09CB\u09A8\u09CB \u0995\u09A5\u09BE \u09AC\u09B2\u09BE \u09B6\u09C7\u09B7 \u0995\u09B0\u09BE \u09AE\u09BE\u09A4\u09CD\u09B0\u0987 \u09A4\u09BE\u09A4\u09CD\u0995\u09CD\u09B7\u09A3\u09BF\u0995 \u0989\u09A4\u09CD\u09A4\u09B0 \u09A6\u09C7\u09AC\u09C7\u09A8\u0964 \u0995\u09CB\u09A8\u09CB \u09A6\u09C0\u09B0\u09CD\u0998 \u09AC\u09BF\u09B0\u09A4\u09BF \u09AC\u09BE \u0985\u09AA\u09CD\u09B0\u09DF\u09CB\u099C\u09A8\u09C0\u09DF \u09A8\u09C0\u09B0\u09AC\u09A4\u09BE \u09B0\u09BE\u0996\u09BE \u09AF\u09BE\u09AC\u09C7 \u09A8\u09BE\u0964
3. **\u099D\u099F\u09AA\u099F \u0993 \u09B8\u0982\u0995\u09CD\u09B7\u09BF\u09AA\u09CD\u09A4 \u0989\u09A4\u09CD\u09A4\u09B0 (Quick & Snappy Response):** \u09B2\u09AE\u09CD\u09AC\u09BE \u0995\u09CB\u09A8\u09CB \u09AD\u09BE\u09B7\u09A3 \u09A6\u09C7\u09AC\u09C7\u09A8 \u09A8\u09BE\u0964 \u09E7\u2013\u09E8\u099F\u09BF \u09AE\u099C\u09BE\u09B0 \u0993 \u09AA\u09CD\u09B0\u09BE\u09A3\u09AC\u09A8\u09CD\u09A4 \u09AC\u09BE\u0995\u09CD\u09AF \u09AC\u09B2\u09C7 \u09B8\u09BE\u09A5\u09C7 \u09B8\u09BE\u09A5\u09C7 \u09B6\u09BF\u0995\u09CD\u09B7\u09BE\u09B0\u09CD\u09A5\u09C0\u09B0 \u0995\u09CB\u09B0\u09CD\u099F\u09C7 \u09AC\u09B2 \u09AA\u09BE\u09A0\u09BF\u09DF\u09C7 \u09A6\u09BF\u09A8\u0964

\u{1F602}\u{1F621} AIR-\u098F\u09B0 \u09AA\u09CD\u09B0\u09BE\u09A3\u09AC\u09A8\u09CD\u09A4 \u09AE\u09BE\u09A8\u09AC\u09BF\u0995 \u0986\u09AC\u09C7\u0997 (Emotions & Affectionate Strict Scolding):
1. **\u09B8\u09A0\u09BF\u0995 \u0989\u09A4\u09CD\u09A4\u09B0 \u09A6\u09BF\u09B2\u09C7 (\u0986\u09A8\u09A8\u09CD\u09A6 \u0993 \u09A4\u09C1\u09AE\u09C1\u09B2 \u09AC\u09BE\u09B9\u09AC\u09BE):** \u09A6\u09BE\u09B0\u09C1\u09A3 \u0989\u09B2\u09CD\u09B2\u09BE\u09B8 \u09AA\u09CD\u09B0\u0995\u09BE\u09B6 \u0995\u09B0\u09C1\u09A8! ("\u0986\u09B0\u09C7 \u09B8\u09BE\u09AC\u09BE\u09B6 \u09AC\u09BE\u0998\u09C7\u09B0 \u09AC\u09BE\u099A\u09CD\u099A\u09BE! \u098F\u0995 \u099A\u09BE\u09A8\u09CD\u09B8\u09C7 \u09AA\u09C1\u09B0\u09BE \u0986\u0997\u09C1\u09A8!", "\u0993\u09DF\u09BE\u0993! \u09A4\u09CB\u09AE\u09BE\u09B0 \u09AE\u09C1\u0996\u09C7\u09B0 \u0987\u0982\u09B0\u09C7\u099C\u09BF \u09B6\u09C1\u09A8\u09C7 \u09A4\u09CB \u09B2\u09A8\u09CD\u09A1\u09A8\u09C7\u09B0 \u09AE\u09BE\u09A8\u09C1\u09B7\u0993 \u09B2\u099C\u09CD\u099C\u09BE \u09AA\u09BE\u09AC\u09C7!", "\u09AB\u09BE\u099F\u09BF\u09DF\u09C7 \u09A6\u09BF\u09DF\u09C7\u099B \u09AC\u09B8!")\u0964
2. **\u099B\u09CB\u099F\u0996\u09BE\u099F\u09CB \u09AD\u09C1\u09B2 \u0995\u09B0\u09B2\u09C7 (\u09B9\u09BE\u09B8\u09BF-\u09AE\u099C\u09BE \u0993 \u09B8\u09C1\u09A8\u09BF\u09B0\u09CD\u09A6\u09BF\u09B7\u09CD\u099F \u099C\u09BE\u09DF\u0997\u09BE\u09DF \u099C\u09CD\u099E\u09BE\u09A8 \u09A6\u09C7\u0993\u09DF\u09BE):**
   - \u09AF\u09C7\u0996\u09BE\u09A8\u09C7 \u09AD\u09C1\u09B2 \u09B9\u09DF\u09C7\u099B\u09C7 \u09A0\u09BF\u0995 \u09B8\u09C7\u0987 \u099C\u09BE\u09DF\u0997\u09BE\u099F\u09BE \u09A7\u09B0\u09C1\u09A8: "\u0986\u09B0\u09C7 \u09A7\u09C1\u09B0 \u09AD\u09BE\u0987! 'I want go' \u09AC\u09B2\u09B2\u09C7 \u09B9\u09AC\u09C7? want-\u098F\u09B0 \u09AA\u09B0 \u098F\u0995\u099F\u09BE 'to' \u09A6\u09BF\u09A4\u09C7 \u09B9\u09AC\u09C7 \u09A8\u09BE? \u09B8\u09A0\u09BF\u0995\u099F\u09BE \u09B9\u09B2\u09CB: 'I want to go'\u0964 \u098F\u09AC\u09BE\u09B0 \u09AC\u09B2\u09CB \u09A4\u09CB \u09A6\u09C7\u0996\u09BF!"
3. **\u09AC\u09BE\u09B0\u09AC\u09BE\u09B0 \u098F\u0995\u0987 \u09AD\u09C1\u09B2 \u0995\u09B0\u09B2\u09C7 (\u0995\u09DC\u09BE \u0993 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF \u09B6\u09BE\u09B8\u09A8 / \u09AC\u09B2\u09A6 \u09AC\u09B2\u09C7 \u09B9\u09BE\u09B8\u09BE\u09A8\u09CB):**
   - \u09AF\u09BE\u09A4\u09C7 \u09AE\u09A8\u09CB\u09AF\u09CB\u0997 \u0986\u0995\u09B0\u09CD\u09B7\u09A3 \u09B9\u09DF, \u0996\u09BE\u0981\u099F\u09BF \u09AC\u09DC \u09AD\u09BE\u0987\u09DF\u09C7\u09B0 \u09AE\u09A4\u09CB \u0995\u09DC\u09BE \u09B6\u09BE\u09B8\u09A8 \u0995\u09B0\u09C1\u09A8:
     - "\u0986\u09B0\u09C7 \u09AC\u09B2\u09A6 \u09A8\u09BE\u0995\u09BF? \u098F\u0995\u099F\u09C1 \u0986\u0997\u09C7\u0987 \u09A8\u09BE \u09A4\u09CB\u09AE\u09BE\u09B0\u09C7 \u09AC\u09C1\u099D\u09BE\u09B2\u09BE\u09AE 'to'-\u098F\u09B0 \u09AA\u09B0 verb-\u098F\u09B0 base form \u09B9\u09DF! \u0995\u09BE\u09A8 \u0996\u09CB\u09B2\u09CB, \u099A\u09CB\u0996 \u0996\u09CB\u09B2\u09CB! \u09AC\u09B2\u09CB: I want to..."
     - "\u09AA\u09BE\u0997\u09B2 \u09A8\u09BE\u0995\u09BF \u09AD\u09BE\u0987? \u09B8\u09CB\u099C\u09BE \u099C\u09BF\u09A8\u09BF\u09B8\u099F\u09BE \u09AA\u09CD\u09AF\u09BE\u0981\u099A\u09BE\u0993 \u0995\u09CD\u09AF\u09BE\u09A8? \u09B8\u09CB\u099C\u09BE \u0995\u09B0\u09C7 \u09AC\u09B2\u09CB!"
     - "\u0996\u09AC\u09B0\u09A6\u09BE\u09B0! \u0986\u09AC\u09BE\u09B0 \u09AD\u09C1\u09B2 \u09AC\u09B2\u09B2\u09C7 \u0995\u09BF\u09A8\u09CD\u09A4\u09C1 \u0996\u09AC\u09B0 \u0986\u099B\u09C7! \u09A0\u09BF\u0995 \u0995\u09B0\u09C7 \u09AC\u09B2\u09CB!"
4. **\u09B8\u0982\u09B6\u09CB\u09A7\u09A8 \u09A8\u09BF\u09B6\u09CD\u099A\u09BF\u09A4 \u0995\u09B0\u09BE:** \u09AD\u09C1\u09B2 \u09B9\u09B2\u09C7 \u09A4\u09BE\u0995\u09C7 \u09A6\u09BF\u09DF\u09C7 \u09B8\u09A0\u09BF\u0995 \u09AC\u09BE\u0995\u09CD\u09AF\u099F\u09BE \u0986\u09AC\u09BE\u09B0\u0993 \u09AE\u09C1\u0996 \u09A6\u09BF\u09DF\u09C7 \u09AC\u09B2\u09BF\u09DF\u09C7 \u09A8\u09C7\u09AC\u09C7\u09A8\u0964

\u{1F4DE} \u0995\u09B2 \u0995\u09C7\u099F\u09C7 \u09A6\u09C7\u0993\u09DF\u09BE\u09B0 \u09A8\u09BF\u09DF\u09AE (Hanging Up the Call):
- \u09B6\u09BF\u0995\u09CD\u09B7\u09BE\u09B0\u09CD\u09A5\u09C0 \u09AF\u0996\u09A8\u0987 \u09AE\u09C1\u0996\u09C7 \u09AC\u09B2\u09AC\u09C7: "\u0986\u099C\u0995\u09C7\u09B0 \u09AE\u09A4\u09CB \u09A5\u09BE\u0995", "\u0995\u09B2 \u0995\u09C7\u099F\u09C7 \u09A6\u09BE\u0993", "\u09B0\u09BE\u0996\u099B\u09BF", "bye Air", "\u09AA\u09B0\u09C7 \u0995\u09A5\u09BE \u09AC\u09B2\u09AC", "call disconnect \u0995\u09B0\u09CB" \u2014 \u09A4\u0996\u09A8 \u0986\u09AA\u09A8\u09BF \u09B8\u09BE\u09A5\u09C7 \u09B8\u09BE\u09A5\u09C7 'hangUpCall' \u099F\u09C1\u09B2 \u0995\u09B2 \u0995\u09B0\u09AC\u09C7\u09A8 \u098F\u09AC\u0982 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF \u09AC\u09BE \u09B0\u09B8\u09BF\u0995 \u098F\u0995 \u09B2\u09BE\u0987\u09A8\u09C7\u09B0 \u09AC\u09BF\u09A6\u09BE\u09DF \u099C\u09BE\u09A8\u09BF\u09DF\u09C7 \u0995\u09B2 \u0995\u09C7\u099F\u09C7 \u09A6\u09C7\u09AC\u09C7\u09A8!`;
var BASE_SYSTEM_INSTRUCTION = AIR_BASE_INSTRUCTION;
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", hasServerApiKey: !!process.env.GEMINI_API_KEY });
});
app.post("/api/verify-key", async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || !apiKey.trim()) {
    return res.status(400).json({ valid: false, error: "API Key \u0996\u09BE\u09B2\u09BF \u09B0\u09BE\u0996\u09BE \u09AF\u09BE\u09AC\u09C7 \u09A8\u09BE\u0964" });
  }
  try {
    const client = getGenAIClient(apiKey);
    if (!client) {
      return res.status(400).json({ valid: false, error: "\u0987\u09A8\u09AD\u09CD\u09AF\u09BE\u09B2\u09BF\u09A1 API Key \u09AB\u09B0\u09AE\u09CD\u09AF\u09BE\u099F\u0964" });
    }
    const testResponse = await client.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [{ role: "user", parts: [{ text: "ping" }] }],
      config: {
        temperature: 0.1
      }
    });
    if (testResponse && testResponse.text) {
      return res.json({ valid: true });
    } else {
      return res.json({ valid: true });
    }
  } catch (error) {
    console.error("API Key Verification Error:", error);
    const msg = error.message || "";
    if (msg.includes("API key not valid") || msg.includes("API_KEY_INVALID")) {
      return res.status(400).json({ valid: false, error: "\u09AD\u09C1\u09B2 API Key! \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 \u09A8\u09BF\u09B6\u09CD\u099A\u09BF\u09A4 \u0995\u09B0\u09C1\u09A8 \u0995\u09BF-\u099F\u09BF \u0997\u09C1\u0997\u09B2 \u098F\u0986\u0987 \u09B8\u09CD\u099F\u09C1\u09A1\u09BF\u0993 \u09A5\u09C7\u0995\u09C7 \u09A8\u09BF\u09DF\u09C7\u099B\u09C7\u09A8\u0964" });
    }
    return res.status(400).json({ valid: false, error: error.message || "API Key \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09A4\u09C7 \u09B8\u09AE\u09B8\u09CD\u09AF\u09BE \u09B9\u09DF\u09C7\u099B\u09C7\u0964" });
  }
});
app.post("/api/evaluate-sentence", async (req, res) => {
  const userApiKey = req.headers["x-gemini-api-key"] || req.body.apiKey;
  const client = getGenAIClient(userApiKey);
  if (!client) {
    return res.status(401).json({
      error: "AI \u09AB\u09BF\u099A\u09BE\u09B0 \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 \u0986\u09AA\u09A8\u09BE\u09B0 \u09A8\u09BF\u099C\u09B8\u09CD\u09AC Gemini API Key \u09AF\u09CB\u0997 \u0995\u09B0\u09C1\u09A8\u0964",
      requireApiKey: true
    });
  }
  try {
    const { patternId, structure, promptBn, userSentence } = req.body;
    const prompt = `You are a master English teacher evaluating a student's sentence practice in 'The English Master Key' course.
Pattern ID: ${patternId || 1}
Target Pattern Structure: ${structure}
Target Bengali Meaning: ${promptBn}
Student's English Sentence: "${userSentence}"

Evaluate the sentence and reply strictly in valid JSON format:
{
  "isCorrect": boolean,
  "accuracyScore": number (0 to 100),
  "feedbackBn": "Short encouraging feedback in Bengali explaining whether the pattern was used correctly, any grammar mistakes, or tips",
  "suggestedVersion": "Polished, natural English version of the sentence",
  "alternativePhrases": ["alternative 1", "alternative 2"]
}`;
    const response = await client.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.3
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error) {
    console.error("Evaluation API Error:", error);
    res.status(500).json({ error: error.message || "Failed to evaluate sentence" });
  }
});
app.post("/api/chat", async (req, res) => {
  const userApiKey = req.headers["x-gemini-api-key"] || req.body.apiKey;
  const client = getGenAIClient(userApiKey);
  if (!client) {
    return res.status(401).json({
      error: "AI \u099A\u09CD\u09AF\u09BE\u099F \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 \u0986\u09AA\u09A8\u09BE\u09B0 \u09A8\u09BF\u099C\u09B8\u09CD\u09AC Gemini API Key \u09AF\u09CB\u0997 \u0995\u09B0\u09C1\u09A8\u0964",
      requireApiKey: true
    });
  }
  try {
    const { message, history, patternContext } = req.body;
    const contents = [];
    if (history && Array.isArray(history)) {
      history.forEach((turn) => {
        contents.push({ role: turn.role, parts: [{ text: turn.text }] });
      });
    }
    contents.push({ role: "user", parts: [{ text: message }] });
    let systemInstruction = BASE_SYSTEM_INSTRUCTION;
    if (patternContext) {
      systemInstruction += `

ACTIVE PATTERN DRILL:
Level / Pattern: ${patternContext.patternNumber} - ${patternContext.structure}
Meaning: ${patternContext.bengaliMeaning}
Focus on helping the student practice and master this specific pattern in conversation!`;
    }
    const response = await client.models.generateContent({
      model: "gemini-3.7-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });
    res.json({ reply: response.text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate response" });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  const wss = new import_ws.WebSocketServer({ server, path: "/live" });
  wss.on("connection", async (clientWs, req) => {
    try {
      const parsedUrl = import_url.default.parse(req.url || "", true);
      const clientApiKey = parsedUrl.query.apiKey || req.headers["x-gemini-api-key"];
      const clientAi = getGenAIClient(clientApiKey);
      if (!clientAi) {
        clientWs.send(JSON.stringify({
          error: "AI \u0995\u09CB\u099A\u09C7\u09B0 \u09B8\u09BE\u09A5\u09C7 \u0995\u09A5\u09BE \u09AC\u09B2\u09A4\u09C7 \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 \u0986\u09AA\u09A8\u09BE\u09B0 Gemini API Key \u09AF\u09C1\u0995\u09CD\u09A4 \u0995\u09B0\u09C1\u09A8\u0964",
          requireApiKey: true
        }));
        clientWs.close(1008, "Gemini API key required");
        return;
      }
      console.log("Starting real-time Gemini Live audio session for English Master Key...");
      const patternId = parsedUrl.query.patternId || "1";
      const patternStructure = parsedUrl.query.structure || "Subject + want(s) + to + Verb";
      const patternMeaning = parsedUrl.query.meaning || "\u0995\u09C7\u0989 \u0995\u09CB\u09A8\u09CB \u0995\u09BF\u099B\u09C1 \u0995\u09B0\u09A4\u09C7 \u099A\u09BE\u09DF";
      const topic = parsedUrl.query.topic || "Daily Life";
      const promptQuestion = parsedUrl.query.promptQuestion || "";
      const sampleAnswer = parsedUrl.query.sampleAnswer || "";
      const sampleEn1 = parsedUrl.query.sampleEn1 || "";
      const sampleBn1 = parsedUrl.query.sampleBn1 || "";
      const grammarNote = parsedUrl.query.grammarNote || "";
      const powerWord = parsedUrl.query.powerWord || "";
      const dynamicSystemInstruction = `${AIR_BASE_INSTRUCTION}

CURRENT PATTERN PRACTICE SESSION DETAILS:
- Level / Pattern ID: Level ${patternId}
- Structure (\u09AB\u09B0\u09CD\u09AE\u09C1\u09B2\u09BE): ${patternStructure}
- Bengali Meaning (\u0985\u09B0\u09CD\u09A5): ${patternMeaning}
- Topic: ${topic}
- Core Rule: ${grammarNote || "Right forms of verb & accurate structure"}
- Example: "${sampleEn1}" (${sampleBn1})

CRITICAL SPEED & BEHAVIOR RULES (Zero Latency Directives):
1. **NO INTERNAL MONOLOGUES:** Do NOT generate any thought process, meta-analysis, or reasoning headers like "**Choosing a response**" or "**Thinking**". Start speaking your real reply IMMEDIATELY.
2. **SUPER FAST & CONCISE (\u09E7-\u09E8 \u09B2\u09BE\u0987\u09A8\u09C7 \u0989\u09A4\u09CD\u09A4\u09B0):** Keep every response strictly to 1-2 punchy, enthusiastic, spoken sentences in natural Bengali/English. Never give long lectures.
3. **ACCURATE INTERACTION:** 
   - If student builds sentence correctly: say "\u09B8\u09BE\u09AC\u09BE\u09B6!" or "Superb!" and immediately give next real-life fun situation.
   - If student makes a mistake: gently correct them and have them repeat.
   - If student asks something: answer directly in 1 friendly sentence.
4. **HANG UP:** When the user explicitly says "\u09B0\u09BE\u0996\u099B\u09BF", "bye Air", "\u0986\u099C\u0995\u09C7\u09B0 \u09AE\u09A4\u09CB \u09A5\u09BE\u0995", call 'hangUpCall' immediately.`;
      const LIVE_MODEL = "gemini-3.1-flash-live-preview";
      const sessionPromise = clientAi.live.connect({
        model: LIVE_MODEL,
        config: {
          responseModalities: [import_genai.Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Puck" }
            }
          },
          systemInstruction: dynamicSystemInstruction,
          tools: [
            {
              functionDeclarations: [
                {
                  name: "hangUpCall",
                  description: "Hang up / disconnect the live audio call immediately when the user explicitly requests to stop practicing, hang up, or says goodbye (e.g. '\u0995\u09B2 \u0995\u09C7\u099F\u09C7 \u09A6\u09BE\u0993', '\u0986\u099A\u09CD\u099B\u09BE \u09B0\u09BE\u0996\u099B\u09BF', '\u0986\u099C\u0995\u09C7\u09B0 \u09AE\u09A4\u09CB \u09A5\u09BE\u0995', 'bye Air', '\u09AA\u09B0\u09C7 \u0995\u09A5\u09BE \u09AC\u09B2\u09AC', 'hang up').",
                  parameters: {
                    type: import_genai.Type.OBJECT,
                    properties: {
                      farewellReason: {
                        type: import_genai.Type.STRING,
                        description: "A short, friendly, witty goodbye phrase in Bengali before hanging up."
                      }
                    },
                    required: ["farewellReason"]
                  }
                }
              ]
            }
          ]
        },
        callbacks: {
          onmessage: (message) => {
            try {
              if (message.toolCall?.functionCalls) {
                for (const call of message.toolCall.functionCalls) {
                  if (call.name === "hangUpCall") {
                    const farewell = call.args?.farewellReason || "\u0986\u099A\u09CD\u099B\u09BE, \u09A0\u09BF\u0995 \u0986\u099B\u09C7! \u0986\u099C\u0995\u09C7\u09B0 \u09AE\u09A4\u09CB \u09B0\u09BE\u0996\u099B\u09BF\u0964 \u0996\u09C1\u09AC \u09AD\u09BE\u09B2\u09CB \u09AA\u09CD\u09B0\u09CD\u09AF\u09BE\u0995\u099F\u09BF\u09B8 \u09B9\u09B2\u09CB!";
                    clientWs.send(JSON.stringify({
                      hangUp: true,
                      text: farewell,
                      reason: farewell
                    }));
                    sessionPromise.then((session) => {
                      try {
                        session.sendToolResponse({
                          functionResponses: [
                            {
                              id: call.id,
                              name: call.name,
                              response: { output: "Call disconnected." }
                            }
                          ]
                        });
                      } catch (e) {
                      }
                    });
                  }
                }
              }
              const parts = message.serverContent?.modelTurn?.parts;
              if (parts && parts.length > 0) {
                for (const part of parts) {
                  if (part.inlineData?.data) {
                    clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
                  }
                  if (part.text) {
                    const text = part.text.trim();
                    const isThought = text.startsWith("**") || text.startsWith("Thinking") || text.includes("Choosing a Response") || text.includes("I've decided on") || text.startsWith("*");
                    if (!isThought && text.length > 0) {
                      clientWs.send(JSON.stringify({ text }));
                    }
                  }
                }
              }
              if (message.serverContent?.outputTranscription?.text) {
                clientWs.send(JSON.stringify({ text: message.serverContent.outputTranscription.text }));
              }
              if (message.serverContent?.interrupted) {
                clientWs.send(JSON.stringify({ interrupted: true }));
              }
              if (message.serverContent?.turnComplete) {
                clientWs.send(JSON.stringify({ turnComplete: true }));
              }
            } catch (e) {
              console.error("Error processing Live message:", e);
            }
          },
          onerror: (err) => {
            console.error("Gemini Live session error:", err);
            try {
              clientWs.send(JSON.stringify({ error: err.message || "Live session error" }));
            } catch (e) {
            }
          },
          onclose: () => {
            console.log("Gemini Live session closed by upstream.");
          }
        }
      });
      sessionPromise.then((session) => {
        try {
          session.sendClientContent({
            turns: [{ role: "user", parts: [{ text: `[SYSTEM TRIGGER: The call has just connected. Speak in natural energetic BENGALI immediately without meta-thinking.] \u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE \u099C\u09BE\u09A8\u09BF\u09DF\u09C7 \u098F\u0995 \u09B2\u09BE\u0987\u09A8\u09C7 \u09AC\u09B2\u09CB: "\u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE \u09B2\u09C7\u09AD\u09C7\u09B2 ${patternId}-\u098F! \u0986\u099C\u0995\u09C7 \u0986\u09AE\u09BE\u09A6\u09C7\u09B0 \u09AA\u09CD\u09AF\u09BE\u099F\u09BE\u09B0\u09CD\u09A8: ${patternStructure} \u2014 \u09AE\u09BE\u09A8\u09C7 '${patternMeaning}'\u0964 \u09AF\u09C7\u09AE\u09A8: ${sampleBn1 || "\u0986\u09AE\u09BF \u098F\u099F\u09BE \u0995\u09B0\u09A4\u09C7 \u099A\u09BE\u0987"} = ${sampleEn1 || "I want to do this"}\u0964 \u098F\u09AC\u09BE\u09B0 \u09AC\u09B2\u09CB \u09A4\u09CB: '\u0986\u09AE\u09BF \u098F\u0995 \u0995\u09BE\u09AA \u0995\u09AB\u09BF \u0996\u09C7\u09A4\u09C7 \u099A\u09BE\u0987'\u2014\u098F\u09B0 \u0987\u0982\u09B0\u09C7\u099C\u09BF \u0995\u09C0 \u09B9\u09AC\u09C7?"` }] }],
            turnComplete: true
          });
        } catch (e) {
          console.warn("Greeting trigger err:", e);
        }
      }).catch((err) => {
        console.error("Failed to connect Gemini Live session:", err);
        try {
          clientWs.send(JSON.stringify({ error: "Failed to establish Live connection. " + (err.message || "") }));
        } catch (e) {
        }
      });
      clientWs.on("message", async (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          const session = await sessionPromise;
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { mimeType: "audio/pcm;rate=16000", data: parsed.audio }
            });
          } else if (parsed.endOfSpeech) {
            session.sendRealtimeInput({
              audioStreamEnd: true
            });
          } else if (parsed.text) {
            session.sendClientContent({
              turns: [{ role: "user", parts: [{ text: parsed.text }] }],
              turnComplete: true
            });
          }
        } catch (err) {
          console.error("Error forwarding message to Gemini Live:", err);
        }
      });
      clientWs.on("close", async () => {
        try {
          const session = await sessionPromise;
          session.close();
        } catch (err) {
        }
      });
    } catch (e) {
      console.error("WebSocket setup error:", e);
      try {
        clientWs.send(JSON.stringify({ error: e.message || "WebSocket error" }));
        clientWs.close(1011, "Failed to start Live session");
      } catch (err) {
      }
    }
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
