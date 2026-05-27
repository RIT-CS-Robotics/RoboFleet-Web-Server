# RoboFleet-Web-Server
The web server for the RoboFleet Project


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
# allow users on an RIT enabled computer to access data from the backend port
6. sudo ufw allow from 129.21.0.0/16 to any port 3000 proto tcp
# run the backend server
7. node app.js
