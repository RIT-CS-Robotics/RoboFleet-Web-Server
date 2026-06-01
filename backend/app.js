// These lines are essentially the same as imports
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const ROSLIB = require('roslib');
const dns = require('dns');

// Initializes the app as an express app and sets the port for it to 3000
const app = express();
const PORT = process.env.PORT || 3000;

// Tells the app to use cors and json
app.use(cors());
app.use(express.json());

// Security
app.set('trust proxy', true);
const passkey = process.env.PASSKEY;

// Specific IP addresses of computers with direct access to the backend
const ALLOWED_HOSTS = process.env.ALLOWED_HOSTS ? process.env.ALLOWED_HOSTS.split(',') : [];

const allowedIPsFromHosts = new Set();

// Resolve hostnames to IPs
ALLOWED_HOSTS.forEach(host => {
    const cleanHost = host.trim();
    if (/^[0-9.]+$/.test(cleanHost)) {
        allowedIPsFromHosts.add(cleanHost);
    } else {
        dns.lookup(cleanHost, (err, address) => {
            if (!err) {
                allowedIPsFromHosts.add(address);
                console.log(`DNS: Resolved ${cleanHost} to ${address}`);
            } else {
                console.error(`DNS Error: Could not resolve hostname ${cleanHost}`);
            }
        });
    }
});

let latestSavedText = 'Hello World!';

// This will now hold an object tracking status AND the active instance
const robotConnections = {}; 

// Check to make sure the request is coming from an allowed place
function verifyPassKey(req, res, next) {
    const clientToken = req.headers['x-dashboard-token'];
    const clientIp = req.ip;

    // Does the visitor have the correct secret token header?
    const hasValidToken = (clientToken === passkey);

    // Is the visitor's computer on the approved IP list?
    const isApprovedIp = allowedIPsFromHosts.has(clientIp);

    // If either check is true, grant full access to the backend
    if (hasValidToken || isApprovedIp) {
        return next();
    }

    // Access denied
    console.log(`SECURITY: Blocked unauthorized request from IP: ${clientIp}`);
    return res.status(403).json({ error: "Direct API access is disabled."}); 
}

/**
 * Helper function to dynamically connect to a robot and track its status
 */
function initializeRobotConnection(robotId, ipAddress) {
    console.log(`Initializing connection loop for ${robotId} at ${ipAddress}...`);

    // Ensure we have a placeholder state object in our tracker if it doesn't exist
    if (!robotConnections[robotId]) {
        robotConnections[robotId] = {
            host: ipAddress,
            isConnected: false,
            instance: null,
            position: {x: 0, y: 0},
        };
    }

    const wsUrl = `ws://${ipAddress}:9090`;
    const rosInstance = new ROSLIB.Ros({ url: wsUrl });
    
    // Track if a retry timer is already pending for this cycle
    let retryTriggered = false;

    // This will only run when a robot connection dies to check every 5 seconds to restart the connection
    const triggerRetry = () => {
        if (!retryTriggered) {
            retryTriggered = true;
            
            // Clean up event listeners to prevent Node.js memory leaks
            rosInstance.removeAllListeners();
            robotConnections[robotId].isConnected = false;
            robotConnections[robotId].instance = null;

            setTimeout(() => {
                initializeRobotConnection(robotId, ipAddress);
            }, 5000); // Retry every 5 seconds
        }
    };

    rosInstance.on('connection', () => {
        console.log(`SUCCESS: Connected via ROSLIB to ${robotId} at ${ipAddress}`);
        robotConnections[robotId].isConnected = true;
        robotConnections[robotId].instance = rosInstance;

        const odomTopic = new ROSLIB.Topic({
            ros: rosInstance,
            name: "/odom",
            messageType: "nav_msgs/msg/Odometry",
        });
        let lastProccessedTime = 0;
        const THROTTLE_MS = 500;

        odomTopic.subscribe((message) => {
            const now = Date.now();
            if (now - lastProccessedTime > THROTTLE_MS) {
                lastProccessedTime = now;
                const xPos = message.pose.pose.position.x;
                const yPos = message.pose.pose.position.y;
                robotConnections[robotId].position = { x: Number(xPos.toFixed(3)), y: Number(yPos.toFixed(3))};
            }
        });
    });

    rosInstance.on('error', (error) => {
        console.log(`ROSLIB Status: ${robotId} at ${ipAddress} is offline or unreachable.`);
        // Note: roslib always fires 'close' right after 'error', but we trigger retry safely
        triggerRetry();
    });

    rosInstance.on('close', () => {
        console.log(`ROSLIB Connection to ${robotId} closed.`);
        triggerRetry();
    });
}

// ----------------------------------------------------
// FLEET REGISTRATION: Add or edit your robots here!
// ----------------------------------------------------
initializeRobotConnection('robot 1', process.env.ROBOT_1_ADDRESS || 'gcis-zxbvcs-rl1.ad.rit.edu');
initializeRobotConnection('robot 2', process.env.ROBOT_2_ADDRESS || 'gcis-zxbvcs-rl2.ad.rit.edu');
initializeRobotConnection('robot 3', process.env.ROBOT_3_ADDRESS || 'gcis-zxbvcs-rl3.ad.rit.edu');

// read from the new tracking object structure
app.get('/api', verifyPassKey, (req, res) => {
    const statusReport = {};
    for (const [id, trackingData] of Object.entries(robotConnections)) { // stores the ip of each robot in an id temp variable and the connection details in a trackingData temp variable
        statusReport[id] = { 
            host: trackingData.host, 
            online: trackingData.isConnected,
            position: trackingData.position 
        };
    }
    res.json({ latestSavedText: latestSavedText, fleet: statusReport }); // puts all of this information in a json file to transfer to the status page
});

// publish to the fresh active instance securely
app.post('/api/save', verifyPassKey, (req, res) => { // req is the incoming data from the frontend and res is the responce to send back
    const robotId = req.body.robotId || 'robot_default'; 
    const userText = req.body.text;

    console.log(`Received data from frontend for ${robotId}:`, userText);

    const trackingData = robotConnections[robotId];

    if (!trackingData) {
        return res.status(404).json({ message: `Robot ID "${robotId}" is not configured.` });
    }

    // Check if we have a live websocket instance running and if we do then a ros topic is created
    if (trackingData.isConnected && trackingData.instance) {
        latestSavedText = userText;
        // Instantiate the topic directly on the current live instance
        const textTopic = new ROSLIB.Topic({ // this is the new topic that is created
            ros: trackingData.instance, // this is like the highway to the robot
            name: '/frontend_commands',
            messageType: 'std_msgs/String'
        });

        const msg = new ROSLIB.Message({ data: userText }); // new message for the textTopic is created with the user inputed text from the frontend and is then published
        textTopic.publish(msg);

        console.log(`Forwarded "${userText}" to ${robotId} on topic /frontend_commands`);
        return res.json({ message: `Saved and forwarded to ${robotId}: "${userText}"` });
    } else {
        return res.status(503).json({ message: `Message not saved, ${robotId} is offline.` });
    }
});

app.listen(PORT, () => {
    console.log(`Backend hub running on port ${PORT}`);
});
