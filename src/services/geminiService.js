import { GoogleGenAI } from '@google/genai';

/**
 * Initializes the Gemini API client.
 * We fall back to importing the key from environment variables (Vite uses import.meta.env).
 */
const getGeminiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Missing VITE_GEMINI_API_KEY in environment variables.");
    throw new Error("Missing Gemini API Key");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Calls the Gemini API with structured output using a defined JSON schema.
 * 
 * @param {Object} params
 * @param {string} params.prompt - The instruction or prompt for the model.
 * @param {Array<Object>} [params.mediaInputs] - Optional array of media inputs or context (e.g. text/image data).
 * @param {Object} params.schema - The JSON schema structure to enforce.
 * @param {string} [params.model] - The Gemini model to use (default: gemini-2.5-flash).
 * @returns {Promise<Object>} The parsed structured JSON.
 */
export const callGeminiWithStructuredOutput = async ({
  prompt,
  mediaInputs = [],
  schema,
  model = 'gemini-3.1-flash-lite',
  maxRetries = 3
}) => {
  const ai = getGeminiClient();
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const generatePromise = ai.models.generateContent({
        model,
        contents: [prompt, ...mediaInputs],
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        }
      });

      // 15 second timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Gemini API request timed out after 15 seconds.")), 15000)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Gemini returned an empty response.");
      }

      return JSON.parse(responseText);
    } catch (error) {
      attempt++;
      
      const errorMessage = error?.message || '';
      const isRateLimitOr503 = error?.status === 503 || error?.status === 429 || 
                               errorMessage.includes('503') || errorMessage.includes('429') || 
                               errorMessage.includes('UNAVAILABLE') || errorMessage.includes('timed out');
      
      // If we are out of retries OR the error is not a transient 503/429, fail immediately.
      if (attempt > maxRetries || !isRateLimitOr503) {
        console.error(`Error calling Gemini API (Attempt ${attempt}):`, error);
        throw error;
      }

      // Exponential backoff delay (2s, 4s, 8s...)
      const delayMs = 2000 * Math.pow(2, attempt - 1);
      console.warn(`Gemini API 503/Timeout. Retrying in ${delayMs}ms... (Attempt ${attempt}/${maxRetries})`);
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
};
