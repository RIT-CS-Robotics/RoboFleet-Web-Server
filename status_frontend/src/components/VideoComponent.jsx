import { useState, useEffect } from 'react'; 
import './VideoComponent.css';

export default function VideoComponent({robotId}) {
    const [hostAddress, setHostAddress] = useState('');

    useEffect(() => {
        async function getHostAddress() {
            try {
                const response = await fetch('/api', { method: 'GET' }); 
                if (!response.ok) { 
                    throw new Error(`Server returned status code ${response.status}`); 
                }
                const data = await response.json();
                const robots = data.fleet;

                if (!robots || !robots[robotId]) {
                    throw new Error(`Can not find robot with given ID`); 
                }

                const robot = robots[robotId];
                const hostAddress = robot.host;
                console.log(`Host address found for video streaming with robot: ${robotId}`);
                setHostAddress(hostAddress);
            }
            catch (err) {
                console.error(`Can not fetch host address for robot: ${robotId} for video streaming -> Error: ${err}`);
            }
        }
        getHostAddress();
    }, [robotId]);



    return (
        <div className="video-card">
            {hostAddress ? (
                <div className="stream-wrapper">
                    <img 
                        src={`/robot-stream/${hostAddress}/stream?topic=/image_raw`} 
                        alt={`Live Feed for ${robotId}`} 
                        className="robot-stream-feed"
                    />
                <span className="live-badge">LIVE</span>
                 </div>
            ) : (
            <div className="stream-loading">
                <p>Locating stream endpoint for Robot {robotId}...</p>
            </div>
                )}
        </div>
    );
}