// src/components/Dashboard.jsx
import { useState } from 'react';

export default function Dashboard({ onLogout, currentUser }) {
  const [inputText, setInputText] = useState('');
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
        },
        body: JSON.stringify({ text: inputText, robotId: selectedRobot }),
      });

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>RoboFleet Account: {currentUser}</h2>
        <button onClick={onLogout} style={{ padding: '5px 10px', cursor: 'pointer', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '4px' }}>
          Logout
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Target Robot:</label>
          <select value={selectedRobot} onChange={(e) => setSelectedRobot(e.target.value)} style={{ padding: '6px', borderRadius: '4px' }} >
            <option value="robot 1">Robot 1 (129.21.118.12)</option>
            <option value="robot 2">Robot 2 (129.21.136.147)</option>
            <option value="robot 3">Robot 3 (129.21.65.243)</option>
          </select>
        </div>
        <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Enter text here..." style={{ padding: '8px', marginRight: '10px', width: '65%' }} />
        <button type="submit" style={{ padding: '8px 15px', cursor: 'pointer' }}>Save & Forward</button>
      </form>

      <div style={{ marginTop: '20px', padding: '10px', background: '#eee', borderRadius: '4px', color: '#333' }}>
        <strong>Status:</strong> {statusMessage}
      </div>
    </div>
  );
}
