/**
 * Functionality: The admin dashboard page (robotics-project.gccis.rit.edu/dashboard)
 *
 * @file user_interaction_frontend/src/pages/Admin.jsx
 * @author Aidan Sanderson
 * @date 7/29/2026
 */
import { useState, useEffect } from 'react';
import './Admin.css'; // Imported stylesheet here
import { loadLogs } from '../Utilities';

/**
 * Admin Dashboard
 * 
 * @param {function} onLogout: Handles the admin logout event.
 */
export default function Admin({ onLogout }) {
  document.title = "RoboFleet Admin";
  const [newUsername, setNewUsername] = useState(''); // New username for account creation
  const [newPassword, setNewPassword] = useState(''); // New password for account creation
  const [studentList, setStudentList] = useState([]); // List of the students
  const [message, setMessage] = useState(''); // Output message to screen on events

  const [currentStudent, setCurrentStudent] = useState(''); // The currently selected student for viewing log (perm) list
  const [currentLog, setCurrentLog] = useState(null); // Current log (perm) path that is selected
  const [logText, setLogText] = useState(''); // The text of the currently selected log (perm)
  const [userLogs, setUserLogs] = useState([]); // The list of logs (perms) of the selected student
  const [permUser, setPermUser] = useState(''); // The student of the log (perm) text that is displayed on the consal at the moment

  /**
   * Loads the list of students for displaying and interacting with.
   */
  const fetchStudents = async () => {
    try {
      // Gets the student list from the backend
      const response = await fetch('/api/users');
      // Successfully fetched the student list
      if (response.ok) {
        const data = await response.json();
        setStudentList(data.filter(user => user !== 'admin')); // Remove the main admin name from this student listing
      }
      // Had an error while trying to fetch the student list
    } catch (err) {
      console.error("Failed to fetch student list:", err);
    }
  };

  // Fetches the list of students on page loading
  useEffect(() => {
    fetchStudents();
  }, []);

    /**
   * Student account creation.
   * 
   * @param {event} e: Account create button pressed event.
   */
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      // Create a new user account in the backend.
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername.trim(), password: newPassword })
      });
      const data = await response.json().catch(() => ({}));
      // Error creating new account
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create student account.');
      }
      // Success creating new account
      setMessage(`✅ Account created for "${newUsername}"!`);
      setNewUsername('');
      setNewPassword('');
      fetchStudents();
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  /**
   * Student account deletion.
   * 
   * @param {string} usernameToDelete: The username to delete.
   */
  const handleDeleteAccount = async (usernameToDelete) => {
    if (!window.confirm(`Are you sure you want to delete the account for "${usernameToDelete}"?`)) {
      return;
    }
    try {
      // Removes user account in the backend
      const response = await fetch(`/api/users/${usernameToDelete}`, {
        method: 'DELETE',
      });
      // Error removing account
      if (!response.ok) {
        throw new Error('Failed to delete account.');
      }
      // Success removing account
      setMessage(`🗑️ Removed account "${usernameToDelete}".`);
      fetchStudents();
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  /**
   * Displays the log (perm) file contents to the admin log console.
   * 
   * @param {string} student: The student whos perm file it belongs to.
   * @param {string} fileName: The file name of the perm file to display.
   * @returns The perm file contents.
   */
  const handlePermButton = async (student, fileName) => {
    let perm = '';
    // Gets the perm file contents from the backend.
    try {
      const response = await fetch(`/api/perm/${student}/${fileName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      perm = data.permLog; // Perm file contents

      setPermUser(student); // Saves the user whos perm it is so it knows to clear the console later if that user is deleted while currently on a different user log list.

      console.log(`Loaded code perm for user: ${student}`);
    }
    // Error loading perm file contents
    catch(err) {
      alert(`Error: Could not load code log`);
      console.error(`Could not load code perm for user: ${student} -> Error: ${err}`);
    }
    return perm;
  };

  /**
   * Clears the perm files for a selected student.
   * 
   * @param {event} event: Clear logs button pressed event.
   * @param {string} student: The student to clear the perms for.
   */
  const handleClearPerms = async function(event, student) {
    try {
      if (event) {
        event.preventDefault();
      }

      const check = confirm(`WARNING: You are about to delete all perm logs for the selected student. Are you sure you want to continue?`);
      if (check) {
        try {
            // Calls backend to clear the perms
            const response = await fetch(`/api/perm/${student}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          });
        
          // Successfully cleared perms
          if (response.ok) {
            setUserLogs(await loadLogs(student, true));
            console.log(`Perms successfully cleared for User: ${student}`);
          }
          // Error when trying to clear perms
          else {
            throw new Error(`Error with clearing perms`);
          }

          if (student === permUser) {
            setCurrentLog(null);
            setLogText('');
            setPermUser(null);
          }

        }
        catch (err) {
          alert(`ERROR: Failed to clear perms`);
          console.error(`Could not clear logs for user: ${student} -> Error: ${err}`);
          return;
        }
      }
    }
    catch (err) {
      console.error(`Failed to clear logs (perms) for student: ${student}`);
    }
  };

  return (
    <div className="admin-screen-layout">
      {/* Student list container */}
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
                    const perms = await loadLogs(student, true);
                    setUserLogs(perms);
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

      {/* Middle files directory panel */}
      <div className="scroll-panel-section admin-elevated-log-track">
        <h3 className="admin-scroll-panel-title">Selected Student Logs</h3>
        <div className="scroll-button-container admin-restricted-height-scroll">
          {userLogs.map((fileName, index) => (
            <div key={index} className="log-item-wrapper">
              <button 
                onClick={async () => {
                  const perm = await handlePermButton(currentStudent, fileName);
                  setLogText(perm);
                  setCurrentLog(fileName);
                }} 
                className={`log-item-btn ${currentLog === fileName ? 'active-log-highlight' : ''}`}
                title={fileName}
              >
                {fileName}
              </button>
            </div>
          ))}
        </div>

        <button onClick={(event) => handleClearPerms(event, currentStudent)} className="btn-delete"> Clear Logs </button>

      </div>

      {/* Far right log text terminal */}
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
