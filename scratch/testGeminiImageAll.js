import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

// Read .env manually
const env = fs.readFileSync('.env', 'utf-8');
const match = env.match(/VITE_GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : '';

const ai = new GoogleGenAI({ apiKey });

async function testAll() {
  const models = [
    "gemini-3.1-flash-lite-image",
    "gemini-3-pro-image",
    "gemini-2.5-flash-image",
    "gemini-3.1-flash-image-preview",
    "gemini-3-pro-image-preview"
  ];

  for (const m of models) {
    try {
      console.log(`Trying model: ${m}...`);
      const response = await ai.models.generateImages({
        model: m,
        prompt: "A red car.",
        config: {
          numberOfImages: 1
        }
      });
      console.log(`SUCCESS with ${m}!`);
      return;
    } catch (err) {
      console.log(`FAILED with ${m}:`, err.message || err);
    }
  }
}

testAll();
