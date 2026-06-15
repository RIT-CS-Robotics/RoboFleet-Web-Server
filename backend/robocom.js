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
const tmp = require('tmp'); // Version: tmp@0.2.7

// file options for temp files for running code
const temps = {
    postfix: '.py',
    keep: false, // cleanup
    tmpdir: path.join(__dirname, 'python_files')
}

// file options for student logs
const logs = {
    postfix: '.py',
    keep: true // saves in the backend
}

/**
 * Uses the written to robot code file to run the students code on the specified robot.
 * 
 * @param code: The students code
 * @param robotId: The robot to run the code on
 */
function robotRun(code, robotId) {
    let script_path;
    let code_file;
    try {
        code_file = tmp.fileSync(temps);
        script_path = code_file.name;
        console.log(`temp code file created with path: ${script_path}`);
        writeCode(code, script_path, true);
    }
    catch (err) {
        console.error(`Could not write student code to script -> Error: ${err}`);
        return;
    }

    const host = selectHost(robotId);
    if (host === null) {
        console.error(`Could not validate hostname with robot ID: ${robotId}. Can not run script.`);
        return;
    }
    console.log(`robot host selected to run script with ID: ${robotId}`);
    
    const pythonScript = spawn('python3', ['-u', script_path], {
        env: {
            ...process.env,
            ROBOT_HOST: host
        }
    });

    pythonScript.stdout.on('data', (data) => {
        console.log(`Robot standard output with ID: ${robotId} -> ${data.toString().trim()}`);
    });

    pythonScript.stderr.on('data', (data) => {
        console.error(`Robot standard error with ID: ${robotId} -> ${data.toString().trim()}`);
    });

    pythonScript.on('spawn', () => {
        console.log(`Python script spawned with robot ID: ${robotId}`);
        console.log(`Running robot with ID: ${robotId}`);
    });

    pythonScript.on('error', (err) => {
        console.error(`Error while running python script with path: ${script_path} on robot ID: ${robotId}`)
        console.error(`Python error: ${err}`)
        cleanupFile(code_file, script_path);
        code_file = null;
    });
    pythonScript.on('close', () => {
        console.log(`Python script closed with robot ID: ${robotId}`);
        console.log(`Disconnecting robot with ID: ${robotId}`);
        cleanupFile(code_file, script_path);
        code_file = null;
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

/////////////////////////
////ADD HOSTS HERE///////
/////////////////////////

/**
 * Gets the hostname of a selected robot
 * 
 * @param robotId: The id of the robot
 * @returns the hostname of the robot
 */
function selectHost(robotId) {
    let host;
    switch (robotId) {
        case 'robot 1':
            host = process.env.ROBOT_1_ADDRESS;
            break;
        case 'robot 2':
            host = process.env.ROBOT_2_ADDRESS;
            break;
        case 'robot 3':
            host = process.env.ROBOT_3_ADDRESS;
            break;
        default:
            host = null;
            break;
    }
    return host;
}

/**
 * Deletes a file from the backend.
 * 
 * @param file_obj: the file object to delete
 * @param path: the path of the file to delete
 */
function cleanupFile(file_obj, path) {
    if (file_obj) {
        try {
            file_obj.removeCallback();
            console.log(`Cleaned up file with path: ${path}`);
        }
        catch (err) {
            console.error(`Could not cleanup temp code file with path: ${path}`);
            console.error(`removeCallback() error: ${err}`);
        }
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