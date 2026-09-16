/**
 * Long-running Node bootstrap for JoyVibe API (local dev / Render).
 * The Express app itself lives in ../joyvibe-web/netlify/lib/createApp.cjs
 * so local and serverless deployments share one source of truth.
 */
const path = require('path');
const { createApp } = require('../joyvibe-web/netlify/lib/createApp.cjs');

const PORT = process.env.PORT || 4000;
const DATA_DIR = process.env.JOYVIBE_DATA_DIR || path.join(__dirname, 'data');

const { app, carts, orders, persistence } = createApp({
  dataDir: DATA_DIR,
  jwtSecret: process.env.JWT_SECRET || 'joyvibe-dev-secret-key-change-in-production',
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════╗
║  悦界 JoyVibe API Server                     ║
║  http://localhost:${PORT}                         ║
║  已恢复 carts: ${String(carts.size).padEnd(3)} orders: ${String(orders.size).padEnd(3)}             ║
║                                              ║
║  登录演示账号：                              ║
║  李同学 / 123456                             ║
║  demo / demo123                              ║
╚══════════════════════════════════════════════╝
`);
});

// Render free-tier keepalive (only activates where RENDER_EXTERNAL_URL exists)
const SELF_URL = process.env.RENDER_EXTERNAL_URL;
if (SELF_URL) {
  const keepAlive = () => {
    fetch(`${SELF_URL}/api/health`)
      .then((r) => console.log(`[keepalive] self-ping ${r.status}`))
      .catch((e) => console.error('[keepalive] failed:', e.message));
  };
  setInterval(keepAlive, 14 * 60 * 1000).unref();
  console.log('[keepalive] enabled for Render free tier');
}

function shutdown(signal) {
  console.log(`\n[shutdown] ${signal} received, flushing stores...`);
  persistence.saveStoreNow('carts', carts);
  persistence.saveStoreNow('orders', orders);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = app;
