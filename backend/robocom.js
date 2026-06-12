/**
 * File: robocom.js
 * @author Aidan Sanderson
 * Date: 6/12/2026
 * 
 * Functionality: The functionality behind the backend web server commanding the robot.
 */

require('dotenv').config(); // Version: dotenv@17.4.2
const fs = require('fs'); // Version: node@24.16.0
const path = require('path'); // Version: node@24.16.0
const { spawn } = require('child_process');

const scriptPath = path.join(__dirname, 'python_files', 'core', 'code_runner.py');

/**
 * Uses the written to robot code file to run the students code on the specified robot.
 * 
 * @param code: The students code
 * @param robotId: The robot to run the code on
 */
function robot_run(code, robotId) {
    let robotHost;

    if (robotId === 'robot 1') {
        robotHost = process.env.ROBOT_1_ADDRESS;
    }
    else if (robotId === 'robot 2') {
        robotHost = process.env.ROBOT_2_ADDRESS;
    }
    else if (robotId === 'robot 3') {
        robotHost = process.env.ROBOT_3_ADDRESS;
    }
    else {
        console.error(`Invalid Robot ID: ${robotId}`);
        return;
    }
    
     const pythonScript = spawn('python3', ['-u', scriptPath], {
        env: {
            ...process.env,
            ROBOT_HOST: robotHost
        }
    });
    console.log(`This line was reached in the robocom.js!`);
}

/**
 * Writes the students code to the specific robot code file.
 * 
 * @param code: The students code
 * @param robotId: The robot to run the code on
 */
function save_code(code, robotId) {

}

/**
 * Clears the code from the specified robot code file.
 * 
 * @param robotId: The robot to clear the current code for
 */
function clear_code(robotId) {
// later implementation
}

/**
 * Logs the students code to them for late use.
 * 
 * @param code: The code to log
 * @param student: The student to log the code to
 * @param key: The key to use when logging the code
 */
function log_save(code, student, key) {
// later implementation
}

/**
 * Pulls from the students code logs to return to old code.
 * 
 * @param robotId: The robot that the code is being saved to
 * @param student: The student that the code is logged to
 * @param key: The key to fetch the logged code
 */
function log_pull(robotId, student, key) {
// later implementation
}

/**
 * Checks code for problems or illigal commands.
 * 
 * @param code: The code to validate
 * @returns: True if the code is safe to run, False otherwise.
 */
function validate_code(code) {

}

// Use as an import in app.js
module.exports = {robot_run};