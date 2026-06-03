// src/components/Login.jsx
import { useState } from 'react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Send credentials directly to your backend server
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Invalid username or password.');
      }

      const data = await response.json();
      
      // Pass the username returned from backend up to App
      onLoginSuccess(data.username); 
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: '40px 20px', fontFamily: 'sans-serif', maxWidth: '400px', margin: '100px auto', textAlign: 'center', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>RoboFleet Login</h2>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            placeholder="Username" 
            style={{ padding: '10px', width: '80%', borderRadius: '4px', border: '1px solid #ccc' }}
            required 
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Password" 
            style={{ padding: '10px', width: '80%', borderRadius: '4px', border: '1px solid #ccc' }}
            required 
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', width: '85%' }}>
          Access Dashboard
        </button>
      </form>
      {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}
    </div>
  );
}
