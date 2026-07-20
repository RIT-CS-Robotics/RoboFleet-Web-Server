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
const passport = require('passport'); // for saml authentification
const { defaultSamlStrategy, SP_CERT } = require('./samlConfig.js'); // samlConfig

const {getDestination} = require('./destinations.js'); // coordinate-destination mapping
const {robotRun, refreshOnRestart} = require('./robocom.js'); // running student code
const {createUserLog, removeUserLog, saveCode, getLogs, loadCode, removeCode, removeAllCode, getPerms, loadPerm} = require('./logs.js'); // create and remove code log directories for users

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

app.use(passport.initialize());
passport.use('saml', defaultSamlStrategy);

(async () => {await refreshOnRestart();}) () ; // clears any leftover temp code files and compiles Validator.java on server restart

const USERS_FILE = path.join(__dirname, '../users.json');

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

// generates the meta data for saml authentification
app.get("/saml2/metadata", (req, res) => {
  res.set('Content-Type', 'text/xml');
  res.send(defaultSamlStrategy.generateServiceProviderMetadata(SP_CERT, SP_CERT));
});

const robotConnections = {}; // each robot is saved here

/**
 * Helper function to dynamically manage connection to a robot and track its online/offline status. 
 * Also sets the information for each robot that the frontend will need, and manages ros2 topics.
 * 
 * @param robotId: The id number to give the robot
 * @param ipAddress: The IP/Hostname of the robot
 */
function initializeRobotConnection(robotId, ipAddress, optionalColor = 'grey') {
  //console.log(`Initializing connection loop for ${robotId} at ${ipAddress}...`);
  // Ensure we have a placeholder state object in our tracker if it doesn't exist
  if (!robotConnections[robotId]) {
    robotConnections[robotId] = {
      host: ipAddress,
      isConnected: false,
      instance: null,
      position: {x: 0, y: 0},
      direction: 0,
      destination: {x: 0, y: 0,},
      destinationName: 'N/A',
      isActive: false,
      color: optionalColor,
      battery: 0
    };
  }

  const wsUrl = `ws://${ipAddress}:9090`; // rosbridge websocket url
  const rosInstance = new ROSLIB.Ros({ url: wsUrl,  encoding: 'ascii'}); // rosbridge websocket connection

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
      robotConnections[robotId].direction = 0;
      robotConnections[robotId].instance = null;
      robotConnections[robotId].destination = {x: 0, y: 0,};
      robotConnections[robotId].destinationName = 'N/A';
      robotConnections[robotId].isActive = false;
      robotConnections[robotId].battery = 0;

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

    const batteryTopic = new ROSLIB.Topic({
      ros: rosInstance,
      name: '/laptop_battery',
      messageType: 'std_msgs/msg/Int32',
    });

    // timers for the backend to refresh how often to take in topic information.
    const THROTTLE_MS = 500; // time refreshers for each topic
    let lastProcessedTime_pos = 0;
    let lastProcessedTime_dest = 0;
    let lastProcessedTime_battery = 0;

    // ----------------------------------------------------
    // TOPIC SUBSCRIPTIONS
    // ----------------------------------------------------

    /**
     * Subscribes to a topic /robot_pos that continuously gets the robots current position and quaternion (for facing direction) 
     * in the building in x and y coordinates and updates them in the backend.
     * 
     * @param message: The message being received from the topic publisher.
     */
    posTopic.subscribe((message) => {
      const now = Date.now();
      if ((now - lastProcessedTime_pos) > THROTTLE_MS) {
        lastProcessedTime_pos = now;
        const xPos = message.pose.position.x;
        const yPos = message.pose.position.y;

        const quaternionZ = message.pose.orientation.z;
        const quaternionW = message.pose.orientation.w; // normalization value
        const angleRad = 2 * Math.atan2(quaternionZ, quaternionW); // radians
        const angleDeg = angleRad * (180/Math.PI); // deg (used for status page and map)

        robotConnections[robotId].position = { x: Number(xPos.toFixed(3)), y: Number(yPos.toFixed(3)) };
        robotConnections[robotId].direction = angleDeg;
      }
    });

    /**
     * Subscribes to a topic /nav_destination that continuously gets the x and y coordinates for the current 
     * goal destination and updates them in the backend. Also uses them as a key to look for the actual 
     * location name in a Map() if there is a location name mapped to those coordinates.
     * 
     * @param message: The message being received from the topic publisher.
     */
    destinationTopic.subscribe((message) => {
      const now = Date.now();
      if ((now - lastProcessedTime_dest) > THROTTLE_MS) {
        lastProcessedTime_dest = now;
        const xDest = message.pose.position.x;
        const yDest = message.pose.position.y;
        robotConnections[robotId].destination = { x: Number(xDest.toFixed(3)), y: Number(yDest.toFixed(3)) };
        const destName = getDestination(xDest, yDest);
        if (destName !== undefined) {
          robotConnections[robotId].destinationName = destName;
        }
        else {
          robotConnections[robotId].destinationName = 'N/A';
        }
      }
    });


    /**
     * Subscribes to a topic /laptop_battery that continuously gets the robot laptops current battery charge value from 0 to 100
     * 
     * @param message: The message being received from the topic publisher.
     */
    batteryTopic.subscribe((message) => {
      const now = Date.now();
      if ((now - lastProcessedTime_battery) > THROTTLE_MS) {
        lastProcessedTime_battery = now;
        const laptopBattery = message.data;
        robotConnections[robotId].battery = laptopBattery;
      }
    });

  });

  /**
   * Ends connection if there is an error with the robot web socket connection, then starts its reconnection triggering phase.
   * Note: roslib always fires 'close' right after 'error', but this trigger retry safely as an extra safeguard.
   */
  rosInstance.on('error', (error) => {
    //console.log(`ROSLIB Status: ${robotId} at ${ipAddress} is offline or unreachable.`);
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

// Necessary to tell passport how to serialize the user
// In a production environment we may just serialize the
// user.id and then read from the database when deserializing
passport.serializeUser(function (user, done) {
  done(null, user);
});

// Same as the above, we could just have an id and need to hydrate
// that into a full user object. In this example we just store the
// full attribute array in the session and retrieve it every time.
passport.deserializeUser(function (user, done) {
  done(null, user);
});


// ====================================================
// AUTHENTICATION & STUDENT REGISTRATION ROUTES
// ====================================================

// Passes the SAML login function handler to passport.
// Passport will then redirect the client to the IdP
app.get('/login', passport.authenticate('saml'));

// Passes the ACS function to passport. 
// Passport will then extract the attributes from the IdP
// assertion and store the user in the session.
app.post(
  "/saml2/acs",
  express.urlencoded({ extended: false }), // Modern Express replacement for bodyParser
  passport.authenticate("saml", {
    failureRedirect: "/loginFailed", // Redirect back to login if authentication fails
    failureFlash: false,       // Turn off flash messages unless you installed connect-flash
  }),
  function (req, res) {
    // Successful login! 
    // The RIT user attributes are now saved inside: req.user
    const cleanUsername = req.user.uid;
    const users = loadUsers();
    console.log("Logged in RIT User Attributes:", req.user);

    if(users[cleanUsername]) {
      console.log(`Authenticated user: ${cleanUsername} found in system. Redirecting to dashboard.`);
      return res.redirect('/dashboard');
    }

    else {
      console.warn(`Authenticated user: ${cleanUsername} not found in system. Denying access to dashboard.`);
      req.logout(() => {
        return res.redirect("/loginFailed");
      });
    }
  }
);

// LOGIN FAILURE ROUTE
app.get('/loginFailed', (req, res) => {
  // Extract why they landed here (if passed via query param)
  const reason = req.query.reason || 'saml_error';
  
  console.warn(`Login denied: ${reason}`);

  // Redirect the browser back to the status frontend with an error parameter
  // Vite can read this URL parameter and show an error popup or banner
  res.redirect(`/?error=${reason}`);
});

// ==================================================== //
// SECURE SESSION ENDPOINT (Feeds the User to Vite)
// ==================================================== //
app.get('/api/userSession', (req, res) => {
  // If the Passport session is valid, req.user exists
  if (req.isAuthenticated && req.isAuthenticated()) {
    // Deliver the RIT user to your Vite dashboard instantly
    return res.json({ 
      username: req.user.uid.trim() 
    });
  }

  // Security check: If someone tries to bypass login, block them
  console.error(`Unauthorized attempt to access dashboard`);
  return res.status(401).json({ message: "Unauthorized" });
});


app.post('/api/loginOld', (req, res) => {
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

 // gets the text from the specified log file for code and log versions
app.get('/api/log/:userName/:fileName', async (req,res) => {
  const user = req.params.userName;
  const title = req.params.fileName;
  const log = await loadCode(user, title, true);
  const code = await loadCode(user, title, false);
  res.json({ userLog: log, userCode: code });
});

 // gets the text from the specified log file for code and log versions
app.get('/api/perm/:userName/:fileName', async (req,res) => {
  const user = req.params.userName;
  const title = req.params.fileName;
  const perm = await loadPerm(user, title);
  res.json({ permLog: perm });
});

// gets all logs
app.get('/api/log/:userName', async (req, res) => {
const user = req.params.userName;
console.log(`Backend received data for log filename request for user: ${user}`);
const logs = await getLogs(user);
res.json({userLogs: logs});
});

// gets all logs
app.get('/api/perm/:userName', async (req, res) => {
const user = req.params.userName;
console.log(`Backend received data for perm filename request for user: ${user}`);
const perms = await getPerms(user);
res.json({userPerms: perms});
});

// removes specified log file
app.delete('/api/log/:userName/:logTitle', async (req, res) => {
  const user = path.basename(req.params.userName);
  const title = path.basename(req.params.logTitle);
  const success = await removeCode(user, title);
  if (success) {
    return res.status(200).json({message: 'Successfully removed student log'});
  }
  else {
    return res.status(500).json({message: 'Failed to remove student log'});
  }
});

// removes all log files for user
app.delete('/api/log/:userName', async (req, res) => {
  const user = path.basename(req.params.userName);
  const success = await removeAllCode(user);
  if (success) {
    return res.status(200).json({message: 'Successfully removed student log'});
  }
  else {
    return res.status(500).json({message: 'Failed to remove student log'});
  }
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
      direction: trackingData.direction,
      destination: trackingData.destination,
      destinationName: trackingData.destinationName,
      active: trackingData.isActive,
      color: trackingData.color,
      battery: trackingData.battery
    };
  }
  res.json({ fleet: statusReport }); // puts all of this information in a json file to transfer to the frontend
});

/**
 * REST get command used to retrieve robot information and broadcast message information from the backend.
 */
app.get('/api/robots', (req, res) => {
  const robotIDs = []
  for (const id of Object.keys(robotConnections)) {
    if (robotConnections[id].isConnected && !robotConnections[id].isActive) {
      robotIDs.push(id);
    }
  }
  res.json({ robots: robotIDs });
});

/**
 * REST post command that saves the broadcast message in the backend and forwards it to the robot.
 */
app.post('/api/deploy', (req, res) => {
    const robotId = req.body.robotId || 'robot_default';  // robot_default is for unconfigured robots
    const code = req.body.text; // broadcast message
    const title = req.body.codeTitle; // code/log title
    const user = req.body.user; // current user

    const fileType = title.split('$')[0]; // The raw file name without log info

    console.log(`Received data from frontend for ${robotId}:`, code);

    // selects the correct robot
    const trackingData = robotConnections[robotId];

    if (!trackingData) {
        return res.status(404).json({ message: `Robot ID "${robotId}" is not configured.` });
    }

    if (trackingData.isActive) {
        return res.status(409).json({ message: `Robot ID "${robotId}" is already active.` });
    }

    if (!fileType.endsWith('.py') && !fileType.endsWith('.java')) {
      console.error(`Error: Invalid file type`);
      return res.status(503).json( {message: `Invalid file type`});
    }

    const hostName = trackingData.host;

    // If the selected robot is online and connected to rosbridge then it creates a new topic /frontend_commands and publishes to it.
    // Note: this will need to be updated and optimized eventually for multiple robots getting signals at once.
    if (trackingData.isConnected && trackingData.instance) {

      robotConnections[robotId].isActive = true;

      saveCode(user, title, code); // writes student code in log file

      if (fileType.endsWith('.py')) {
        console.log(`Attempting to deploy Robot: ${robotId} -> (PYTHON VERSION)`);
        robotRun(code, title, user, robotId, hostName, 'Python', (active) => { // runs the robot
          codeCallback(active, robotId);
        });
        return res.json({ message: `Attempted to deploy ${robotId} with Python code` });
      }
      else if (fileType.endsWith('.java')) {
        console.log(`Attempting to deploy Robot: ${robotId} -> (JAVA VERSION)`);
        robotRun(code, title, user, robotId, hostName, 'Java', (active) => { // runs the robot
          codeCallback(active, robotId);
        });
        return res.json({ message: `Attempted to deploy ${robotId} with Java code` });
      }
  } else {
      return res.status(503).json( {message: `Error running code on ${robotId}`});
  }
});

function codeCallback(active, robotId) {
  robotConnections[robotId].isActive = active;
}

// ----------------------------------------------------
// ROBOFLEET REGISTRATION: add or edit robots here!
// ----------------------------------------------------
initializeRobotConnection('Robot 1', process.env.ROBOT_1_ADDRESS, '#307D7E'); 
initializeRobotConnection('Robot 2', process.env.ROBOT_2_ADDRESS, 'pink'); 
initializeRobotConnection('Robot 3', process.env.ROBOT_3_ADDRESS, 'blue'); 

// Open the HTTP gateway bound securely to the local bridge
app.listen(PORT, bridge, () => { 
    console.log(`Backend hub running securely on port ${PORT} via loopback ${bridge}`); 
});
