// src/App.jsx
import { useState } from 'react';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem('currentUser') || '';
  });

  // Determines the initial view based on who is logged in from localStorage
  const [currentView, setCurrentView] = useState(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser === 'admin' ? 'admin' : 'dashboard';
  });

  const handleLoginSuccess = (username) => {
    setIsLoggedIn(true);
    setCurrentUser(username);
    
    // Core Fix: If admin logs in, send them straight to management. Otherwise, send to fleet.
    if (username === 'admin') {
      setCurrentView('admin');
    } else {
      setCurrentView('dashboard');
    }

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', username);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser('');
    setCurrentView('dashboard');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
  };

  return (
    <>
      {isLoggedIn ? (
        currentView === 'admin' ? (
          // Notice we pass handleLogout here so the admin has a clear way out!
          <Admin onLogout={handleLogout} />
        ) : (
          <Dashboard 
            onLogout={handleLogout} 
            currentUser={currentUser} 
          />
        )
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
}
