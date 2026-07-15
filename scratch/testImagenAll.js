import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

// Read .env manually
const env = fs.readFileSync('.env', 'utf-8');
const match = env.match(/VITE_GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : '';

const ai = new GoogleGenAI({ apiKey });

async function testAll() {
  const models = [
    "imagen-4.0-generate-001",
    "imagen-4.0-fast-generate-001",
    "imagen-4.0-ultra-generate-001",
    "imagen-3.0-generate-002",
    "imagen-3.0-fast-001",
    "imagen-3.0-generate-001",
    "imagen-3.0-fast-generate-001"
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
