
import { SYSTEM_INSTRUCTION_TEMPLATE } from "../constants";
import { blobToBase64 } from "../utils/audioHelper";

// We generate a simple session ID for the current user's session
let currentSessionId = Math.random().toString(36).substring(2, 15);

// Reset chat session (e.g., when resume changes)
export const resetChatSession = () => {
  currentSessionId = Math.random().toString(36).substring(2, 15);
};

export const sendMessageToGemini = async (
  resumeContent: string,
  input: string | Blob
): Promise<string> => {
  try {
    let payload: any = {
      sessionId: currentSessionId,
      resumeContent,
      systemInstruction: SYSTEM_INSTRUCTION_TEMPLATE,
      isAudio: false,
    };

    if (input instanceof Blob) {
      // Handle Audio Input
      payload.isAudio = true;
      payload.mimeType = input.type || 'audio/webm';
      payload.input = await blobToBase64(input);
    } else {
      payload.input = input;
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    return data.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Error communicating with backend:", error);
    return "Sorry, I encountered an error processing your request. Please try again.";
  }
};
