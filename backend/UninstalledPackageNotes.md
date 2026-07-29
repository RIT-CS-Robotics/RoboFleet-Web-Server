### These packages were once installed but were not needed at the time of deploying the website. If there is a problem later on with new things like saml2 authentification being fully implemented or similar, here is the package.json file from before, the uninstall command, and the npm fund output.

### package.json

{
  "name": "backend",
  "version": "1.0.0",
  "description": "",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "dependencies": {
    "@node-saml/passport-saml": "^5.1.0",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "express-session": "^1.19.0",
    "javadoc": "^2.0.2",
    "jsonwebtoken": "^9.0.3",
    "passport": "^0.7.0",
    "roslib": "^1.4.1",
    "tmp": "^0.2.7",
    "ws": "^8.21.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.14",
    "patch-package": "^8.0.1"
  }
}

### Uninstall terminal command

user@robotics-project:~/RoboFleet_WebServer/backend$ npm uninstall cookie-parser express-session jsonwebtoken javadoc

removed 260 packages, and audited 195 packages in 1s

44 packages are looking for funding
  run `npm fund` for details

5 vulnerabilities (1 low, 4 high)

To address all issues, run:
  npm audit fix

Run `npm audit` for details.

### npm fund

user@robotics-project:~/RoboFleet_WebServer/backend$ npm fund
backend@1.0.0
├── https://opencollective.com/express
│   └── cors@2.8.6, express@5.2.1, body-parser@2.2.2, iconv-lite@0.7.2, content-disposition@1.1.0, finalhandler@2.1.1, http-errors@2.0.1, mime-types@3.0.2, send@1.2.1, serve-static@2.2.1, type-is@2.1.0, content-type@2.0.0, path-to-regexp@8.4.2
├── https://dotenvx.com
│   └── dotenv@17.4.2
├── https://github.com/sponsors/jaredhanson
│   └── passport@0.7.0
├─┬ https://opencollective.com/nodemon
│ │ └── nodemon@3.1.14
│ ├─┬ https://paulmillr.com/funding/
│ │ │ └── chokidar@3.6.0
│ │ └── https://github.com/sponsors/jonschlinkert
│ │     └── picomatch@2.3.2
│ └── https://github.com/sponsors/isaacs
│     └── minimatch@10.2.5
├─┬ https://github.com/chalk/chalk?sponsor=1
│ │ └── chalk@4.1.2
│ └── https://github.com/chalk/ansi-styles?sponsor=1
│     └── ansi-styles@4.3.0
├── https://github.com/sponsors/sibiraj-s
│   └── ci-info@3.9.0
└── https://github.com/sponsors/eemeli
    └── yaml@2.9.0
