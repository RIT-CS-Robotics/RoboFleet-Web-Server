# TODO

This document contains future development tasks and maintenance notes for the RoboFleet Web Server project.

---

## 1. npm run dev → npm run build (frontends)

Right now the website frontends are constructed with `npm run dev` which allows for easy code modifications with instant changes to the frontend. This is great for development but eventually it would be better to switch over to using `npm run build`. This won't allow developers to make code changes that instantly appear on the website but it will make the production speed much faster and the overall frontend load more efficient.

This must be done for both the `user_interaction_frontend` and the `status_frontend`.

### Requirements

- When doing this change, make sure to run it as a `pm2` process to keep the server up 24/7 (as long as the RIT VM server is up this will work).
- Make sure to check the README for how `pm2` works to manage and run several processes constantly.
- Also, note that when this was tried before using `npm run build` there was a white screening problem with the non-root page (`user_interaction_frontend`).
- When switching to `npm run build`, make sure to investigate this by looking through the apache config and adjusting that with the `vite.config.js` file in `/user_interaction_frontend`.

---

## 2. make student and admin dashboards more modular

The current user interaction pages are not very modular. This is because they were developed early on when developing these things with the websites frameworks were still being learned about and there were some small confusions.

When looking at `Dashboard.jsx`/`Dashboard.css` and `Admin.jsx`/`Admin.css`, you should see that there is a lot of js code, html, and css all bundled together. This is because there is no components directory with individual elements of each page but rather every element for each page is directly in that page's source code.

Everything does work but this is of course not great practice and it would be much better to organize the different frontend components into a components directory and import them into `Dashboard.jsx` and `Admin.jsx`.

### Important Considerations

When doing this however be mindful of how information is shared between components in the `usestate` jsx variables.

For example when clicking on a log from the log list component, that information for the log must be available globally to `Dashboard.jsx` so that it can be used for the text editor component in the log section of that.

A good approach to handle this might be to use global `usestate` variables in `Dashboard.jsx`/`Admin.jsx` and somehow make the components in their own files impact these when imported into the parent `Dashboard.jsx`/`Admin.jsx` files.

React is a one way data binding framework so you can't do this directly from the imported components but you can pass the state updater function down to the imported component as a prop.

This pattern is known as **"lifting state up"** or **passing an action callback**.

All of this can be done in `user_interaction_frontend/src/pages`.

---

## 3. SAML Integration

SAML integration should mostly be configured and ready to go, however once fully implemented you might have to make small changes depending on the results and you will need to alter how the login works and what information you need for the user login from SAML2 (should just be username because this is what links the student accounts to the logs for them).

The system is still using the old login system without SAML authentication but the endpoints for SAML authentication do exist in `/backend/src/app.js` under a comment section titled **AUTHENTICATION AND STUDENT REGISTRATION ENDPOINTS**.

There is also already a needed metadata endpoint near the top of that same file and going to [https://robotics-project.gccis.rit.edu/saml2/metadata](https://robotics-project.gccis.rit.edu/saml2/metadata) will bring you to that page.

The certificates needed for the SAML config are also in the backend at `/backend/certificates`.

### Next Steps

- Once you see all of this and try to make sense of the whole SAML authentication system, please talk to Professor Zach Butler to see how to get going with all of this by contacting gccis IT to get the full SAML authentication login working for the website.

---

## 4. update to newest robot.py and Robot.java

The `robot.py` and `Robot.java` code files are often updated. Ensure that when they are updated in the future, you copy and paste the new ones into `/backend/code_files`.

Once you do this:

- Go into them and make sure that the env variable being injected in is called `ROBOT_HOST` (not `ROBOT_IP` or something else).
- Also make sure that whenever they are updated you run the `update_docs.sh` executable in `/backend/code_files` to update the documentation for the resources page.
- Check the README for more information on how the `update_docs.sh` executable works.

---

## 5. update song list on resources page

At the time of making this document, robots playing songs are not fully implemented.

When it does get implemented, each song will have a specific ID, and students will need to know these ID's to make the robots play the songs they want to hear.

For this, the resources page uses a song list component with song names to matching ID's in `status_frontend/src/components/resources/songs`.

### Updating the Song List

To update the list when the full song list is fleshed out:

- Just edit the file in that directory called `songs.txt`.
- Look at the format, make sure to keep it just as it is, and add/remove/edit whatever songs need to be adjusted with the correct names/ID's to match whatever the robots are expecting.

---

## 6. update project contributors and version

Make sure everyone who works on the project gets credit!

To ensure this on the website side of things:

- Update the `LICENSE` file to have all contributors names.
- Update the `About.jsx` page in `status_frontenud/src/pages/About.jsx` by adding all contributors names to the Research Team text under the HTML `className` `team-roster`.

Also in this file, you may update the website version number when changes are made and production ready under the HTML `className` `build-version`.

---

## 7. update the point database

If the point database is updated for the robots on the robot laptops, make sure to reflect those same changes on the website so that the correct name locations to coordinates are the same on both the robots and the website.

### Updating the Database

To do this:

1. On the `robofleet2` repository go to `src/robofleet_core/map/point_database.txt` and copy the file.
2. Then, on the `RoboFleet-Web-Server` repository go to `/backend/destination_database.txt` and paste the contents there.

---
