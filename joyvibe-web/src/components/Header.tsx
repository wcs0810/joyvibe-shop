import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Menu, X, LogIn, TrendingUp, History, X as XIcon, Bell } from 'lucide-react';
import { useCart } from '@/store/CartContext';
import { useAuth } from '@/store/AuthContext';
import { useNotification } from '@/store/NotificationContext';
import { products } from '@/data/products';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: '首页', end: true },
  { to: '/categories', label: '分类' },
  { to: '/campaign', label: '活动' },
  { to: '/live', label: '直播' },
  { to: '/service', label: '客服' },
];

const HOT_SEARCHES = ['降噪耳机', '智能手表', '4K显示器', '咖啡套装', '香薰蜡烛', '连衣裙'];
const HISTORY_KEY = 'jy_search_history';
const MAX_HISTORY = 8;

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: string[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch { /* ignore */ }
}

function addToHistory(history: string[], q: string): string[] {
  const clean = q.trim();
  if (!clean) return history;
  const filtered = history.filter((h) => h !== clean);
  return [clean, ...filtered].slice(0, MAX_HISTORY);
}

export function Header() {
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { isAuthenticated, user, login } = useAuth();
  const { unreadCount, notifications, showPanel: showNotifPanel, setShowPanel: setShowNotifPanel, markAsRead, markAllRead } = useNotification();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // Search autocomplete state
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestIndex, setSuggestIndex] = useState(-1);
  const [history, setHistory] = useState<string[]>(() => loadHistory());
  const [debouncedValue, setDebouncedValue] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedValue(searchValue), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchValue]);

  // Filter suggestions
  const suggestions = useCallback(() => {
    const q = debouncedValue.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
      .slice(0, 6);
  }, [debouncedValue]);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggest(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard navigation on input
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggest) return;
    const total = suggestions().length + (searchValue.trim() ? 0 : history.length + HOT_SEARCHES.length);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSuggestIndex((i) => Math.min(i + 1, total - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSuggestIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setShowSuggest(false);
      setSuggestIndex(-1);
    }
  };

  const doSearch = (q: string) => {
    const clean = q.trim();
    if (!clean) return;
    setSearchValue(clean);
    setHistory((h) => addToHistory(h, clean));
    saveHistory(addToHistory(history, clean));
    setShowSuggest(false);
    setSuggestIndex(-1);
    navigate(`/categories?q=${encodeURIComponent(clean)}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(searchValue);
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.username.trim() || !loginForm.password.trim()) return;
    setLoginLoading(true);
    const ok = await login(loginForm.username, loginForm.password);
    setLoginLoading(false);
    if (ok) {
      setShowLoginModal(false);
      setLoginForm({ username: '', password: '' });
    }
  };

  const hasQuery = searchValue.trim().length > 0;
  const matchedProducts = hasQuery ? suggestions() : [];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-ink-100">
        <div className="container-app flex items-center gap-6 h-16">
          <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="悦界首页">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-lg">
              悦
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block">悦界 JoyVibe</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="主导航">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive ? 'text-brand-600 bg-brand-50' : 'text-ink-600 hover:text-ink-900 hover:bg-ink-50',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Search with autocomplete */}
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-md ml-auto relative">
            <div className="relative w-full">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
              <input
                type="search"
                placeholder="搜索商品..."
                value={searchValue}
                onChange={(e) => { setSearchValue(e.target.value); setShowSuggest(true); setSuggestIndex(-1); }}
                onFocus={() => setShowSuggest(true)}
                onKeyDown={handleSearchKeyDown}
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-ink-200 bg-ink-50 text-sm focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
                aria-label="搜索"
                aria-expanded={showSuggest}
                aria-controls="search-suggestions"
              />
            </div>

            {/* Suggestion Panel */}
            {showSuggest && (
              <div
                id="search-suggestions"
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-elevation border border-ink-100 overflow-hidden z-50 animate-fade-in max-h-[480px] overflow-y-auto"
                role="listbox"
              >
                {hasQuery && matchedProducts.length > 0 ? (
                  // Product matches
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-medium text-ink-400 uppercase tracking-wider">商品</div>
                    {matchedProducts.map((p, i) => (
                      <button
                        key={p.id}
                        type="button"
                        role="option"
                        aria-selected={suggestIndex === i}
                        onClick={() => doSearch(p.name)}
                        onMouseEnter={() => setSuggestIndex(i)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                          suggestIndex === i ? 'bg-brand-50' : 'hover:bg-ink-50',
                        )}
                      >
                        <span className="text-2xl shrink-0">{p.image}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-ink-900 truncate">{highlightMatch(p.name, searchValue)}</div>
                          <div className="text-xs text-ink-500 tabular-nums">{p.category} · {matchedProducts[0] === p ? '¥' : ''}{p.price}</div>
                        </div>
                        {p.tags?.[0] && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 font-medium">{p.tags[0]}</span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : hasQuery ? (
                  // No matches
                  <div className="p-6 text-center text-sm text-ink-500">
                    未找到与 "{searchValue}" 相关的商品
                    <button type="button" onClick={() => doSearch(searchValue)} className="ml-2 text-brand-600 hover:underline">
                      仍然搜索
                    </button>
                  </div>
                ) : (
                  // Hot searches + History
                  <div className="p-3 space-y-4">
                    {history.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
                            <History size={12} /> 搜索历史
                          </span>
                          <button type="button" onClick={clearHistory} className="text-xs text-ink-400 hover:text-red-500 flex items-center gap-0.5">
                            <XIcon size={10} /> 清空
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {history.map((h) => (
                            <button
                              key={h}
                              type="button"
                              onClick={() => doSearch(h)}
                              className="px-2.5 py-1 text-xs rounded-full bg-ink-100 text-ink-600 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                            >
                              {h}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-ink-500">
                        <TrendingUp size={12} /> 热门搜索
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {HOT_SEARCHES.map((h, i) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => doSearch(h)}
                            className="px-2.5 py-1 text-xs rounded-full transition-colors"
                            style={{
                              backgroundColor: i < 3 ? 'rgba(255,107,71,0.08)' : undefined,
                              color: i < 3 ? '#FF6B47' : undefined,
                            }}
                          >
                            <span className="font-bold mr-1">{i + 1}</span>
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isAuthenticated && user ? (
              <Link
                to="/account"
                className="flex items-center gap-2 px-2 h-10 rounded-lg text-ink-600 hover:text-ink-900 hover:bg-ink-50 transition-colors"
                aria-label={`${user.username} 的账户`}
              >
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-sm font-bold">
                  {user.avatar}
                </span>
                <span className="hidden sm:block text-sm font-medium max-w-[80px] truncate">{user.username}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 px-3 h-10 rounded-lg text-sm font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 transition-colors"
              >
                <LogIn size={18} />
                <span>登录</span>
                <span className="hidden sm:inline text-ink-400 font-normal">/ 注册</span>
              </button>
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifPanel(!showNotifPanel)}
                className="relative w-10 h-10 flex items-center justify-center rounded-lg text-ink-600 hover:text-ink-900 hover:bg-ink-50 transition-colors"
                aria-label={`消息通知，${unreadCount}条未读`}
                aria-expanded={showNotifPanel}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifPanel && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifPanel(false)} aria-hidden="true" />
                  <div className="absolute right-0 top-full mt-2 w-[380px] bg-white rounded-xl shadow-elevation border border-ink-100 z-50 overflow-hidden animate-fade-in">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
                      <span className="font-semibold text-ink-900">消息通知</span>
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-xs text-brand-600 hover:underline font-medium disabled:text-ink-300"
                        disabled={unreadCount === 0}
                      >
                        全部已读
                      </button>
                    </div>
                    <div className="max-h-[420px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-4xl mb-3">📭</div>
                          <p className="text-ink-500 text-sm">暂无通知</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => { markAsRead(n.id); setShowNotifPanel(false); }}
                            className={cn(
                              'w-full text-left px-4 py-3 border-b border-ink-50 last:border-0 hover:bg-ink-50 transition-colors',
                              !n.read && 'bg-brand-50/40',
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <span className={cn(
                                'shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm',
                                n.type === 'promotion' && 'bg-brand-500',
                                n.type === 'system' && 'bg-blue-500',
                                n.type === 'order' && 'bg-green-500',
                                n.type === 'info' && 'bg-ink-400',
                              )}>
                                {n.type === 'promotion' ? '🎉' : n.type === 'system' ? '⚙️' : n.type === 'order' ? '📦' : 'ℹ️'}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-ink-900 text-sm truncate">{n.title}</span>
                                  {!n.read && <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />}
                                </div>
                                <p className="text-ink-500 text-xs mt-0.5 line-clamp-2">{n.message}</p>
                                <span className="text-ink-400 text-[11px] mt-1 block">
                                  {new Date(n.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <Link
              to="/cart"
              id="header-cart-icon"
              className="relative w-10 h-10 flex items-center justify-center rounded-lg text-ink-600 hover:text-ink-900 hover:bg-ink-50 transition-colors"
              aria-label={`购物车，${totalItems}件商品`}
            >
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span
                  className="cart-badge absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                  aria-hidden="true"
                >
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>
            <button
              type="button"
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg text-ink-600 hover:text-ink-900 hover:bg-ink-50 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-ink-100 bg-white animate-fade-in">
            <nav className="container-app py-4 flex flex-col gap-1" aria-label="移动端导航">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                      isActive ? 'text-brand-600 bg-brand-50' : 'text-ink-600 hover:text-ink-900 hover:bg-ink-50',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              {isAuthenticated && (
                <Link
                  to="/account"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm font-medium text-ink-600 hover:text-ink-900 hover:bg-ink-50 flex items-center gap-2"
                >
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
                    {user?.avatar}
                  </span>
                  {user?.username} · 我的账户
                </Link>
              )}
              <form onSubmit={handleSearch} className="mt-3">
                <input
                  type="search"
                  placeholder="搜索商品..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-full h-10 px-4 rounded-lg border border-ink-200 bg-ink-50 text-sm focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              </form>
            </nav>
          </div>
        )}
      </header>

      {/* Login Modal */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="登录"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowLoginModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-elevation w-full max-w-md overflow-hidden animate-fade-in">
            <button
              type="button"
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 z-10"
              aria-label="关闭"
            >
              <X size={18} />
            </button>

            <div className="bg-gradient-to-br from-brand-500 to-brand-600 px-8 py-10 text-white text-center">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3">
                悦
              </div>
              <h2 className="text-2xl font-bold">欢迎来到悦界</h2>
              <p className="text-white/80 text-sm mt-1">登录后享受会员专属福利</p>
            </div>

            <form onSubmit={handleLogin} className="p-8 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink-700">用户名 / 手机号</label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm((p) => ({ ...p, username: e.target.value }))}
                  placeholder="输入用户名"
                  className="h-11 w-full rounded-lg border border-ink-200 px-4 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  autoComplete="username"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink-700">密码</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="输入密码"
                  className="h-11 w-full rounded-lg border border-ink-200 px-4 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  autoComplete="current-password"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-ink-500 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-brand-500 rounded" defaultChecked />
                  记住我
                </label>
                <a href="#" className="text-brand-600 hover:underline">忘记密码？</a>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full h-11 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                    登录中...
                  </>
                ) : (
                  '登录'
                )}
              </button>

              <p className="text-center text-sm text-ink-500">
                还没有账号？
                <button type="button" className="text-brand-600 font-medium ml-1 hover:underline">立即注册</button>
              </p>

              <div className="text-center text-xs text-ink-400 pt-2 border-t border-ink-100">
                演示模式：任意用户名和密码即可登录
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function highlightMatch(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-100 text-brand-700 font-medium rounded px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}
