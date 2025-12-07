export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isAudio?: boolean;
  timestamp: number;
}

export interface ResumeData {
  content: string;
}

export enum SendingState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  SPEAKING = 'SPEAKING'
}