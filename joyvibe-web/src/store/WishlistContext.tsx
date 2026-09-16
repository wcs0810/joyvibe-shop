import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import type { Product } from '@/types';
import { products as productCatalog } from '@/data/products';

const WISHLIST_KEY = 'jy_wishlist';

interface WishlistContextValue {
  ids: string[];
  products: Product[];
  has: (id: string) => boolean;
  toggle: (product: Product) => void;
  add: (product: Product) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

function loadIds(): string[] {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveIds(ids: string[]) {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
  } catch { /* ignore */ }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(() => loadIds());

  useEffect(() => {
    saveIds(ids);
  }, [ids]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const add = useCallback((product: Product) => {
    setIds((prev) => (prev.includes(product.id) ? prev : [...prev, product.id]));
  }, []);

  const remove = useCallback((id: string) => {
    setIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const toggle = useCallback((product: Product) => {
    setIds((prev) => (prev.includes(product.id)
      ? prev.filter((x) => x !== product.id)
      : [...prev, product.id]));
  }, []);

  const clear = useCallback(() => setIds([]), []);

  const products = useMemo(
    () => ids.map((id) => productCatalog.find((p) => p.id === id)).filter((p): p is Product => !!p),
    [ids],
  );

  const value: WishlistContextValue = { ids, products, has, toggle, add, remove, clear };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
