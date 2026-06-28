import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Chat } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });

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
    console.error(err);
    return res.status(500).json({ error: err.message || "An error occurred" });
  }
}
