/**
 * Functionality: Resources page for RoboFleet (robotics-project.gccis.rit.edu)
 * 
 * @file status_frontend/src/pages/Resources.jsx
 * @author Aidan Sanderson
 * @date 8/6/2026
 */
import { useState, useEffect } from 'react';
import './Resources.css';
import InstructionsComponent from '../components/resources/InstructionsComponent';
import PythonAPIComponent from '../components/resources/PythonAPIComponent';
import JavaAPIComponent from '../components/resources/JavaAPIComponent';
import SongsComponent from '../components/resources/SongsComponent';
import ExampleComponent from '../components/resources/ExampleComponent';

/**
 * Resources page
 */
export default function Resources() {
  const [activeTab, setActiveTab] = useState('instructions');

  return (
    <div className="resources-container">
      {/* Left Sidebar Menu */}
      <aside className="sidebar">
        <h2 className="sidebar-title">RoboFleet Resources</h2>
        <nav className="sidebar-menu">
          <button 
            className={`menu-btn ${activeTab === 'instructions' ? 'active' : ''}`} 
            onClick={() => setActiveTab('instructions')}
          >
            Instructions
          </button>
          <button 
            className={`menu-btn ${activeTab === 'apiPY' ? 'active' : ''}`} 
            onClick={() => setActiveTab('apiPY')}
          >
            Robot.py API
          </button>
          <button 
            className={`menu-btn ${activeTab === 'apiJAVA' ? 'active' : ''}`} 
            onClick={() => setActiveTab('apiJAVA')}
          >
            Robot.java API
          </button>
          <button 
            className={`menu-btn ${activeTab === 'songs' ? 'active' : ''}`} 
            onClick={() => setActiveTab('songs')}
          >
            Song List
          </button>
          <button 
            className={`menu-btn ${activeTab === 'example' ? 'active' : ''}`} 
            onClick={() => setActiveTab('example')}
          >
            Example Code
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="content-area">
        {activeTab === 'instructions' && (
          <section className="content-section">
            <InstructionsComponent />
          </section>
        )}

        {activeTab === 'apiPY' && (
          <section className="content-section">
            <PythonAPIComponent />
          </section>
        )}

        {activeTab === 'apiJAVA' && (
          <section className="content-section">
            <JavaAPIComponent />
          </section>
        )}

        {activeTab === 'songs' && (
          <section className="content-section">
            <SongsComponent />
          </section>
        )}

        {activeTab === 'example' && (
          <section className="content-section">
            <ExampleComponent />
          </section>
        )}
      </main>
    </div>
  );
}
