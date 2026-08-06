/**
 * Functionality: Main component for Status and About pages for RoboFleet (robotics-project.gccis.rit.edu). Acts as a wrapper for those pages.
 * 
 * @file status_frontend/src/App.jsx
 * @author Aidan Sanderson
 * @date 7/8/2026
 */

import { useState, useEffect } from 'react';
import './App.css';
import Status from './pages/Status';
import About from './pages/About';
import Songs from './pages/Songs';
import logo from './assets/logo.png';

/**
 * Status, About, and Songs page main.
 */
export default function App() {
  const [activePage, setActivePage] = useState('status'); // The current page (Status page or About page)

  // Used to load the selected page.
  useEffect(() => {
    if (activePage === 'status') {
      document.title = "RoboFleet Status";
    } else if (activePage === 'about') {
      document.title = "About RoboFleet";
    } else if (activePage === 'songs') {
      document.title = "RoboFleet Song List";
    }
  }, [activePage]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      
      {/* TOP NAVIGATION BAR */}
      <nav className="global-navbar">
        
        {/* RoboFleet LOGO HEADER GROUP */}
        <div className="brand-logo-group">
          <img src={logo} alt="Company Brand Logo" />
          <h1>RoboFleet Live Monitor Panel</h1>
          <a href="/dashboard" className="btn btn-primary">Login to Dashboard</a>
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
          <button 
            onClick={() => setActivePage('songs')} 
            className={`nav-item-btn ${activePage === 'songs' ? 'active-tab' : ''}`}
          >
           🎵 Song List
          </button>
        </div>

      </nav>

      {/* RENDER PAGE SWITCHER COMPONENT */}
      <div className="app-viewport-stage">
        {activePage === 'status' && <Status />}
        {activePage === 'about' && <About />}
        {activePage === 'songs' && <Songs />}
      </div>

    </div>
  );
}
