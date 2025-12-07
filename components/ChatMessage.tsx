import React from 'react';
import { Bot, User, Volume2 } from 'lucide-react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-indigo-600 text-white' 
            : 'bg-emerald-600 text-white'
        }`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
            isUser
              ? 'bg-slate-700 text-slate-100 rounded-tr-none'
              : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
          }`}>
             {/* If it was an audio message from user, show icon */}
             {message.isAudio && isUser && (
               <div className="flex items-center space-x-2 text-indigo-300 mb-1">
                 <Volume2 size={14} />
                 <span className="text-xs font-medium uppercase tracking-wider">Voice Input</span>
               </div>
             )}
            <div className="whitespace-pre-wrap">{message.text}</div>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;