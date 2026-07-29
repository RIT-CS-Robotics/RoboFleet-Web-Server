/**
 * Functionality:The general dashboard (admin, student dashboard, login) page.
 * (robotics-project.gccis.rit.edu/dashboard). Acts as a wrapper for those pages.
 *
 * @file user_interaction_frontend/src/pages/App.jsx
 * @author Aidan Sanderson
 * @date 7/29/2026
 */
import { useState } from 'react';
import './App.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('isLoggedIn') === 'true';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    return sessionStorage.getItem('currentUser') || '';
  });

  // Determines the initial view based on who is logged in from localStorage
  const [currentView, setCurrentView] = useState(() => {
    const savedUser = sessionStorage.getItem('currentUser');
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

    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('currentUser', username);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser('');
    setCurrentView('dashboard');
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('currentUser');
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
