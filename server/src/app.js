const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const { DEFAULT_DOWNLOAD_DIR } = require('./config');
const { requireLocalHost, requireLocalOrigin, localCors } = require('./security');

const createApp = () => {
  fs.mkdirSync(DEFAULT_DOWNLOAD_DIR, { recursive: true });

  const app = express();
  app.use(requireLocalHost);
  app.use(requireLocalOrigin);
  app.use(localCors);
  app.use(bodyParser.json());

  app.use('/api', require('./routes/system'));
  app.use('/api', require('./routes/info'));
  app.use('/api', require('./routes/download'));

  return app;
};

module.exports = { createApp };
