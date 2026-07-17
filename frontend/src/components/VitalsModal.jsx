// src/components/VitalsModal.jsx
import React, { useState } from 'react';
import { Activity, X, Heart, Thermometer, Droplets } from 'lucide-react';

export default function VitalsModal({ onClose, onSubmit }) {
  const [vitals, setVitals] = useState({
    heartRate: '',
    bloodPressureSys: '',
    bloodPressureDia: '',
    oxygen: '',
    temperature: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Format the vitals into a clean string for the AI to read
    const formattedMessage = `I would like to log my daily vitals: 
- Heart Rate: ${vitals.heartRate} bpm
- Blood Pressure: ${vitals.bloodPressureSys}/${vitals.bloodPressureDia} mmHg
- SpO2 (Oxygen): ${vitals.oxygen}%
- Temperature: ${vitals.temperature}°F

Can you analyze these and let me know if everything looks normal?`;

    onSubmit(formattedMessage);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <Activity className="w-5 h-5" />
            Log Daily Vitals
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-400" /> Heart Rate (BPM)
            </label>
            <input 
              required type="number" min="0" placeholder="e.g., 72"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition"
              onChange={(e) => setVitals({...vitals, heartRate: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Systolic BP</label>
              <input 
                required type="number" min="0" placeholder="120"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition"
                onChange={(e) => setVitals({...vitals, bloodPressureSys: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Diastolic BP</label>
              <input 
                required type="number" min="0" placeholder="80"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition"
                onChange={(e) => setVitals({...vitals, bloodPressureDia: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" /> SpO2 (%)
              </label>
              <input 
                required type="number" min="0" max="100" placeholder="98"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition"
                onChange={(e) => setVitals({...vitals, oxygen: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" /> Temp (°F)
              </label>
              <input 
                required type="number" step="0.1" placeholder="98.6"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition"
                onChange={(e) => setVitals({...vitals, temperature: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition shadow-lg shadow-emerald-900/20"
          >
            Submit Vitals to DiagnoSys
          </button>
        </form>
      </div>
    </div>
  );
}