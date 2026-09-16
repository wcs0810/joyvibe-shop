/**
 * JoyVibe 72-hour stability probe.
 *
 * Polls GET /api/health at a fixed interval and records every result to a CSV
 * log plus a rolling text log. Non-200 / timeout / payload anomalies are counted
 * as failures. At the end (or on Ctrl+C) it prints a summary and exits non-zero
 * if any failure was observed.
 *
 * Usage:
 *   node stability-check.cjs                     # default: 60s interval, 72h
 *   DURATION_MIN=60 INTERVAL_SEC=10 node stability-check.cjs   # short smoke run
 *   API=http://localhost:4000 node stability-check.cjs
 *
 * Outputs:
 *   data/stability-YYYYMMDD-HHmm.csv   (timestamp,status,latencyMs,rssMB,heapMB,note)
 *   data/stability-latest-summary.txt  (written on exit)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const API = process.env.API || 'http://localhost:4000';
const INTERVAL_MS = (Number(process.env.INTERVAL_SEC) || 60) * 1000;
const DURATION_MS = (Number(process.env.DURATION_MIN) || 72 * 60) * 60 * 1000;
const REQUEST_TIMEOUT_MS = 5000;

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 13);
const csvFile = path.join(DATA_DIR, `stability-${stamp}.csv`);
const summaryFile = path.join(DATA_DIR, 'stability-latest-summary.txt');

fs.writeFileSync(csvFile, 'timestamp,httpStatus,latencyMs,rssMB,heapMB,note\n');
const startedAt = Date.now();

let total = 0;
let failures = 0;
let latencySum = 0;
let latencyMax = 0;
let rssMax = 0;
let lastStatus = 'starting';

function probe() {
  return new Promise((resolve) => {
    const url = new URL(API + '/api/health');
    const t0 = Date.now();
    const req = http.get({ hostname: url.hostname, port: url.port, path: url.pathname, timeout: REQUEST_TIMEOUT_MS }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        const ms = Date.now() - t0;
        let note = '';
        let rssMB = '';
        let heapMB = '';
        try {
          const j = JSON.parse(body);
          rssMB = j.memory?.rssMB ?? '';
          heapMB = j.memory?.heapUsedMB ?? '';
          if (j.status !== 'ok') note = 'status!=ok';
        } catch { note = 'bad-json'; }
        resolve({ httpStatus: res.statusCode, ms, rssMB, heapMB, note: res.statusCode === 200 ? note : 'http-error' });
      });
    });
    req.on('timeout', () => { req.destroy(); resolve({ httpStatus: 0, ms: REQUEST_TIMEOUT_MS, rssMB: '', heapMB: '', note: 'timeout' }); });
    req.on('error', (err) => resolve({ httpStatus: 0, ms: Date.now() - t0, rssMB: '', heapMB: '', note: 'error:' + err.code }));
  });
}

function appendCsv(row) {
  fs.appendFileSync(csvFile, row + '\n');
}

async function tick() {
  const r = await probe();
  total++;
  latencySum += r.ms;
  latencyMax = Math.max(latencyMax, r.ms);
  if (r.rssMB !== '') rssMax = Math.max(rssMax, Number(r.rssMB));
  const ok = r.httpStatus === 200 && !r.note;
  if (!ok) failures++;
  lastStatus = ok ? 'ok' : 'FAIL';
  appendCsv([
    new Date().toISOString(),
    r.httpStatus,
    r.ms,
    r.rssMB,
    r.heapMB,
    ok ? 'ok' : r.note,
  ].join(','));
  const elapsedMin = Math.round((Date.now() - startedAt) / 60000);
  process.stdout.write(`[${elapsedMin}m] #${total} ${ok ? 'OK ' : 'FAIL'} ${r.ms}ms rss=${r.rssMB}MB ${r.note}\n`);
}

function finish() {
  const elapsedMin = Math.round((Date.now() - startedAt) / 60000);
  const avg = total ? Math.round(latencySum / total) : 0;
  const availability = total ? ((total - failures) / total * 100).toFixed(3) : '0.000';
  const summary = [
    'JoyVibe Stability Probe Summary',
    '================================',
    `API:            ${API}`,
    `Started:        ${new Date(startedAt).toISOString()}`,
    `Ended:          ${new Date().toISOString()}`,
    `Elapsed:        ${elapsedMin} min (target ${DURATION_MS / 60000} min)`,
    `Probes:         ${total}`,
    `Failures:       ${failures}`,
    `Availability:   ${availability}%`,
    `Latency avg:    ${avg} ms`,
    `Latency max:    ${latencyMax} ms`,
    `RSS max:        ${rssMax} MB`,
    `CSV log:        ${csvFile}`,
    '',
  ].join('\n');
  fs.writeFileSync(summaryFile, summary);
  console.log('\n' + summary);
  process.exit(failures > 0 ? 1 : 0);
}

process.on('SIGINT', finish);
process.on('SIGTERM', finish);

(async () => {
  console.log(`Stability probe starting: ${API} every ${INTERVAL_MS / 1000}s for ${DURATION_MS / 60000}min`);
  const endAt = Date.now() + DURATION_MS;
  while (Date.now() < endAt) {
    await tick();
    if (Date.now() >= endAt) break;
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
  finish();
})();
