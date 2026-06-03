require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ROSLIB = require('roslib');
const dns = require('dns').promises;
const fs = require('fs');
const path = require('path');

// Initializes the app as an express app and sets the port for it to 3000
const app = express();
const PORT = process.env.PORT;

// Tells the app to use cors and json
app.use(cors());
app.use(express.json());

// Security
app.set('trust proxy', true);
const passkey = process.env.PASSKEY;

const USERS_FILE = path.join(__dirname, 'users.json');

// Helper function to read the user file safely
function loadUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      return { "admin": passkey };
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading users file:", err);
    return {};
  }
}

// Helper function to write to the user file safely
function saveUsers(usersObj) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersObj, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing to users file:", err);
  }
}

// Specific IP addresses of computers with direct access to the backend
const ALLOWED_HOSTS = process.env.ALLOWED_HOSTS ? process.env.ALLOWED_HOSTS.split(',') : [];
const allowedIPsFromHosts = new Set();

// Resolve hostnames to IPs
async function initializeAllowedIPs() {
  for (const host of ALLOWED_HOSTS) {
    const cleanHost = host.trim(); // simply just removes white spaces and non-needed characters of host name
    // If it's already an IP, add it directly
    if (/^[0-9a-fA-F:.]+$/.test(cleanHost)) { // checks to see if its a numerical IP
      allowedIPsFromHosts.add(cleanHost);
      continue; // go to the next host
    }
    // If it's a domain, await the resolution
    try {
      const result = await dns.lookup(cleanHost); // checks to see if the host name is a valid dns to use
      allowedIPsFromHosts.add(result.address);
      console.log(`DNS: Resolved ${cleanHost} to ${result.address}`);
    } catch (err) {
      console.error(`DNS Error: Could not resolve ${cleanHost}`, err.message);
    }
  }
}

let latestSavedText = 'Hello World!'; // This will now hold an object tracking status AND the active instance
const robotConnections = {};

// Check to make sure the request is coming from an allowed place
function verifyPassKey(req, res, next) {
  const clientToken = req.headers['x-dashboard-token'];
  let clientIp = req.ip;

  // removes ipv6 wrapper
  if (clientIp && clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.substring(7);
  }

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
      odometry: {x: 0, y: 0},
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

    // ----------------------------------------------------
    // TOPICS
    // ----------------------------------------------------
    const odomTopic = new ROSLIB.Topic({
      ros: rosInstance,
      name: "/odom",
      messageType: "nav_msgs/msg/Odometry",
    });

    const posTopic = new ROSLIB.Topic({
      ros: rosInstance,
      name: "/robot_pos",
      messageType: "geometry_msgs/msg/PoseStamped",
    });

    // timer for topics
    const THROTTLE_MS = 500; // time refreshers for each topic
    let lastProcessedTime_odom = 0;
    let lastProcessedTime_pos = 0;

    odomTopic.subscribe((message) => {
      const now = Date.now();
      if (now - lastProcessedTime_odom > THROTTLE_MS) {
        lastProcessedTime_odom = now;
        const xOdom = message.pose.pose.position.x;
        const yOdom = message.pose.pose.position.y;
        robotConnections[robotId].odometry = { x: Number(xOdom.toFixed(3)), y: Number(yOdom.toFixed(3))};
      }
    });

    posTopic.subscribe((message) => {
      const now = Date.now();
      if (now - lastProcessedTime_pos > THROTTLE_MS) {
        lastProcessedTime_pos = now;
        const xPos = message.pose.position.x;
        const yPos = message.pose.position.y;
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

// ====================================================
// AUTHENTICATION & STUDENT REGISTRATION ROUTES
// ====================================================

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  const users = loadUsers();
  const cleanUsername = username.trim();

  if (users[cleanUsername] && users[cleanUsername] === password) {
    console.log(`AUTH: User "${cleanUsername}" successfully logged in.`);
    return res.json({ username: cleanUsername });
  }

  console.log(`AUTH FAILED: Failed login attempt for user "${cleanUsername}".`);
  return res.status(401).json({ message: "Invalid username or password. Access denied." });
});

app.post('/api/register', verifyPassKey, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  const cleanUsername = username.trim();
  const users = loadUsers();

  if (users[cleanUsername]) {
    return res.status(409).json({ message: "Account username already exists." });
  }

  users[cleanUsername] = password;
  saveUsers(users);

  console.log(`ADMIN ACTION: Registered a new student account: "${cleanUsername}"`);
  return res.status(201).json({ message: "Student account created successfully." });
});

// 3. GET ALL USERS (Excludes sensitive passwords from being exposed to frontend)
app.get('/api/users', verifyPassKey, (req, res) => {
  const users = loadUsers();
  // Get an array of just the usernames
  const usernames = Object.keys(users);
  return res.json(usernames);
});

// 4. DELETE USER ENDPOINT
app.delete('/api/users/:username', verifyPassKey, (req, res) => {
  const userToDelete = req.params.username.trim();
  const users = loadUsers();

  // Protect the primary admin account from accidental deletion
  if (userToDelete === 'admin') {
    return res.status(400).json({ message: "The main admin account cannot be deleted." });
  }

  // Check if the user exists
  if (!users[userToDelete]) {
    return res.status(404).json({ message: "User account not found." });
  }

  // Remove user from the object and save changes
  delete users[userToDelete];
  saveUsers(users);

  console.log(`ADMIN ACTION: Deleted student account: "${userToDelete}"`);
  return res.json({ message: `Account "${userToDelete}" has been removed.` });
});

// read from the new tracking object structure
app.get('/api', verifyPassKey, (req, res) => {
  const statusReport = {};
  for (const [id, trackingData] of Object.entries(robotConnections)) {
    // stores the ip of each robot in an id temp variable and the connection details in a trackingData temp variable
    statusReport[id] = {
      host: trackingData.host,
      online: trackingData.isConnected,
      odometry: trackingData.odometry,
      position: trackingData.position,
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

// ----------------------------------------------------
// FLEET REGISTRATION: Add or edit your robots here!
// ----------------------------------------------------
initializeAllowedIPs().then(() => { // init IPs and then run the server
    // Start robot tracking loops after security is ready
    initializeRobotConnection('robot 1', process.env.ROBOT_1_ADDRESS); 
    initializeRobotConnection('robot 2', process.env.ROBOT_2_ADDRESS); 
    initializeRobotConnection('robot 3', process.env.ROBOT_3_ADDRESS); 

    // Open the HTTP gateway
    app.listen(PORT, () => { 
        console.log(`Backend hub running on port ${PORT}`); 
    }); 
}).catch(err => {
    console.error('CRITICAL ERROR: Security failed to initialize.', err);
    process.exit(1);
});
