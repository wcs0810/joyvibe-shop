/**
 * Netlify Function: wraps the Express app.
 * /api/* requests are rewritten here by netlify.toml, so the frontend
 * calls the backend on the SAME origin (no CORS, separate backend domain).
 */
const os = require('os');
const path = require('path');
const serverless = require('serverless-http');
const { createApp } = require('../lib/createApp.cjs');

const dataDir = path.join(os.tmpdir(), 'joyvibe-data');

const { app } = createApp({
  dataDir,
  jwtSecret: process.env.JWT_SECRET || 'joyvibe-netlify-demo-secret',
});

const handler = serverless(app);

module.exports.handler = handler;
