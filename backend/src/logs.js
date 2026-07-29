/**
 * Functionality: The functionality behind the user code logging system for the RoboFleet backend server.
 * 
 * @file: logs.js
 * @author Aidan Sanderson
 * @date: 6/15/2026
 */
const { promises } = require('node:dns');
const fs = require('node:fs/promises'); // Version: node@24.16.0
const { promiseHooks } = require('node:v8');
const path = require('path'); // Version: node@24.16.0

const dirPath = path.join(__dirname, '../user_logs'); // The root log directory

/**
 * Creates a new code log directory for a given user.
 * 
 * @param user: The user to create the code log directory for 
 */
async function createUserLog(user) {
    try {
        const userPath = path.join(dirPath, user);
        const codePath = path.join(userPath, 'code');
        const logPath = path.join(userPath, 'log');
        const permPath = path.join(userPath, 'perm');

        await fs.mkdir(userPath, { recursive: true }); // recursive used here to prevent crashes if the folder exists

        await Promise.all([
            fs.mkdir(codePath, { recursive: true }),
            fs.mkdir(logPath, { recursive: true }),
            fs.mkdir(permPath, { recursive: true })
        ]);

        console.log(`Code log directory created for user: ${user}`);
    }
    catch (err) {
        console.error(`Error creating code log directory for user: ${user} -> Error: ${err.message}`);
    }
}

/**
 * Removes the code log directory associated with the user given.
 * 
 * @param user: The user to remove the code log directory for
 */
async function removeUserLog(user) {
    try {
        const userPath = path.join(dirPath, user);
        await fs.rm(userPath, { recursive: true, force: true }); // recursive removes all files inside and force doesn't error on minor issues
        console.log(`Code log directory removed for user: ${user}`);
    }
    catch (err) {
        console.error(`Error removing code log directory for user: ${user} -> Error: ${err.message}`);
    }
}

/**
 * Stores the users code into their log directory.
 * 
 * @param user: The user to store the code for from their log directory.
 * @param title: The name to give the code file.
 * @param code: The code that the user deploys.
 */
async function saveCode(user, title, code) {
    let result = true;
    await createUserLog(user); // safe guard if the user log doesn't already exist somehow
    try {
        const codePath = path.join(dirPath, user, 'code', title);
        const logPath = path.join(dirPath, user, 'log', (title + '.log') );
        const permPath = path.join(dirPath, user, 'perm', (title + '.perm') );
        
        const seperator = '--------------------';
        const header = `Log: ${title}\nUser: ${user}\n${seperator}\nCode Ran:\n${seperator}\n ${code}\n${seperator}\nLog:\n${seperator}\n`;

        await Promise.all([
            fs.writeFile(codePath, code, 'utf-8'),
            fs.writeFile(logPath, header, 'utf-8'),
            fs.writeFile(permPath, header, 'utf-8')
        ]);
        console.log(`Code saved for user: ${user} with title: ${title}`);
    }
    catch (err) {
        console.error(`Code could not be saved for user: ${user} with title: ${title} -> Error: ${err.message}`);
        result = false;
    }
    return result;
}

/**
 * Loads the users code from their log directory.
 * 
 * @param user: The user to load the code for from their log directory.
 * @param title: The name of the code file.
 * @param isLog: Is this for a log file? (if not then for a code file)
 * @returns file_content: The contents of the file (code or log text)
 */
async function loadCode(user, title, isLog) {
    await createUserLog(user); // safe guard if the user log doesn't already exist somehow
    let fileContent;
    let filePath;
    try {
        if (isLog) {
            filePath = path.join(dirPath, user, 'log', (title + '.log') );
        }
        else {
            filePath = path.join(dirPath, user, 'code', title);
        }
        fileContent = await fs.readFile(filePath, 'utf-8');
        console.log(`Log loaded for user: ${user} with title: ${title}`);
    }
    catch (err) {
        console.error(`Log could not be loaded for user: ${user} with title: ${title} -> Error: ${err.message}`);
        fileContent = "ERROR";
    }
    return fileContent;
}

/**
 * Removes the users specific code and log from their log directory.
 * 
 * @param user: The user to remove the code for in their log directory.
 * @param title: The name of the code file.
 * @return: Was the deletion successfull?
 */
async function removeCode(user, title) {
    let success = true;
    try {
        const codePath = path.join(dirPath, user, 'code', title);
        const logPath = path.join(dirPath, user, 'log', (title + '.log') );
        const [codeRes, logRes] = await Promise.allSettled([
            fs.unlink(codePath),
            fs.unlink(logPath)
        ]);

        if (codeRes.status === 'rejected' && codeRes.reason.code !== 'ENOENT') {
            throw new Error('log failed to delete');
        }
        if (logRes.status === 'rejected' && logRes.reason.code !== 'ENOENT') {
            throw new Error('Log failed to delete');
        }

        console.log(`Log deleted for user: ${user} with title: ${title}`);
    }
    catch (err) {
        success = false;
        console.error(`Log could not be deleted for user: ${user} with title: ${title} -> Error: ${err.message}`);
    }
    return success;
}

/**
 * Removes all the users code and logs from their log directory.
 * 
 * @param user: The user to remove the code for in their log directory.
 * @return: Was the clearing successfull?
 */
async function removeAllCode(user) {
    let success = true;
    try {
        const codePath = path.join(dirPath, user, 'code');
        const logPath = path.join(dirPath, user, 'log');

        const codeFiles = await fs.readdir(codePath).catch(() => []);
        const logFiles = await fs.readdir(logPath).catch(() => []);

        const promisesArr = [];
        for (const file of codeFiles) {
            promisesArr.push(fs.unlink(path.join(codePath, file)));
        }

        for (const file of logFiles) {
            promisesArr.push(fs.unlink(path.join(logPath, file)));
        }

        const results = await Promise.allSettled(promisesArr);
        for (const result of results) {
            if (result.status === 'rejected' && result.reason.code !== 'ENOENT') {
                throw new Error(`Failed to clear logs`);
            }
        }

        console.log(`Logs successfully cleared for User: ${user}`);
    }
    catch (err) {
        success = false;
        console.error(`Logs could not be deleted for user: ${user} -> Error: ${err.message}`);
    }
    return success;
}

/**
 * Sorts the array of logs/perms by when they were created (newest -> oldest).
 * 
 * @param arr: The array of code logs/perms
 * @return: The sorted array of code logs/perms as file names
 */
async function sortByCreation(arr, userPath) {
    // Build the file objects and collect the needed metaData
    const arrPromises = arr.map(async (filename) => {
        const fullPath = path.join(userPath, filename);
        const metaData = await fs.stat(fullPath);
        return {
            name: filename,
            creationTime: metaData.birthtimeMs
        };
    });
    const fileObjects = await Promise.all(arrPromises);

    // Sort the objects by time they were created (newest to oldest) and then return the paths of the files
    fileObjects.sort((a, b) => b.creationTime - a.creationTime);
    return fileObjects.map(file => file.name);

}

/**
 * gets all of the file names for the users code files stored in their log (code) directory.
 * 
 * @param user: The user to get the code file names for from their log directory.
 */
async function getLogs(user) {
    await createUserLog(user); // safe guard if the user log doesn't already exist somehow
    let logs;
    try {
        const userPath = path.join(dirPath, user, 'code');
        logs = await fs.readdir(userPath);
        logs = await sortByCreation(logs, userPath); // sorts the logs from newest to oldest
        console.log(`Successfully retrieved logs for user: ${user}`);
    }
    catch (err) {
        console.error(`Could not get logs for user: ${user} -> Error: ${err.message}`);
        logs = [];
    }
    return logs;
}

/**
 * Gets all of the perm file names for a given user.
 * 
 * @param user: The user to get the array of perms for.
 * @returns The array of perm files for the user.
 */
async function getPerms(user) {
        await createUserLog(user); // safe guard if the user log doesn't already exist somehow
    let perms;
    try {
        const userPath = path.join(dirPath, user, 'perm');
        perms = await fs.readdir(userPath);
        perms = await sortByCreation(perms, userPath); // sorts the perms from newest to oldest
        console.log(`Successfully retrieved perms for user: ${user}`);
    }
    catch (err) {
        console.error(`Could not get perms for user: ${user} -> Error: ${err.message}`);
        perms = [];
    }
    return perms;
}

/**
 * Gets the contents of a given perm file for a given user.
 * 
 * @param user: The user for the perm file to load.
 * @param title: The name of the perm file to load.
 * @returns The contents of the perm file that has been loaded.
 */
async function loadPerm(user, title) {
    await createUserLog(user); // safe guard if the user log doesn't already exist somehow
    let fileContent;
    let filePath;
    try {
        filePath = path.join(dirPath, user, 'perm', title);
        fileContent = await fs.readFile(filePath, 'utf-8');
        console.log(`Log loaded for user: ${user} with title: ${title}`);
    }
    catch (err) {
        console.error(`Log could not be loaded for user: ${user} with title: ${title} -> Error: ${err.message}`);
        fileContent = "ERROR";
    }
    return fileContent;
}

/**
 * Removes all the users perms from their log directory.
 * 
 * @param user: The user to remove the perms for in their log directory.
 * @return: Was the clearing successfull?
 */
async function removeAllPerms(user) {
    let success = true;
    try {
        const permPath = path.join(dirPath, user, 'perm');

        const permFiles = await fs.readdir(permPath).catch(() => []);

        const promisesArr = [];
        for (const file of permFiles) {
            promisesArr.push(fs.unlink(path.join(permPath, file)));
        }

        const results = await Promise.allSettled(promisesArr);
        for (const result of results) {
            if (result.status === 'rejected' && result.reason.code !== 'ENOENT') {
                throw new Error(`Failed to clear perms`);
            }
        }

        console.log(`Perms successfully cleared for User: ${user}`);
    }
    catch (err) {
        success = false;
        console.error(`Perms could not be deleted for user: ${user} -> Error: ${err.message}`);
    }
    return success;
}

module.exports = {
    createUserLog,
    removeUserLog,
    saveCode,
    loadCode,
    removeCode,
    getLogs,
    removeAllCode,
    getPerms,
    loadPerm,
    removeAllPerms
};