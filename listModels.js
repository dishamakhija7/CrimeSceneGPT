import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

// Read .env manually
const env = fs.readFileSync('.env', 'utf-8');
const match = env.match(/VITE_GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : '';

const ai = new GoogleGenAI({ apiKey });

async function listModels() {
  try {
    const response = await ai.models.list();
    for await (const model of response) {
      console.log(`Model: ${model.name}`);
    }
  } catch (err) {
    console.error("Failed to list models:", err);
  }
}

listModels();
