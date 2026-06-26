// src/components/Admin.jsx
import { useState, useEffect } from 'react';
import './Admin.css'; // Imported stylesheet here
import { loadLogs, handleLogButton } from '../Utilities';

export default function Admin({ onLogout }) {
  document.title = "RoboFleet Admin";
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [studentList, setStudentList] = useState([]);
  const [message, setMessage] = useState('');

  const [currentStudent, setCurrentStudent] = useState('');
  const [currentLog, setCurrentLog] = useState(null);
  const [logText, setLogText] = useState('');
  const [userLogs, setUserLogs] = useState([]);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        // Remove the main admin name from this student listing
        setStudentList(data.filter(user => user !== 'admin'));
      }
    } catch (err) {
      console.error("Failed to fetch student list:", err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername.trim(), password: newPassword })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create student account.');
      }
      setMessage(`✅ Account created for "${newUsername}"!`);
      setNewUsername('');
      setNewPassword('');
      fetchStudents();
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  const handleDeleteAccount = async (usernameToDelete) => {
    if (!window.confirm(`Are you sure you want to delete the account for "${usernameToDelete}"?`)) {
      return;
    }
    try {
      const response = await fetch(`/api/users/${usernameToDelete}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete account.');
      }
      setMessage(`🗑️ Removed account "${usernameToDelete}".`);
      fetchStudents();
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div className="admin-screen-layout">
      {/* 1. LEFT COLUMN: Your clean original admin container box */}
      <div className="admin-container">
        <div className="admin-header">
          <h2 className="admin-title">Admin Dashboard</h2>
          <button onClick={onLogout} className="btn-logout"> Logout </button>
        </div>

        <h3 className="section-title">Add New Student</h3>
        <form onSubmit={handleCreateAccount} className="admin-form">
          <div className="form-group">
            <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Student Username" className="form-input" required />
          </div>
          <div className="form-group">
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Student Password" className="form-input" required />
          </div>
          <button type="submit" className="btn-register"> Register Student </button>
        </form>

        {message && <p className="status-message">{message}</p>}

        <hr className="divider" />

        <h3 className="section-title">Student Roster</h3>
        {studentList.length === 0 ? (
          <p className="empty-roster">No Registered Students</p>
        ) : (
          <ul className="student-list">
            {studentList.map((student) => (
              <li key={student} className="student-item">
                <span className="student-name">👤 {student}</span>
                <button 
                  onClick={async () => {
                    const logs = await loadLogs(student);
                    setUserLogs(logs);
                    setCurrentStudent(student);
                  }} 
                  className="btn-view-logs"
                > 
                  View Logs 
                </button>
                <button onClick={() => handleDeleteAccount(student)} className="btn-delete"> Remove Account </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 2. MIDDLE COLUMN: The files directory checklist panel */}
      <div className="scroll-panel-section admin-elevated-log-track">
        <h3 className="admin-scroll-panel-title">Selected Student Logs</h3>
        <div className="scroll-button-container admin-restricted-height-scroll">
          {userLogs.map((fileName, index) => (
            <div key={index} className="log-item-wrapper">
              <button 
                onClick={async () => {
                  const check = confirm(`Are you sure you want to select this code log?`);
                  if (check) {
                    const [log, code, title] = await handleLogButton(currentStudent, fileName);
                    setLogText(log);
                    setCurrentLog(fileName);
                  }
                }} 
                className={`log-item-btn ${currentLog === fileName ? 'active-log-highlight' : ''}`}
                title={fileName}
              >
                {fileName}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. FAR RIGHT COLUMN: Entirely separate text terminal frame canvas */}
      <div className="log-box-container">
        <h3 className="admin-scroll-panel-title">Log Console</h3>
        <textarea 
          value={logText} 
          placeholder=''
          className="log-textarea" 
          readOnly={true} 
        />
      </div>

    </div>
  );
}
