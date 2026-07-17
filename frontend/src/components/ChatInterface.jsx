// src/components/ChatInterface.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, FileText, Image as ImageIcon, Activity, Bot, User, Loader2, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import VitalsModal from './VitalsModal';
import { useReactToPrint } from 'react-to-print';

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
  const [scanType, setScanType] = useState('X-Ray'); 
  const [targetPrintData, setTargetPrintData] = useState(null);
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const sessionReportRef = useRef(null); 
  const singleReportRef = useRef(null); 

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // --- NATIVE BROWSER PDF EXPORT (100% Crash-Proof) ---
  const exportFullSession = useReactToPrint({
    contentRef: sessionReportRef,
    documentTitle: `DiagnoSys_Complete_Record_${patientData.name.replace(/\s+/g, '_')}`,
  });

  const handleFullPrintClick = () => {
    setShowMenu(false);
    setTimeout(() => exportFullSession(), 100);
  };

  const exportSingleMessage = useReactToPrint({
    contentRef: singleReportRef,
    documentTitle: 'DiagnoSys_Targeted_Analysis',
  });

  const handleSinglePrintClick = (msg, index) => {
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const precedingImage = (prevMsg && prevMsg.type === 'image' && prevMsg.fileUrl) ? prevMsg : null;
    
    setTargetPrintData({ msg, precedingImage });
    setTimeout(() => exportSingleMessage(), 100);
  };
  // ----------------------------------------------------

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
      
      // Only apply the selected modality if it's actually an image!
      formData.append('scan_type', type === 'image' ? scanType : 'Document');
      
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
    setImageFilter('normal'); 
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

      <header className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between z-10">
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

      {/* Hidden scrollbar styling applied here */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {messages.map((msg, index) => (
          <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-blue-900/50 border border-blue-700 flex items-center justify-center shrink-0 mt-2">
                <Bot className="w-5 h-5 text-blue-400" />
              </div>
            )}

            <div className={`max-w-[75%] rounded-2xl p-4 relative group ${
              msg.sender === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-sm' 
                : 'bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-sm'
            }`}>
              
              {/* --- OPTION B: Single Message Export Button --- */}
              {msg.sender === 'ai' && (
                <button 
                  onClick={() => handleSinglePrintClick(msg, index)}
                  className="absolute -right-12 top-2 p-2 bg-slate-800 hover:bg-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition border border-slate-700 hover:border-blue-500 shadow-lg"
                  title="Export Clinical PDF"
                >
                  <Download className="w-4 h-4 text-slate-300 hover:text-white" />
                </button>
              )}

              {msg.type === 'document' && (
                <div className="flex items-center gap-3 bg-blue-700/50 p-3 rounded-lg mb-2">
                  <FileText className="w-6 h-6" />
                  <span className="text-sm font-medium">{msg.text}</span>
                </div>
              )}

              {msg.type === 'image' && msg.fileUrl && (
                <div className="flex flex-col gap-2 mb-2">
                  {!msg.isScanning && (
                    <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-lg border border-slate-700 w-fit">
                      <button onClick={() => setImageFilter('normal')} className={`text-[10px] font-semibold px-2 py-1 rounded transition ${imageFilter === 'normal' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Standard</button>
                      <button onClick={() => setImageFilter('invert')} className={`text-[10px] font-semibold px-2 py-1 rounded transition ${imageFilter === 'invert' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Invert (Bone)</button>
                      <button onClick={() => setImageFilter('contrast')} className={`text-[10px] font-semibold px-2 py-1 rounded transition ${imageFilter === 'contrast' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>High Contrast</button>
                    </div>
                  )}

                  <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-800 inline-block">
                    <img src={msg.fileUrl} alt="User Upload" className="w-full max-w-sm h-auto object-contain opacity-90 block transition-all duration-300" style={{ filter: imageFilter === 'invert' ? 'invert(1) hue-rotate(180deg)' : imageFilter === 'contrast' ? 'contrast(1.5) brightness(0.9)' : 'none' }}/>
                    
                    {msg.boundingBox && !msg.isScanning && (
                      <div className="absolute border-2 border-emerald-400 bg-emerald-400/10 z-10 transition-all duration-700 ease-in-out shadow-[0_0_15px_3px_rgba(52,211,153,0.3)]" style={{ top: `${msg.boundingBox.top}%`, left: `${msg.boundingBox.left}%`, width: `${msg.boundingBox.width}%`, height: `${msg.boundingBox.height}%` }}>
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
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mt-2">
                <User className="w-5 h-5 text-slate-400" />
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-4 justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-900/50 border border-blue-700 flex items-center justify-center mt-2">
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

      <div className="p-4 bg-slate-900/80 border-t border-slate-800 relative z-20">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt" />

        <div className="max-w-4xl mx-auto mb-3">
          <div className="bg-amber-950/40 border border-amber-800/50 rounded-lg p-3 flex items-start gap-3 shadow-sm">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-[11px] text-amber-200/80 leading-relaxed">
              <strong className="text-amber-400">MEDICAL DISCLAIMER:</strong> DiagnoSys is an AI research tool, not a licensed healthcare provider. The insights, bounding boxes, and summaries generated are for educational purposes only. Always consult a qualified human doctor for medical advice, diagnosis, or treatment.
            </p>
          </div>
        </div>

        {showMenu && (
          <div className="absolute bottom-32 left-4 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-3 w-64 flex flex-col gap-1 animate-in slide-in-from-bottom-2 z-50">
            <div className="flex flex-col gap-1 pb-2 border-b border-slate-700 mb-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Modality</label>
              <select value={scanType} onChange={(e) => setScanType(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-md p-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500">
                <option value="X-Ray">Standard Radiography (X-Ray)</option>
                <option value="MRI">Magnetic Resonance Imaging (MRI)</option>
                <option value="PET Scan">Positron Emission Tomography (PET)</option>
              </select>
            </div>
            <button onClick={triggerFileUpload} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-700 rounded-lg text-sm text-slate-200 text-left transition"><FileText className="w-4 h-4 text-purple-400" /> Upload Medical Report</button>
            <button onClick={triggerFileUpload} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-700 rounded-lg text-sm text-slate-200 text-left transition"><ImageIcon className="w-4 h-4 text-cyan-400" /> Analyze Uploaded Scan</button>
            <button onClick={() => {setShowMenu(false); setShowVitalsModal(true);}} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-700 rounded-lg text-sm text-slate-200 text-left transition"><Activity className="w-4 h-4 text-emerald-400" /> Log Daily Vitals</button>
            
            {/* OPTION A: NATIVE Full Session Export Button */}
            <div className="border-t border-slate-700 mt-1 pt-1">
              <button onClick={handleFullPrintClick} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-700 rounded-lg text-sm text-slate-200 text-left transition w-full">
                <Download className="w-4 h-4 text-blue-400" /> Print Session Record (PDF)
              </button>
            </div>
          </div>
        )}

        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <button onClick={() => setShowMenu(!showMenu)} className={`p-3 rounded-xl flex items-center justify-center transition shrink-0 ${showMenu ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}>
            <Plus className={`w-6 h-6 transition-transform ${showMenu ? 'rotate-45' : ''}`} />
          </button>
          
          <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl flex items-center pr-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition">
            <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)} placeholder="Describe your symptoms or ask a question..." className="flex-1 bg-transparent p-4 text-sm text-slate-200 focus:outline-none"/>
            <button onClick={() => handleSendMessage(inputValue)} disabled={!inputValue.trim()} className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* --- SAFE PRINT TEMPLATE: OPTION A (Full Session) --- */}
      <div className="absolute top-0 left-[-9999px] opacity-0 pointer-events-none z-[-50]">
        <div ref={sessionReportRef} className="p-10 bg-white text-slate-900 font-sans w-[800px] min-h-screen">
          <div className="flex justify-between items-end border-b-2 border-blue-800 pb-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 tracking-tight">DiagnoSys</h1>
              <p className="text-slate-500 text-sm mt-1">AI-Assisted Diagnostic Session Record</p>
            </div>
            <div className="text-right text-sm text-slate-500">
              <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
              <p><strong>Session ID:</strong> #DS-{Math.floor(Math.random() * 1000000)}</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-8 grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
            <p><span className="text-slate-500 font-medium">Name:</span> <strong>{patientData.name}</strong></p>
            <p><span className="text-slate-500 font-medium">Age:</span> <strong>{patientData.age}</strong></p>
            <p><span className="text-slate-500 font-medium">Biological Sex:</span> <strong>{patientData.gender}</strong></p>
            <p><span className="text-slate-500 font-medium">Vitals:</span> <strong>{patientData.height || '--'}cm / {patientData.weight || '--'}kg</strong></p>
            <p className="col-span-2"><span className="text-slate-500 font-medium">Medications:</span> <strong>{patientData.medications || 'None'}</strong></p>
            <p className="col-span-2"><span className="text-slate-500 font-medium">Conditions:</span> <strong>{patientData.conditions || 'None'}</strong></p>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">Clinical Transcript</h3>
            {messages.map((msg) => (
              <div key={`print-${msg.id}`} className="mb-4">
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${msg.sender === 'user' ? 'text-blue-600' : 'text-emerald-600'}`}>
                  {msg.sender === 'user' ? patientData.name : 'DiagnoSys AI'}
                </p>
                
                {msg.type === 'image' && msg.fileUrl && (
                  <div className="relative inline-block border border-slate-300 p-1 bg-white rounded shadow-sm mb-3 mt-1">
                    <img src={msg.fileUrl} alt="Scan" style={{ maxWidth: '300px', height: 'auto', display: 'block' }} />
                    {msg.boundingBox && (
                      <div className="absolute border-[3px] border-emerald-500 bg-emerald-500/20" style={{ top: `${msg.boundingBox.top}%`, left: `${msg.boundingBox.left}%`, width: `${msg.boundingBox.width}%`, height: `${msg.boundingBox.height}%` }}>
                         <div className="absolute -top-5 left-[-3px] bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-t-sm whitespace-nowrap">
                           Detected | {msg.confidence}%
                         </div>
                      </div>
                    )}
                  </div>
                )}

                {msg.type === 'text' && (
                  <div className="text-sm text-slate-700 leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>strong]:text-slate-900">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-12 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
            MEDICAL DISCLAIMER: DiagnoSys is an AI research tool, not a licensed healthcare provider. The insights, bounding boxes, and summaries generated are for educational purposes only. Always consult a qualified human doctor for medical advice, diagnosis, or treatment.
          </div>
        </div>
      </div>

      {/* --- SAFE PRINT TEMPLATE: OPTION B (Single Message) --- */}
      <div className="absolute top-0 left-[-9999px] opacity-0 pointer-events-none z-[-50]">
        <div ref={singleReportRef} className="p-10 bg-white text-slate-900 font-sans w-[800px] min-h-screen">
          {targetPrintData && (
             <>
              <div className="border-b-2 border-blue-900 pb-4 mb-6 flex justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-blue-900">DiagnoSys Targeted Analysis</h1>
                  <p className="text-slate-500 text-sm">Patient: {patientData.name} | Age: {patientData.age} | Sex: {patientData.gender}</p>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <p>Date: {new Date().toLocaleDateString()}</p>
                  <p>Report ID: #{targetPrintData.msg.id.toString().slice(-5)}</p>
                </div>
              </div>

              {targetPrintData.precedingImage && (
                <div className="mb-6 relative inline-block border border-slate-300 p-1 bg-white rounded shadow-sm">
                  <img src={targetPrintData.precedingImage.fileUrl} style={{ maxWidth: '300px', height: 'auto', display: 'block' }} alt="Scan" />
                  {targetPrintData.precedingImage.boundingBox && (
                    <div 
                      className="absolute border-[3px] border-emerald-500 bg-emerald-500/20"
                      style={{ 
                        top: `${targetPrintData.precedingImage.boundingBox.top}%`, 
                        left: `${targetPrintData.precedingImage.boundingBox.left}%`, 
                        width: `${targetPrintData.precedingImage.boundingBox.width}%`, 
                        height: `${targetPrintData.precedingImage.boundingBox.height}%` 
                      }}
                    >
                      <div className="absolute -top-6 left-[-3px] bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-t-sm whitespace-nowrap">
                        Anomaly Detected {targetPrintData.precedingImage.confidence ? `| ${targetPrintData.precedingImage.confidence}%` : ''}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="text-sm text-slate-700 leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>strong]:text-slate-900">
                <ReactMarkdown>{targetPrintData.msg.text}</ReactMarkdown>
              </div>
              
              <div className="mt-10 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
                MEDICAL DISCLAIMER: DiagnoSys is an AI research tool, not a licensed healthcare provider. The insights, bounding boxes, and summaries generated are for educational purposes only. Always consult a qualified human doctor for medical advice, diagnosis, or treatment.
              </div>
             </>
          )}
        </div>
      </div>
    </div>
  );
}