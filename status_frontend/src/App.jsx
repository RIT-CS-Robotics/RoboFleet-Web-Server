import { useState, useEffect } from 'react';
import './App.css';
import GolisanoMap from './MapComponent';

export function getRobotColor(robotId) {
    let robotColor = "gray";
    if (robotId.includes("1")) robotColor = "red";
    if (robotId.includes("2")) robotColor = "blue";
    if (robotId.includes("3")) robotColor = "green";
    return robotColor;
} 

export default function App() {
  const [fleetData, setFleetData] = useState({});
  const [latestText, setLatestText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFleetStatus = async () => {
    try {
      const response = await fetch('/api', {
        method: 'GET',
        headers: { 'x-dashboard-token': 'CS@RIT-70' }
      });
      if (!response.ok) {
        throw new Error(`Server returned status code ${response.status}`);
      }
      const data = await response.json();
      setLatestText(data.latestSavedText || '');
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
    const interval = setInterval(fetchFleetStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={{ padding: '20px' }}>Loading fleet matrix...</div>;

  return (
    <div className="dashboard-container">
      <h2>🛸 RoboFleet Live Monitor Panel</h2>
      
      {error && (
        <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', borderRadius: '4px', marginBottom: '15px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="dashboard-layout">
        
        {/* Left Column */}
        <div className="status-column">
          <h3>Robot Fleet Inventory ({Object.keys(fleetData || {}).length})</h3>
          
          <div className="inventory-list">
            {Object.entries(fleetData || {}).map(([robotId, info]) => (
              <div 
                key={robotId} 
                className="robot-card" 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '15px', 
                  borderRadius: '6px', 
                  border: '1px solid #e5e7eb', 
                  background: info?.online ? '#f0fdf4' : '#fef2f2', 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  marginBottom: '12px'
                }}
              >

                <div 
                  className="robot-id-dot" 
                  style={{ backgroundColor: getRobotColor(robotId) }} 
                />

                <div>
                  <strong style={{ textTransform: 'capitalize', fontSize: '1.1em' }}>
                    {robotId.replace('_', ' ')}
                  </strong>
                  <div style={{ fontSize: '0.85em', color: '#6b7280', marginTop: '2px' }}>
                    <p>Current X Coordinate: {info?.position?.x ?? 'N/A'}</p>
                    <hr />
                    <p>Current Y Coordinate: {info?.position?.y ?? 'N/A'}</p>
                  </div>
                </div>
                <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.85em', fontWeight: 'bold', color: info?.online ? '#15803d' : '#b91c1c', background: info?.online ? '#dcfce7' : '#fee2e2', border: `1px solid ${info?.online ? '#bbf7d0' : '#fecaca'}` }} >
                  {info?.online ? '● ONLINE' : '○ OFFLINE'}
                </span>
              </div>
            ))}
            <div className="broadcast-box">
            <strong>Last Broadcast Command Sent:</strong>
            <span className="broadcast-text">"{latestText}"</span>
          </div>


          </div>
        </div>

        {/* Right Column */}
        <div className="map-column">
          <GolisanoMap />
        </div>

      </div>
    </div>
  ); 
}
