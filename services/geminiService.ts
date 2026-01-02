
import { GoogleGenAI, Chat } from "@google/genai";
import { SYSTEM_INSTRUCTION_TEMPLATE } from "../constants";
import { blobToBase64 } from "../utils/audioHelper";

let client: GoogleGenAI | null = null;
let chatSession: Chat | null = null;

// Initialize the API client
const initializeClient = () => {
  if (!client) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY is missing from environment variables");
      return;
    }
    client = new GoogleGenAI({ apiKey });
  }
};

// Reset chat session (e.g., when resume changes)
export const resetChatSession = () => {
  chatSession = null;
};

// Get or create a chat session with the specific resume context
const getChatSession = (resumeContent: string): Chat => {
  initializeClient();
  if (!client) throw new Error("Client not initialized");

  if (!chatSession) {
    const systemInstruction = `${SYSTEM_INSTRUCTION_TEMPLATE}\n${resumeContent}`;
    chatSession = client.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });
  }
  return chatSession;
};

export const sendMessageToGemini = async (
  resumeContent: string,
  input: string | Blob
): Promise<string> => {
  try {
    const session = getChatSession(resumeContent);
    let result;

    if (input instanceof Blob) {
      // Handle Audio Input
      const base64Audio = await blobToBase64(input);
      const mimeType = input.type || 'audio/webm';
      
      result = await session.sendMessage({
        message: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          {
            text: "Please answer the question spoken in this audio based on the profile context."
          }
        ]
      });
    } else {
      // Handle Text Input
      result = await session.sendMessage({
        message: input
      });
    }

    return result.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Error communicating with Gemini:", error);
    return "Sorry, I encountered an error processing your request. Please try again.";
  }
};
