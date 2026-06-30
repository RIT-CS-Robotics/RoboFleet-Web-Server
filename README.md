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

    # Express Backend
    ProxyPass /api http://localhost:3000/api
    ProxyPassReverse /api http://localhost:3000/api

    # Frontend 2 (Must be placed above the root '/' proxy)
    ProxyPass /status http://localhost:5174/status
    ProxyPassReverse /status http://localhost:5174/status

    # Frontend 1 (Root site)
    ProxyPass / http://localhost:5173/
    ProxyPassReverse / http://localhost:5173/
</VirtualHost>
##################################################
# test and restart Apache
5. sudo apache2ctl configtest
6. sudo systemctl restart apache2
# enter the following line above plugins in the defineconfig section in the vite.config.js directory (DO THIS ONLY IN THE STATUS_FRONTEND REACT DIRECTORY)
base: '/status', 
# replace the app.get() function in the app.js file in the backend with the following
// Basic route
app.get('/api', (req, res) => {
  res.send('Hello World!');
});
# ensure the backend and both frontends are running and everything should now be working
# to manually start/stop/restart Apache, you can enter the following commands
7. sudo systemctl start apache2
8. sudo systemctl stop apache2
9. sudo systemctl start apache2
#
#
#
# Keeping the Web Server Online 24/7 Instructions
Enter the following commands in the SSH terminal
# install pm2 for keeping the web server open through proccesses that constantly run
1. npm install pm2 -g
2. pm2 -v
# navigate to the BACKEND directory
3. pm2 start app.js --name "robotics-api"
# navigate to the USER_INTERACTION_FRONTEND directory
4. pm2 start "npm run dev -- --port 5173" --name "robotics-main"
# navigate to the STATUS_FRONTEND directory
5. pm2 start "npm run dev -- --port 5174" --name "robotics-status"
# navigate to the project root directory and save these changes
6. pm2 save
# now each part of the web server will stay up and run through a proccess
# the following is a list of helpful pm2 commands to run in the SSH terminal if needed
7. pm2 list
8. pm2 logs
9. pm2 restart all
10. pm2 stop all
# you will need to use pm2 restart all when code changes
#
#
#
# Setting Up ros2 Communication to the Web Server
# stop the web server
1. pm2 stop all
# enter the following commands to install roslib, websockets, and cors on the SSH terminal while in the BACKEND directory
2. npm install cors
3. npm install ws
4. npm install roslib@1.4.1
# find the robot IP by running hostname -I on the robots laptop
# add the robots IP to the app.js code in the BACKEND directory
# enter the following command on the SSH terminal to run the web server again
5. pm2 run all
# on the robot laptop source a terminal and install rosbridge_server and web sockets with the following commands in the terminal
6. sudo apt-get update
7. sudo apt-get install ros-jazzy-rosbridge-server
8. sudo apt-get install ros-jazzy-rosbridge-suite
# run the robot with the websocket connection on the robots laptop
9. ros2 launch rosbridge_server rosbridge_websocket_launch.xml
#
#
#
SETTING UP DOCKER CONTAINER:
.
.
.
.
.
#
#
#
General Notes:
1. Be sure to only allow web server access through the reverse proxy apache by configuring its file to have all routing done exclusivly through the proxy. You can however add a few manual diract access IPs by adding them as exceptions to the apache configuration file.
2. The web server initially runs on the web via http, however it should be changed to https by enabling the use of an SSL certificate. This will add encryption to your web services and open up a wider range of things that modern browsers can do on the website.

