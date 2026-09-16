// Live same-origin backend verification on Netlify
const BASE = 'https://joyvibe-shop.netlify.app';

const steps = [];
function log(name, ok, detail) {
  steps.push({ name, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`);
}

(async () => {
  // 1. health via same-origin /api rewrite
  let r = await fetch(BASE + '/api/health');
  let j = await r.json().catch(() => null);
  log('GET /api/health', r.ok && j && j.status === 'ok', j ? `rss=${j.memory.rssMB}MB stores=${JSON.stringify(j.stores)}` : `HTTP ${r.status}`);

  // 2. wrong login
  r = await fetch(BASE + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'x', password: 'y' }),
  });
  log('login wrong creds -> 401', r.status === 401);

  // 3. real login
  r = await fetch(BASE + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: '李同学', password: '123456' }),
  });
  j = await r.json();
  const token = j.token;
  log('login 李同学 -> JWT', !!token);

  // 4. auth/me
  r = await fetch(BASE + '/api/auth/me', { headers: { Authorization: 'Bearer ' + token } });
  j = await r.json();
  log('auth/me', r.ok && j.username === '李同学', j.username);

  // 5. cart sync
  r = await fetch(BASE + '/api/cart/sync', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ items: [{ productId: 'p001', quantity: 2 }] }),
  });
  j = await r.json();
  log('cart sync', r.ok && j.count === 1, `lines=${j.count}`);

  // 6. invalid quantity rejected
  r = await fetch(BASE + '/api/cart/sync', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ items: [{ productId: 'p001', quantity: 999 }] }),
  });
  log('cart validation rejects qty 999', r.status === 400);

  // 7. create order
  r = await fetch(BASE + '/api/orders', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({
      items: [{ product: { id: 'p001' }, quantity: 2 }],
      total: 998, shipping: 0, discount: 0,
      address: { name: '李同学', phone: '133****5831', region: '辽宁大连', detail: '测试地址' },
      paymentMethod: '微信支付',
    }),
  });
  j = await r.json();
  const orderId = j.order && j.order.id;
  log('create order', r.status === 201 && orderId, orderId);

  // 8. pay
  r = await fetch(BASE + `/api/orders/${orderId}/status`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ status: 'paid' }),
  });
  j = await r.json();
  log('order -> paid', r.ok && j.order.status === 'paid');

  // 9. list orders
  r = await fetch(BASE + '/api/orders', { headers: { Authorization: 'Bearer ' + token } });
  j = await r.json();
  log('orders list contains new order', Array.isArray(j.orders) && j.orders.some((o) => o.id === orderId), `total=${j.orders.length}`);

  // 10. 404 handler
  r = await fetch(BASE + '/api/nope');
  log('unknown api route -> 404 json', r.status === 404);

  const failed = steps.filter((s) => !s.ok).length;
  console.log(`\nLIVE API: ${steps.length - failed}/${steps.length} passed`);
  process.exit(failed ? 1 : 0);
})();
