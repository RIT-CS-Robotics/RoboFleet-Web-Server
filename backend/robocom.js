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

const script = process.env.MAIN_SCRIPT_PY;
const code1 = process.env.CODE_1_PY
const code2 = process.env.CODE_2_PY
const code3 = process.env.CODE_3_PY

//const scriptPath = path.join(__dirname, 'python_files', 'core', script);
const code1Path = path.join(__dirname, 'python_files', code1);
const code2Path = path.join(__dirname, 'python_files', code2);
const code3Path = path.join(__dirname, 'python_files', code3);

/**
 * Uses the written to robot code file to run the students code on the specified robot.
 * 
 * @param code: The students code
 * @param robotId: The robot to run the code on
 */
function robot_run(code, robotId) {
    let robotHost;
    let scriptPath;

    if (robotId === 'robot 1') {
        robotHost = process.env.ROBOT_1_ADDRESS;
        scriptPath = code1Path;
    }
    else if (robotId === 'robot 2') {
        robotHost = process.env.ROBOT_2_ADDRESS;
        scriptPath = code2Path;
    }
    else if (robotId === 'robot 3') {
        robotHost = process.env.ROBOT_3_ADDRESS;
        scriptPath = code3Path;
    }
    else {
        console.error(`Failed to run python Script. Invalid robot ID: ${robotId}`);
        return;
    }

    try {
        write_code(code, scriptPath, true);
    }
    catch (err) {
        console.error(`Could not write student code to script -> Error: ${err}`);
        return;
    }
    
     const pythonScript = spawn('python3', ['-u', scriptPath], {
        env: {
            ...process.env,
            ROBOT_HOST: robotHost
        }
    });
    console.log(`Running robot with ID: ${robotId}`);
}

/**
 * Writes the students code to the specific robot code file.
 * 
 * @param code: The students code
 * @param robotId: The robot to run the code on
 */
function write_code(code, writePath, toRun) {
    let fileContent = '';
    if (toRun) {
        fileContent = 'import sys\nimport os\n';
    }
    fileContent += code;
    fs.writeFileSync(writePath, fileContent, 'utf-8');
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
 */scriptPath = code1Path;
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