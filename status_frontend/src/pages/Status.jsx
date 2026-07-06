import { useState, useEffect } from 'react';
import './Status.css'; 
import GolisanoMap from '../components/MapComponent';
import VideoStream from '../components/VideoComponent';

function getRobotColor(robotId) {
  let robotColor = "gray";
  if (robotId.includes("1")) robotColor = "red";
  if (robotId.includes("2")) robotColor = "blue";
  if (robotId.includes("3")) robotColor = "green";
  return robotColor;
}

export default function Status() {
  const [fleetData, setFleetData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        <div className="system-bulletin-box" style={{ borderColor: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <strong className="system-bulletin-title" style={{ color: 'var(--danger)' }}>CRITICAL NETWORK ERROR:</strong>
          <span style={{ fontSize: '14px', fontFamily: 'var(--font-mono)' }}>{error}</span>
        </div>
      )}

      <div className="dashboard-layout">
        {/* Left Robot Display Column */}
        <div className="status-column">
          <h3>Robots</h3>
          <div className="inventory-list">
            {Object.entries(fleetData || {}).map(([robotId, info]) => (
              <details key={robotId} className={`robot-card ${info?.online ? 'online' : 'offline'} ${info?.active ? 'active' : 'inactive'}`} >
                <summary className="robot-card-summary">
                  <div className="card-profile-group">
                    <div className="robot-id-dot" style={{ backgroundColor: getRobotColor(robotId) }} />
                    <strong className="robot-title">
                      {robotId.replace('_', ' ')}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
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
                    {/* 1. Position Panel */}
                    <div className="robot-dropdown-content">
                      <strong className="telemetry-block-title">POSITION INFO</strong>
                      <p>Current X: {info?.position?.x ?? '0'}</p>
                      <hr className="telemetry-divider" />
                      <p>Current Y: {info?.position?.y ?? '0'}</p>
                    </div>

                    {/* 2. Destination Panel */}
                    <div className="robot-dropdown-content">
                      <strong className="telemetry-block-title">DESTINATION INFO</strong>
                      <p>Target: {info?.destinationName || 'N/A'}</p>
                      <hr className="telemetry-divider" />
                      <p>Target X: {info?.destination?.x ?? 'N/A'}</p>
                      <hr className="telemetry-divider" />
                      <p>Target Y: {info?.destination?.y ?? 'N/A'}</p>
                    </div>

                    {/* 3. Live Camera Asset Container */}
                    <div className="camera-dropdown-content">
                      {info?.online ? (
                        <VideoStream robotId={robotId} />
                      ) : (
                        <div className="stream-loading">
                          <p>Cannot view feed: Robot is offline</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Right Map Display Column */}
        <div className="map-column">
          <GolisanoMap fleetData={fleetData} />
        </div>
      </div>
    </div>
  );
}
