import { useState } from 'react';
import './App.css';

export default function App() {
  const [inputText, setInputText] = useState('');
  const [selectedRobot, setSelectedRobot] = useState('robot_alpha'); // Tracks selected robot
  const [statusMessage, setStatusMessage] = useState('Ready');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage(`Sending to ${selectedRobot}...`);
    
    try {
      // Combines with your RIT domain automatically on the web
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: inputText,
          robotId: selectedRobot // Added to tell the backend which robot to target
        }),
      });
      
      const data = await response.json();
      setStatusMessage(data.message);
    } catch (error) {
      setStatusMessage('Error connecting to server');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
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
            <option value="robot_alpha">Robot Alpha (192.168.1.50)</option>
            <option value="robot_beta">Robot Beta (192.168.1.60)</option>
          </select>
        </div>

        <input 
          type="text" 
          value={inputText} 
          onChange={(e) => setInputText(e.target.value)} 
          placeholder="Enter text here..." 
          style={{ padding: '8px', marginRight: '10px' }} 
        />
        
        <button type="submit" style={{ padding: '8px 15px' }}>Save & Forward</button>
      </form>

      <div style={{ marginTop: '20px', padding: '10px', background: '#eee', borderRadius: '4px', color: '#333' }}>
        <strong>Status:</strong> {statusMessage}
      </div>
    </div>
  );
}
