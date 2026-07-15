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
const { resolve } = require('dns');

tmp.setGracefulCleanup(); // cleanup on server exit

const pythonDir = path.join(__dirname, 'python_files');
if (!fs.existsSync(pythonDir)) {
    fs.mkdirSync(pythonDir, { recursive: true});
}

// file options for temp files for running code
const temps = {
    postfix: '.py',
    keep: false, // cleanup
    tmpdir: pythonDir
}

// file options for student logs
const logs = {
    postfix: '.py',
    keep: true // saves in the backend
}

const dir_path = path.join(__dirname, 'user_logs');

/**
 * Clears any temporary code files on server restart
 */
function clearTempsOnRestart() {
try {
    if (fs.existsSync(pythonDir)) {
      const files = fs.readdirSync(pythonDir);
      for (const file of files) {
        // Only target temporary python scripts, never touches the validator or robot scripts
        if (file.endsWith('.py') && file !== 'validator.py' && file !== 'robot.py') {
          fs.unlinkSync(path.join(pythonDir, file));
        }
      }
    }
    console.log(`Cleared temp code files on backend.`);
  } 
  catch (err) {
    console.error(`Failed to clear code files on backend -> Error: ${err}`);
  }
}

/**
 * Uses the written to robot code file to run the students code on the specified robot.
 * 
 * @param code: The students code
 * @param robotId: The robot to run the code on
 */
async function robotRun(code, title, user, robotId, host, callBack) {
    let script_path;
    let code_file;
    const output_path_log = path.join(dir_path, user, 'log', (title + '.log') );
    const output_path_perm = path.join(dir_path, user, 'perm', (title + '.perm') );

    if (host === null) {
        console.error(`Could not validate hostname with robot ID: ${robotId}. Can not run script.`);
        callBack(false);
        return;
    }

    try {
        code_file = tmp.fileSync(temps);
        script_path = code_file.name;
        console.log(`temp code file created with path: ${script_path}`);
        fs.writeFileSync(script_path, code, 'utf-8');
        fs.chmodSync(script_path, 0o644); // Gives global read permission to the file
    }
    catch (err) {
        console.error(`Could not write student code to script -> Error: ${err}`);
        callBack(false);
        return;
    }

    const logStream = fs.createWriteStream(output_path_log, { flags: 'a', encoding: 'utf-8' });
    const permStream = fs.createWriteStream(output_path_perm, { flags: 'a', encoding: 'utf-8' });

    logStream.on('error', (err) => console.error(`System logStream write error: ${err}`));
    permStream.on('error', (err) => console.error(`System permStream write error: ${err}`));

    const shouldRun = await validate(script_path, logStream, permStream);
    if (!shouldRun) {
        console.error(`Code validation failed for User: ${user}`);
        cleanupFile(code_file, script_path);
        code_file = null;
        callBack(false);
        return;
    }
    console.log(`Code validation passed for User: ${user}`);
    
    
    // Map the temporary python script safely inside the container's working directory (/app) as read-only (:ro)
    const dockerArgs = [
        'run', '--rm',
        '--read-only',                        // Lock the file system completely
        '--memory=256m', '--cpus=0.5',        // Prevent server crashes from infinite loops
        '-e', `ROBOT_HOST=${host}`,          // Inject ONLY the robot host IP
        '-v', `${script_path}:/app/user_code.py:ro`, // Mount user code as read-only
        'my-robot-runner'   
    ];

    const pythonScript = spawn('docker', dockerArgs);

    pythonScript.stdout.on('data', (data) => {
        logStream.write(data.toString());
        permStream.write(data.toString());
        console.log(`Robot standard output with ID: ${robotId} -> ${data.toString().trim()}`);
    });

     pythonScript.stderr.on('data', (data) => {
         logStream.write(data.toString());
         permStream.write(data.toString());
         console.error(`Robot standard error with ID: ${robotId} -> ${data.toString().trim()}`);
    });

    pythonScript.on('spawn', () => {
          console.log(`Python script spawned with robot ID: ${robotId}`);
         console.log(`Running robot with ID: ${robotId}`);
    });

    pythonScript.on('error', (err) => {
         console.error(`Error while running python script with path: ${script_path} on robot ID: ${robotId}`)
         console.error(`Python error: ${err}`)
         logStream.end();
         permStream.end();
         cleanupFile(code_file, script_path);
           code_file = null;
        callBack(false);
    });
    pythonScript.on('close', () => {
        console.log(`Python script closed with robot ID: ${robotId}`);
        console.log(`Disconnecting robot with ID: ${robotId}`);
         logStream.end();
         permStream.end();
         cleanupFile(code_file, script_path);
         code_file = null;
        callBack(false);
     });
}

/**
 * Checks the users code for syntax errors and illigal calls to validate if it should run and connect to the robot.
 * 
 * @param code: The students code
 * @returns: true if code should run, false otherwise
 */
function validate(code, logStream, permStream) {
    return new Promise( (resolve) => {
        const validatorPath = path.join(pythonDir, 'validator.py');
        const validator = spawn('python3', ['-u', validatorPath, code]);

        validator.stdout.on('data', (data) => {
            console.log(`Validator Output: ${data.toString().trim()}`);
        });

        validator.stderr.on('data', (data) => {
            console.error(`Validator Error Stream: ${data.toString().trim()}`);
            logStream.write(data.toString());
            permStream.write(data.toString());
        });

        validator.on('error', (err) => {
            console.error(`Validator: DENIED`);
            resolve(false);
        });

        validator.on('close', (exitStatus) => {
            console.log(`Validator script closed`)
            if (exitStatus === 0) {
                console.log(`Validator: ACCEPTED`);
                resolve(true);
            }
            else {
                console.error(`Validator: DENIED`);
                resolve(false);
            }
        });
    });
}

/**
 * Deletes a file from the backend.
 * 
 * @param file_obj: the file object to delete
 * @param path: the path of the file to delete
 */
function cleanupFile(file_obj, path) {
    if (file_obj && fs.existsSync(path)) {
        try {
            fs.unlinkSync(path);
            console.log(`Removed file with path: ${path}`);
        }
        catch (err) {
            console.error(`Could not remove temp code file with path: ${path}`);
            console.error(`unlinkSync() error: ${err}`);
        }
    }
}

// Use as an import in app.js
module.exports = {robotRun, clearTempsOnRestart};