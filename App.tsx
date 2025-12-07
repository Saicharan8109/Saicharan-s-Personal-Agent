import React, { useState, useRef, useEffect } from 'react';
import { Linkedin, Mail, Sparkles, Phone, Volume2, VolumeX } from 'lucide-react';
import { Message, SendingState } from './types';
import { DEFAULT_RESUME } from './constants';
import { sendMessageToGemini } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import InputBar from './components/InputBar';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sendingState, setSendingState] = useState<SendingState>(SendingState.IDLE);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial welcome message
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: "Hello! I am Saicharan's AI Agent. I can answer any questions about my experience, skills, and background. What would you like to know?",
        timestamp: Date.now()
      }
    ]);
  }, []);

  // Speak text function
  const speakText = (text: string) => {
    if (!isAudioEnabled) return;
    
    // Cancel any current speech
    window.speechSynthesis.cancel();

    // Clean text for speech: 
    // 1. Remove markdown symbols (*, #, `)
    // 2. Remove links but keep text [text](url) -> text
    // 3. Remove raw URLs
    const speechText = text
      .replace(/[*#_`]/g, '')               // Remove markdown chars
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Keep link text, remove URL
      .replace(/https?:\/\/\S+/g, '')       // Remove raw URLs
      .trim();

    const utterance = new SpeechSynthesisUtterance(speechText);
    // Ensure voices are loaded (sometimes necessary for Chrome)
    let voices = window.speechSynthesis.getVoices();

    // Priority list to approximate "en-IN-Wavenet-B" (Indian Male) or high quality male
    const preferredVoice = voices.find(v => 
      // 1. Specific Indian Male voices (OS dependent)
      v.name.includes('Rishi') ||  // macOS Indian Male
      v.name.includes('Ravi') ||   // Windows Indian Male
      v.name.includes('Probhat') || // ChromeOS
      (v.lang === 'en-IN' && v.name.toLowerCase().includes('male')) ||

      // 2. "Natural" male voices (Edge/Cloud) - often high quality
      (v.name.includes('Natural') && v.name.includes('Male')) ||
      v.name.includes('Microsoft Guy') || 

      // 3. Fallback to standard high-quality US voices if Indian isn't available
      v.name === 'Google US English' || 
      v.name.includes('Daniel') || // macOS UK Male
      v.name.includes('Microsoft David') || // Windows US Male
      
      // 4. Generic fallback
      (v.name.toLowerCase().includes('male') && v.lang.startsWith('en'))
    );

    // Fallback if no specific male voice is found
    const genericEnglish = voices.find(v => v.lang === 'en-US' || v.lang === 'en-GB');

    if (preferredVoice) {
      utterance.voice = preferredVoice;
      // Adjust pitch based on voice type
      if (preferredVoice.name === 'Google US English') {
        utterance.pitch = 0.9;
      } else if (preferredVoice.lang === 'en-IN') {
        // Indian voices usually sound good at normal pitch
        utterance.pitch = 1.0; 
      } else {
        utterance.pitch = 1.0;
      }
    } else if (genericEnglish) {
      utterance.voice = genericEnglish;
      utterance.pitch = 0.85; 
    }
    
    // SPEED: Fast reading as requested
    utterance.rate = 1.65;
    
    window.speechSynthesis.speak(utterance);
  };

  // Handle Send Logic (Shared for Text and Audio)
  const processInput = async (input: string | Blob) => {
    setSendingState(SendingState.PROCESSING);
    window.speechSynthesis.cancel(); // Stop speaking if user interrupts

    // 1. Add User Message
    const userMsgId = Date.now().toString();
    const userMessage: Message = {
      id: userMsgId,
      role: 'user',
      text: input instanceof Blob ? "Audio Question..." : input,
      isAudio: input instanceof Blob,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);

    // 2. Call Gemini API
    const responseText = await sendMessageToGemini(DEFAULT_RESUME, input);

    // 3. Add Model Response
    const modelMsgId = (Date.now() + 1).toString();
    const modelMessage: Message = {
      id: modelMsgId,
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, modelMessage]);
    
    setSendingState(SendingState.IDLE);
    
    // 4. Speak response
    speakText(responseText);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      
      {/* Enhanced Sticky Header */}
      <header className="flex-none bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 z-10 sticky top-0 shadow-lg shadow-black/20">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Profile Info */}
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <div className="absolute -inset-0.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full opacity-70 group-hover:opacity-100 transition duration-500 blur-[2px]"></div>
                <img 
                  src="https://media.licdn.com/dms/image/v2/D4E03AQHz2Vy2NH6H1w/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1689370108712?e=1766620800&v=beta&t=RdHnnv9_fNcBIyyBAqGw6mjeISF81ZtkcWQEmbg-XR8" 
                  alt="Saicharan Vaddadi" 
                  className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-slate-900 shadow-xl"
                />
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
              </div>
              <div>
                <h1 className="font-bold text-xl sm:text-2xl tracking-tight text-white leading-tight">Saicharan Vaddadi</h1>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                   <span className="text-sm font-medium text-indigo-400">Senior Software Engineer</span>
                   <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-600"></span>
                   <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-700/50">
                     <Sparkles size={10} className="text-amber-400" /> AI Agent
                   </span>
                </div>
              </div>
            </div>

            {/* Contact Actions & Controls */}
            <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-4 pl-16 md:pl-0">
               {/* Links */}
               <div className="flex items-center gap-2">
                  <a href="mailto:scharanv12@gmail.com" className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-indigo-600 transition-all duration-300" title="Email">
                    <Mail size={18}/>
                  </a>
                  <a href="https://www.linkedin.com/in/saicharan-vaddadi-390603163" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-[#0077b5] transition-all duration-300" title="LinkedIn">
                    <Linkedin size={18}/>
                  </a>
                  <a href="tel:8138032143" className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-emerald-600 transition-all duration-300" title="Phone">
                    <Phone size={18}/>
                  </a>
               </div>
               
               <div className="h-8 w-px bg-slate-800 mx-1"></div>

               {/* Audio Toggle */}
               <button
                onClick={() => {
                  const newState = !isAudioEnabled;
                  setIsAudioEnabled(newState);
                  if (!newState) window.speechSynthesis.cancel();
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border ${
                  isAudioEnabled 
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                    : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-400'
                }`}
               >
                 {isAudioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                 <span className="text-xs font-medium hidden sm:inline">{isAudioEnabled ? 'Voice On' : 'Voice Off'}</span>
               </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col max-w-5xl mx-auto w-full">
        
        {/* Chat Area - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 scroll-smooth">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          
          {/* Loading Indicator */}
          {sendingState === SendingState.PROCESSING && (
            <div className="flex w-full justify-start mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex max-w-[85%] flex-row items-center gap-3">
                 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-900/20">
                   <Sparkles size={16} className="animate-spin-slow" />
                 </div>
                 <div className="bg-slate-800 px-5 py-4 rounded-2xl rounded-tl-none border border-slate-700 shadow-sm">
                   <div className="flex space-x-1.5">
                     <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                     <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                     <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                   </div>
                 </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-none">
          <InputBar 
            onSendText={processInput} 
            onSendAudio={processInput}
            sendingState={sendingState} 
          />
        </div>

      </main>

    </div>
  );
};

export default App;