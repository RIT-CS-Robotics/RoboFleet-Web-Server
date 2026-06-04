// src/components/Admin.jsx
import { useState, useEffect } from 'react';

export default function Admin({ onLogout }) {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [studentList, setStudentList] = useState([]);
  const [message, setMessage] = useState('');

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/users', {
      });
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
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '450px', margin: '40px auto', border: '1px solid #ccc', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '22px' }}>Admin Dashboard</h2>
        <button onClick={onLogout} style={{ padding: '6px 12px', cursor: 'pointer', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
          Logout
        </button>
      </div>

      <h3 style={{ marginTop: '0', color: '#555' }}>Add New Student</h3>
      <form onSubmit={handleCreateAccount} style={{ marginBottom: '30px' }}>
        <div style={{ marginBottom: '10px' }}>
          <input 
            type="text" 
            value={newUsername} 
            onChange={(e) => setNewUsername(e.target.value)} 
            placeholder="Student Username" 
            style={{ padding: '8px', width: '90%', borderRadius: '4px', border: '1px solid #ccc' }}
            required 
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input 
            type="password" 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            placeholder="Student Password" 
            style={{ padding: '8px', width: '90%', borderRadius: '4px', border: '1px solid #ccc' }}
            required 
          />
        </div>
        <button type="submit" style={{ padding: '8px 15px', cursor: 'pointer', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', width: '95%' }}>
          Register Student
        </button>
      </form>

      {message && <p style={{ padding: '8px', background: '#f8f9fa', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', borderLeft: '4px solid #007bff' }}>{message}</p>}

      <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '20px 0' }} />

      <h3 style={{ color: '#555' }}>Active Student Roster</h3>
      {studentList.length === 0 ? (
        <p style={{ color: '#777', fontStyle: 'italic' }}>No registered student accounts found.</p>
      ) : (
        <ul style={{ listStyleType: 'none', paddingLeft: '0' }}>
          {studentList.map((student) => (
            <li key={student} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f1f1' }}>
              <span style={{ fontWeight: '500' }}>👤 {student}</span>
              <button 
                onClick={() => handleDeleteAccount(student)}
                style={{ padding: '4px 8px', cursor: 'pointer', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px' }}
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
