import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Chat } from "@google/genai";

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: Gemini API key is missing. Please set GEMINI_API_KEY in your environment variables.");
}
const ai = new GoogleGenAI({ apiKey: apiKey || 'missing-key' });

// Basic in-memory session store (Note: In a serverless environment like Vercel, 
// this may reset if the function cold-starts, but it will work for general conversational use)
const sessions = new Map<string, Chat>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  try {
    const { sessionId, resumeContent, input, isAudio, mimeType, systemInstruction } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    let session = sessions.get(sessionId);
    if (!session) {
      session = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: systemInstruction + "\n" + resumeContent,
          temperature: 0.7,
        },
      });
      sessions.set(sessionId, session);
    }
    
    let result;
    if (isAudio) {
      result = await session.sendMessage({
        message: [
          {
            inlineData: {
              mimeType: mimeType,
              data: input // base64 string
            }
          },
          {
            text: "Please answer the question spoken in this audio based on the profile context."
          }
        ]
      });
    } else {
      result = await session.sendMessage({
        message: input
      });
    }
    
    return res.status(200).json({ text: result.text || "I couldn't generate a response." });
  } catch (err: any) {
    const errorMessage = err.message || "";
    // Sanitize the error message to remove potential API key exposures
    const sanitizedMessage = errorMessage.replace(/api_key:[\w-]+/g, 'api_key:[REDACTED]');
    
    console.error("Chat API Error:", sanitizedMessage);
    return res.status(500).json({ error: "An error occurred while communicating with the AI service." });
  }
}
