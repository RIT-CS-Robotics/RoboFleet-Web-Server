  // loads the current logs
  export async function loadLogs(currentUser, forAdmin) {
    let logs = [];
    try {
      let response;
      if (forAdmin) {
        response = await fetch(`/api/perm/${currentUser}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
    }
    else {
        response = await fetch(`/api/log/${currentUser}`, {
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
      console.error(`ERROR: cant load logs for User: ${currentUser}`);
    }
    return logs;
  }