/**
 * Canonical JoyVibe Express application factory.
 * Single source of truth used by:
 *   - joyvibe-api/server.js        (long-running Node, local / Render)
 *   - netlify/functions/api.cjs    (serverless wrapper on Netlify)
 */
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { createPersistence } = require('./store.cjs');

function createApp(options = {}) {
  const {
    dataDir,
    jwtSecret = process.env.JWT_SECRET || 'joyvibe-dev-secret-key-change-in-production',
    corsOrigins = [],
  } = options;

  const persistence = createPersistence(dataDir);
  const { loadStore, saveStore } = persistence;

  const app = express();

  // ---------- Security headers ----------
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });

  // ---------- CORS ----------
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    ...corsOrigins,
    // Netlify Functions expose the site URL as process.env.URL — same-origin
    // POST/PATCH requests still carry an Origin header and must be allowed.
    ...(process.env.URL ? [process.env.URL, process.env.URL.replace(/^http:/, 'https:')] : []),
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()) : []),
  ];
  app.use(cors({
    origin(origin, cb) {
      // Same-origin (no Origin header, e.g. curl) or explicitly allowed host
      if (!origin) return cb(null, true);
      // Normalize trailing slash
      const normalized = origin.replace(/\/$/, '');
      if (allowedOrigins.map((o) => o.replace(/\/$/, '')).includes(normalized)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
  }));

  app.use(express.json({ limit: '1mb' }));

  // ---------- Request logger ----------
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      const line = `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`;
      if (res.statusCode >= 500) console.error(line);
      else console.log(line);
    });
    next();
  });

  // ---------- Data ----------
  const users = [
    { id: 'u001', username: '李同学', password: '123456', phone: '133****5831', avatar: '李', createdAt: '2026-09-01T10:00:00Z' },
    { id: 'u002', username: 'demo', password: 'demo123', phone: '138****0000', avatar: 'D', createdAt: '2026-09-10T10:00:00Z' },
  ];

  const carts = loadStore('carts');
  const orders = loadStore('orders');

  function sanitizeCartItems(rawItems) {
    if (!Array.isArray(rawItems)) return { ok: false, error: 'items 必须是数组' };
    const cleaned = [];
    for (const it of rawItems) {
      if (!it || typeof it.productId !== 'string' || !it.productId) {
        return { ok: false, error: 'productId 必须是非空字符串' };
      }
      const qty = Number(it.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
        return { ok: false, error: 'quantity 必须是 1-99 的整数' };
      }
      cleaned.push({ productId: it.productId, quantity: qty });
    }
    if (cleaned.length > 200) return { ok: false, error: '单次最多同步 200 种商品' };
    return { ok: true, items: cleaned };
  }

  function signToken(user) {
    return jwt.sign({ sub: user.id, username: user.username }, jwtSecret, { expiresIn: '7d' });
  }

  function authRequired(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: '未登录' });
    try {
      const payload = jwt.verify(token, jwtSecret);
      req.userId = payload.sub;
      req.username = payload.username;
      next();
    } catch {
      return res.status(401).json({ error: 'token 无效或已过期' });
    }
  }

  // ---------- Auth ----------
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });
    if (typeof username !== 'string' || typeof password !== 'string' || username.length > 50 || password.length > 100) {
      return res.status(400).json({ error: '用户名或密码格式不正确' });
    }
    const user = users.find((u) => u.username === username && u.password === password);
    if (!user) return res.status(401).json({ error: '用户名或密码错误' });
    const token = signToken(user);
    res.json({
      token,
      user: { id: user.id, username: user.username, phone: user.phone, avatar: user.avatar },
    });
  });

  app.get('/api/auth/me', authRequired, (req, res) => {
    const user = users.find((u) => u.id === req.userId);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json({ id: user.id, username: user.username, phone: user.phone, avatar: user.avatar });
  });

  app.post('/api/auth/logout', authRequired, (_req, res) => res.json({ ok: true }));

  // ---------- Cart ----------
  app.get('/api/cart', authRequired, (req, res) => {
    res.json({ items: carts.get(req.userId) || [] });
  });

  app.post('/api/cart/sync', authRequired, (req, res) => {
    const result = sanitizeCartItems((req.body || {}).items);
    if (!result.ok) return res.status(400).json({ error: result.error });
    carts.set(req.userId, result.items);
    saveStore('carts', carts);
    res.json({ ok: true, count: result.items.length });
  });

  app.post('/api/cart/add', authRequired, (req, res) => {
    const { productId } = req.body || {};
    let { quantity = 1 } = req.body || {};
    if (!productId || typeof productId !== 'string') return res.status(400).json({ error: 'productId 不能为空' });
    quantity = Number(quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return res.status(400).json({ error: 'quantity 必须是 1-99 的整数' });
    }
    const items = carts.get(req.userId) || [];
    const existing = items.find((i) => i.productId === productId);
    if (existing) existing.quantity = Math.min(99, existing.quantity + quantity);
    else items.push({ productId, quantity });
    carts.set(req.userId, items);
    saveStore('carts', carts);
    res.json({ ok: true, items });
  });

  // ---------- Orders ----------
  app.get('/api/orders', authRequired, (req, res) => {
    const userOrders = orders.get(req.userId) || [];
    const sorted = [...userOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ orders: sorted });
  });

  app.post('/api/orders', authRequired, (req, res) => {
    const { items, total, shipping = 0, discount = 0, address, paymentMethod } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: '商品列表不能为空' });
    for (const it of items) {
      const productId = it && (it.product?.id || it.productId);
      if (!productId || typeof productId !== 'string') {
        return res.status(400).json({ error: '订单商品数据不完整' });
      }
      const qty = Number(it.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
        return res.status(400).json({ error: '商品数量必须是 1-99 的整数' });
      }
    }
    if (total !== undefined && (typeof total !== 'number' || !Number.isFinite(total) || total < 0)) {
      return res.status(400).json({ error: '订单金额不合法' });
    }
    if (address && typeof address !== 'object') {
      return res.status(400).json({ error: '收货地址格式不正确' });
    }
    const order = {
      id: `JV${Date.now()}${Math.floor(Math.random() * 1000)}`,
      userId: req.userId,
      items,
      address: address || null,
      paymentMethod: typeof paymentMethod === 'string' && paymentMethod.length <= 30 ? paymentMethod : '微信支付',
      total,
      shipping: Number.isFinite(Number(shipping)) ? Number(shipping) : 0,
      discount: Number.isFinite(Number(discount)) ? Number(discount) : 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const userOrders = orders.get(req.userId) || [];
    userOrders.push(order);
    orders.set(req.userId, userOrders);
    saveStore('orders', orders);
    carts.set(req.userId, []);
    saveStore('carts', carts);
    res.status(201).json({ order });
  });

  app.patch('/api/orders/:id/status', authRequired, (req, res) => {
    const { id } = req.params;
    const { status } = req.body || {};
    const userOrders = orders.get(req.userId) || [];
    const order = userOrders.find((o) => o.id === id);
    if (!order) return res.status(404).json({ error: '订单不存在' });
    if (order.userId !== req.userId) return res.status(403).json({ error: '无权修改' });
    const validStatus = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (status && validStatus.includes(status)) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
      saveStore('orders', orders);
    }
    res.json({ order });
  });

  // ---------- Health ----------
  app.get('/', (_req, res) => {
    res.json({ service: 'JoyVibe API', status: 'ok', docs: '/api/health' });
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      pid: process.pid,
      memory: {
        rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
      stores: { users: users.length, carts: carts.size, orders: orders.size },
    });
  });

  app.use('/api', (_req, res) => res.status(404).json({ error: '接口不存在' }));

  app.use((err, req, res, _next) => {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ error: '请求体不是合法的 JSON' });
    }
    if (err && err.message === 'Not allowed by CORS') {
      return res.status(403).json({ error: '跨域请求被拒绝' });
    }
    console.error(`[error] ${req.method} ${req.originalUrl}:`, err);
    res.status(500).json({ error: '服务器内部错误' });
  });

  return { app, carts, orders, persistence };
}

module.exports = { createApp };
