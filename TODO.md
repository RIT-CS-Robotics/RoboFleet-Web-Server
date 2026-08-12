# npm run dev -> npm run build (frontends)

right now the website frontends are constructed with npm run dev which allows for easy code modifications with instant changes to the frontend. This is great for development but eventually it would be better to switch over to using npm run build. This won't allow developers to make code changes that instantly appear on the website but it will make the production speed much fatser and the overall frontend load more efficient. This must be done for both the user_interaction_frontend and the status_frontend. When doing this change, make sure to run it as a pm2 process to keep the server up 24/7 (as long as the RIT VM server is up this will work). Make sure to check the README for how pm2 works to manage and run several processes constantly. Also, note that when this was tried before using npm run build there was a white screening problem with the non-root page (user_interaction_frontend). When switching to npm run build, make sure to investigate this by looking through the apache config and adjusting that with the vite.config.js file in /user_interaction_frontend.

---

# make student and admin dashboards more modular

The currant user interaction pages are not very modular. This is because they were developed early on when developing these things with the websites frameworks was still being learned about and there was some small confusions. When looking at Dashboard.jsx/Dashboard.css and Admin.jsx/Admin.css, you should see that there is a lot of js code, html, and css all bundled together. This is because there is not components directory with individual elements of each page but rather every element for each page in directly in that pages source code. Everything does work but this is of course not great practice and it would be much better to organize the different frontend components into a components directory and import them into Dashboard.jsx and Admin.jsx. When doing this however be mindefull of how information is shared between components in the usestate jsx variables. For example when clicking on a log from the log list component, that information for the log must be available globally to Dashboard.jsx so that it can be used for the text editor component in the log section of that. A good aproach to handle this might be to use global usestate variables in Dashboard.jsx/Admin.jsx and somehow make the components in their own files impact these when imported into the parent Dashboard.jsx/Admin.jsx files. React is a one way data binding framework so you cant do this directly from the imported components but you can pass the state updater function down to the imported component as a prop. This pattern is known as "lifting state up" or passing an action callback. All of this can be done in user_interaction_frontend/src/pages.

---

# SAML Integration

SAML integration should mostly be configured and ready to go, however once fully implemented you might have to make small changed depending on the results and you will need to alter how the login works and what information you need for the user login from SAML2 (should just be username because this is what links the student accounts to the logs for them). The system is still using the old login system without SAML authentication but the endpoints for SAML authentication do exist in /backend/src/app.js under a comment section titled AUTHENTICATION AND STUDENT REGISTRATION ENDPOINTS. There is also already a needed metadata endpoint near the top of that same file and going to https://robotics-project.gccis.rit.edu/saml2/metadata will bring you to that page. The certificates needed for the SAML config are also in the backend at /backend/certificates. Once you see all of this and try to make sense of the whole SAML authentication system, please talk to Professor Zach Butler to see how to get going with all of this with contacting gccis IT to get the full SAML authentication login working for the website.

# update to newest robot.py and Robot.java

# update song list on resources page

# update project contributors

# update the point database
