/**
 * @file status_frontend/src/pages/Status.jsx
 * 
 * @fileoverview Status page for RoboFleet (robotics-project.gccis.rit.edu/status)
 * 
 * @date 7/8/2026
 * @author Aidan Sanderson
 */

import { useState, useEffect } from 'react';
import './Status.css'; 
import GolisanoMap from '../components/MapComponent';
import VideoStream from '../components/VideoComponent';

export default function Status() {
  const [fleetData, setFleetData] = useState({}); // Robotics fleet data
  const [loading, setLoading] = useState(true); // Is the page loading?
  const [error, setError] = useState(null); // A page error

  /**
   * Gets the needed information for the robots connected to the web server.
   * 
   * @returns: The robots established on the web server and the information they contain.
   */
  const fetchFleetStatus = async () => {
    try {
      const response = await fetch('/api', { method: 'GET' });
      if (!response.ok) {
        throw new Error(`Server returned status code ${response.status}`);
      }
      const data = await response.json();
      setFleetData(data.fleet || {});
      setError(null);
    } catch (err) {
      console.error("Error pulling status:", err);
      setError("Failed to sync with backend server.");
    } finally {
      setLoading(false);
    }
  };

  // Updates the robot fleet status every 0.5 seconds and on initial load.
  useEffect(() => {
    fetchFleetStatus();
    const interval = setInterval(fetchFleetStatus, 500);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div style={{ padding: '20px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Loading fleet status...</div>;
  }

return (
  <div className="dashboard-container">
    {/* SYSTEM ERROR BULLETIN PANEL */}
    {error && (
      <div 
        className="system-bulletin-box" 
        style={{ borderColor: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)' }}
      >
        <strong className="system-bulletin-title" style={{ color: 'var(--danger)' }}>CRITICAL NETWORK ERROR:</strong>
        <span style={{ fontSize: '14px', fontFamily: 'var(--font-mono)' }}>{error}</span>
      </div>
    )}

    <div className="dashboard-layout">
      {/* ROBOT DISPLAY LEFT COLUMN*/}
      <div className="status-column">
        <h3>Robots</h3>
        <div className="inventory-list">
          {Object.entries(fleetData || {}).map(([robotId, info]) => (
            <details 
              key={robotId} 
              className={`robot-card ${info?.online ? 'online' : 'offline'} ${info?.active ? 'active' : 'inactive'}`}
            >
              <summary className="robot-card-summary">
                <div className="card-profile-group">
                  <div className="robot-id-dot" style={{ backgroundColor: info.color }} />
                  <strong className="robot-title">
                    {/* if the robotId is using _ as spaces in configuration */}
                    {robotId.replace('_', ' ')}
                  </strong>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                  
                  {/* BATTERY CONTAINER */}
                  <div className="inline-battery-container">
                    <div className="inline-battery-shell">
                      <div 
                        className="inline-battery-fill" 
                        style={{ height: `${Math.max(0, Math.min(100, info.battery ?? 0))}%` }}
                      />
                    </div>
                    <div className="inline-battery-tip" />
                    <span className="inline-battery-text">{info.battery ?? 0}%</span>
                  </div>

                  <span className="status-badge">
                    {info?.online ? '● ONLINE' : '○ OFFLINE'}
                  </span>
                  <span className="active-badge">
                    {info?.active ? '⚡ ACTIVE' : '🛑 INACTIVE'}
                  </span>
                </div>
              </summary>

              <div className="robot-expanded-body">
                <div className="telemetry-stack-group">
                  {/* MERGED POSITION & DESTINATION PANEL */}
                  <div className="robot-dropdown-content telemetry-merged-row">
                    
                    {/* 1. POSITION PANEL (LEFT) */}
                    <div className="telemetry-sub-panel">
                      <strong className="telemetry-block-title">POSITION INFO</strong>
                      <p>Current X: {info?.position?.x ?? '0'}</p>
                      <hr className="telemetry-divider" />
                      <p>Current Y: {info?.position?.y ?? '0'}</p>
                      <hr className="telemetry-divider" />
                      <p>Current Direction: {Math.round(info?.direction) ?? '0'}°</p>
                    </div>

                    {/* VERTICAL DIVIDER */}
                    <div className="telemetry-vertical-divider" />

                    {/* 2. DESTINATION PANEL (RIGHT) */}
                    <div className="telemetry-sub-panel">
                      <strong className="telemetry-block-title">DESTINATION INFO</strong>
                      <p>Target: {info?.destinationName || 'N/A'}</p>
                      <hr className="telemetry-divider" />
                      <p>Target X: {info?.destination?.x ?? 'N/A'}</p>
                      <hr className="telemetry-divider" />
                      <p>Target Y: {info?.destination?.y ?? 'N/A'}</p>
                    </div>
                  </div>

                  {/* 3. LIVE CAMERA STREAMING */}
                  <div className="camera-dropdown-content">
                    <VideoStream host={info.host} isOnline={info.online} robotId={robotId} />
                  </div>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* MAP DISPLAY RIGHT COLUMN */}
      <div className="map-column">
        <GolisanoMap fleetData={fleetData} />
      </div>
    </div>
  </div>
);

}
