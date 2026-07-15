import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

// Read .env manually
const env = fs.readFileSync('.env', 'utf-8');
const match = env.match(/VITE_GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : '';

const ai = new GoogleGenAI({ apiKey });

async function testGeminiConnection() {
  const model = 'gemini-3.1-flash-lite';
  console.log(`Model used: ${model}`);
  
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: "Reply with exactly the word CONNECTED."
    });
    
    console.log("Raw response:", response.text);
  } catch (error) {
    console.error("Exact error object:", error);
  }
}

testGeminiConnection();
