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
const { spawn, spawnSync } = require('child_process');
const tmp = require('tmp'); // Version: tmp@0.2.7
const { resolve } = require('dns');
const { tmpdir } = require('os');
const { dir } = require('console');

tmp.setGracefulCleanup(); // cleanup on server exit

const logsPath = path.join(__dirname, '../user_logs');

const codeDir = path.join(__dirname, '../code_files');
if (!fs.existsSync(codeDir)) {
    fs.mkdirSync(codeDir, { recursive: true});
}

const temps = {
    keep: false,
    tmpdir: codeDir
};

/**
 * Clears any temporary code files and compiles Validator.java on server restart
 */
async function refreshOnRestart() {
    // clear code_files directory of files not needed
    try {
        if (fs.existsSync(codeDir)) {
            const files = fs.readdirSync(codeDir);
            for (const file of files) {
                // Only target temporary scripts, never touches the validator or robot scripts
                if ( (file.startsWith('tmp') || file.endsWith('.class') ) && file !== 'validator.py' && file !== 'robot.py' && file !== 'Validator.java' && file !== 'Robot.java') {
                    fs.rmSync(path.join(codeDir, file), {recursive: true, force: true});
                }
            }
        }
        console.log(`Cleared temp code files on backend.`);
    } 
    catch (err) {
        console.error(`Failed to clear code files on backend -> Error: ${err}`);
    }

    // Compile Validator.java
    const validatorPath = path.join(codeDir, 'Validator.java');
    const jarPath = path.join(codeDir, '..', 'javaparser-core-3.25.10.jar');
    const classPath = `.:${codeDir}:${jarPath}`;

    const compile = spawnSync('javac', ['-cp', classPath, '-d', codeDir, validatorPath]);

    if (compile.status !== 0) {
        console.error('Validator.java compilation Error:', compile.stderr.toString());
    }
    else {
        console.log('Validator.java compilation success');
    }
    return;
}

/**
 * Deletes a temp directory and script from the backend.
 * 
 * @param scriptDir:
 */
function cleanupTemp(scriptDir) {
    try {
        if (fs.existsSync(scriptDir.name)) {
            fs.rmSync(scriptDir.name, {recursive: true, force: true});
            console.log(`Removed temp scipt directory and script with name: ${scriptDir.name}`);
        }
    }
    catch (err) {
        console.warn(`Could not remove temp script directory and script -> Error: ${err}`);
    }
    return null;
}

/**
 * Writes the student code to a temp file to be able to run as a script.
 * 
 * @param code: The student code to write
 * @param title: The title the student gave their code
 * 
 * @returns The temp code directory and path to the script file in it -> {scriptDir, scriptPath}
 */
async function getTempDir(code, title) {
    let scriptDir;
    let scriptPath
    try {
        scriptDir = tmp.dirSync(temps);
        const cleanTitle = title.split('$')[0]; // no log info
        scriptPath = path.join(scriptDir.name, cleanTitle);
        fs.writeFileSync(scriptPath, code, 'utf-8');
    }
    catch (err) {
        console.error(`Could not generate temp code directory -> Error: ${err}`);
        scriptDir = cleanupTemp(scriptDir);
        scriptPath = null;
    }
    return {scriptDir, scriptPath}
}

/**
 * Checks the users code for syntax errors and illigal calls to validate if it should run and connect to the robot.
 * 
 * @param code: The students code
 * @param logStream: Stream to write validation output to for log files
 * @param permStream: Stream to write validation output to for perm files
 * @param codeType: 'Python' or 'Java'
 * 
 * @returns: true if code should run, false otherwise
 */
async function validate(code, logStream, permStream, codeType) {
    return new Promise( (resolve) => {
        let validator;
        if (codeType === 'Python') {
            const validatorPath = path.join(codeDir, 'validator.py');
            validator = spawn('python3', ['-u', validatorPath, code]); // Python validation version
        }
        else if (codeType === 'Java') {
            // 1. Target the compiled .jar package inside your backend root folder
            const jarPath = path.join(codeDir, '..', 'javaparser-core-3.25.10.jar');
            
            // 2. Build the classpath: include codeDir so Java can look inside it to locate "Validator.class"
            const classpathStr = `.:${codeDir}:${jarPath}`;
            console.log(`[Validator Config] Linking JAR path -> ${jarPath}`);
            
            // 3. Spawns Java: executes the 'Validator' binary and hands it the 'code' file path argument
            validator = spawn('java', [
                '-cp', classpathStr, 
                'Validator', 
                code
            ]);
        }
        else {
            console.error(`Invalid code type for validation.`);
            resolve(false);
        }

        validator.stdout.on('data', (data) => {
            console.log(`Validator Output: ${data.toString().trim()}`);
        });

        validator.stderr.on('data', (data) => {
            console.error(`Validator Error Stream: ${data.toString().trim()}`);
            if (logStream) {logStream.write(data.toString());}
            if (permStream) {permStream.write(data.toString());}
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
 * Gets the specific docker arguments for running robot code with Python or Java.
 * 
 * @param codeType: 'Python' or 'Java'
 * @param host: The IP of the robot to inject into the script
 * @param scriptDir: The directory that the script is in
 * @param scriptPath: The path to the temp code file to run as a script
 * 
 * @returns The docker arguments for the specific type of script to run robot code on (Python or Java).
 */
async function getDockerArgs(codeType, host, scriptDir, scriptPath) {
    let dockerArgs;
     fs.chmodSync(scriptDir, 0o755); // Explicit temp directory permisions for docker
     fs.chmodSync(scriptPath, 0o644); // Explicit code file permisions for docker
    // Map the temporary Python script safely inside the container's working directory (/app) as read-only (:ro)
    if (codeType === 'Python') {
        dockerArgs = [
            'run', '--rm', '--read-only',
            '--memory=256m', '--cpus=0.5',
            '-e', `ROBOT_HOST=${host}`,
            // Mount ONLY this single student's temp folder directly to the container workspace
            '-v', `${scriptDir}:/app/workspace:ro`, 
            'robot-runner'
        ];
    }
    // Map the temporary Java script safely inside the container's working directory (/app) as read-only (:ro)
    else if (codeType === 'Java') {
        dockerArgs = [
            'run', '--rm', '--read-only',
            '--tmpfs', '/tmp:rw,noexec,nosuid', 
            '--memory=256m', '--cpus=0.5',
            '-e', `ROBOT_HOST=${host}`,
            // Mount ONLY this single student's temp folder directly to the container workspace
            '-v', `${scriptDir}:/app/workspace:ro`, 
            'robot-runner'
        ];
    } 
    else {
        console.error(`Invalid code type for fetching Docker arguments.`);
        dockerArgs = null;
    }
    return dockerArgs;
}

/**
 * Takes the students code, writes it as a temp file, validates it, and runs the students code to control a robot.
 * @param dockerArgs:
 * @param robotId: The robot to run the code on
 * @param scriptDir: Temp directory for student code
 * @param scriptPath: The path to the temp code file object
 * @param logStream: Writable stream to the code log file
 * @param permStream: Writable stream to the code perm file
 * @param callBack: The callback function to activate once the code is finished running
 */
function runScript(dockerArgs, robotId, scriptDir, scriptPath, logStream, permStream, callBack) {
    const script = spawn('docker', dockerArgs);

    script.stdout.on('data', (data) => {
        if (logStream) {logStream.write(data.toString());}
        if (permStream) {permStream.write(data.toString());}
        console.log(`Robot standard output with ID: ${robotId} -> ${data.toString().trim()}`);
    });

     script.stderr.on('data', (data) => {
         if (logStream) {logStream.write(data.toString());}
         if (permStream) {permStream.write(data.toString());}
         console.error(`Robot standard error with ID: ${robotId} -> ${data.toString().trim()}`);
    });

    script.on('spawn', () => {
        console.log(`Script spawned with robot ID: ${robotId}`);
        console.log(`Running robot with ID: ${robotId}`);
    });

    script.on('error', (err) => {
        console.error(`Error while running script with path: ${scriptPath} on robot ID: ${robotId}`)
        console.error(`Error: ${err}`)
        if (logStream) {logStream.end();}
        if (permStream) {permStream.end();}
        scriptDir = cleanupTemp(scriptDir);
        callBack(false);
    });
    script.on('close', () => {
        console.log(`Script closed with robot ID: ${robotId}`);
        console.log(`Disconnecting robot with ID: ${robotId}`);
        if (logStream) {logStream.end();}
        if (permStream) {permStream.end();}
        scriptDir = cleanupTemp(scriptDir);
        callBack(false);
     });
}

/**
 * Takes the students code, writes it as a temp file, validates it, and runs the students code to control a robot.
 * 
 * @param code: The students code
 * @param title: The title of the code file
 * @param user: The user running the code
 * @param robotId: The robot to run the code on
 * @param host: The robot IP to run the code on
 * @param codeType: 'Python' or 'Java'
 * @param callBack: The callback function to activate once the code is finished running
 */
async function robotRun(code, title, user, robotId, host, codeType, callBack) {
    // Makes sure a robot IP is given
    if (host === null) {
        console.error(`Could not validate hostname with robot ID: ${robotId}. Can not run script.`);
        callBack(false);
        return;
    }

    // Creates a temp file with the student code written to it and gets a path to it for running it as a script
    const tempFetch = await getTempDir(code, title);
    const scriptDir = tempFetch.scriptDir;
    const scriptPath = tempFetch.scriptPath;
    if (!scriptDir || !scriptPath) {
        callBack(false);
        return;
    }

    // Establishes writable streams for logging student code output
    const output_path_log = path.join(logsPath, user, 'log', (title + '.log') );
    const output_path_perm = path.join(logsPath, user, 'perm', (title + '.perm') );
    const logStream = fs.createWriteStream(output_path_log, { flags: 'a', encoding: 'utf-8' });
    const permStream = fs.createWriteStream(output_path_perm, { flags: 'a', encoding: 'utf-8' });
    logStream.on('error', (err) => console.error(`System logStream write error: ${err}`));
    permStream.on('error', (err) => console.error(`System permStream write error: ${err}`));

    // Validates student code
    const shouldRun = await validate(scriptPath, logStream, permStream, codeType);
    if (!shouldRun) {
        console.error(`Code validation failed for User: ${user}`);
        scriptDir = cleanupTemp(scriptDir);
        callBack(false);
        return;
    }
    console.log(`Code validation passed for User: ${user}`);
    
    // Gets the specific Docker arguments for the type of code being ran (Python or Java)
    const dockerArgs = await getDockerArgs(codeType, host, scriptDir.name, scriptPath);
    if (!dockerArgs) {
        scriptDir = cleanupTemp(scriptDir);
        callBack(false);
        return;
    }

    // Runs the student code to control the robot.
    runScript(dockerArgs, robotId, scriptDir, scriptPath, logStream, permStream, callBack);
}

// Use as an import in app.js
module.exports = {robotRun, refreshOnRestart};