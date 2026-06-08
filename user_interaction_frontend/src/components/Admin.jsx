// src/components/Admin.jsx
import { useState, useEffect } from 'react';
import './Admin.css'; // Imported stylesheet here

export default function Admin({ onLogout }) {
document.title = "RoboFleet Admin";

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [studentList, setStudentList] = useState([]);
  const [message, setMessage] = useState('');

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
        headers: { 
          'Content-Type': 'application/json'
        },
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete account.');
      }

      setMessage(`🗑️ Removed account "${usernameToDelete}".`);
      fetchStudents(); 
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2 className="admin-title">Admin Dashboard</h2>
        <button onClick={onLogout} className="btn-logout">
          Logout
        </button>
      </div>

      <h3 className="section-title">Add New Student</h3>
      <form onSubmit={handleCreateAccount} className="admin-form">
        <div className="form-group">
          <input 
            type="text" 
            value={newUsername} 
            onChange={(e) => setNewUsername(e.target.value)} 
            placeholder="Student Username" 
            className="form-input"
            required 
          />
        </div>
        <div className="form-group">
          <input 
            type="password" 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            placeholder="Student Password" 
            className="form-input"
            required 
          />
        </div>
        <button type="submit" className="btn-register">
          Register Student
        </button>
      </form>

      {message && <p className="status-message">{message}</p>}

      <hr className="divider" />

      <h3 className="section-title">Active Student Roster</h3>
      {studentList.length === 0 ? (
        <p className="empty-roster">No registered student accounts found.</p>
      ) : (
        <ul className="student-list">
          {studentList.map((student) => (
            <li key={student} className="student-item">
              <span className="student-name">👤 {student}</span>
              <button 
                onClick={() => handleDeleteAccount(student)}
                className="btn-delete"
              >
                Remove Account
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
