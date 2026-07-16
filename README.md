# RoboFleet Web Server

The complete backend and frontend architecture for the RoboFleet Project, hosted at Rochester Institute of Technology (RIT). This project manages robotic fleets, real-time tracking streams over ROS2, secure SAML authentication, and student code execution sandboxing.

---

## 📂 Project Architecture

```text
RoboFleet_WebServer/
├── backend/                      # Node.js Express Backend Service
│   ├── certificates/             # Service SSL/IdP SAML Certs (Root Ignored)
│   ├── code_files/               # Temporary runtime storage & core assets
│   ├── user_logs/                # Dynamic log directories per student
│   ├── src/                      # Source Code Matrix
│   │   ├── app.js                # Core API Hub & Routing Gateway
│   │   ├── destinations.js       # Coordinate-to-Room Mapping Engine
│   │   ├── logs.js               # File stream controllers
│   │   ├── robocom.js            # Docker process spawning controller
│   │   └── samlConfig.js         # Shibboleth Authentication Layer
│   ├── Dockerfile                # Student container sandbox builder
│   ├── package.json              # Backend isolated configuration
│   └── users.json                # User credentials database
├── status_frontend/              # Vite + React Robot Monitoring Dashboard
│   ├── src/                      # App views & dashboard grids
│   └── package.json              # Status isolated configuration
└── user_interaction_frontend/    # Vite + React Control Console (Root App)
    ├── src/                      # User inputs & code submission deck
    └── package.json              # Interface isolated configuration
```

---

## 🛠️ Step 1: Apache Server Reverse Proxy Setup
Run these commands inside your RIT web server host terminal to install Apache and lock network access exclusively to the RIT network ecosystem.

```bash
# Update system and install Apache
sudo apt update && sudo apt install apache2 -y

# Firewall configuration: Restrict port 80 strictly to RIT subnets
sudo ufw allow from 129.21.0.0/16 to any port 80 proto tcp

# Find the server host IP
hostname -I
```
*Access the domain securely inside the network at:* `https://rit.edu`

---

## 💻 Step 2: Express.js Backend Deployment
Navigate into your `backend/` directory to configure dependencies and establish security paths.

```bash
cd /home/ars4041/RoboFleet_WebServer/backend

# Update packages and install Node core runtimes
sudo apt update && sudo apt install nodejs npm -y

# Install isolated local node dependencies
npm install

# Firewall configuration: Explicitly open API listener port to RIT traffic
sudo ufw allow from 129.21.0.0/16 to any port 3000 proto tcp
```

---

## ⚛️ Step 3: React Frontends Setup (Vite)
Both user portals operate as self-contained Vite apps. You must initialize dependencies inside **both** frontend folders.

### Setup User Interaction Portal (Port 5173)
```bash
cd /home/ars4041/RoboFleet_WebServer/user_interaction_frontend
npm install
```

### Setup Status Monitoring Portal (Port 5174)
```bash
cd /home/ars4041/RoboFleet_WebServer/status_frontend
npm install
```

---

## 🔀 Step 4: Routing Network Matrix via Apache
To bind your frontends and API layers smoothly under a single port 80 domain interface, configure Apache's reverse proxy modules.

```bash
# Enable proxy routing dependencies
sudo a2enmod proxy proxy_http rewrite

# Configure Apache virtual hosts routing maps
sudo nano /etc/apache2/sites-available/000-default.conf
```

Replace the virtual configuration block with the tracking maps below:
```apache
<VirtualHost *:80>
    ServerName robotics-project.gccis.rit.edu

    # Express Backend API Gateway Proxy
    ProxyPass /api http://localhost:3000/api
    ProxyPassReverse /api http://localhost:3000/api

    # Status Monitor Portal Gateway Proxy
    ProxyPass /status http://localhost:5174/status
    ProxyPassReverse /status http://localhost:5174/status

    # User Interface Portal Gateway Proxy (Root Layout)
    ProxyPass / http://localhost:5173/
    ProxyPassReverse / http://localhost:5173/
</VirtualHost>
```

```bash
# Audit settings and bounce the web service engine
sudo apache2ctl configtest
sudo systemctl restart apache2
```

---

## ♾️ Step 5: Keep the Server Online 24/7 (PM2 Process Controls)
Use PM2 to manage processes persistently so they automatically survive server restarts and service log rotation.

```bash
# Install PM2 utility manager globally on host
sudo npm install pm2 -g

# Start the Backend Hub (Execute from the backend folder context)
cd /home/ars4041/RoboFleet_WebServer/backend
pm2 start src/app.js --name "robotics-api"

# Start the Interactive Web Console
cd /home/ars4041/RoboFleet_WebServer/user_interaction_frontend
pm2 start "npm run dev -- --port 5173" --name "robotics-main"

# Start the Status Dashboard Deck
cd /home/ars4041/RoboFleet_WebServer/status_frontend
pm2 start "npm run dev -- --port 5174" --name "robotics-status"

# Snapshot state lists to survive host hardware reboots
pm2 save
```

### Essential PM2 Process Diagnostic Commands
```bash
pm2 list          # Check running apps statuses and up-times
pm2 logs          # Monitor console outputs and errors streams live
pm2 restart all   # Restart all elements to apply code modifications
pm2 stop all      # Halt all background running processes
```

---

## 🤖 Step 6: Establish ROS2 Communication Framework
To subscribe to telemetry streams (`/robot_pos`, `/nav_destination`, `/laptop_battery`), you must run the server gateway layer.

### Robot Setup Tasks (Run on each Physical Robot Laptop)
```bash
# Sync package indexes
sudo apt-get update

# Install target ROS2 Jazzy bridge utilities
sudo apt-get install ros-jazzy-rosbridge-server ros-jazzy-rosbridge-suite

# Launch the websocket socket interface loop
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
```

---

## 🐳 Step 7: Docker Sandbox Engine Configuration
Instructions for provisioning the restricted runtime code execution engine container image.

### Building the Runner Image
```bash
cd /home/ars4041/RoboFleet_WebServer/backend
docker build -t my-robot-runner .
```

### [Docker Optimization Notes - To Be Expanded]
*Placeholder: Detail container memory fencing, container pruning cycles, and access control profiles.*

---

## 📦 Critical Package Manifest & Dependencies
Below is an index of core installation modules and libraries critical to the initialization of the stack.

### Backend Dependencies (`backend/package.json`)
*   **`express`** — API routing framework.
*   **`cors`** — Cross-Origin Resource Sharing handling network mappings to RIT domains.
*   **`roslib`** — ROSbridge WebSocket interface connector.
*   **`@node-saml/passport-saml`** — Shibboleth authentication layer interface.
*   **`dotenv`** — Key-value environment variable load automation tool.
*   **`tmp`** — Absolute file-path safe host scratchfile engine.

### System Utilities
*   **`python3`** & **`ast`** — Static evaluation script analyzers.
*   **`default-jdk-headless`** — Container sandbox decoupled Java execution library.

---

## 📝 General Production Operations Notes
1. **Network Firewalls**: Ensure all raw connection ports outside of explicit Apache routing maps are closed via internal `ufw` policies to prevent arbitrary execution outside reverse proxy boundaries.
2. **SSL Upgrade Path**: The system web interface operates on HTTP. Transitioning the platform to HTTPS via trusted SSL certificates is necessary to enable browser-level security checks and complete authentication bindings.
