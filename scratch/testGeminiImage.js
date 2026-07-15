import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

// Read .env manually
const env = fs.readFileSync('.env', 'utf-8');
const match = env.match(/VITE_GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : '';

const ai = new GoogleGenAI({ apiKey });

async function testGeminiImage() {
  try {
    console.log("Generating image with gemini-3.1-flash-image...");
    const response = await ai.models.generateImages({
      model: "gemini-3.1-flash-image",
      prompt: "A simple red car drawing.",
      config: {
        numberOfImages: 1,
        aspectRatio: "16:9",
      }
    });

    console.log("SUCCESS!");
    console.log("Image response keys:", Object.keys(response));
    console.log("Generated images:", response.generatedImages.length);
    console.log("Image data length:", response.generatedImages[0].image.imageBytes.length);
  } catch (err) {
    console.error("Gemini Image API error:", err.message || err);
  }
}

testGeminiImage();
