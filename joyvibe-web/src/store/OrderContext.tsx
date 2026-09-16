import { createContext, useContext, useReducer, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import type { CartItem, Product } from '@/types';
import { apiOrders } from '@/lib/api';
import { getAuthToken } from '@/store/AuthContext';
import { products as productCatalog } from '@/data/products';

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderAddress {
  name: string;
  phone: string;
  region: string;
  detail: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  address: OrderAddress;
  paymentMethod: string;
  total: number;
  shipping: number;
  discount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

interface OrderState {
  orders: Order[];
  loaded: boolean;
}

type OrderAction =
  | { type: 'SET_LOADED' }
  | { type: 'INIT'; orders: Order[] }
  | { type: 'ADD'; order: Order }
  | { type: 'UPDATE_STATUS'; id: string; status: OrderStatus };

const STORAGE_KEY = 'jy_orders';

function loadLocalOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Order[];
  } catch { /* ignore */ }
  return [];
}

function saveLocalOrders(orders: Order[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)); } catch { /* ignore */ }
}

function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case 'SET_LOADED': return { ...state, loaded: true };
    case 'INIT': return { orders: action.orders, loaded: true };
    case 'ADD': return { orders: [action.order, ...state.orders], loaded: true };
    case 'UPDATE_STATUS':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.id ? { ...o, status: action.status, updatedAt: new Date().toISOString() } : o,
        ),
      };
    default: return state;
  }
}

interface OrderContextValue {
  orders: Order[];
  loaded: boolean;
  createOrder: (params: {
    items: CartItem[];
    address: OrderAddress;
    paymentMethod: string;
    shipping: number;
    discount: number;
  }) => Promise<Order>;
  updateStatus: (id: string, status: OrderStatus) => Promise<void>;
  getById: (id: string) => Order | undefined;
  refresh: () => Promise<void>;
}

const OrderContext = createContext<OrderContextValue | null>(null);

// Convert backend order item DTO to CartItem (lookup product from catalog)
function backendToOrder(backendOrder: any): Order {
  const items: CartItem[] = (backendOrder.items || [])
    .map((dto: any): CartItem | null => {
      if (dto.productId) {
        const product = productCatalog.find((p) => p.id === dto.productId);
        if (product) return { product, quantity: dto.quantity || 1 };
      }
      if (dto.product) {
        return { product: dto.product, quantity: dto.quantity || 1 };
      }
      return null;
    })
    .filter((i: CartItem | null): i is CartItem => i !== null);

  return {
    id: backendOrder.id,
    items,
    address: backendOrder.address || { name: '', phone: '', region: '', detail: '' },
    paymentMethod: backendOrder.paymentMethod || '微信支付',
    total: backendOrder.total || 0,
    shipping: backendOrder.shipping || 0,
    discount: backendOrder.discount || 0,
    status: (backendOrder.status || 'pending') as OrderStatus,
    createdAt: backendOrder.createdAt,
    updatedAt: backendOrder.updatedAt || backendOrder.createdAt,
  };
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(orderReducer, { orders: [], loaded: false });

  const refresh = useCallback(async () => {
    const token = getAuthToken();
    if (token) {
      const res = await apiOrders.list(token);
      if (res.ok && res.data) {
        const orders = res.data.orders.map(backendToOrder);
        dispatch({ type: 'INIT', orders });
        saveLocalOrders(orders);
        return;
      }
    }
    // Fallback: local storage
    dispatch({ type: 'INIT', orders: loadLocalOrders() });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createOrder = useCallback<OrderContextValue['createOrder']>(async (params) => {
    const total = params.items.reduce((s, i) => s + i.product.price * i.quantity, 0);
    const backendItems = params.items.map((i) => ({
      productId: i.product.id,
      quantity: i.quantity,
      price: i.product.price,
      name: i.product.name,
    }));

    const token = getAuthToken();
    if (token) {
      const res = await apiOrders.create(token, {
        items: backendItems,
        total: total + params.shipping - params.discount,
        shipping: params.shipping,
        discount: params.discount,
        address: params.address,
        paymentMethod: params.paymentMethod,
      });
      if (res.ok && res.data) {
        const order = backendToOrder(res.data.order);
        dispatch({ type: 'ADD', order });
        saveLocalOrders([order, ...state.orders]);
        return order;
      }
    }

    // Fallback: local
    const order: Order = {
      id: `JV${Date.now()}${Math.floor(Math.random() * 1000)}`,
      items: params.items,
      address: params.address,
      paymentMethod: params.paymentMethod,
      total: total + params.shipping - params.discount,
      shipping: params.shipping,
      discount: params.discount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD', order });
    saveLocalOrders([order, ...state.orders]);
    return order;
  }, [state.orders]);

  const updateStatus = useCallback<OrderContextValue['updateStatus']>(async (id, status) => {
    const token = getAuthToken();
    if (token) {
      await apiOrders.updateStatus(token, id, status);
    }
    dispatch({ type: 'UPDATE_STATUS', id, status });
    saveLocalOrders(state.orders.map((o) =>
      o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o,
    ));
  }, [state.orders]);

  const getById = useCallback<OrderContextValue['getById']>((id) => {
    return state.orders.find((o) => o.id === id);
  }, [state.orders]);

  const value = useMemo<OrderContextValue>(
    () => ({ orders: state.orders, loaded: state.loaded, createOrder, updateStatus, getById, refresh }),
    [state.orders, state.loaded, createOrder, updateStatus, getById, refresh],
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder(): OrderContextValue {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrder must be used within OrderProvider');
  return ctx;
}

// Helper to track recently viewed products
const RECENT_VIEW_KEY = 'jy_recent_view';
const MAX_RECENT = 10;

export function trackRecentlyViewed(product: Product) {
  try {
    const raw = localStorage.getItem(RECENT_VIEW_KEY);
    const list: Product[] = raw ? (JSON.parse(raw) as Product[]) : [];
    const filtered = list.filter((p) => p.id !== product.id);
    const next = [product, ...filtered].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_VIEW_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
}

export function getRecentlyViewed(): Product[] {
  try {
    const raw = localStorage.getItem(RECENT_VIEW_KEY);
    if (raw) return JSON.parse(raw) as Product[];
  } catch { /* ignore */ }
  return [];
}
