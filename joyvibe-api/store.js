/**
 * Lightweight JSON-file persistence for carts & orders.
 * - loadStore(): restore a Map<userId, value> from disk on boot
 * - saveStore(): atomic write (tmp + rename), debounced per store
 *
 * Designed for the demo/single-node deployment. The write path is synchronous
 * under the hood (fs.renameSync) to guarantee data survives a crash, but
 * scheduling is debounced so burst traffic (cart sync every 500ms) only
 * triggers one disk write per second at most.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const SAVE_DEBOUNCE_MS = 1000;

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

/**
 * Load a persisted JSON map file.
 * @param {string} name file basename without extension
 * @returns {Map<string, any>}
 */
function loadStore(name) {
  const file = path.join(DATA_DIR, `${name}.json`);
  try {
    if (!fs.existsSync(file)) return new Map();
    const raw = fs.readFileSync(file, 'utf8');
    const obj = JSON.parse(raw);
    if (obj && typeof obj === 'object') {
      return new Map(Object.entries(obj));
    }
    return new Map();
  } catch (err) {
    // Corrupt file must never crash the server — back it up and start fresh
    const backup = path.join(DATA_DIR, `${name}.corrupt-${Date.now()}.json`);
    try { fs.renameSync(file, backup); } catch { /* ignore */ }
    console.error(`[store] failed to load ${name}.json, backed up to ${backup}:`, err.message);
    return new Map();
  }
}

const timers = new Map();

/**
 * Schedule a debounced, atomic persist of a Map store.
 * @param {string} name file basename
 * @param {Map} store live Map to serialize
 */
function saveStore(name, store) {
  const existing = timers.get(name);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => {
    timers.delete(name);
    writeNow(name, store);
  }, SAVE_DEBOUNCE_MS);
  timers.set(name, timer);
}

/** Flush immediately (used on graceful shutdown). */
function saveStoreNow(name, store) {
  if (timers.has(name)) {
    clearTimeout(timers.get(name));
    timers.delete(name);
  }
  writeNow(name, store);
}

function writeNow(name, store) {
  const file = path.join(DATA_DIR, `${name}.json`);
  const tmp = path.join(DATA_DIR, `${name}.json.tmp`);
  try {
    const obj = Object.fromEntries(store);
    fs.writeFileSync(tmp, JSON.stringify(obj));
    fs.renameSync(tmp, file);
  } catch (err) {
    console.error(`[store] failed to persist ${name}.json:`, err.message);
  }
}

module.exports = { loadStore, saveStore, saveStoreNow, DATA_DIR };
