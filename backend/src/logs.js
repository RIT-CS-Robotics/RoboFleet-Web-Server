/**
 * File: logs.js
 * @author Aidan Sanderson
 * Date: 6/15/2026
 * 
 * Functionality: The functionality behind the user code logging system for the RoboFleet backend server.
 */
const { promises } = require('node:dns');
const fs = require('node:fs/promises'); // Version: node@24.16.0
const { promiseHooks } = require('node:v8');
const path = require('path'); // Version: node@24.16.0

const dir_path = path.join(__dirname, '../user_logs');

/**
 * Creates a new code log directory for a given user.
 * 
 * @param user: The user to create the code log directory for 
 */
async function createUserLog(user) {
    try {
        const user_path = path.join(dir_path, user);
        const code_path = path.join(user_path, 'code');
        const log_path = path.join(user_path, 'log');
        const perm_path = path.join(user_path, 'perm');

        await fs.mkdir(user_path, { recursive: true }); // recursive used here to prevent crashes if the folder exists

        await Promise.all([
            fs.mkdir(code_path, { recursive: true }),
            fs.mkdir(log_path, { recursive: true }),
            fs.mkdir(perm_path, { recursive: true })
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
        const user_path = path.join(dir_path, user);
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
    let result = true;
    await createUserLog(user); // safe guard if the user log doesn't already exist somehow
    try {
        const code_path = path.join(dir_path, user, 'code', title);
        const log_path = path.join(dir_path, user, 'log', (title + '.log') );
        const perm_path = path.join(dir_path, user, 'perm', (title + '.perm') );
        
        const seperator = '--------------------';
        const header = `Log: ${title}\nUser: ${user}\n${seperator}\nCode Ran:\n${seperator}\n ${code}\n${seperator}\nLog:\n${seperator}\n`;

        await Promise.all([
            fs.writeFile(code_path, code, 'utf-8'),
            fs.writeFile(log_path, header, 'utf-8'),
            fs.writeFile(perm_path, header, 'utf-8')
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
 * @returns file_content: The contents of the file (code or log text)
 */
async function loadCode(user, title, is_log) {
    await createUserLog(user); // safe guard if the user log doesn't already exist somehow
    let file_content;
    let file_path;
    try {
        if (is_log) {
            file_path = path.join(dir_path, user, 'log', (title + '.log') );
        }
        else {
            file_path = path.join(dir_path, user, 'code', title);
        }
        file_content = await fs.readFile(file_path, 'utf-8');
        console.log(`Log loaded for user: ${user} with title: ${title}`);
    }
    catch (err) {
        console.error(`Log could not be loaded for user: ${user} with title: ${title} -> Error: ${err.message}`);
        file_content = "ERROR";
    }
    return file_content;
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
        const code_path = path.join(dir_path, user, 'code', title);
        const log_path = path.join(dir_path, user, 'log', (title + '.log') );
        const [code_res, log_res] = await Promise.allSettled([
            fs.unlink(code_path),
            fs.unlink(log_path)
        ]);

        if (code_res.status === 'rejected' && code_res.reason.code !== 'ENOENT') {
            throw new Error('log failed to delete');
        }
        if (log_res.status === 'rejected' && log_res.reason.code !== 'ENOENT') {
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
        const code_path = path.join(dir_path, user, 'code');
        const log_path = path.join(dir_path, user, 'log');

        const code_files = await fs.readdir(code_path).catch(() => []);
        const log_files = await fs.readdir(log_path).catch(() => []);

        const promises_arr = [];
        for (const file of code_files) {
            promises_arr.push(fs.unlink(path.join(code_path, file)));
        }

        for (const file of log_files) {
            promises_arr.push(fs.unlink(path.join(log_path, file)));
        }

        const results = await Promise.allSettled(promises_arr);
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
 * gets all of the file names for the users code files stored in their log directory.
 * 
 * @param user: The user to get the code file names for from their log directory.
 */
async function getLogs(user) {
    await createUserLog(user); // safe guard if the user log doesn't already exist somehow
    let logs;
    try {
        const user_path = path.join(dir_path, user, 'code');
        logs = await fs.readdir(user_path);
        console.log(`Successfully retrieved logs for user: ${user}`);
    }
    catch (err) {
        console.error(`Could not get logs for user: ${user} -> Error: ${err.message}`);
        logs = [];
    }
    return logs;
}

async function getPerms(user) {
        await createUserLog(user); // safe guard if the user log doesn't already exist somehow
    let perms;
    try {
        const user_path = path.join(dir_path, user, 'perm');
        perms = await fs.readdir(user_path);
        console.log(`Successfully retrieved perms for user: ${user}`);
    }
    catch (err) {
        console.error(`Could not get perms for user: ${user} -> Error: ${err.message}`);
        perms = [];
    }
    return perms;
}

async function loadPerm(user, title) {
    await createUserLog(user); // safe guard if the user log doesn't already exist somehow
    let file_content;
    let file_path;
    try {
        file_path = path.join(dir_path, user, 'perm', title);
        file_content = await fs.readFile(file_path, 'utf-8');
        console.log(`Log loaded for user: ${user} with title: ${title}`);
    }
    catch (err) {
        console.error(`Log could not be loaded for user: ${user} with title: ${title} -> Error: ${err.message}`);
        file_content = "ERROR";
    }
    return file_content;
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
    loadPerm
};