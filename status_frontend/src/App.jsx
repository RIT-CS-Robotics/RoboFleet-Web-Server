// src/App.jsx
import { useState, useEffect } from 'react';
import './App.css';
import Status from './pages/Status';
import About from './pages/About';
import logo from './assets/logo.png';

export default function App() {
  const [activePage, setActivePage] = useState('status');

  useEffect(() => {
    document.title = activePage === 'status' ? "RoboFleet Status" : "About RoboFleet";
  }, [activePage]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      
      {/* GLOBAL HIGH-TECH TOP NAVIGATION BAR */}
      <nav className="global-navbar">
        
        {/* BRAND IDENTITY LOGO HEADER GROUP */}
        <div className="brand-logo-group">
          <img src={logo} alt="Company Brand Logo" />
          <h1>RoboFleet Live Monitor Panel</h1>
        </div>

        {/* NAVIGATION TOGGLE BUTTONS GROUP */}
        <div className="nav-buttons-group">
          <button 
            onClick={() => setActivePage('status')} 
            className={`nav-item-btn ${activePage === 'status' ? 'active-tab' : ''}`}
          >
            🛰️ Fleet Status
          </button>
          <button 
            onClick={() => setActivePage('about')} 
            className={`nav-item-btn ${activePage === 'about' ? 'active-tab' : ''}`}
          >
            ℹ️ About Project
          </button>
        </div>

      </nav>

      {/* RENDER VIEW SWITCHER COMPONENT */}
      <div className="app-viewport-stage">
        {activePage === 'status' ? <Status /> : <About />}
      </div>

    </div>
  );
}
