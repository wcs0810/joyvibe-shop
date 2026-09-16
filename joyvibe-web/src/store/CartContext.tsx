import { createContext, useContext, useReducer, useCallback, useMemo, useEffect, useRef, type ReactNode } from 'react';
import type { CartItem, Product } from '@/types';
import { apiCart, type CartItemDto } from '@/lib/api';
import { getAuthToken } from '@/store/AuthContext';
import { products as productCatalog } from '@/data/products';

interface CartState {
  items: CartItem[];
  syncing: boolean;
}

type CartAction =
  | { type: 'INIT'; items: CartItem[] }
  | { type: 'ADD'; product: Product; quantity?: number }
  | { type: 'REMOVE'; productId: string }
  | { type: 'UPDATE'; productId: string; quantity: number }
  | { type: 'TOGGLE_SAVE'; productId: string }
  | { type: 'CLEAR' }
  | { type: 'SET_SYNCING'; value: boolean };

const initialState: CartState = { items: [], syncing: false };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'INIT':
      return { ...state, items: action.items };
    case 'ADD': {
      const quantity = action.quantity ?? 1;
      const existing = state.items.find((i) => i.product.id === action.product.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.product.id === action.product.id
              ? { ...i, quantity: i.quantity + quantity }
              : i,
          ),
        };
      }
      return { ...state, items: [...state.items, { product: action.product, quantity }] };
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter((i) => i.product.id !== action.productId) };
    case 'UPDATE':
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.product.id !== action.productId) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.product.id === action.productId ? { ...i, quantity: action.quantity } : i,
        ),
      };
    case 'TOGGLE_SAVE':
      return {
        ...state,
        items: state.items.map((i) =>
          i.product.id === action.productId ? { ...i, saved: !i.saved } : i,
        ),
      };
    case 'CLEAR':
      return { ...state, items: [] };
    case 'SET_SYNCING':
      return { ...state, syncing: action.value };
    default:
      return state;
  }
}

const CART_STORAGE_KEY = 'jy_cart';

function loadLocalCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CartItem[];
  } catch { /* ignore */ }
  return [];
}

function saveLocalCart(items: CartItem[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch { /* ignore */ }
}

function dtoToCartItem(dto: CartItemDto): CartItem | null {
  const product = productCatalog.find((p) => p.id === dto.productId);
  if (!product) return null;
  return { product, quantity: dto.quantity };
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleSave: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load cart on mount: try backend first, fallback to localStorage
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      apiCart.get(token).then((res) => {
        if (res.ok && res.data) {
          const remoteItems = res.data.items
            .map(dtoToCartItem)
            .filter((i): i is CartItem => i !== null);
          if (remoteItems.length > 0) {
            dispatch({ type: 'INIT', items: remoteItems });
            saveLocalCart(remoteItems);
            return;
          }
        }
        // Backend empty or failed — use local
        const local = loadLocalCart();
        if (local.length > 0) dispatch({ type: 'INIT', items: local });
      }).catch(() => {
        const local = loadLocalCart();
        if (local.length > 0) dispatch({ type: 'INIT', items: local });
      });
    } else {
      const local = loadLocalCart();
      if (local.length > 0) dispatch({ type: 'INIT', items: local });
    }
  }, []);

  // Debounced sync to backend + localStorage
  useEffect(() => {
    if (state.items.length === 0) {
      saveLocalCart([]);
      return;
    }
    saveLocalCart(state.items);

    const token = getAuthToken();
    if (!token) return; // No need to sync to backend if not logged in

    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      const dtos: CartItemDto[] = state.items.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
      }));
      apiCart.sync(token, dtos).catch(() => { /* ignore */ });
    }, 500);

    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [state.items]);

  const addItem = useCallback(
    (product: Product, quantity?: number) => dispatch({ type: 'ADD', product, quantity }),
    [],
  );
  const removeItem = useCallback(
    (productId: string) => dispatch({ type: 'REMOVE', productId }),
    [],
  );
  const updateQuantity = useCallback(
    (productId: string, quantity: number) =>
      dispatch({ type: 'UPDATE', productId, quantity }),
    [],
  );
  const toggleSave = useCallback(
    (productId: string) => dispatch({ type: 'TOGGLE_SAVE', productId }),
    [],
  );
  const clear = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  const value = useMemo<CartContextValue>(() => {
    const activeItems = state.items.filter((i) => !i.saved);
    const totalItems = activeItems.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = activeItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    return { items: state.items, totalItems, totalPrice, addItem, removeItem, updateQuantity, toggleSave, clear };
  }, [state.items, addItem, removeItem, updateQuantity, toggleSave, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
