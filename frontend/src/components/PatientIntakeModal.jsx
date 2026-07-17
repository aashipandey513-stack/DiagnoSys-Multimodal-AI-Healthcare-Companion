// src/components/PatientIntakeModal.jsx
import React, { useState } from 'react';
import { Activity, ShieldCheck } from 'lucide-react';

export default function PatientIntakeModal({ onComplete }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'prefer-not-to-say',
    height: '',
    weight: '',
    medications: '',
    conditions: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete(formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      
      {/* FIX: Removed max-h and overflow-y-auto. Added overflow-hidden to guarantee NO scrollbars. */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-300 overflow-hidden">
        
        {/* Header - Tightened padding (p-4) and icon size */}
        <div className="bg-blue-950/30 p-4 border-b border-slate-800 text-center">
          <div className="bg-blue-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
            <Activity className="text-blue-400 w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Welcome to DiagnoSys!</h2>
          <p className="text-slate-400 text-xs mt-1">Please share a brief medical profile.</p>
        </div>

        {/* Form - Tightened row spacing (space-y-3) and overall padding (p-4) */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          
          {/* Row 1: Name & Age */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Name / Alias</label>
              {/* Inputs tightened from p-2.5 to p-2 */}
              <input 
                required
                type="text" 
                placeholder="Alex"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Age</label>
              <input 
                required
                type="number" 
                min="0" 
                placeholder="30"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                onChange={(e) => setFormData({...formData, age: e.target.value})}
              />
            </div>
          </div>

          {/* Row 2: Biological Sex */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Biological Sex</label>
            <select 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition appearance-none"
              onChange={(e) => setFormData({...formData, gender: e.target.value})}
            >
              <option value="prefer-not-to-say">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Row 3: Height & Weight */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Height (cm)</label>
              <input 
                type="number" 
                min="0"
                placeholder="170"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                onChange={(e) => setFormData({...formData, height: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Weight (kg)</label>
              <input 
                type="number" 
                min="0"
                step="0.1" 
                placeholder="70"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                onChange={(e) => setFormData({...formData, weight: e.target.value})}
              />
            </div>
          </div>

          {/* Row 4: Medications */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Current Medications</label>
            <input 
              type="text"
              placeholder="E.g., Lisinopril 10mg, none..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
              onChange={(e) => setFormData({...formData, medications: e.target.value})}
            />
          </div>

          {/* Row 5: Conditions */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Known Conditions / Allergies</label>
            {/* Reduced height from h-20 to h-14 to save space */}
            <textarea 
              placeholder="E.g., Asthma, Penicillin allergy... (Leave blank if none)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition h-14 resize-none"
              onChange={(e) => setFormData({...formData, conditions: e.target.value})}
            />
          </div>

          <div className="pt-1">
            {/* Tightened button padding (py-2.5) */}
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition shadow-lg shadow-blue-900/20"
            >
              <ShieldCheck className="w-5 h-5" />
              Initialize Secure Session
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-500 mt-1">
            Your data is processed locally for context and is never stored permanently.
          </p>
        </form>
      </div>
    </div>
  );
}