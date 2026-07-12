// src/components/ChatInterface.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, FileText, Image as ImageIcon, Activity, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import VitalsModal from './VitalsModal';

export default function ChatInterface({ patientData }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      type: 'text',
      text: `Hi ${patientData.name}, I'm your DiagnoSys assistant. I see you are ${patientData.age} years old. How can I help you today? You can ask a question, or use the + button to upload an X-ray or medical report.`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [imageFilter, setImageFilter] = useState('normal'); 
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (text, type = 'text', fileUrl = null, actualFile = null) => {
    if (!text.trim() && !fileUrl) return;

    const newUserMsg = {
      id: Date.now(),
      sender: 'user',
      type: type,
      text: text,
      fileUrl: fileUrl,
      isScanning: type === 'image',
      boundingBox: null,
      confidence: null
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setShowMenu(false);
    setIsTyping(true);

    try {
      const formData = new FormData();
      formData.append('message', text);
      formData.append('patient_data', JSON.stringify(patientData));
      
      if (actualFile) {
        formData.append('file', actualFile);
      }

      const response = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to connect to AI engine');
      
      const data = await response.json();

      if (type === 'image') {
        setMessages(prev => 
          prev.map(msg => msg.id === newUserMsg.id ? { 
            ...msg, 
            isScanning: false,
            boundingBox: data.box, 
            confidence: data.confidence
          } : msg)
        );
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        type: 'text',
        text: data.reply
      }]);

    } catch (error) {
      console.error("API Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        type: 'text',
        text: "Sorry, I am having trouble connecting to the secure medical server right now. Is your Python backend running?"
      }]);
      if (type === 'image') {
        setMessages(prev => prev.map(msg => msg.id === newUserMsg.id ? { ...msg, isScanning: false } : msg));
      }
    } finally {
      setIsTyping(false);
    }
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    
    if (file.type.startsWith('image/')) {
      handleSendMessage(`Uploaded: ${file.name}`, 'image', fileUrl, file);
    } else {
      handleSendMessage(`Uploaded: ${file.name}`, 'document', fileUrl, file);
    }

    e.target.value = '';
    setShowMenu(false);
    setImageFilter('normal'); // Reset filter on new upload
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-slate-950 text-slate-200">
      
      {showVitalsModal && (
        <VitalsModal 
          onClose={() => setShowVitalsModal(false)}
          onSubmit={(formattedText) => {
            setShowVitalsModal(false);
            handleSendMessage(formattedText);
          }}
        />
      )}

      <header className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100">DiagnoSys</h1>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Secure Session Active
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-blue-900/50 border border-blue-700 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-blue-400" />
              </div>
            )}

            <div className={`max-w-[75%] rounded-2xl p-4 ${
              msg.sender === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-sm' 
                : 'bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-sm'
            }`}>
              
              {msg.type === 'document' && (
                <div className="flex items-center gap-3 bg-blue-700/50 p-3 rounded-lg mb-2">
                  <FileText className="w-6 h-6" />
                  <span className="text-sm font-medium">{msg.text}</span>
                </div>
              )}

              {/* IMAGE RENDERING CORE WITH RADIOLOGY TOOLBAR */}
              {msg.type === 'image' && msg.fileUrl && (
                <div className="flex flex-col gap-2 mb-2">
                  
                  {!msg.isScanning && (
                    <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-lg border border-slate-700 w-fit">
                      <button 
                        onClick={() => setImageFilter('normal')}
                        className={`text-[10px] font-semibold px-2 py-1 rounded transition ${imageFilter === 'normal' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        Standard
                      </button>
                      <button 
                        onClick={() => setImageFilter('invert')}
                        className={`text-[10px] font-semibold px-2 py-1 rounded transition ${imageFilter === 'invert' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        Invert (Bone)
                      </button>
                      <button 
                        onClick={() => setImageFilter('contrast')}
                        className={`text-[10px] font-semibold px-2 py-1 rounded transition ${imageFilter === 'contrast' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        High Contrast
                      </button>
                    </div>
                  )}

                  <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-800 inline-block">
                    <img 
                      src={msg.fileUrl} 
                      alt="User Upload" 
                      className="w-full max-w-sm h-auto object-contain opacity-90 block transition-all duration-300" 
                      style={{
                        filter: imageFilter === 'invert' ? 'invert(1) hue-rotate(180deg)' : 
                                imageFilter === 'contrast' ? 'contrast(1.5) brightness(0.9)' : 'none'
                      }}
                    />
                    
                    {msg.boundingBox && !msg.isScanning && (
                      <div 
                        className="absolute border-2 border-emerald-400 bg-emerald-400/10 z-10 transition-all duration-700 ease-in-out shadow-[0_0_15px_3px_rgba(52,211,153,0.3)]"
                        style={{
                          top: `${msg.boundingBox.top}%`,
                          left: `${msg.boundingBox.left}%`,
                          width: `${msg.boundingBox.width}%`,
                          height: `${msg.boundingBox.height}%`
                        }}
                      >
                        <div className="absolute -top-6 left-[-2px] bg-emerald-500 text-slate-950 text-[11px] font-bold px-2 py-1 rounded-t-sm whitespace-nowrap flex items-center gap-1 shadow-md">
                          Pathology Detected {msg.confidence ? `| ${msg.confidence}%` : ''}
                        </div>
                      </div>
                    )}

                    {msg.isScanning && (
                      <>
                        <div className="absolute inset-0 bg-blue-900/20 z-10"></div>
                        <div className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_15px_3px_rgba(34,211,238,0.6)] z-20 animate-scan"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 bg-slate-900/80 px-4 py-2 rounded-full text-xs font-semibold text-cyan-400 flex items-center gap-2 border border-cyan-800 shadow-xl backdrop-blur-sm">
                          <Loader2 className="w-4 h-4 animate-spin" /> Neural Scan Active...
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {msg.type === 'text' && (
                <div className="text-sm leading-relaxed [&>p]:mb-3 last:[&>p]:mb-0 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-3 [&>li]:mb-1 [&>strong]:text-slate-100 [&>strong]:font-semibold">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-slate-400" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-4 justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-900/50 border border-blue-700 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm p-4 flex items-center gap-1.5">
              <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
              <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-900/80 border-t border-slate-800 relative">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt" />

        {showMenu && (
          <div className="absolute bottom-20 left-4 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-2 w-56 flex flex-col gap-1 animate-in slide-in-from-bottom-2">
            <button onClick={triggerFileUpload} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700 rounded-lg text-sm text-slate-200 text-left transition">
              <FileText className="w-4 h-4 text-purple-400" /> Upload Medical Report
            </button>
            <button onClick={triggerFileUpload} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700 rounded-lg text-sm text-slate-200 text-left transition">
              <ImageIcon className="w-4 h-4 text-cyan-400" /> Analyze X-Ray / Scan
            </button>
            <button onClick={() => {setShowMenu(false); setShowVitalsModal(true);}} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700 rounded-lg text-sm text-slate-200 text-left transition">
              <Activity className="w-4 h-4 text-emerald-400" /> Log Daily Vitals
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <button onClick={() => setShowMenu(!showMenu)} className={`p-3 rounded-xl flex items-center justify-center transition shrink-0 ${showMenu ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}>
            <Plus className={`w-6 h-6 transition-transform ${showMenu ? 'rotate-45' : ''}`} />
          </button>
          
          <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl flex items-center pr-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
              placeholder="Describe your symptoms or ask a question..."
              className="flex-1 bg-transparent p-4 text-sm text-slate-200 focus:outline-none"
            />
            <button onClick={() => handleSendMessage(inputValue)} disabled={!inputValue.trim()} className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}