const express = require('express');
const cors = require('cors');
const ROSLIB = require('roslib'); // Works perfectly out of the box now!

const app = express(); 
const PORT = 3000; 

app.use(cors()); 
app.use(express.json()); 

let latestSavedText = 'Hello World!'; 
const robotConnections = {};

/**
 * Helper function to dynamically connect to a robot and track its status
 */
function initializeRobotConnection(robotId, ipAddress) {
    console.log(`Initializing connection for ${robotId} at ${ipAddress}...`);

    // roslib 1.x automatically handles the Node.js websocket internally!
    const rosInstance = new ROSLIB.Ros({ 
        url: `ws://${ipAddress}:9090`
    }); 

    rosInstance.isConnected = false;
    rosInstance.ip = ipAddress;

    rosInstance.on('connection', () => { 
        console.log(`SUCCESS: Connected via ROSLIB to ${robotId} at ${ipAddress}`); 
        rosInstance.isConnected = true; 
    }); 

    rosInstance.on('error', (error) => { 
        console.log(`ROSLIB Status: ${robotId} at ${ipAddress} is offline or unreachable.`); 
        rosInstance.isConnected = false; 
    }); 

    rosInstance.on('close', () => { 
        console.log(`ROSLIB Connection to ${robotId} closed.`); 
        rosInstance.isConnected = false; 
    }); 

    robotConnections[robotId] = rosInstance;
}

// ----------------------------------------------------
// FLEET REGISTRATION: Add or edit your robots here!
// ----------------------------------------------------
initializeRobotConnection('robot_alpha', '192.168.1.50'); 
initializeRobotConnection('robot_beta', '192.168.1.60'); 


// 1. CHANGED: This route is now just '/api' instead of '/api/status'
app.get('/api', (req, res) => { 
    const statusReport = {};
    for (const [id, connection] of Object.entries(robotConnections)) {
        statusReport[id] = {
            ip: connection.ip,
            online: connection.isConnected
        };
    }
    res.json({ latestSavedText, fleet: statusReport }); 
}); 


// 2. CHANGED: This route is now just '/api/save' instead of '/api/robot/:id/save'
app.post('/api/save', (req, res) => {
    // Looks for the 'robotId' property inside the body json sent from the frontend
    const robotId = req.body.robotId || 'robot_alpha'; // Defaults to alpha if missing
    const userText = req.body.text; 
    latestSavedText = userText; 
    
    console.log(`Received data from frontend for ${robotId}:`, userText); 

    const targetRos = robotConnections[robotId];

    if (!targetRos) {
        return res.status(404).json({ message: `Robot ID "${robotId}" is not configured.` });
    }

    if (targetRos.isConnected) { 
        const textTopic = new ROSLIB.Topic({ 
            ros: targetRos, 
            name: '/frontend_commands', 
            messageType: 'std_msgs/String' 
        }); 

        const msg = new ROSLIB.Message({ 
            data: userText 
        }); 

        textTopic.publish(msg); 
        console.log(`Forwarded "${userText}" to ${robotId} on topic /frontend_commands`); 

        return res.json({ message: `Saved and forwarded to ${robotId}: "${userText}"` }); 
    } else { 
        return res.status(503).json({ message: `Saved locally, but ${robotId} is offline.` }); 
    } 
}); 

app.listen(PORT, () => { 
    console.log(`Backend hub running on port ${PORT}`); 
});
