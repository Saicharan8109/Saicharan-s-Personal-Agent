import React, { useState, useEffect } from 'react';
import { X, Save, FileText } from 'lucide-react';

interface ResumeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  currentResume: string;
  onSave: (newResume: string) => void;
}

const ResumeEditor: React.FC<ResumeEditorProps> = ({ isOpen, onClose, currentResume, onSave }) => {
  const [text, setText] = useState(currentResume);

  useEffect(() => {
    setText(currentResume);
  }, [currentResume, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(text);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900">
          <div className="flex items-center space-x-2 text-indigo-400">
            <FileText size={20} />
            <h2 className="text-lg font-semibold text-white">Edit Profile Context</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-0 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-full p-6 bg-slate-800/50 text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-sm leading-relaxed"
            placeholder="Paste your resume or profile text here..."
            spellCheck={false}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-900 flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Save size={16} />
            <span>Save Changes</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ResumeEditor;