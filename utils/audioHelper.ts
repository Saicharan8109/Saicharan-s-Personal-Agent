export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const createWavBlob = (audioData: Float32Array): Blob => {
  // Simple WAV encoder could go here if raw PCM is needed, 
  // but for this app we will use the MediaRecorder's native output (webm/mp4)
  // which Gemini supports directly.
  return new Blob([audioData], { type: 'audio/wav' });
};