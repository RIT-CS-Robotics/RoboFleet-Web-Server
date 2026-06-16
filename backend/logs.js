/**
 * File: logs.js
 * @author Aidan Sanderson
 * Date: 6/15/2026
 * 
 * Functionality: The functionality behind the user code logging system for the RoboFleet backend server.
 */
const fs = require('node:fs/promises'); // Version: node@24.16.0
const path = require('path'); // Version: node@24.16.0

const log_path = path.join(__dirname, 'user_logs');

/**
 * Creates a new code log directory for a given user.
 * 
 * @param user: The user to create the code log directory for 
 */
async function createUserLog(user) {
    try {
        const user_path = path.join(log_path, user);
        await fs.mkdir(user_path, { recursive: true }); // recursive used here to prevent crashes if the folder exists
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
        const user_path = path.join(log_path, user);
        await fs.rm(user_path, { recursive: true, force: true }); // recursive removes all files inside and force doesn't error on minor issues
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
 */
async function saveCode(user, title, code) {
    await createUserLog(user); // safe guard if the user log doesn't already exist somehow
    try {
        const file_path = path.join(log_path, user, title);
        await fs.writeFile(file_path, code, 'utf-8');
        console.log(`Code saved for user: ${user} with title: ${title}`);
    }
    catch (err) {
        console.error(`Code could not be saved for user: ${user} with title: ${title} -> Error: ${err.message}`);
        return;
    }
}

/**
 * Loads the users code from their log directory.
 * 
 * @param user: The user to load the code for from their log directory.
 * @param title: The name of the code file.
 */
async function loadCode(user, title) {
    await createUserLog(user); // safe guard if the user log doesn't already exist somehow
    let code;
    try {
        const file_path = path.join(log_path, user, title);
        code = await fs.readFile(file_path, 'utf-8');
        console.log(`Code loaded for user: ${user} with title: ${title}`);
    }
    catch (err) {
        console.error(`Code could not be loaded for user: ${user} with title: ${title} -> Error: ${err.message}`);
        code = null;
    }
    return code;
}

/**
 * Removes the users code from their log directory.
 * 
 * @param user: The user to remove the code for in their log directory.
 * @param title: The name of the code file.
 */
async function removeCode(user, title) {
    try {
        const file_path = path.join(log_path, user, title);
        await fs.unlink(file_path);
        console.log(`Code deleted for user: ${user} with title: ${title}`);
    }
    catch (err) {
        console.error(`Code could not be deleted for user: ${user} with title: ${title} -> Error: ${err.message}`);
        return;
    }
}

/**
 * gets all of the file names for the users code files stored in their log directory.
 * 
 * @param user: The user to get the code file names for from their log directory.
 */
async function getLogs(user) {
    await createUserLog(user); // safe guard if the user log doesn't already exist somehow
    let logs;
    try {
        const user_path = path.join(log_path, user);
        logs = await fs.readdir(user_path);
        console.log(`Successfully retrieved logs for user: ${user}`);
    }
    catch (err) {
        console.error(`Could not get logs for user: ${user} -> Error: ${err.message}`);
        logs = [];
    }
    return logs;
}

module.exports = {
    createUserLog,
    removeUserLog,
    saveCode,
    loadCode,
    removeCode,
    getLogs
};