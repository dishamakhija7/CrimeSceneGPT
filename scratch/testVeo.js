import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

// Read .env manually
const env = fs.readFileSync('.env', 'utf-8');
const match = env.match(/VITE_GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : '';

const ai = new GoogleGenAI({ apiKey });

async function testVeo() {
  try {
    console.log("Initiating Veo generation...");
    const operation = await ai.models.generateVideos({
      model: "veo-3.1-fast-generate-preview",
      prompt: "A low-poly 3D render of a car collision at an intersection, high angle view, 3D graphics.",
      config: {
        aspectRatio: "16:9",
        resolution: "720p",
      }
    });

    console.log("Operation initiated successfully. Name:", operation.name);
    console.log("Is Done:", operation.done);
  } catch (err) {
    console.error("Veo API error:", err);
  }
}

testVeo();
