/**
 * File: app.js
 * @author Aidan Sanderson
 * Date: 6/9/2026
 * 
 * Functionality: The backend architecture for the RoboFleet webserver.
 */

require('dotenv').config(); // Version: dotenv@17.4.2
const express = require('express'); // Version: express@5.2.1
const cors = require('cors'); // Version: cors@2.8.6
const ROSLIB = require('roslib'); // Version: roslib@1.4.1
const fs = require('fs'); // Version: node@24.16.0
const path = require('path'); // Version: node@24.16.0

const {getDestination} = require('./destinations.js'); // coordinate-destination mapping
const {robotRun} = require('./robocom.js'); // running student code
const {createUserLog, removeUserLog, saveCode, getLogs, loadCode} = require('./logs.js'); // create and remove code log directories for users

// Initializes the app as an express app and sets the port for it to 3000
const app = express();
const PORT = process.env.PORT;
const bridge = process.env.ONLY_CONNECT;

// Tells the app to use cors and json
app.use(cors({
  origin: 'https://robotics-project.gccis.rit.edu',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
})); // Note: May be able to remove later if apache can do 100% of everything under the hood.
app.use(express.json());

// Security
app.set('trust proxy', 'loopback'); // allows any connections that apache provides, giving it reverse proxy controls
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

let latestSavedText = 'Hello World!'; // broadcast message
const robotConnections = {}; // each robot is saved here

/**
 * Helper function to dynamically manage connection to a robot and track its online/offline status. 
 * Also sets the information for each robot that the frontend will need, and manages ros2 topics.
 * 
 * @param robotId: The id number to give the robot
 * @param ipAddress: The IP/Hostname of the robot
 */
function initializeRobotConnection(robotId, ipAddress) {
  //console.log(`Initializing connection loop for ${robotId} at ${ipAddress}...`);
  // Ensure we have a placeholder state object in our tracker if it doesn't exist
  if (!robotConnections[robotId]) {
    robotConnections[robotId] = {
      host: ipAddress,
      isConnected: false,
      instance: null,
      position: {x: 0, y: 0},
      destination: {x: 0, y: 0,},
      destination_name: 'N/A'
    };
  }

  const wsUrl = `ws://${ipAddress}:9090`; // rosbridge websocket url
  const rosInstance = new ROSLIB.Ros({ url: wsUrl }); // rosbridge websocket connection

  // Track if a connection retry timer is already pending for this cycle
  let retryTriggered = false;

  /**
   * Function that checks for a robot without connection, resets its information values, 
   * and continuously tries to check if the robot is trying to connect again. 
   * This will only run when a robot connection dies to check every 5 seconds to restart the connection
  */
  const triggerRetry = () => {
    if (!retryTriggered) {
      retryTriggered = true;
      // Clean up event listeners to prevent Node.js memory leaks
      rosInstance.removeAllListeners();
      robotConnections[robotId].isConnected = false;
      robotConnections[robotId].position = { x: 0, y: 0};
      robotConnections[robotId].instance = null;
      robotConnections[robotId].destination = {x: 0, y: 0,};
      robotConnections[robotId].destination_name = 'N/A';

      setTimeout(() => {
        initializeRobotConnection(robotId, ipAddress);
      }, 5000); // Retry every 5 seconds
    }
  };

  /**
   * When a robot is connected, ste its web socket connection and subscribe to topics to
   * continuously update its current information that the frontend needs to display real time robotic information.
   */
  rosInstance.on('connection', () => {
    console.log(`SUCCESS: Connected via ROSLIB to ${robotId} at ${ipAddress}`);
    robotConnections[robotId].isConnected = true;

    // Sets its instance as a specific ros instance and uses it to communicate to rosbridge over its specific web socket connection
    robotConnections[robotId].instance = rosInstance;

    // ----------------------------------------------------
    // TOPIC INITIALIZATION
    // ----------------------------------------------------


    const posTopic = new ROSLIB.Topic({
      ros: rosInstance,
      name: "/robot_pos",
      messageType: "geometry_msgs/msg/PoseStamped",
    });

    const destinationTopic = new ROSLIB.Topic({
      ros: rosInstance,
      name: '/nav_destination',
      messageType: 'geometry_msgs/msg/PoseStamped',
    });

    // timers for the backend to refresh how often to take in topic information.
    const THROTTLE_MS = 500; // time refreshers for each topic
    let lastProcessedTime_pos = 0;
    let lastProcessedTime_dest = 0;

    // ----------------------------------------------------
    // TOPIC SUBSCRIPTIONS
    // ----------------------------------------------------

    /**
     * Subscribes to a topic /robot_pos that continuously gets the robots read from the new tracking object structure current position 
     * in the building in x and y coordinates and updates them in the backend.
     * 
     * @param message: The message being received from the topic publisher.
     */
    posTopic.subscribe((posMessage) => {
      //console.log("=== RECEIVED A PoseStamped POSITION MESSAGE ===", posMessage);
      const now = Date.now();
      if (now - lastProcessedTime_pos > THROTTLE_MS) {
        lastProcessedTime_pos = now;
        const xPos = posMessage.pose.position.x;
        const yPos = posMessage.pose.position.y;
        robotConnections[robotId].position = { x: Number(xPos.toFixed(3)), y: Number(yPos.toFixed(3)) };
      }
    });

    /**
     * Subscribes to a topic /nav_destination that continuously gets the x and y coordinates for the current 
     * goal destination and updates them in the backend. Also uses them as a key to look for the actual 
     * location name in a Map() if there is a location name mapped to those coordinates.
     * 
     * @param message: The message being received from the topic publisher.
     */
    destinationTopic.subscribe((destMessage) => {
      //console.log("=== RECEIVED A PoseStamped DESTINATION MESSAGE ===", destMessage);
      const now = Date.now();
      if (now - lastProcessedTime_dest > THROTTLE_MS) {
        lastProcessedTime_dest = now;
        const xDest = destMessage.pose.position.x;
        const yDest = destMessage.pose.position.y;
        robotConnections[robotId].destination = { x: Number(xDest.toFixed(3)), y: Number(yDest.toFixed(3)) };
        const destName = getDestination(xDest, yDest);
        if (destName !== undefined) {
          robotConnections[robotId].destination_name = destName;
        }
      }
    });

  });

  /**
   * Ends connection if there is an error with the robot web socket connection, then starts its reconnection triggering phase.
   * Note: roslib always fires 'close' right after 'error', but this trigger retry safely as an extra safeguard.
   */
  rosInstance.on('error', (error) => {
    console.log(`ROSLIB Status: ${robotId} at ${ipAddress} is offline or unreachable.`);
    triggerRetry();
  });

  /**
   * Ends connection if the robot web socket connection is closed, then starts its reconnection triggering phase.
   */
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

app.post('/api/register', (req, res) => {
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
  createUserLog(cleanUsername);

  console.log(`ADMIN ACTION: Registered a new student account: "${cleanUsername}"`);
  return res.status(201).json({ message: "Student account created successfully." });
});

// 3. GET ALL USERS (Excludes sensitive passwords from being exposed to frontend)
app.get('/api/users', (req, res) => {
  const users = loadUsers();
  // Get an array of just the usernames
  const usernames = Object.keys(users);
  return res.json(usernames);
});

// 4. DELETE USER ENDPOINT
app.delete('/api/users/:username', (req, res) => {
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
  removeUserLog(userToDelete);

  console.log(`ADMIN ACTION: Deleted student account: "${userToDelete}"`);
  return res.json({ message: `Account "${userToDelete}" has been removed.` });
});

// ====================================================
// Code Logging Routes
// ====================================================

app.post('/api/log', (req, res) => {
  const userName = req.body.user;
  const logName = req.body.log;
  const code = req.body.code;
  console.log(`Backend received data for log request for user: ${userName} and log: ${logName}`);
  const result = saveCode(userName, logName, code);
  if (result === false) {
    return res.status(400).json({message: 'Could not log student code'});
  }
  return res.status(201).json({message: 'Successfully logged student code'});
});

app.get('/api/log/:userName/:fileName', async (req,res) => {
  const user = req.params.userName;
  const title = req.params.fileName;
  const log = await loadCode(user, title, true);
  const code = await loadCode(user, title, false);
  res.json({ userLog: log, userCode: code });
});

app.get('/api/log/:userName', async (req, res) => {
const user = req.params.userName;
console.log(`Backend received data for log filename request for user: ${user}`);
const logs = await getLogs(user);
res.json({userLogs: logs});
});


// ====================================================
// ROBOT DATA COMMUNICATION ROUTES
// ====================================================

/**
 * REST get command used to retrieve robot information and broadcast message information from the backend.
 */
app.get('/api', (req, res) => {
  const statusReport = {};
  for (const [id, trackingData] of Object.entries(robotConnections)) {
    // stores the connection details and info of each robot using its id.
    statusReport[id] = {
      host: trackingData.host,
      online: trackingData.isConnected,
      position: trackingData.position,
      destination: trackingData.destination,
      destination_name: trackingData.destination_name
    };
  }
  res.json({ latestSavedText: latestSavedText, fleet: statusReport }); // puts all of this information in a json file to transfer to the frontend
});

/**
 * REST post command that saves the broadcast message in the backend and forwards it to the robot.
 */
app.post('/api/save', (req, res) => {
    const robotId = req.body.robotId || 'robot_default';  // robot_default is for unconfigured robots
    const userText = req.body.text; // broadcast message

    console.log(`Received data from frontend for ${robotId}:`, userText);

    // selects the correct robot
    const trackingData = robotConnections[robotId];
    const hostName = trackingData.host;

    if (!trackingData) {
        return res.status(404).json({ message: `Robot ID "${robotId}" is not configured.` });
    }

    // If the selected robot is online and connected to rosbridge then it creates a new topic /frontend_commands and publishes to it.
    // Note: this will need to be updated and optimized eventually for multiple robots getting signals at once.
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

        robotRun(userText,robotId, hostName); // runs the robot

        console.log(`Forwarded "${userText}" to ${robotId} on topic /frontend_commands`);
        return res.json({ message: `Saved and forwarded to ${robotId}: "${userText}"` });
    } else {
        return res.status(503).json({ message: `Message not saved, ${robotId} is offline.` });
    }
});

// ----------------------------------------------------
// ROBOFLEET REGISTRATION: add or edit robots here!
// ----------------------------------------------------
initializeRobotConnection('robot 1', process.env.ROBOT_1_ADDRESS); 
initializeRobotConnection('robot 2', process.env.ROBOT_2_ADDRESS); 
initializeRobotConnection('robot 3', process.env.ROBOT_3_ADDRESS); 

// Open the HTTP gateway bound securely to the local bridge
app.listen(PORT, bridge, () => { 
    console.log(`Backend hub running securely on port ${PORT} via loopback ${bridge}`); 
});
