# RoboFleet Web Server

The complete backend and frontend architecture for the RoboFleet Project, hosted at Rochester Institute of Technology (RIT). This project manages robotic fleets, real-time tracking streams over ROS2, secure SAML authentication, and student code execution sandboxing.

---

## 📂 Project Architecture

```text
RoboFleet_WebServer/
├── backend/                      # Node.js Express Backend Service
│   ├── certificates/             # Service SSL/IdP SAML Certs (Root Ignored)
│   ├── code_files/               # Temporary runtime storage & core assets for running student code for the robots
│   ├── user_logs/                # Dynamic log directories per student
│   ├── src/                      # Source Code
│   │   ├── app.js                # Core API Hub & Routing Gateway
│   │   ├── destinations.js       # Coordinate-to-Room Mapping Engine
│   │   ├── logs.js               # File logging for student code
│   │   ├── robocom.js            # Docker process spawning controller to run the robots from student code
│   │   └── samlConfig.js         # Shibboleth Authentication Layer (saml2)
│   ├── Dockerfile                # Student code container sandbox builder
│   ├── package.json              # Backend isolated configuration
│   └── users.json                # User credentials database
├── status_frontend/              # Vite + React Robot Monitoring Dashboard (root app)
│   ├── src/                      # App views & dashboard grids
│   └── package.json              # Status isolated configuration
└── user_interaction_frontend/    # Vite + React User Control Console
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

# Firewall configuration: Explicitly open API listener port to RIT traffic (only through apache)
sudo ufw allow from 129.21.0.0/16 to any port 443 proto tcp
sudo ufw allow from 129.21.0.0/16 to any port 80 proto tcp
sudo ufw allow from 10.0.0.0/8 to any port 443 proto tcp
sudo ufw allow from 10.0.0.0/8 to any port 80 proto tcp
sudo ufw deny 3000/tcp
sudo ufw deny 5173/tcp
sudo ufw deny 5174/tcp
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
    # Automatically send all standard HTTP traffic to the secure HTTPS version
    RewriteEngine On
    RewriteCond %{SERVER_NAME} =robotics-project.gccis.rit.edu
    RewriteRule ^ https://%{SERVER_NAME}%{REQUEST_URI} [END,NE,R=permanent]
</VirtualHost>

# ====================================================
# HTTPS (PORT 443) - SECURE REVERSE PROXY
# ====================================================
<VirtualHost *:443>
    ServerName robotics-project.gccis.rit.edu

    # TLS/Encryption Configuration
    SSLEngine on

    # Modern Security: Force TLS 1.2 and 1.3 only (Disables vulnerable SSL)
    SSLProtocol all -SSLv2 -SSLv3 -TLSv1 -TLSv1.1

    # Global Proxy settings to pass headers correctly to Node/Vite backends
    ProxyRequests Off
    ProxyPreserveHost On

    # ─── SSL PROXY ENGINE FOR ROBOT TUNNELS ───────────────────
    # Allows Apache to connect securely to the self-signed Nginx on laptops
    SSLProxyEngine on
    SSLProxyCheckPeerCN off
    SSLProxyCheckPeerName off
    SSLProxyCheckPeerExpire off
    # ─────────────────────────────────────────────────────────

    <Proxy *>
        Require all granted
    </Proxy>

    # Crucial for React/Vite/Express to know the request came over HTTPS
    RequestHeader set X-Forwarded-Proto "https"

    # ====================================================
    # ANTI-CURL/DIRECT ACCESS FIREWALL BLOCK
    # ====================================================
    <Location /api>
        # Allow the server itself to communicate internally
        Require local

        # Only allow connections if they come from our official site URLs
        SetEnvIf Referer "^https://robotics-project\.gccis\.rit\.edu" local_frontend
        Require env local_frontend

        # EXCEPTION: allow developer machines to access backend directly
        Require ip 129.21.34.84
    </Location>

    # ====================================================
    # VITE DEVELOPMENT HMR WEBSOCKET TUNNELS
    # ====================================================
    RewriteEngine On

    # 1. Route /dashboard WebSocket connections to Vite Frontend 1 (Port 5173)
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/dashboard/(.*) ws://localhost:5173/dashboard/$1 [P,L]

    # 2. Route root layout WebSocket connections to Vite Frontend 2 (Port 5174)
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/(.*) ws://localhost:5174/$1 [P,L]

    # ====================================================
    # STANDARD REVERSE PROXY PASSES (ORDERED SPECIFIC -> GENERAL)
    # ====================================================

    # 1. RIT SAML Integration Routes (Mapped to Node/Express on Port 3000)
    ProxyPass /saml2/acs http://localhost:3000/saml2/acs
    ProxyPassReverse /saml2/acs http://localhost:3000/saml2/acs

    ProxyPass /saml2/metadata http://localhost:3000/saml2/metadata
    ProxyPassReverse /saml2/metadata http://localhost:3000/saml2/metadata

    ProxyPass /login http://localhost:3000/login
    ProxyPassReverse /login http://localhost:3000/login

    # 2. Express Backend Proxy (Port 3000)
    ProxyPass /api http://localhost:3000/api
    ProxyPassReverse /api http://localhost:3000/api

    # 3. Main Dashboard Frontend (Port 5173)
    ProxyPass /dashboard http://localhost:5173/dashboard
    ProxyPassReverse /dashboard http://localhost:5173/dashboard

    # 4. ROBOT VIDEO STREAMING PROXY MATCH
    # Dynamically targets any robot IP over HTTPS port 8443
    ProxyPassMatch "^/robot-stream/([^/]+)/(.*)$" "https://$1:8443/$2"
    ProxyPassReverse "^/robot-stream/([^/]+)/(.*)$" "https://$1:8443/$2"

    # 5. Status Page Catch-All (Port 5174 - MUST BE THE LAST RULE IN THE FILE)
    ProxyPass / http://localhost:5174/
    ProxyPassReverse / http://localhost:5174/

    # Generated Let's Encrypt SSL Certificates
    SSLCertificateFile /etc/letsencrypt/live/robotics-project.gccis.rit.edu/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/robotics-project.gccis.rit.edu/privkey.pem
    Include /etc/letsencrypt/options-ssl-apache.conf
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
To subscribe to and publish to telemetry streams (`/robot_pos`, `/nav_destination`, `/laptop_battery`, `/robot_status`), you must run the server gateway layer.

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

## 🐳 Step 7: Docker Sandbox Engine Configuration Instructions
Instructions for provisioning the restricted runtime code execution engine container image.

### Building the Runner Image
```bash
cd /home/ars4041/RoboFleet_WebServer/backend
docker build -t my-robot-runner .
```

---

## 📦 Critical Package Manifest & Dependencies
Below is an index of core installation modules and libraries critical to the initialization of the stack.

### Backend Dependencies (`backend/package.json`)
* **`express`** — API routing framework.
* **`cors`** — Cross-Origin Resource Sharing handling network mappings to RIT domains.
* **`roslib`** — ROSbridge WebSocket interface connector.
* **`@node-saml/passport-saml`** — Shibboleth authentication layer interface.
* **`dotenv`** — Key-value environment variable load automation tool.
* **`tmp`** — Absolute file-path safe host scratchfile engine.
* **`passport`** — Core modular authentication middleware for Node.js.
* **`ws`** — Implements full-duplex WebSocket server and client connections.
* **`nodemon`** *(Dev)* — Restarts the backend service automatically during local changes.
* **`patch-package`** *(Dev)* — Modifies and fixes broken external module code instantly.

### Local Java Archives (`backend/`)
* **`javaparser-core-3.25.10.jar`** — Local Java dependency used to parse, analyze, and manipulate Java Abstract Syntax Trees (AST) programmatically.

### User Interaction Frontend Dependencies (`user_interaction_frontend/package.json`)
* **`react`** — UI library for components and reactive application state management.
* **`react-dom`** — Renders components directly into the browser DOM ecosystem.
* **`vite` & `@vitejs/plugin-react`** *(Dev)* — Fast build tool and local development server supporting hot module replacement (HMR).
* **`eslint`, `globals` & plugins** *(Dev)* — Static analysis system designed to catch code bugs, safely identify global variables, and optimize React hooks.

### Status Frontend Dependencies (`status_frontend/package.json`)
* **`react`** — UI library for components and reactive application state management.
* **`react-dom`** — Renders components directly into the browser DOM ecosystem.
* **`vite` & `@vitejs/plugin-react`** *(Dev)* — Fast build tool and local development server supporting hot module replacement (HMR).
* **`eslint`, `globals` & plugins** *(Dev)* — Static analysis system designed to catch code bugs, safely identify global variables, and optimize React hooks.

### System Utilities & Compilers
* **`python3`** & **`ast`** — Static evaluation script analyzers.
* **`default-jdk-headless`** — Decoupled Java Development Kit (JDK) execution library and compiler (`javac`) utilized inside the container sandbox.

---

## 🔒 Step 9: Nginx Reverse Proxy for Encrypted ROS2 Video Streaming

To comply with modern browser security policies, a website served over **HTTPS** cannot load unencrypted **HTTP** video streams. This security measure is known as blocking **Mixed Content**. 

This step configures Nginx as a lightweight **TLS/SSL middleware proxy** running directly on the robot's laptop. It intercepts the local, unencrypted ROS2 HTTP video stream on port `8080` and securely exposes it over HTTPS on port `8443`. This architecture satisfies browser security requirements and prevents backend server overhead during real-time video playback.

### REMINDER: This is configured on the robots laptop, not the device running the website!

### 1. Install Nginx
Update your package repository lists and install the Nginx web server:
```bash
sudo apt update
sudo apt install nginx -y
```

### 2. Generate a Self-Signed SSL Certificate
Create a long-term (100-year) self-signed SSL certificate to encrypt the streaming traffic. 

> 💡 **Tip:** You can safely press **ENTER** to leave all requested details (such as Country, State, and Organization Name) at their blank default values.

```bash
sudo openssl req -x509 -nodes -days 36500 -newkey rsa:2048 \
  -keyout /etc/ssl/private/robot.key \
  -out /etc/ssl/certs/robot.crt
```

### 3. Configure the Nginx Server Block
Open the default Nginx configuration file using the nano text editor:
```bash
sudo nano /etc/nginx/sites-available/default
```

Completely clear the file and replace its entire contents with the following configuration block:
```nginx
server {
    listen 8443 ssl;
    server_name localhost;

    # SSL Certificates
    ssl_certificate /etc/ssl/certs/robot.crt;
    ssl_certificate_key /etc/ssl/private/robot.key;

    location / {
        # Proxy traffic to the local unencrypted ROS2 HTTP server
        proxy_pass http://127.0.0.1:8080;
        
        # Real-time streaming optimizations
        proxy_buffering off;
        proxy_cache off;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        
        # Prevent streaming timeouts during low-activity periods
        proxy_set_header Host \$host;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```
*To exit nano: Press `Ctrl + O` then `Enter` to save the file, followed by `Ctrl + X` to close the editor.*

### 4. Verify and Restart Nginx
Always test your Nginx configuration syntax for mistakes before restarting the active daemon:
```bash
sudo nginx -t
```

If the test reports that the configuration syntax is okay, restart the Nginx system service to apply your changes:
```bash
sudo systemctl restart nginx
```

---

## 📝 General Production Operations Notes
1. **Network Firewalls**: Ensure all raw connection ports outside of explicit Apache routing maps are closed via internal `ufw` policies to prevent arbitrary execution outside reverse proxy boundaries.
2. **SSL Upgrade Path**: The system web interface operates on HTTP. Transitioning the platform to HTTPS via trusted SSL certificates is necessary to enable browser-level security checks and complete authentication bindings.
