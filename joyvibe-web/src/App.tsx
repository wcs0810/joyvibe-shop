import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ScrollToTop } from '@/components/ScrollToTop';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { CartProvider } from '@/store/CartContext';
import { ToastProvider } from '@/store/ToastContext';
import { AuthProvider } from '@/store/AuthContext';
import { OrderProvider } from '@/store/OrderContext';
import { NotificationProvider } from '@/store/NotificationContext';
import { WishlistProvider } from '@/store/WishlistContext';

const HomePage = lazy(() => import('@/pages/HomePage'));
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const AccountPage = lazy(() => import('@/pages/AccountPage'));
const CampaignPage = lazy(() => import('@/pages/CampaignPage'));
const LivePage = lazy(() => import('@/pages/LivePage'));
const StorePage = lazy(() => import('@/pages/StorePage'));
const OrderTrackPage = lazy(() => import('@/pages/OrderTrackPage'));
const ServicePage = lazy(() => import('@/pages/ServicePage'));

function PageSkeleton() {
  return (
    <div className="container-app py-10 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="container-app py-24 text-center">
      <h1 className="text-6xl font-bold text-ink-900 mb-4">404</h1>
      <p className="text-ink-500 text-lg mb-8">抱歉，您访问的页面不存在。</p>
      <Button onClick={() => navigate('/')}>返回首页</Button>
    </div>
  );
}

export default function App() {
  // Preload key routes after first paint for faster navigation
  useEffect(() => {
    const t = setTimeout(() => {
      const preloads = [
        import('@/pages/CategoriesPage'),
        import('@/pages/ProductDetailPage'),
        import('@/pages/CartPage'),
        import('@/pages/AccountPage'),
      ];
      Promise.all(preloads).catch(() => { /* ignore */ });
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <WishlistProvider>
            <CartProvider>
              <ToastProvider>
                <OrderProvider>
                  <ScrollToTop />
                  <Suspense fallback={<PageSkeleton />}>
                    <Routes>
                      <Route element={<Layout />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/categories" element={<CategoriesPage />} />
                        <Route path="/products/:id" element={<ProductDetailPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/account" element={<AccountPage />} />
                        <Route path="/campaign" element={<CampaignPage />} />
                        <Route path="/live" element={<LivePage />} />
                        <Route path="/store/:id" element={<StorePage />} />
                        <Route path="/order/:id/track" element={<OrderTrackPage />} />
                        <Route path="/service" element={<ServicePage />} />
                        <Route path="/404" element={<NotFoundPage />} />
                        <Route path="*" element={<Navigate to="/404" replace />} />
                      </Route>
                    </Routes>
                  </Suspense>
                </OrderProvider>
              </ToastProvider>
            </CartProvider>
          </WishlistProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
