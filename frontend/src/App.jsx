// src/App.jsx
import React, { useState } from 'react';
import PatientIntakeModal from './components/PatientIntakeModal';
import ChatInterface from './components/ChatInterface';

function App() {
  const [patientData, setPatientData] = useState(null);

  if (!patientData) {
    return <PatientIntakeModal onComplete={(data) => setPatientData(data)} />;
  }

  // Once the modal is complete, render the chat interface
  return (
    <div className="h-screen w-full bg-slate-950 font-sans">
      <ChatInterface patientData={patientData} />
    </div>
  );
}

export default App;