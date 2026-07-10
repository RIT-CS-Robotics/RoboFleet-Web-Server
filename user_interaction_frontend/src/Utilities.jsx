/**
 * @file status_frontend/src/Utilities.jsx
 * 
 * @fileoverview Utility functions for user interaction frontend for RoboFleet (robotics-project.gccis.rit.edu)
 * 
 * @date 7/10/2026
 * @author Aidan Sanderson
 */

/**
 * Loads the logs for the given user. Uses the perm log fies for sending to the admin account so it shows the logs that have been deleted by the user.
 * 
 * @param {string} user: The user to load the logs for.
 * @param {string} forAdmin: Is the log loading for the admin account?
 * @returns: The log file paths for the given user (perm paths for giving to admin).
 */
  export async function loadLogs(user, forAdmin) {
    let logs = [];
    try {
      let response;
      if (forAdmin) {
        response = await fetch(`/api/perm/${user}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
    }
    else {
        response = await fetch(`/api/log/${user}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
    }

      const data = await response.json();
      if (forAdmin) {
        logs = data.userPerms;
      }
      else {
        logs = data.userLogs;
      }
    }
    catch(err) {
      console.error(`ERROR: cant load logs for User: ${user}`);
    }
    return logs;
  }