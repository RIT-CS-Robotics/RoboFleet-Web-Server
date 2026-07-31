/**
 * Functionality: Robot video streaming component for the status page (robotics-project.gccis.rit.edu)
 * 
 * @file status_frontend/src/components/VideoComponent.jsx
 * @author Aidan Sanderson
 * @date 7/8/2026
 */

import { useState, useEffect } from 'react'; 
import './VideoComponent.css';

/**
 * The video component for a robots live camera feed display.
 * 
 * @param {string} host: The robot IP/Hostname.
 * @param {bollean} isOnline: Is the robot online right now?
 * @param {string} robotId: The id of the robot.
 */
export default function VideoComponent({host, isOnline, robotId}) {
    const [hostAddress, setHostAddress] = useState(''); // host IP for streaming video from ROS2 camera server
    const [videoDown, setVideoDown] = useState(false); // is the video services from ROS2 down?

    // gets the host IP when the component is loaded or when the online status of the robot changes.
    useEffect(() => {
        if (isOnline) {
            setVideoDown(false);
            console.log(`Host IP address collected for video streaming with Host: ${host} for Robot: ${robotId}`);
        }
        else {
            setVideoDown(true);
        }
    }, [isOnline]);

return (
    <div className="video-card">
            <div className="stream-wrapper">
                {/* VIDEO STREAM FOR ROBOT CAMERA */}
                {!videoDown ? (
                    <>
                        <img 
                            src={`/robot-stream/${host}/stream?topic=/image_raw&quality=30&width=640&height=480`} 
                            alt={`Live Feed for ${robotId}`} 
                            className="robot-stream-feed"
                            onError={() => setVideoDown(true)} 
                        />
                        {/* LIVE BADGE */}
                        <span className="live-badge">LIVE</span>
                    </>
                ) : (
                    <div className="robot-stream-feed stream-offline-box">
                        <span className="offline-text">STREAM OFFLINE</span>
                    </div>
                )}
            </div>
    </div>
);
}