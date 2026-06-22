// src/components/Dashboard.jsx
import { useEffect, useState } from 'react';
import './Dashboard.css';

export default function Dashboard({ onLogout, currentUser }) {
  document.title = "RoboFleet Dashboard";

  const [inputText, setInputText] = useState('');
  const [logText, setLogText] = useState('');
  const [displayMode, setDisplayMode] = useState('code'); // for switching between code and log mode


  const [selectedRobot, setSelectedRobot] = useState('robot 1');
  const [statusMessage, setStatusMessage] = useState('Ready');
  const [logName, setLogName] = useState('');
  const [userLogs, setUserLogs] = useState([]);


  // loads the current logs
  async function loadLogs() {
    try {
      const response = await fetch(`/api/log/${currentUser}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      const logs = data.userLogs;

      setUserLogs(logs);
    }
    catch(err) {
      alert('Error fetching user logs');
      setUserLogs([]);
    }
  }

  // Loads the new set of logs when a new user logs in
  useEffect(() => {
    if (currentUser) {
        loadLogs();
    }
  }, [currentUser]); 

  // Handles the logging of the student code
  const handleLog = async () => {
    try {
      let logTitle = logName;
      if (logTitle.trim() === '') {
        logTitle = 'Unnamed Code';
      }
      const logInfo = new Date();
      const year = logInfo.getFullYear();
      const month = String(logInfo.getMonth() + 1).padStart(2, '0'); // js Date object returns month as 0-11 so you must add 1 to get the correct month
      const day = String(logInfo.getDate()).padStart(2, '0');
      const hours = String(logInfo.getHours()).padStart(2, '0');
      const minutes = String(logInfo.getMinutes()).padStart(2, '0');
      const seconds = String(logInfo.getSeconds()).padStart(2, '0');
      logTitle = `${logTitle}_${month}-${day}-${year}_${hours}h.${minutes}m.${seconds}s`;

      const response = await fetch('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: currentUser, log: logTitle, code: inputText}),
      });

      if (response.ok) {
        console.log(`Log handled successfully for user: ${currentUser}`);
      } 
      else {
        alert('Failed to Log Code');
        throw new Error(`Server returned status code ${response.status}`);
      }

    } catch (err) {
      console.error(`Could not save log for user: ${currentUser} -> Error: ${err}`);
    }

    loadLogs();
  }

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

      handleLog();
      
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
      let fileName = logName;
      if (fileName.trim() === '') {
        fileName = 'Unnamed Code.py';
      }
      const fileHandler = await window.showSaveFilePicker({
        suggestedName: fileName,
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
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(`Could not save file for user: ${currentUser} -> Error: ${err}`);
        alert('Failed to Save File');
      }
    }
  }

  const handleLogButton = async (fileName) => {
    const check = confirm(`Are you sure you want to pull the selected code log?`);
    if (check) {
      try {
        const response = await fetch(`/api/log/${currentUser}/${fileName}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        const code = data.userCode;
        const fileSplit = fileName.split('_');
        const title = fileSplit[0];

        
        setInputText(code);
        setLogName(title);

        console.log(`Loaded code log for user: ${currentUser}`);
      }
      catch(err) {
        alert(`Error pulling code log: ${err}`);
        console.error(`Could not load code log for user: ${currentUser} -> Error: ${err}`);
      }
    }
    return;
  };

return (
  <div className="dashboard-container">
    {/* LEFT SIDE COLUMN (SIDEBAR) */}
    <div className="dashboard-sidebar">
      {/* Centered Account Info Header Block */}
      <div className="dashboard-account-header-block">
        <h2 className="dashboard-account-title">RoboFleet Account:</h2>
        <p className="dashboard-username">{currentUser}</p>
      </div>

      {/* INNER SPLIT ROW: Side-by-side layout columns */}
      <div className="sidebar-split-layout-row">
        {/* SUBCOLUMN A (LEFT SIDE): Shortened Instructions & Dropdown */}
        <div className="sidebar-left-subcolumn">
          <div className="instructions-section">
            <h3 className="instructions-title">Instructions:</h3>
            <div className="instructions-box shortened-box">
              <p>1. Select a target robot dropdown menu.</p>
              <p>2. Load or write code in the editor workspace.</p>
              <p>3. Click "Deploy" to transmit your commands.</p>
            </div>
          </div>

          {/* Robot Selection Dropdown - Positioned directly under instructions */}
          <div className="robot-selector-group">
            <label className="robot-selector-label">Target Robot:</label>
            <select value={selectedRobot} onChange={(e) => setSelectedRobot(e.target.value)} className="robot-select-dropdown">
              <option value="robot 1">Robot 1</option>
              <option value="robot 2">Robot 2</option>
              <option value="robot 3">Robot 3</option>
            </select>
          </div>
        </div>

        {/* SUBCOLUMN B (RIGHT SIDE): Elevated Logs Box & Future Button Slot */}
        <div className="sidebar-right-subcolumn">
          {/* Logs section floats up to the top level */}
          <div className="scroll-panel-section elevated-log-track">
            <h3 className="scroll-panel-title">Logs:</h3>
            <div className="scroll-button-container restricted-height-scroll">
              {userLogs.map((fileName, index) => (
                <button key={index} onClick={() => handleLogButton(fileName)} className="log-item-btn">
                  {fileName}
                </button>
              ))}
            </div>
          </div>

          {/* Code and Log buttons */}
          <div className="switch-buttons">
            <button type="button" className="btn-sidebar-action btn-blue-code">
              Code
            </button>
            <button type="button" className="btn-sidebar-action btn-green-log">
              Log
            </button>
          </div>
        </div>
      </div> {/* Closes .sidebar-split-layout-row */}

      {/* Logout button spanning beneath both layout lanes */}
      <button onClick={onLogout} className="btn-logout">
        Logout
      </button>
    </div> {/* Closes .dashboard-sidebar */}

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
              // FIXED: Added back '[0]' here to target the specific file object instance
              const file = changeEvent.target.files[0]; 
              if (!file) return;
              
              setLogName(file.name);
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

          {/* Code Title Input Field */}
          <input type="text" value={logName} onChange={(event) => setLogName(event.target.value)} placeholder="Enter Code Title..." className="log-name-text-box" />
        </div>
      </div>

      {/* Code Textarea Main Canvas Frame */}
      <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleTabPress} placeholder="Enter code here..." className="code-editor-textarea" />

      {/* Bottom Control Bar Row */}
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
