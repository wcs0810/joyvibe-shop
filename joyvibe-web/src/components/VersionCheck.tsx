/**
 * Client-side update detection.
 *
 * The build emits /version.json (no-cache on CDN). After every deployment the
 * file changes, so an open browser tab learns a new version exists via:
 *   - page becoming visible again (tab switch back)
 *   - network reconnecting
 *   - a low-frequency background poll (5 min)
 * A non-blocking banner lets the user refresh; cart/auth/wishlist all live in
 * localStorage, so a refresh never loses their state.
 */
import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

interface VersionInfo {
  version: string;
  buildTime?: string;
  commit?: string;
}

const POLL_INTERVAL_MS = 5 * 60 * 1000;
const CURRENT_VERSION = __APP_VERSION__;

async function fetchRemoteVersion(): Promise<VersionInfo | null> {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as VersionInfo;
  } catch {
    return null; // offline / serverless cold start — silently retry later
  }
}

export function VersionCheck() {
  const [newVersion, setNewVersion] = useState<VersionInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      // Don't bother the user while a payment/order flow is in progress
      if (location.pathname === '/checkout') return;
      const remote = await fetchRemoteVersion();
      if (cancelled || !remote || !remote.version) return;
      if (remote.version !== CURRENT_VERSION) {
        setNewVersion(remote);
      }
    };

    // Check shortly after first paint, then on visibility/network events
    const initial = setTimeout(check, 8000);
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    const onOnline = () => check();
    const timer = setInterval(check, POLL_INTERVAL_MS);

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);

    return () => {
      cancelled = true;
      clearTimeout(initial);
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  if (!newVersion || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md">
      <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-white px-4 py-3 shadow-elevation">
        <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
          <RefreshCw size={18} className="text-brand-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-ink-900">网站已更新到新版本</div>
          <div className="text-xs text-ink-500 truncate">
            刷新即可体验最新内容{newVersion.buildTime ? ` · 发布于 ${new Date(newVersion.buildTime).toLocaleString('zh-CN')}` : ''}
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="shrink-0 px-3 h-9 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          立即刷新
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 w-8 h-8 flex items-center justify-center text-ink-400 hover:text-ink-600"
          aria-label="稍后提醒"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
