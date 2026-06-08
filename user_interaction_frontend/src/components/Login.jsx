// src/components/Login.jsx
import { useState } from 'react';
import './Login.css'; // Imported stylesheet here

export default function Login({ onLoginSuccess }) {
  document.title = "RoboFleet Login";

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
        headers: { 
          'Content-Type': 'application/json' 
        },
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
    <div className="login-container">
      <h2 className="login-title">RoboFleet Login</h2>
      
      <form onSubmit={handleLogin} className="login-form">
        <div className="form-group">
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            placeholder="Username" 
            className="form-input"
            required 
          />
        </div>
        <div className="form-group">
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Password" 
            className="form-input"
            required 
          />
        </div>
        <button type="submit" className="btn-submit">
          Access Dashboard
        </button>
      </form>

      {error && <p className="error-message">❌ {error}</p>}
    </div>
  );
}
