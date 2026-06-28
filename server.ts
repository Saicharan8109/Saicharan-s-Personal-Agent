import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Chat } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize GoogleGenAI server-side
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: Gemini API key is missing. Please set GEMINI_API_KEY in your environment variables.");
}
const ai = new GoogleGenAI({ apiKey: apiKey || 'missing-key' });

// Basic in-memory session store
const sessions = new Map<string, Chat>();

app.post('/api/chat', async (req, res) => {
  try {
    const { sessionId, resumeContent, input, isAudio, mimeType, systemInstruction } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    let session = sessions.get(sessionId);
    if (!session) {
      session = ai.chats.create({
        model: "gemini-2.5-flash",
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
    
    res.json({ text: result.text || "I couldn't generate a response." });
  } catch (err: any) {
    const errorMessage = err.message || "";
    const sanitizedMessage = errorMessage.replace(/api_key:[\w-]+/g, 'api_key:[REDACTED]');
    console.error("Chat API Error:", sanitizedMessage);
    res.status(500).json({ error: "An error occurred while communicating with the AI service." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
