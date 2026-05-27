# RoboFleet-Web-Server
The web server for the RoboFleet Project
#
#
#
# Apache Setup Instructions (for connecting to an online web server):
Enter the following in the SSH terminal
# update system
1. sudo apt update
# install Apache
2. sudo apt install apache2 -y
# only allow rit computers to access the servers port
3. sudo ufw allow from 129.21.0.0/16 to any port 80 proto tcp
# find the IP address for the server
4. hostname -I
# connect to the server
5. Either use the server IP or enter robotics-project.gccis.rit.edu in the web browser on an RIT internet enabled computer
#
#
#
# Express.js (Backend) Setup Instructions:
Go to the project root directory, create a backend directory, enter the following commands in the SSH terminal
# install node.js and npm
1. sudo apt update
2. sudo apt install nodejs npm -y
# initialize the project and install Express in the backend directory
3. npm init -y
4. npm install express
#create the Express app file
5. nano app.js
# enter the following code inside of the app.js file
# (see code section of the README)
################################################## 
const express = require('express');
const app = express();
const PORT = 3000;

// Basic route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
################################################## 
# allow RIT internet enabled computers to access the backend directly (will be helpful for rosbidge_suite)
6. sudo ufw allow from 129.21.0.0/16 to any port 3000 proto tcp
# run the backend server
7. node app.js
#
#
#
# React Setup Instruction With Vite (Both Frontends):
Go to the project root directory and enter the following commands in the SSH terminal
# initialize both react directories
1. npm create vite@latest user_interaction_frontend -- --template react
2. npm create vite@latest status_frontend -- --template react
# manually ensure npm is installed correctly (DO THIS IN BOTH REACT DIRECTORIES)
3. npm install
# inside of package.json change the following line (DO THIS FOR BOTH REACT DIRECTORIES)
4. "dev": "vite", ---> (CHANGE THIS TO) ---> "dev": "vite --host",
# enter the following in vite.config.js (DO THIS ONLY IN THE USER_INTERACTION_FRONTEND REACT DIRECTORY)
# (see code section of the README)
################################################## 
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
})
################################################## 
# enter the following in vite.config.js (DO THIS ONLY IN THE STATUS_FRONTEND REACT DIRECTORY)
# (see code section of the README)
################################################## 
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174
  }
})
################################################## 
# enter a react directory and enter the following to run the react app in development mode
5. npm run dev
#
#
#
# Routing the Project to the Apache Server Instructions:
Enter the following commands on the SSH terminal
# enable Apache proxy modules
1. sudo a2enmod proxy
2. sudo a2enmod proxy_http
3. 3. sudo a2enmod rewrite
# open the Apache site config file
4. sudo nano /etc/apache2/sites-available/000-default.conf
# replace the Apache config file with the following
# (see code section of the README)
##################################################
<VirtualHost *:80>
    ServerName robotics-project.gccis.rit.edu

    ProxyPreserveHost On

    # 1. Express.js Backend (Port 3000)
    # Accessible via: http://your-ip/api
    ProxyPass /api http://localhost:3000/
    ProxyPassReverse /api http://localhost:3000/

    # 2. First React Frontend (Port 5173)
    # Accessible via: http://your-ip/
    ProxyPass /user http://localhost:5173/
    ProxyPassReverse /user http://localhost:5173/

    # 3. Second React Frontend (Port 5174)
    # Accessible via: http://your-ip/app2
    ProxyPass /status http://localhost:5174/
    ProxyPassReverse /status http://localhost:5174/
</VirtualHost>
##################################################
# test and restart Apache
5. sudo apache2ctl configtest
6. sudo systemctl restart apache2
# enter the following line above plugins in the defineconfig section in the vite.config.js directory (DO THIS ONLY IN THE USER_INTERACTION_FRONTEND REACT DIRECTORY)
base: '/user/', 
# enter the following line above plugins in the defineconfig section in the vite.config.js directory (DO THIS ONLY IN THE STATUS_FRONTEND REACT DIRECTORY)
base: '/status/', 
# ensure the backend and both frontends are running and everything should now be working
# to manually start/stop/restart Apache, you can enter the following commands
7. sudo systemctl start apache2
8. sudo systemctl stop apache2
9. sudo systemctl start apache2


