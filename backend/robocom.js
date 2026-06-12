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

let robot1_active = false;
let robot2_active = false;
let robot3_active = false;

//const scriptPath = path.join(__dirname, 'python_files', 'core', script);
const code1_path = path.join(__dirname, 'python_files', code1);
const code2_path = path.join(__dirname, 'python_files', code2);
const code3_path = path.join(__dirname, 'python_files', code3);

/**
 * Uses the written to robot code file to run the students code on the specified robot.
 * 
 * @param code: The students code
 * @param robotId: The robot to run the code on
 */
function robotRun(code, robotId) {
    let robot_host;
    let script_path;

    if (robotId === 'robot 1') {
        if (robot1_active) {
            console.error(`Failed to run python Script. Robot ID: ${robotId} is already active`);
            return;
        }
        robot_host = process.env.ROBOT_1_ADDRESS;
        script_path = code1_path;
        robot1_active = true;
    }
    else if (robotId === 'robot 2') {
        if (robot2_active) {
            console.error(`Failed to run python Script. Robot ID: ${robotId} is already active`);
            return;
        }
        robot_host = process.env.ROBOT_2_ADDRESS;
        script_path = code2_path;
        robot2_active = true;
    }
    else if (robotId === 'robot 3') {
        if (robot3_active) {
            console.error(`Failed to run python Script. Robot ID: ${robotId} is already active`);
            return;
        }
        robot_host = process.env.ROBOT_3_ADDRESS;
        script_path = code3_path;
        robot3_active = true;
    }
    else {
        console.error(`Failed to run python Script. Invalid robot ID: ${robotId}`);
        return;
    }

    try {
        writeCode(code, script_path, true);
    }
    catch (err) {
        console.error(`Could not write student code to script -> Error: ${err}`);
        return;
    }
    
     const pythonScript = spawn('python3', ['-u', script_path], {
        env: {
            ...process.env,
            ROBOT_HOST: robot_host
        }
    });
    console.log(`Running robot with ID: ${robotId}`);

    pythonScript.on('close', () => {
        console.log(`Python script closed. Robot ID: ${robotId}`);
        resetActive(robotId);
    });
}

/**
 * Writes the students code to the specific robot code file.
 * 
 * @param code: The students code
 * @param robotId: The robot to run the code on
 */
function writeCode(code, writePath, toRun) {
    let fileContent = '';
    if (toRun) {
        fileContent = 'import sys\nimport os\n';
    }
    fileContent += code;
    fs.writeFileSync(writePath, fileContent, 'utf-8');
}

/**
 * Makes the given robots active identifier false to allow it to spawn python processes again.
 * 
 * @param robotId: The id of the robot to set the active identifier false for
 */
function resetActive(robotId) {
    if (robotId === 'robot 1') {
        robot1_active = false;
    }
    else if (robotId === 'robot 2') {
        robot2_active = false;
    }
    else if (robotId === 'robot 3') {
        robot3_active = false;
    }
}

/**
 * Logs the students code to them for late use.
 * 
 * @param code: The code to log
 * @param student: The student to log the code to
 * @param key: The key to use when logging the code
 */
function logSave(code, student, key) {
// later implementation
}

/**
 * Pulls from the students code logs to return to old code.
 * 
 * @param robotId: The robot that the code is being saved to
 * @param student: The student that the code is logged to
 * @param key: The key to fetch the logged code
 */
function logLoad(robotId, student, key) {
// later implementation
}

/**
 * Checks code for problems or illigal commands.
 * 
 * @param code: The code to validate
 * @returns: True if the code is safe to run, False otherwise.
 */
function validateCode(code) {

}

// Use as an import in app.js
module.exports = {robotRun};