/**
 * @file status_frontend/src/App.jsx
 * 
 * @fileoverview Main component for Status and About pages for RoboFleet (robotics-project.gccis.rit.edu/status). Acts as a wrapper for those pages.
 * 
 * @date 7/8/2026
 * @author Aidan Sanderson
 */

import { useState, useEffect } from 'react';
import './App.css';
import Status from './pages/Status';
import About from './pages/About';
import logo from './assets/logo.png';

export default function App() {
  const [activePage, setActivePage] = useState('status'); // The current page (Status page or About page)

  // Used to load the selected page.
  useEffect(() => {
    document.title = activePage === 'status' ? "RoboFleet Status" : "About RoboFleet";
  }, [activePage]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      
      {/* TOP NAVIGATION BAR */}
      <nav className="global-navbar">
        
        {/* RoboFleet LOGO HEADER GROUP */}
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
            ℹ️ About
          </button>
        </div>

      </nav>

      {/* RENDER PAGE SWITCHER COMPONENT */}
      <div className="app-viewport-stage">
        {activePage === 'status' ? <Status /> : <About />}
      </div>

    </div>
  );
}
