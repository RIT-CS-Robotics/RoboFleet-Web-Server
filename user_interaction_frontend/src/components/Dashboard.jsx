// src/components/Dashboard.jsx
import { useState } from 'react';
import './Dashboard.css';

export default function Dashboard({ onLogout, currentUser }) {
  document.title = "RoboFleet Dashboard";

  const [inputText, setInputText] = useState('');
  const [selectedRobot, setSelectedRobot] = useState('robot 1');
  const [statusMessage, setStatusMessage] = useState('Ready');

  // Handles API transmission and safely opens status window on success
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
      
      // Fixed: Only opens the window after a successful database save
      window.open('status', '_blank');
    } catch (error) {
      console.error("Transmission error:", error);
      setStatusMessage('Error connecting to robot');
    }
  };

  // Makes Tab key press inside the textarea do an indent
  const handleTabPress = (tabEvent) => {
    if (tabEvent.key === 'Tab') {
      tabEvent.preventDefault();
      
      const textarea = tabEvent.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const indent = '    '; 
      
      const newText = inputText.substring(0, start) + indent + inputText.substring(end);
      setInputText(newText);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + indent.length;
      }, 0);
    }
  };

  // Modern Export system with standard automatic fallback for Safari/Firefox
  async function handleExport() {
    try {
      const fileHandler = await window.showSaveFilePicker({
        suggestedName: 'RoboFleet-code.py',
        types: [{
          description: 'Code Files',
          accept: {'text/x-python': ['.py'], 'text/x-java-source': ['.java']}
        }]
      });

      const writable = await fileHandler.createWritable();
      await writable.write(inputText);
      await writable.close();
      console.log(`Code file saved for user: ${currentUser}`);
      alert('File Saved');
    }
    catch (err) {
      if (err.name !== 'AbortError') {
        console.error(`Could not save file for user: ${currentUser} -> Error: ${err.message}`);
        alert('Failed to Save File');
      }
    }
  }

  return (
    <div className="dashboard-container">
      
      {/* LEFT SIDE COLUMN */}
      <div className="dashboard-sidebar">
        <div className="sidebar-top-group">
          <div>
            <h2 className="dashboard-account-title">RoboFleet Account:</h2>
            <p className="dashboard-username">{currentUser}</p>
          </div>
          <div className="instructions-section">
            <h3 className="instructions-title">Instructions:</h3>
            <div className="instructions-box">
              <p>1. Select a target robot from the dropdown menu.</p>
              <p>2. Write or import your code into the workspace.</p>
              <p>3. Make sure you are importing Robot in your code.</p>
              <p>4. Click "Deploy" to send commands to the selected robot!</p>
            </div>
          </div>
        </div>
        <button onClick={onLogout} className="btn-logout">
          Logout
        </button>
      </div>

      {/* RIGHT SIDE MAIN COLUMN */}
      <form onSubmit={handleSubmit} className="dashboard-main-form">
        <div className="controls-row-wrapper">
          <div className="file-loader-group">
            
            {/* Import Button */}
            <label htmlFor="code-file-upload" className="btn-file-loader">
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <polyline points="9 15 12 18 15 15" />
              </svg>
              <span>Import Code</span>
            </label>

            <input
              id="code-file-upload"
              type="file"
              accept=".txt,.py,.css"
              style={{ display: 'none' }}
              onChange={(changeEvent) => {
                const file = changeEvent.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (readEvent) => {
                  setInputText(readEvent.target.result);
                };
                reader.readAsText(file);
              }}
            />
            
            {/* Export Button */}
            <button type="button" onClick={handleExport} className="btn-file-loader btn-file-exporter">
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="12" x2="12" y2="18" />
                <polyline points="9 15 12 12 15 15" />
              </svg>
              <span>Export Code</span>
            </button>
          </div>
          
          <div className="robot-selector-group">
            <label className="robot-selector-label">Target Robot:</label>
            <select value={selectedRobot} onChange={(e) => setSelectedRobot(e.target.value)} className="robot-select-dropdown">
              <option value="robot 1">Robot 1</option>
              <option value="robot 2">Robot 2</option>
              <option value="robot 3">Robot 3</option>
            </select>
          </div>
        </div>
        
        <textarea
          value={inputText} 
          onChange={(e) => setInputText(e.target.value)} 
          onKeyDown={handleTabPress} 
          placeholder="Enter code here..." 
          className="code-editor-textarea"
        />

        <div className="action-row">
          <button type="submit" className="btn-deploy">
            Deploy
          </button>
          <div className="status-display">
            <strong>Status:</strong> &nbsp; {statusMessage}
          </div>
        </div>

      </form>
    </div>
  );
}
