/**
 * End-to-end integration test for JoyVibe API + Frontend
 * Run with: node test-e2e.cjs
 */
const http = require('http');

const API = 'http://localhost:4000';
let passed = 0, failed = 0;

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(API + path);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const req = http.request({
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers,
    }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data), headers: res.headers }); }
        catch { resolve({ status: res.statusCode, body: data, headers: res.headers }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}`);
    console.log(`     ${e.message}`);
    failed++;
  }
}

async function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log('\n╔══════════════════════════════════════════════╗');
console.log('║  JoyVibe E2E Integration Test                 ║');
console.log('╚══════════════════════════════════════════════╝\n');

(async () => {

// ── Step 1: Health ──
console.log('📡 Step 1: API Health');
await test('GET /api/health returns ok', async () => {
  const r = await request('GET', '/api/health');
  assert(r.status === 200, `status=${r.status}`);
  assert(r.body.status === 'ok', `body=${JSON.stringify(r.body)}`);
});

// ── Step 2: Auth ──
console.log('\n🔐 Step 2: Authentication');
let token = null;

await test('POST /api/auth/login (wrong creds) returns 401', async () => {
  const r = await request('POST', '/api/auth/login', { username: 'x', password: 'x' });
  assert(r.status === 401, `status=${r.status}`);
});

await test('POST /api/auth/login (missing fields) returns 400', async () => {
  const r = await request('POST', '/api/auth/login', {});
  assert(r.status === 400, `status=${r.status}`);
});

await test('POST /api/auth/login (李同学/123456) returns JWT', async () => {
  const r = await request('POST', '/api/auth/login', { username: '李同学', password: '123456' });
  assert(r.status === 200, `status=${r.status}`);
  assert(r.body.token && r.body.token.length > 20, 'no token');
  assert(r.body.user.username === '李同学', `username=${r.body.user?.username}`);
  token = r.body.token;
});

await test('POST /api/auth/login (demo/demo123) also works', async () => {
  const r = await request('POST', '/api/auth/login', { username: 'demo', password: 'demo123' });
  assert(r.status === 200, `status=${r.status}`);
});

await test('GET /api/auth/me (no token) returns 401', async () => {
  const r = await request('GET', '/api/auth/me');
  assert(r.status === 401, `status=${r.status}`);
});

await test('GET /api/auth/me (with token) returns user', async () => {
  const r = await request('GET', '/api/auth/me', null, token);
  assert(r.status === 200, `status=${r.status}`);
  assert(r.body.username === '李同学', `username=${r.body.username}`);
});

await test('POST /api/auth/logout returns 200', async () => {
  const r = await request('POST', '/api/auth/logout', null, token);
  assert(r.status === 200, `status=${r.status}`);
});

// ── Step 3: Cart ──
console.log('\n🛒 Step 3: Cart');

await test('GET /api/cart (no token) returns 401', async () => {
  const r = await request('GET', '/api/cart');
  assert(r.status === 401, `status=${r.status}`);
});

await test('GET /api/cart returns items array', async () => {
  const r = await request('GET', '/api/cart', null, token);
  assert(r.status === 200, `status=${r.status}`);
  assert(Array.isArray(r.body.items), `items not array: ${typeof r.body.items}`);
});

await test('POST /api/cart/add adds item', async () => {
  const r = await request('POST', '/api/cart/add', { productId: 'p001', quantity: 2 }, token);
  assert(r.status === 200, `status=${r.status}`);
  const found = r.body.items.find((i) => i.productId === 'p001');
  assert(found && found.quantity === 2, `quantity wrong: ${found?.quantity}`);
});

await test('POST /api/cart/add increments quantity', async () => {
  const r = await request('POST', '/api/cart/add', { productId: 'p001', quantity: 1 }, token);
  assert(r.status === 200, `status=${r.status}`);
  const found = r.body.items.find((i) => i.productId === 'p001');
  assert(found && found.quantity === 3, `quantity should be 3: ${found?.quantity}`);
});

await test('POST /api/cart/sync replaces all items', async () => {
  const items = [{ productId: 'p002', quantity: 1 }, { productId: 'p003', quantity: 2 }];
  const r = await request('POST', '/api/cart/sync', { items }, token);
  assert(r.status === 200, `status=${r.status}`);
  assert(r.body.count === 2, `count=${r.body.count}`);
});

// ── Step 4: Orders ──
console.log('\n📦 Step 4: Orders');

let orderId = null;

await test('GET /api/orders returns array', async () => {
  const r = await request('GET', '/api/orders', null, token);
  assert(r.status === 200, `status=${r.status}`);
  assert(Array.isArray(r.body.orders), `orders not array`);
});

await test('POST /api/orders creates order', async () => {
  const r = await request('POST', '/api/orders', {
    items: [{ productId: 'p002', quantity: 1, price: 299, name: '运动手环' }],
    total: 299,
    shipping: 0,
    discount: 0,
    address: { name: '李同学', phone: '133****5831', region: '辽宁大连', detail: '鲁迅美术学院' },
    paymentMethod: '微信支付',
  }, token);
  assert(r.status === 201, `status=${r.status}`);
  assert(r.body.order.id && r.body.order.id.startsWith('JV'), `id=${r.body.order.id}`);
  assert(r.body.order.status === 'pending', `status=${r.body.order.status}`);
  orderId = r.body.order.id;
});

await test('POST /api/orders clears cart', async () => {
  const r = await request('GET', '/api/cart', null, token);
  assert(r.body.items.length === 0, `cart not empty: ${r.body.items.length}`);
});

await test('PATCH /api/orders/:id/status updates status', async () => {
  const r = await request('PATCH', `/api/orders/${orderId}/status`, { status: 'paid' }, token);
  assert(r.status === 200, `status=${r.status}`);
  assert(r.body.order.status === 'paid', `new status=${r.body.order.status}`);
});

await test('PATCH /api/orders/:id/status invalid order returns 404', async () => {
  const r = await request('PATCH', '/api/orders/JV0000000/invalid', { status: 'paid' }, token);
  assert(r.status === 404, `status=${r.status}`);
});

await test('GET /api/orders includes new order', async () => {
  const r = await request('GET', '/api/orders', null, token);
  const found = r.body.orders.find((o) => o.id === orderId);
  assert(found, 'order not in list');
  assert(found.status === 'paid', `status=${found.status}`);
});

// ── Step 5: Hardening & validation ──
console.log('\n🛡️  Step 5: Hardening & Validation');

await test('POST malformed JSON body returns 400', async () => {
  const r = await request('POST', '/api/auth/login', '{not valid json', null);
  assert(r.status === 400, `status=${r.status}`);
});

await test('POST /api/cart/sync rejects invalid quantity', async () => {
  const r = await request('POST', '/api/cart/sync', { items: [{ productId: 'p001', quantity: 0 }] }, token);
  assert(r.status === 400, `status=${r.status}`);
});

await test('POST /api/cart/sync rejects quantity > 99', async () => {
  const r = await request('POST', '/api/cart/sync', { items: [{ productId: 'p001', quantity: 100 }] }, token);
  assert(r.status === 400, `status=${r.status}`);
});

await test('POST /api/orders rejects empty product data', async () => {
  const r = await request('POST', '/api/orders', { items: [{ quantity: 1 }], total: 10 }, token);
  assert(r.status === 400, `status=${r.status}`);
});

await test('POST /api/orders rejects negative total', async () => {
  const r = await request('POST', '/api/orders', { items: [{ productId: 'p001', quantity: 1 }], total: -50 }, token);
  assert(r.status === 400, `status=${r.status}`);
});

await test('security headers are present', async () => {
  const r = await request('GET', '/api/health', null, null);
  assert(r.headers['x-content-type-options'] === 'nosniff', 'missing X-Content-Type-Options');
  assert(r.headers['x-frame-options'] === 'DENY', 'missing X-Frame-Options');
});

await test('health exposes memory & store metrics', async () => {
  const r = await request('GET', '/api/health', null, null);
  assert(r.body.memory && typeof r.body.memory.rssMB === 'number', 'missing memory metrics');
  assert(typeof r.body.stores.orders === 'number', 'missing store metrics');
});

await test('unknown API route returns JSON 404', async () => {
  const r = await request('GET', '/api/does-not-exist', null, null);
  assert(r.status === 404 && r.body.error, `status=${r.status}`);
});

// ── Step 6: Persistence ──
console.log('\n💾 Step 6: File Persistence');

const fs = require('fs');
const path = require('path');

await test('orders are persisted to data/orders.json (debounced ≤1.2s)', async () => {
  await new Promise((resolve) => setTimeout(resolve, 1300));
  const file = path.join(__dirname, 'data', 'orders.json');
  assert(fs.existsSync(file), 'data/orders.json not found');
  const obj = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert(obj.u001 && Array.isArray(obj.u001) && obj.u001.length > 0, 'u001 orders missing on disk');
});

// ── Summary ──
console.log(`\n╔══════════════════════════════════════════════╗`);
console.log(`║  Results: ${passed} passed, ${failed} failed             ║`);
console.log(`╚══════════════════════════════════════════════╝\n`);
process.exit(failed > 0 ? 1 : 0);

})().catch((e) => { console.error('Fatal:', e); process.exit(1); });
