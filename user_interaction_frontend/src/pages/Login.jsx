/**
 * Functionality: The dashboard login page (robotics-project.gccis.rit.edu/dashboard)
 *
 * @file user_interaction_frontend/src/pages/Login.jsx
 * @author Aidan Sanderson
 * @date 7/29/2026
 */
import { useState } from 'react';
import './Login.css';

/**
 * Login page
 * 
 * @param {function} onLoginSuccess: The handle login success function.
 */
export default function Login({ onLoginSuccess }) {
  document.title = "RoboFleet Login";

  const [username, setUsername] = useState(''); // Username
  const [password, setPassword] = useState(''); // Password
  const [error, setError] = useState(''); // Login error message

  /**
   * Handles the login attempt after the login button has been pressed using the currently set username and password useState variables.
   * 
   * @param {event} e: Login button event
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Send credentials directly to the backend server login endpoint
      const response = await fetch('/api/loginOld', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ username: username.trim(), password })
      });

      // Login error
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Invalid username or password.');
      }

      // Login success
      const data = await response.json();
      // Pass the username returned from backend up to App.jsx to switch the page to the correct dashboard
      onLoginSuccess(data.username);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReturnHome = async (e) => {
    e.preventDefault();
    try {
      window.location.href = 'https://robotics-project.gccis.rit.edu'
    }
    catch (err) {
      console.error(`Error in trying to return to status page -> Error: ${err.message}`);
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
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
      </div>

      <div className="below-login">
        <button className="btn-home" onClick={ (e) => handleReturnHome(e)}>
          Return Home
        </button>
        {error && <p className="error-message">❌ {error}</p>}
      </div>
    </div>
  );
}
