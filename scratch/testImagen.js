import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

// Read .env manually
const env = fs.readFileSync('.env', 'utf-8');
const match = env.match(/VITE_GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : '';

const ai = new GoogleGenAI({ apiKey });

async function testImagen() {
  try {
    console.log("Generating image...");
    const response = await ai.models.generateImages({
      model: "imagen-4.0-fast-generate-001",
      prompt: "A simple red car drawing.",
      config: {
        numberOfImages: 1,
        aspectRatio: "16:9",
      }
    });

    console.log("Image response keys:", Object.keys(response));
    console.log("Generated images:", response.generatedImages.length);
    console.log("Image type:", typeof response.generatedImages[0].image.imageBytes);
  } catch (err) {
    console.error("Imagen API error:", err);
  }
}

testImagen();
