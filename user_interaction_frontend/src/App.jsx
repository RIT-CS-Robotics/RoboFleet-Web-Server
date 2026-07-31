/**
 * Functionality:The general dashboard (admin, student dashboard, login) page.
 * (robotics-project.gccis.rit.edu/dashboard). Acts as a wrapper for those pages and handles login routing.
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

/**
 * Login, Student Dashboard, and Admin Dashboard main page overhead.
 */
export default function App() {
  // Is logged in or not
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('isLoggedIn') === 'true';
  });

  // Current user
  const [currentUser, setCurrentUser] = useState(() => {
    return sessionStorage.getItem('currentUser') || '';
  });

  // Current page view based on user
  const [currentView, setCurrentView] = useState(() => {
    const savedUser = sessionStorage.getItem('currentUser');
    return savedUser === 'admin' ? 'admin' : 'dashboard';
  });

  // Successfull login
  const handleLoginSuccess = (username) => {
    setIsLoggedIn(true);
    setCurrentUser(username);
    
    // If admin logs in, send them straight to management. Otherwise, send to student dashboard
    if (username === 'admin') {
      setCurrentView('admin');
    } else {
      setCurrentView('dashboard');
    }

    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('currentUser', username);
  };

  // Logout
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
