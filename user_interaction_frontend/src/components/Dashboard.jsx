// src/components/Dashboard.jsx
import { useEffect, useState } from 'react';
import './Dashboard.css';

export default function Dashboard({ onLogout, currentUser }) {
  document.title = "RoboFleet Dashboard";

  const [codeText, setCodeText] = useState(''); // current code that is being worked on
  const [logText, setLogText] = useState(''); // .log file for pulled log

  const [loggedCode, setLoggedCode] = useState(''); // code file for pulled log
  const [logMode, setLogMode] = useState(false); // for switching between code and log mode
  const [currentLog, setCurrentLog] = useState(null); // current log


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

  async function constructTitle() {
    let title = logName;
          if (title.trim() === '') {
        title = 'Unnamed Code';
      }
      const logInfo = new Date();
      const year = logInfo.getFullYear();
      const month = String(logInfo.getMonth() + 1).padStart(2, '0'); // js Date object returns month as 0-11 so you must add 1 to get the correct month
      const day = String(logInfo.getDate()).padStart(2, '0');
      const hours = String(logInfo.getHours()).padStart(2, '0');
      const minutes = String(logInfo.getMinutes()).padStart(2, '0');
      const seconds = String(logInfo.getSeconds()).padStart(2, '0');
      title = `${title}_${month}-${day}-${year}_${hours}h.${minutes}m.${seconds}s`;
      return title;
  }

  // Loads the new set of logs when a new user logs in
  useEffect(() => {
    if (currentUser) {
        loadLogs();
    }
  }, [currentUser]); 

  // Handles the logging of the student code
  const handleLog = async (title) => {
    try {
      const logTitle = title;

      const response = await fetch('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: currentUser, log: logTitle, code: codeText}),
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
      const title = await constructTitle();
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: codeText, codeTitle: title, user: currentUser, robotId: selectedRobot }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status code ${response.status}`);
      }
      const data = await response.json();
      setStatusMessage(data.message);

      handleLog(title);
      
      // Fixed: Only opens the window after a successful database save
      window.open('status', '_blank');
    } catch (error) {
      console.error("Transmission error:", error);
      setStatusMessage('Error connecting to robot');
    }
  };

  // Makes Tab key press inside the textarea do an indent
  const handleTabPress = (tabEvent) => {
    if ( (tabEvent.key === 'Tab') && (!logMode) ) {
      tabEvent.preventDefault();
      const textarea = tabEvent.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const indent = '    ';
      const newText = codeText.substring(0, start) + indent + codeText.substring(end);
      setCodeText(newText);
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
      await writable.write(codeText);
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
    const check = confirm(`Are you sure you want to select this code log?`);
    if (check) {
      try {
        const response = await fetch(`/api/log/${currentUser}/${fileName}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        const log = data.userLog;
        const code = data.userCode;
        const fileSplit = fileName.split('_');
        const title = fileSplit[0];

        
        setLogText(log);
        setLoggedCode(code);
        handleLogSwitch(true);
        setCurrentLog(fileName);

        console.log(`Loaded code log for user: ${currentUser}`);
      }
      catch(err) {
        alert(`Error: error pulling code log: ${err}`);
        console.error(`Could not load code log for user: ${currentUser} -> Error: ${err}`);
      }
    }
    return;
  };

  const handleLogRemove = async (e, fileName) => {
    // Blocks the click from bubbling up to the log-item-btn underneath
    e.stopPropagation();

    const check = confirm(`Are you sure you want to delete this code log?`);
    if (check) {
      try {
        const response = await fetch(`/api/log/${currentUser}/${fileName}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          await loadLogs();
          console.log(`Log successfully removed for User: ${currentUser}`);
        }
        else {
          throw new Error(`Error with removing log`);
        }

        if (currentLog === fileName) {
          setCurrentLog(null);
          setLogText('');
        }

      }
      catch (err) {
        alert(`Error: could not remove log!`);
        console.error(`Could not remove log for user: ${currentUser} -> Error: ${err}`);
      }
    }
    return
  };

  const handleLogClear = async () => {

  };

  function handleLogSwitch(logSwitch) {
    setLogMode(logSwitch);
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
                <div key={index} className="log-item-wrapper">
                  <button onClick={() => handleLogButton(fileName)} className="log-item-btn">
                    {fileName}
                  </button>
                  {/* Updated Button containing the SVG Trash Can Icon */}
                  <button onClick={(e) => handleLogRemove(e, fileName)} className="log-remove-btn" title="Delete log">
                    <svg className="trash-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* PLACEMENT SWAP: Import and Export buttons are now in the sidebar */}
          <div className="switch-buttons">
            {/* Import Button */}
            <label htmlFor="code-file-upload" className="btn-file-loader" style={{ width: '100%' }}>
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <polyline points="9 15 12 18 15 15" />
              </svg>
              <span>Import Code</span>
            </label>
            <input id="code-file-upload" type="file" accept=".txt,.py,.css" style={{ display: 'none' }} onChange={(changeEvent) => {
              const selectedFile = changeEvent.target.files[0];
              if (!selectedFile) return;
              setLogName(selectedFile.name);
              const reader = new FileReader();
              reader.onload = (readEvent) => {
                setCodeText(readEvent.target.result);
              };
              reader.readAsText(selectedFile);
              handleLogSwitch(false);
            }} />
            
            {/* Export Button */}
            <button 
              type="button" 
              onClick={handleExport} 
              className="btn-file-loader" /* CHANGED: Swapped to match the Import button styling */
              style={{ 
                width: '100%', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '12px' 
              }}
              >
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
               <line x1="12" y1="12" x2="12" y2="18" />
                <polyline points="9 15 12 12 15 15" />
              </svg>
            <span>Export Code</span>
          </button>

          </div>
        </div>
      </div> {/* Closes .sidebar-split-layout-row */}

      {/* Logout button spanning beneath both layout lanes */}
      <button onClick={onLogout} className="btn-logout"> Logout </button>
    </div> {/* Closes .dashboard-sidebar */}

    {/* RIGHT SIDE MAIN COLUMN */}
    <form onSubmit={handleSubmit} className="dashboard-main-form">
      <div className="controls-row-wrapper">
        <div className="file-loader-group">
          {/* PLACEMENT SWAP: Code and Log workspace toggle switch buttons */}
          <button type="button" onClick={() => handleLogSwitch(false)} className="btn-file-loader" style={{ minWidth: '120px', backgroundColor: logMode ? 'var(--bg-secondary)' : 'var(--accent)', color: logMode ? 'var(--text-main)' : '#030712' }}>
            Code
          </button>
          <button type="button" onClick={() => handleLogSwitch(true)} className="btn-file-loader" style={{ minWidth: '120px', backgroundColor: logMode ? '#34d399' : 'var(--bg-secondary)', color: logMode ? '#030712' : 'var(--text-main)' }}>
            Log
          </button>

          {/* Code Title Input Field */}
          <input type="text" value={logName} onChange={(event) => setLogName(event.target.value)} placeholder="Enter Code Title..." className="log-name-text-box" />
        </div>
      </div>

      {/* Code Textarea Main Canvas Frame */}
      <textarea value={logMode ? logText : codeText} onChange={(e) => setCodeText(e.target.value)} onKeyDown={handleTabPress} placeholder={`${logMode ? 'Empty Log...' : 'Enter Code Here...'}`} className={`code-editor-textarea ${logMode ? 'editor-mode-green' : 'editor-mode-blue'}`} readOnly={logMode} />

      {/* Bottom Control Bar Row */}
      <div className="action-row">
        <button type="submit" className="btn-deploy"> Deploy </button>
        <div className="status-display">
          <strong>Status:</strong> &nbsp; {statusMessage}
        </div>
      </div>
    </form>
  </div>
);


}
