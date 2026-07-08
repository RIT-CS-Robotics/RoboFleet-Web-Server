/**
 * @file status_frontend/src/components/VideoComponent.jsx
 * 
 * @fileoverview Robot video streaming component for the status page (robotics-project.gccis.rit.edu/status)
 * 
 * @date 7/8/2026
 * @author Aidan Sanderson
 */

import { useState, useEffect } from 'react'; 
import './VideoComponent.css';

export default function VideoComponent({host, isOnline, robotId}) {
    const [hostAddress, setHostAddress] = useState(''); // host IP for streaming video from ROS2 camera server

        // gets the host IP when component is loaded.
    useEffect(() => {
        setHostAddress(host);
    }, [isOnline]);

    return (
        <div className="video-card">
            {hostAddress ? (
                <div className="stream-wrapper">
                    {/* VIDEO STREAM FOR ROBOT CAMERA */}
                    <img 
                        src={`/robot-stream/${hostAddress}/stream?topic=/image_raw`} 
                        alt={`Live Feed for ${robotId}`} 
                        className="robot-stream-feed"
                    />
                {/* LIVE BADGE */}
                <span className="live-badge">LIVE</span>
                 </div>
            ) : (
            <div className="stream-loading">
            {/* LOADING */}
                <p>Locating stream endpoint for Robot {robotId}...</p>
            </div>
                )}
        </div>
    );
}