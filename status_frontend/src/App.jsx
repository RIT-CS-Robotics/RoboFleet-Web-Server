// src/App.jsx
import { useState, useEffect } from 'react'; 
import './App.css'; 
import GolisanoMap from './components/MapComponent'; 
import VideoStream from './components/VideoComponent';

// Base padding offsets to push (0,0) slightly out from the sharp cut lines of the image border 
const MAP_SIZE_X = 2012; 
const MAP_SIZE_Y = 3069; 

export function getRobotColor(robotId) { 
  let robotColor = "gray"; 
  if (robotId.includes("1")) robotColor = "red"; 
  if (robotId.includes("2")) robotColor = "blue"; 
  if (robotId.includes("3")) robotColor = "green"; 
  return robotColor; 
} 

export function robotPlacement(metersX, metersY) { 
  const PIXEl_PER_METER = 25.773; 
  const pixelConX = metersX * PIXEl_PER_METER; 
  const pixelConY = metersY * PIXEl_PER_METER; 
  
  // FIXED: Moving UP from the bottom now means ADDING height pixels to our baseline anchor 
  const percentX = (pixelConX / MAP_SIZE_X) * 100; 
  const percentY = (pixelConY / MAP_SIZE_Y) * 100; 
  
  // FIXED: Return raw numerical strings so the CSS translate calc block reads them cleanly 
  return { x: `${percentX}%`, y: `${percentY}%` }; 
} 

export default function App() { 
  document.title = "RoboFleet Status";

  const [fleetData, setFleetData] = useState({}); 
  const [latestText, setLatestText] = useState(''); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 

  const fetchFleetStatus = async () => { 
    try { 
      const response = await fetch('/api', { method: 'GET' }); 
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
    // Real-time engine syncing data twice every second 
    const interval = setInterval(fetchFleetStatus, 500); 
    return () => clearInterval(interval); 
  }, []); 

  if (loading) {
    return <div style={{ padding: '20px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Loading fleet matrix...</div>; 
  }

  return ( 
    <div className="dashboard-container"> 
      <h2>🛸 RoboFleet Live Monitor Panel</h2> 
      
      {error && ( 
        <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius)', border: '1px solid var(--danger)', marginBottom: '15px', fontFamily: 'var(--font-mono)' }}> 
          <strong>Error:</strong> {error} 
        </div> 
      )} 

      <div className="dashboard-layout"> 
        {/* Left Robot Display */} 
        <div className="status-column"> 
          <h3>Robots ({Object.keys(fleetData || {}).length})</h3> 
          <div className="inventory-list"> 
            {Object.entries(fleetData || {}).map(([robotId, info]) => ( 
              <div key={robotId} className={`robot-card ${info?.online ? 'online' : 'offline'} ${info?.active ? 'active' : 'inactive'}`} > 
                {/* Structural unified horizontal row containing the color dot and text profiles */} 
                <div className="card-profile-group"> 
                  <div className="robot-id-dot" style={{ backgroundColor: getRobotColor(robotId) }} /> 
                  <div> 
                    <strong className="robot-title"> {robotId.replace('_', ' ')} </strong> 

                    {/* Robot Dropdowns */} 
                    <div className="robot-dropdown-group">

                      <details className="robot-dropdown position-dropdown">
                          <summary>Position Info</summary>
                             <div className="robot-dropdown-content position-dropdown-content">
                                <p>Current X Coordinate: {info?.position?.x ?? '0'}</p> 
                                <hr style={{ border: '0', borderTop: '1px solid var(--border)', margin: '4px 0' }} /> 
                                <p>Current Y Coordinate: {info?.position?.y ?? '0'}</p> 
                              </div>
                      </details>

                      <details className="robot-dropdown destination-dropdown">
                          <summary>Destination Info</summary>
                            <div className="robot-dropdown-content destination-dropdown-content">
                                <p>Destination Name: {info?.destination_name || 'N/A'}</p> 
                                <hr style={{ border: '0', borderTop: '1px solid var(--border)', margin: '4px 0' }} /> 
                                <p>Destination X Coordinate: {info?.destination?.x ?? 'N/A'}</p> 
                                <hr style={{ border: '0', borderTop: '1px solid var(--border)', margin: '4px 0' }} /> 
                                <p>Destination Y Coordinate: {info?.destination?.y ?? 'N/A'}</p> 
                            </div>
                      </details>

                      <details className="robot-dropdown camera-dropdown">
                          <summary>Live Footage</summary>
                            <div className="robot-dropdown-content camera-dropdown-content">
                              {info?.online ? (
                                <VideoStream robotId={robotId} />
                              ) : (
                                 <p>Cannot view feed: Robot is offline</p>
                                  )}
                            </div>
                      </details>

                    </div>

                  </div> 
                </div> 

                 {/* Online Status */} 
                <span className="status-badge"> 
                  {info?.online ? '● ONLINE' : '○ OFFLINE'} 
                </span> 

                 <span className="active-badge"> 
                  {info?.active ? '● ACTIVE' : '○ INACTIVE'} 
                </span> 

              </div> 
            ))} 
          </div> 
        </div> 

        {/* Right Map Display */} 
        <div className="map-column"> 
          <GolisanoMap dots={ 
            Object.entries(fleetData || {}).map(([robotId, info]) => { 
              if (!info?.online || info?.position?.x === undefined || info?.position?.y === undefined) { 
                return null; 
              } 
              const { x, y } = robotPlacement(info.position.x, info.position.y); 
              return ( 
                <div 
                  key={robotId} 
                  title={robotId} 
                  className="robot-map-dot" 
                  style={{ 
                    backgroundColor: getRobotColor(robotId), 
                    left: x, 
                    bottom: y,
                    transform: 'translate(-50%, 50%)',
                    transition: 'left 0.5s linear, bottom 0.5s linear'
                  }} 
                /> 
              ); 
            }) 
          } /> 
        </div> 
      </div> 
    </div> 
  ); 
}
