
import React, { useState, useRef, useEffect } from 'react';
import { Linkedin, Mail, Sparkles, Phone, Volume2, VolumeX, Info, X, ExternalLink, Bot } from 'lucide-react';
import { Message, SendingState } from './types';
import { DEFAULT_RESUME, PROFILE_IMAGE_URL } from './constants';
import { sendMessageToGemini } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import InputBar from './components/InputBar';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sendingState, setSendingState] = useState<SendingState>(SendingState.IDLE);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use the raw profile image URL from constants
  const finalImageUrl = PROFILE_IMAGE_URL;
  const fallbackImageUrl = "https://ui-avatars.com/api/?name=Saicharan+Vaddadi&background=4f46e5&color=fff&size=512";

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load voices - Critical for Mobile support
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Initial welcome message
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: "Hello! I am Saicharan's AI Agent. I've analyzed his professional background at T. Rowe Price and Conduent. Ask me anything about his expertise in microservices, AWS, or RAG!",
        timestamp: Date.now()
      }
    ]);
  }, []);

  const speakText = (text: string) => {
    if (!isAudioEnabled) return;
    window.speechSynthesis.cancel();

    const speechText = text
      .replace(/[*#_`]/g, '')               
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') 
      .replace(/https?:\/\/\S+/g, '')       
      .trim();

    const utterance = new SpeechSynthesisUtterance(speechText);
    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();

    const selectedVoice = 
      voices.find(v => v.name.includes('Rishi') || v.name.includes('Ravi')) || 
      voices.find(v => v.name.includes('Daniel') || v.name.includes('Martin') || v.name.includes('David')) ||
      voices.find(v => v.name.toLowerCase().includes('male')) ||
      null;

    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = 1.1; 
    utterance.pitch = selectedVoice && (selectedVoice.name.toLowerCase().includes('female') || !selectedVoice.name.toLowerCase().includes('male')) ? 0.7 : 1.0;
    
    window.speechSynthesis.speak(utterance);
  };

  const processInput = async (input: string | Blob) => {
    setSendingState(SendingState.PROCESSING);
    window.speechSynthesis.cancel(); 

    const userMsgId = Date.now().toString();
    const userMessage: Message = {
      id: userMsgId,
      role: 'user',
      text: input instanceof Blob ? "Audio Question..." : input,
      isAudio: input instanceof Blob,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);

    const responseText = await sendMessageToGemini(DEFAULT_RESUME, input);

    const modelMsgId = (Date.now() + 1).toString();
    const modelMessage: Message = {
      id: modelMsgId,
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, modelMessage]);
    setSendingState(SendingState.IDLE);
    speakText(responseText);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.target as HTMLImageElement;
    if (img.src !== fallbackImageUrl) {
      img.src = fallbackImageUrl;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Header */}
      <header className="flex-none bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-30 sticky top-0 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0 cursor-pointer" onClick={() => setIsSidebarOpen(true)}>
                <div className="absolute -inset-0.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full opacity-70 group-hover:opacity-100 transition duration-300 blur-[1px]"></div>
                <img 
                  src={finalImageUrl} 
                  alt="Saicharan Vaddadi" 
                  onError={handleImageError}
                  className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover object-top border-2 border-slate-900 shadow-xl bg-slate-800"
                  style={{ imageRendering: 'auto' }}
                />
                <div className="absolute -bottom-1 -right-1 bg-indigo-600 rounded-full p-1 border-2 border-slate-900">
                  <Bot size={12} className="text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-bold text-lg sm:text-2xl tracking-tight text-white leading-none">Saicharan Vaddadi</h1>
                  <div className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center gap-1.5 backdrop-blur-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">AI Agent</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                   <span className="text-xs sm:text-sm font-medium text-slate-400">Sr. Software Engineer</span>
                   <button 
                     onClick={() => setIsSidebarOpen(true)}
                     className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 transition-colors"
                   >
                     <Info size={12} /> Bio
                   </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
               <div className="hidden md:flex items-center gap-2 mr-2">
                  <a href="mailto:scharanv12@gmail.com" className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-indigo-600 transition-all duration-200" title="Email">
                    <Mail size={18}/>
                  </a>
                  <a href="https://www.linkedin.com/in/saicharan-vaddadi-390603163" target="_blank" className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-[#0077b5] transition-all duration-200" title="LinkedIn">
                    <Linkedin size={18}/>
                  </a>
               </div>
               
               <button
                onClick={() => {
                  const newState = !isAudioEnabled;
                  setIsAudioEnabled(newState);
                  if (!newState) window.speechSynthesis.cancel();
                }}
                className={`p-2.5 rounded-lg transition-all border ${
                  isAudioEnabled 
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                    : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
                title={isAudioEnabled ? "Mute Voice" : "Unmute Voice"}
               >
                 {isAudioEnabled ? <Volume2 size={22} /> : <VolumeX size={22} />}
               </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        
        {/* Chat Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 scroll-smooth scrollbar-hide">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            
            {sendingState === SendingState.PROCESSING && (
              <div className="flex w-full justify-start mb-6 animate-in fade-in duration-300">
                <div className="flex max-w-[85%] flex-row items-center gap-3">
                   <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                     <Sparkles size={16} className="animate-pulse" />
                   </div>
                   <div className="bg-slate-800/80 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-700">
                     <div className="flex space-x-1">
                       <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                       <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                       <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                     </div>
                   </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <InputBar 
            onSendText={processInput} 
            onSendAudio={processInput}
            sendingState={sendingState} 
          />
        </main>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-80 border-l border-slate-800 bg-slate-900/30 p-0 overflow-y-auto">
          <ProfileContent finalImageUrl={finalImageUrl} handleImageError={handleImageError} />
        </aside>
      </div>

      {/* Mobile Sidebar (Slide-over) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-slate-900 border-l border-slate-700 shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="h-full overflow-y-auto relative">
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-md transition-all"
              >
                <X size={24} />
              </button>
              <ProfileContent finalImageUrl={finalImageUrl} handleImageError={handleImageError} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Extracted Profile Content for reuse
interface ProfileContentProps {
  finalImageUrl: string;
  handleImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

const ProfileContent = ({ finalImageUrl, handleImageError }: ProfileContentProps) => (
  <div className="flex flex-col h-full">
    {/* High Resolution Image Container */}
    <div className="relative aspect-[4/5] w-full bg-slate-800 overflow-hidden shrink-0">
      <img 
        src={finalImageUrl} 
        alt="Saicharan Vaddadi" 
        onError={handleImageError}
        className="w-full h-full object-cover object-top"
        style={{ imageRendering: 'auto' }}
      />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
      <div className="absolute bottom-6 left-6 right-6">
        <h2 className="text-2xl font-bold text-white mb-1">Saicharan Vaddadi</h2>
        <p className="text-indigo-400 font-medium text-sm">Senior Software Engineer</p>
      </div>
    </div>

    <div className="p-6 space-y-8 flex-1">
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
          <Info size={14} className="text-indigo-500" />
          About
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed font-light">
          A results-driven Senior Software Engineer with over a decade of experience in the fintech and insurance domains. 
          Expertise spans across high-performance microservices, AWS cloud architecture, and cutting-edge AI Agent implementations.
        </p>
      </section>

      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
          <Sparkles size={14} className="text-indigo-500" />
          Core Stack
        </h3>
        <div className="flex flex-wrap gap-2">
          {['Java Spring Boot', 'AWS Ecosystem', 'React / TS', 'AI & RAG', 'Appian', 'SQL Expert'].map(skill => (
            <span key={skill} className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-xs font-medium text-indigo-300 border border-indigo-500/20">
              {skill}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
          <Mail size={14} className="text-indigo-500" />
          Connect
        </h3>
        <ul className="space-y-4 text-sm">
          <li className="group">
            <a href="mailto:scharanv12@gmail.com" className="flex items-center gap-3 text-slate-300 group-hover:text-indigo-400 transition-colors">
              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 group-hover:border-indigo-500/50 transition-all">
                <Mail size={16} className="text-slate-500 group-hover:text-indigo-400" />
              </div>
              scharanv12@gmail.com
            </a>
          </li>
          <li className="group">
            <a href="tel:8138032143" className="flex items-center gap-3 text-slate-300 group-hover:text-indigo-400 transition-colors">
              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 group-hover:border-indigo-500/50 transition-all">
                <Phone size={16} className="text-slate-500 group-hover:text-indigo-400" />
              </div>
              813 (803) 2143
            </a>
          </li>
          <li className="group">
            <a href="https://linkedin.com/in/saicharan-vaddadi-390603163" target="_blank" className="flex items-center gap-3 text-slate-300 group-hover:text-indigo-400 transition-colors">
              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 group-hover:border-indigo-500/50 transition-all">
                <Linkedin size={16} className="text-slate-500 group-hover:text-indigo-400" />
              </div>
              LinkedIn <ExternalLink size={12} className="opacity-50" />
            </a>
          </li>
        </ul>
      </section>

      <section className="pt-6 border-t border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] text-slate-400 uppercase tracking-tighter font-bold">Verified Agent Active</span>
        </div>
        <p className="text-[10px] text-slate-500 italic leading-tight">
          This interface is powered by a custom RAG pipeline trained on Saicharan's professional history and achievements.
        </p>
      </section>
    </div>
  </div>
);

export default App;
