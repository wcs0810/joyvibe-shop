import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

export interface Notification {
  id: string;
  type: 'order' | 'promotion' | 'system' | 'info';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  actionUrl?: string;
}

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  showPanel: boolean;
  setShowPanel: (v: boolean) => void;
  add: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);
const STORAGE_KEY = 'jy_notifications';

// Seed with some demo notifications on first visit
function loadInitial(): Notification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Notification[];
  } catch { /* ignore */ }
  return [
    {
      id: 'n1',
      type: 'promotion',
      title: '限时特惠',
      message: '全场蓝牙耳机立减 ¥100，活动仅剩 2 天！',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      read: false,
      actionUrl: '/campaign',
    },
    {
      id: 'n2',
      type: 'system',
      title: '欢迎来到悦界',
      message: '注册即享新人 ¥50 优惠券，快去个人中心领取吧！',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      read: false,
    },
    {
      id: 'n3',
      type: 'info',
      title: '物流公告',
      message: '国庆期间部分地区发货延迟，预计 10 月 8 日恢复正常。',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      read: true,
    },
  ];
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(() => loadInitial());
  const [showPanel, setShowPanel] = useState(false);

  // Persist to localStorage
  const save = useCallback((list: Notification[]) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  }, []);

  const add = useCallback<NotificationContextValue['add']>((n) => {
    const newItem: Notification = {
      ...n,
      id: 'n' + Date.now() + Math.random().toString(36).slice(2, 7),
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => {
      const next = [newItem, ...prev].slice(0, 50);
      save(next);
      return next;
    });
  }, [save]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => n.id === id ? { ...n, read: true } : n);
      save(next);
      return next;
    });
  }, [save]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      save(next);
      return next;
    });
  }, [save]);

  const clear = useCallback(() => {
    setNotifications([]);
    save([]);
  }, [save]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = useMemo<NotificationContextValue>(
    () => ({ notifications, unreadCount, showPanel, setShowPanel, add, markAsRead, markAllRead, clear }),
    [notifications, unreadCount, showPanel, add, markAsRead, markAllRead, clear],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotification(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
