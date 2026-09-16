/**
 * Lightweight JSON-file persistence (parameterized data directory).
 * - loadStore(): restore a Map<userId, value> from disk on boot
 * - saveStore(): atomic write (tmp + rename), debounced per store
 *
 * In long-running Node (local / Render) files persist normally.
 * In serverless (Netlify Functions) dataDir points at /tmp: data survives
 * warm container reuse but may reset on cold starts — acceptable for demo use.
 */
const fs = require('fs');
const path = require('path');

const SAVE_DEBOUNCE_MS = 1000;

function ensureDir(dataDir) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function createPersistence(dataDir) {
  ensureDir(dataDir);
  const timers = new Map();

  function loadStore(name) {
    const file = path.join(dataDir, `${name}.json`);
    try {
      if (!fs.existsSync(file)) return new Map();
      const raw = fs.readFileSync(file, 'utf8');
      const obj = JSON.parse(raw);
      if (obj && typeof obj === 'object') {
        return new Map(Object.entries(obj));
      }
      return new Map();
    } catch (err) {
      const backup = path.join(dataDir, `${name}.corrupt-${Date.now()}.json`);
      try { fs.renameSync(path.join(dataDir, `${name}.json`), backup); } catch { /* ignore */ }
      console.error(`[store] failed to load ${name}.json, backed up:`, err.message);
      return new Map();
    }
  }

  function writeNow(name, store) {
    const file = path.join(dataDir, `${name}.json`);
    const tmp = path.join(dataDir, `${name}.json.tmp`);
    try {
      fs.writeFileSync(tmp, JSON.stringify(Object.fromEntries(store)));
      fs.renameSync(tmp, file);
    } catch (err) {
      console.error(`[store] failed to persist ${name}.json:`, err.message);
    }
  }

  function saveStore(name, store) {
    if (timers.has(name)) clearTimeout(timers.get(name));
    const timer = setTimeout(() => {
      timers.delete(name);
      writeNow(name, store);
    }, SAVE_DEBOUNCE_MS);
    timers.set(name, timer);
  }

  function saveStoreNow(name, store) {
    if (timers.has(name)) {
      clearTimeout(timers.get(name));
      timers.delete(name);
    }
    writeNow(name, store);
  }

  return { loadStore, saveStore, saveStoreNow };
}

module.exports = { createPersistence };
