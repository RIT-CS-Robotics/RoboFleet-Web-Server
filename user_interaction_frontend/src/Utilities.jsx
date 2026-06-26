  // loads the current logs
  export async function loadLogs(currentUser) {
    let logs = [];
    try {
      const response = await fetch(`/api/log/${currentUser}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      logs = data.userLogs;
    }
    catch(err) {
      console.error(`ERROR: cant load logs for User: ${currentUser}`);
    }
    return logs;
  }

    export const handleLogButton = async (currentUser, fileName) => {
    const info = [null, '', ''];
    try {
      const response = await fetch(`/api/log/${currentUser}/${fileName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      const log = data.userLog;
      const code = data.userCode;
      const fileSplit = fileName.split('_');
      const title = fileSplit[0];

      info[0] = log;
      info[1] = code;
      info[2] = title;

      console.log(`Loaded code log for user: ${currentUser}`);
    }
    catch(err) {
      alert(`Error: Could not load code log`);
      console.error(`Could not load code log for user: ${currentUser} -> Error: ${err}`);
    }
    return info;
  };