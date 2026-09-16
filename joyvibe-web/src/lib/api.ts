/**
 * API client with localStorage fallback for offline/demo mode.
 * Base URL can be overridden via VITE_API_BASE env var.
 */

/**
 * Production: same origin (Netlify Function proxied at /api/*), so empty base.
 * Local dev: standalone Express server on :4000.
 * VITE_API_BASE overrides both if set.
 */
export const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ||
  (import.meta.env.PROD ? '' : 'http://localhost:4000');

/** Per-request timeout (ms). Prevents a hung backend from freezing the UI,
 *  which then falls back to localStorage/demo mode. */
const REQUEST_TIMEOUT_MS = 8000;

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  timedOut?: boolean;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, { ...options, headers, signal: controller.signal });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: json.error || `HTTP ${res.status}` };
    }
    return { ok: true, data: json as T };
  } catch (err) {
    // Network error, timeout, or server might be down — caller falls back locally
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { ok: false, error: `请求超时（${REQUEST_TIMEOUT_MS / 1000}s）`, timedOut: true };
    }
    return { ok: false, error: err instanceof Error ? err.message : '网络请求失败' };
  } finally {
    clearTimeout(timer);
  }
}

// ---------- Auth ----------
export const apiAuth = {
  login: (username: string, password: string) =>
    request<{ token: string; user: { id: string; username: string; phone: string; avatar: string } }>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify({ username, password }) },
    ),
  me: (token: string) =>
    request<{ id: string; username: string; phone: string; avatar: string }>(
      '/api/auth/me',
      { method: 'GET' },
      token,
    ),
  logout: (token: string) =>
    request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }, token),
};

// ---------- Cart ----------
export interface CartItemDto { productId: string; quantity: number; }

export const apiCart = {
  get: (token: string) =>
    request<{ items: CartItemDto[] }>('/api/cart', { method: 'GET' }, token),
  sync: (token: string, items: CartItemDto[]) =>
    request<{ ok: boolean; count: number }>(
      '/api/cart/sync',
      { method: 'POST', body: JSON.stringify({ items }) },
      token,
    ),
  add: (token: string, productId: string, quantity: number) =>
    request<{ ok: boolean; items: CartItemDto[] }>(
      '/api/cart/add',
      { method: 'POST', body: JSON.stringify({ productId, quantity }) },
      token,
    ),
};

// ---------- Orders ----------
export const apiOrders = {
  list: (token: string) =>
    request<{ orders: any[] }>('/api/orders', { method: 'GET' }, token),
  create: (token: string, orderData: any) =>
    request<{ order: any }>(
      '/api/orders',
      { method: 'POST', body: JSON.stringify(orderData) },
      token,
    ),
  updateStatus: (token: string, orderId: string, status: string) =>
    request<{ order: any }>(
      `/api/orders/${orderId}/status`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
      token,
    ),
};

// ---------- Health ----------
export const apiHealth = () =>
  request<{ status: string; uptime: number }>('/api/health');
