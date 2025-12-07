import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Square, Loader2 } from 'lucide-react';
import { SendingState } from '../types';

interface InputBarProps {
  onSendText: (text: string) => void;
  onSendAudio: (audioBlob: Blob) => void;
  sendingState: SendingState;
}

const InputBar: React.FC<InputBarProps> = ({ onSendText, onSendAudio, sendingState }) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // Cleanup recorder on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' }); // Chrome default
        onSendAudio(blob);
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please allow permissions.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendText = () => {
    if (!inputText.trim()) return;
    onSendText(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const isLoading = sendingState === SendingState.PROCESSING;

  return (
    <div className="w-full bg-slate-900 border-t border-slate-800 p-4 sticky bottom-0 z-20">
      <div className="max-w-3xl mx-auto flex items-end gap-3">
        
        {/* Input Field */}
        <div className="flex-1 bg-slate-800 rounded-2xl border border-slate-700 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all shadow-sm">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "Listening..." : "Ask a question about the profile..."}
            disabled={isRecording || isLoading}
            className="w-full bg-transparent text-slate-200 placeholder-slate-500 p-3 max-h-32 min-h-[50px] resize-none focus:outline-none text-sm disabled:opacity-50"
            rows={1}
            style={{ minHeight: '48px' }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          
          {/* Voice Button */}
          {isRecording ? (
            <button
              onClick={handleStopRecording}
              className="p-3 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/50 transition-all animate-pulse"
              title="Stop Recording"
            >
              <Square size={20} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleStartRecording}
              disabled={isLoading || inputText.length > 0}
              className={`p-3 rounded-full transition-all ${
                inputText.length > 0
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-slate-800 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 border border-slate-700'
              }`}
              title="Record Voice Question"
            >
              <Mic size={20} />
            </button>
          )}

          {/* Send Button */}
          <button
            onClick={handleSendText}
            disabled={!inputText.trim() || isLoading || isRecording}
            className={`p-3 rounded-full transition-all ${
              !inputText.trim() || isLoading || isRecording
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-800'
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'
            }`}
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
      
      {/* Helper text for recording */}
      {isRecording && (
        <div className="text-center mt-2">
           <span className="text-xs text-red-400 font-medium animate-pulse">Recording... Click stop to send.</span>
        </div>
      )}
    </div>
  );
};

export default InputBar;