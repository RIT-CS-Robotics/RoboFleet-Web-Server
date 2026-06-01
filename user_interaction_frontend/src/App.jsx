import { useState } from 'react';
import './App.css';

export default function App() {
  const [inputText, setInputText] = useState('');
  
  // 1. UPDATED: Changed default state to match your actual database naming conventions
  const [selectedRobot, setSelectedRobot] = useState('robot 1'); 
  const [statusMessage, setStatusMessage] = useState('Ready');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage(`Sending to ${selectedRobot}...`);

    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 2. ADDED: Add your secret token header to authorize this POST command
          'x-dashboard-token': 'CS@RIT-70'
        },
        body: JSON.stringify({
          text: inputText,
          robotId: selectedRobot 
        }),
      });

      // Handle raw non-200 responses safely (e.g. if the backend rejects the passkey)
      if (!response.ok) {
        throw new Error(`Server returned status code ${response.status}`);
      }

      const data = await response.json();
      setStatusMessage(data.message);
    } catch (error) {
      console.error("Transmission error:", error);
      setStatusMessage('Error connecting to robot');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Robotics Project Data Entry</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Dropdown Menu for choosing the robot target */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Target Robot:</label>
          <select 
            value={selectedRobot} 
            onChange={(e) => setSelectedRobot(e.target.value)} 
            style={{ padding: '6px', borderRadius: '4px' }}
          >
            {/* 3. UPDATED: Dropdown options to target your specific RIT fleet names and IPs */}
            <option value="robot 1">Robot 1 (129.21.118.12)</option>
            <option value="robot 2">Robot 2 (129.21.136.147)</option>
            <option value="robot 3">Robot 3 (129.21.65.243)</option>
          </select>
        </div>

        <input 
          type="text" 
          value={inputText} 
          onChange={(e) => setInputText(e.target.value)} 
          placeholder="Enter text here..." 
          style={{ padding: '8px', marginRight: '10px', width: '65%' }} 
        />
        <button type="submit" style={{ padding: '8px 15px', cursor: 'pointer' }}>Save & Forward</button>
      </form>

      <div style={{ marginTop: '20px', padding: '10px', background: '#eee', borderRadius: '4px', color: '#333' }}>
        <strong>Status:</strong> {statusMessage}
      </div>
    </div>
  );
}
