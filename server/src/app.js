const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const { DEFAULT_DOWNLOAD_DIR, CLIENT_DIST_DIR } = require('./config');
const { requireLocalHost, requireLocalOrigin, localCors } = require('./security');

/**
 * options.clientDist: folder with the built web page (default: client/dist)
 * options.shutdown:   called by POST /api/shutdown (set by index.js; missing in tests)
 */
const createApp = ({ clientDist = CLIENT_DIST_DIR, shutdown } = {}) => {
  fs.mkdirSync(DEFAULT_DOWNLOAD_DIR, { recursive: true });

  const app = express();
  app.locals.hasClientBuild = fs.existsSync(path.join(clientDist, 'index.html'));
  app.locals.shutdown = shutdown;

  app.use(requireLocalHost);
  app.use(requireLocalOrigin);
  app.use(localCors);
  app.use(bodyParser.json());

  app.use('/api', require('./routes/system'));
  app.use('/api', require('./routes/info'));
  app.use('/api', require('./routes/download'));

  // The web page itself (http://localhost:3000)
  if (app.locals.hasClientBuild) {
    app.use(express.static(clientDist));
  } else {
    app.get('/', (req, res) => {
      res.status(503).type('text').send('The web page has not been built yet. Run "npm run build" in the client folder, or start the app with start_app.bat / start_app.sh.');
    });
  }

  return app;
};

module.exports = { createApp };
