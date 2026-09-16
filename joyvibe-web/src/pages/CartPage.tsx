import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, Heart, Check, AlertCircle, Gift, Truck, Shield, RotateCcw, ChevronLeft, Sparkles, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProductImage } from '@/components/ProductImage';
import { useCart } from '@/store/CartContext';
import { useToast } from '@/store/ToastContext';
import { formatPrice, cn } from '@/lib/utils';
import { products } from '@/data/products';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clear, toggleSave } = useCart();
  const { show } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const activeItems = items.filter((i) => !i.saved);
  const savedItems = items.filter((i) => i.saved);

  // Auto-select all items on first load
  useEffect(() => {
    if (activeItems.length > 0 && selected.size === 0) {
      setSelected(new Set(activeItems.map((i) => i.product.id)));
    }
  }, [activeItems.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const allSelected = activeItems.length > 0 && selected.size === activeItems.length;
  const someSelected = selected.size > 0 && selected.size < activeItems.length;

  const selectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(activeItems.map((i) => i.product.id)));
    }
  };

  const toggleItem = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedItems = items.filter((i) => selected.has(i.product.id));
  const selectedCount = selectedItems.reduce((s, i) => s + i.quantity, 0);
  const selectedTotal = selectedItems.reduce((s, i) => s + i.product.price * i.quantity, 0);

  // Delivery & discount calculations
  const shipping = selectedTotal >= 99 || selectedTotal === 0 ? 0 : 10;
  const thresholdDiscount = selectedTotal >= 300 ? 50 : 0;
  const finalTotal = Math.max(0, selectedTotal + shipping - thresholdDiscount - couponApplied);
  const freeShippingLeft = Math.max(0, 99 - selectedTotal);
  const discountLeft = Math.max(0, 300 - selectedTotal);

  // Recommended products (not in cart)
  const recommended = products.filter((p) => !items.some((i) => i.product.id === p.id)).slice(0, 4);

  const handleQuantityChange = (id: string, delta: number) => {
    const item = items.find((i) => i.product.id === id);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      setConfirmDelete(id);
    } else if (newQty > 99) {
      show('单次购买不超过 99 件', 'info');
    } else {
      updateQuantity(id, newQty);
    }
  };

  const handleRemove = (id: string) => {
    removeItem(id);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setConfirmDelete(null);
    show('已从购物车移除', 'info');
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    const validCodes: Record<string, number> = { 'JOY50': 50, 'NEW15': 15, 'VIP30': 30 };
    const code = couponCode.trim().toUpperCase();
    if (validCodes[code]) {
      setCouponApplied(validCodes[code]);
      setCouponCode('');
      show(`优惠券已抵扣 ${formatPrice(validCodes[code])}`, 'success');
    } else {
      show('优惠券码无效', 'error');
    }
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      show('请选择要结算的商品', 'info');
      return;
    }
    // Save selected items to a temp key so checkout knows which to use
    try {
      const selectedItemsList = items.filter((i) => selected.has(i.product.id));
      localStorage.setItem('jy_checkout_items', JSON.stringify(selectedItemsList));
    } catch { /* ignore */ }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="container-app py-16 text-center">
        <div className="relative inline-block mb-8">
          <div className="text-9xl opacity-80">🛒</div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-brand-500 flex items-center justify-center text-white text-2xl shadow-lg animate-bounce">!</div>
        </div>
        <h1 className="text-3xl font-bold text-ink-900 mb-3">购物车还是空的</h1>
        <p className="text-ink-500 mb-8">快去挑选心仪的商品吧，满 99 元包邮哦～</p>
        <div className="flex gap-3 justify-center">
          <Button size="lg" onClick={() => navigate('/categories')}>去逛逛</Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/')}>返回首页</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app py-8">
      {/* Header breadcrumb + title */}
      <nav aria-label="面包屑" className="flex items-center gap-2 text-sm text-ink-500 mb-4">
        <Link to="/" className="hover:text-brand-600">首页</Link>
        <span>/</span>
        <span className="text-ink-900">购物车</span>
      </nav>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-ink-900 flex items-center gap-3">
          <ShoppingBag className="text-brand-500" size={28} />
          我的购物车
          <span className="text-base font-normal text-ink-400">({activeItems.length} 款商品 · {activeItems.reduce((s, i) => s + i.quantity, 0)} 件)</span>
        </h1>
        <Button variant="ghost" size="sm" onClick={() => { clear(); setSelected(new Set()); show('购物车已清空', 'info'); }}>
          清空购物车
        </Button>
      </div>

      {/* Delivery promise strip */}
      <div className="mb-6 rounded-xl bg-gradient-to-r from-emerald-50 via-white to-brand-50 border border-ink-100 p-4 flex items-center gap-6 text-sm">
        {[
          { icon: Truck, text: '满 99 包邮' },
          { icon: Shield, text: '正品保障' },
          { icon: RotateCcw, text: '7 天无理由' },
          { icon: Gift, text: '专属赠品' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="flex items-center gap-2 text-ink-600">
              <Icon size={18} className="text-emerald-600" />
              {item.text}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Items column */}
        <div className="flex-1 min-w-0">
          {/* Select all bar */}
          <div className="flex items-center justify-between py-3 px-4 mb-3 rounded-xl bg-white border border-ink-100 text-sm">
            <button
              type="button"
              onClick={selectAll}
              className="flex items-center gap-3 text-ink-700 hover:text-brand-600 transition-colors"
              aria-pressed={allSelected}
            >
              <span
                className={cn(
                  'w-5 h-5 rounded flex items-center justify-center border-2 transition-all',
                  allSelected || someSelected
                    ? 'bg-brand-500 border-brand-500'
                    : 'border-ink-300 hover:border-brand-400',
                )}
              >
                {(allSelected || someSelected) && <Check size={12} className="text-white" strokeWidth={3} />}
              </span>
              全选
            </button>
            {selected.size > 0 && (
              <span className="text-ink-500">
                已选 <span className="text-brand-600 font-semibold">{selectedCount}</span> 件
                {selected.size < activeItems.length && (
                  <button
                    type="button"
                    onClick={() => setSelected(new Set())}
                    className="ml-3 text-ink-400 hover:text-brand-600 underline-offset-2 hover:underline"
                  >
                    取消选择
                  </button>
                )}
              </span>
            )}
          </div>

          {/* Item cards */}
          <div className="space-y-3">
            {activeItems.map((item) => {
              const checked = selected.has(item.product.id);
              const originalTotal = item.product.originalPrice ? (item.product.originalPrice * item.quantity).toFixed(2) : null;
              const itemTotal = (item.product.price * item.quantity).toFixed(2);

              return (
                <article
                  key={item.product.id}
                  className={cn(
                    'group relative flex gap-4 p-5 rounded-xl border bg-white transition-all duration-200',
                    checked
                      ? 'border-brand-200 shadow-card ring-1 ring-brand-500/10'
                      : 'border-ink-100 hover:border-ink-200 hover:shadow-card',
                  )}
                >
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleItem(item.product.id)}
                    className="self-center shrink-0"
                    aria-label={checked ? '取消选择' : '选择'}
                    aria-pressed={checked}
                  >
                    <span
                      className={cn(
                        'w-6 h-6 rounded flex items-center justify-center border-2 transition-all',
                        checked ? 'bg-brand-500 border-brand-500' : 'border-ink-300 hover:border-brand-400',
                      )}
                    >
                      {checked && <Check size={14} className="text-white" strokeWidth={3} />}
                    </span>
                  </button>

                  {/* Image */}
                  <Link
                    to={`/products/${item.product.id}`}
                    className="w-28 h-28 shrink-0 rounded-lg overflow-hidden hover:ring-2 hover:ring-brand-300 transition-all duration-300 group-hover:scale-[1.02]"
                    aria-label={`查看 ${item.product.name} 详情`}
                  >
                    <ProductImage
                      imageUrl={item.product.imageUrl}
                      fallback={item.product.image}
                      alt={item.product.name}
                      containerClassName="w-28 h-28"
                    />
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <Link
                      to={`/products/${item.product.id}`}
                      className="font-semibold text-ink-900 hover:text-brand-600 line-clamp-2 leading-snug transition-colors"
                    >
                      {item.product.name}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {item.product.tags?.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant={tag === '热销' ? 'danger' : tag === '新品' ? 'success' : 'gold'}>{tag}</Badge>
                      ))}
                      <span className="text-xs text-ink-500">颜色：钛灰 / 标准版</span>
                    </div>

                    <div className="mt-auto pt-4 flex items-end justify-between gap-4">
                      {/* Price */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-brand-600 tabular-nums">
                          ¥{itemTotal}
                        </span>
                        {originalTotal && (
                          <span className="text-sm text-ink-400 line-through">¥{originalTotal}</span>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-2">
                        {/* Favorite / Save for later */}
                        <button
                          type="button"
                          onClick={() => { toggleSave(item.product.id); show('已移入「稍后购买」', 'info'); }}
                          className="w-10 h-10 flex items-center justify-center rounded-lg text-ink-400 hover:text-brand-500 hover:bg-brand-50 transition-all"
                          aria-label="移到稍后购买"
                          title="移到稍后购买"
                        >
                          <Heart size={18} />
                        </button>

                        {/* Quantity selector */}
                        <div className="inline-flex items-center border border-ink-200 rounded-lg overflow-hidden bg-white">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.product.id, -1)}
                            className="w-10 h-10 flex items-center justify-center hover:bg-ink-50 text-ink-600 transition-colors"
                            aria-label="减少数量"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-12 h-10 flex items-center justify-center text-sm font-semibold border-x border-ink-200 tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.product.id, 1)}
                            className="w-10 h-10 flex items-center justify-center hover:bg-ink-50 text-ink-600 transition-colors"
                            aria-label="增加数量"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        {/* Delete */}
                        {confirmDelete === item.product.id ? (
                          <div className="flex items-center gap-1 bg-red-50 rounded-lg px-2 py-1">
                            <button
                              type="button"
                              onClick={() => handleRemove(item.product.id)}
                              className="px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-100 rounded transition-colors"
                            >
                              确认
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(null)}
                              className="px-3 py-1 text-sm text-ink-600 hover:bg-ink-100 rounded transition-colors"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(item.product.id)}
                            className="w-10 h-10 flex items-center justify-center rounded-lg text-ink-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            aria-label="删除"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Saved for later */}
          {savedItems.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-ink-900 flex items-center gap-2">
                  <Heart size={18} className="text-brand-500" /> 稍后购买
                  <span className="text-ink-400 text-sm font-normal">({savedItems.length})</span>
                </h2>
              </div>
              <div className="space-y-3">
                {savedItems.map((item) => {
                  const itemTotal = (item.product.price * item.quantity).toFixed(2);
                  return (
                    <article
                      key={item.product.id}
                      className="flex gap-4 p-5 rounded-xl border border-ink-100 bg-ink-50/50 opacity-90"
                    >
                      <Link
                        to={`/products/${item.product.id}`}
                        className="w-24 h-24 shrink-0 rounded-lg overflow-hidden"
                      >
                        <ProductImage
                          imageUrl={item.product.imageUrl}
                          fallback={item.product.image}
                          alt={item.product.name}
                          containerClassName="w-24 h-24"
                        />
                      </Link>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <Link to={`/products/${item.product.id}`} className="font-medium text-ink-700 hover:text-brand-600 line-clamp-1">
                          {item.product.name}
                        </Link>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-lg font-bold text-ink-500 tabular-nums">¥{itemTotal}</span>
                          <span className="text-xs text-ink-400">× {item.quantity}</span>
                        </div>
                        <div className="mt-auto flex items-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => { toggleSave(item.product.id); show('已移回购物车', 'success'); }}
                            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                          >
                            移回购物车
                          </button>
                          <button
                            type="button"
                            onClick={() => { removeItem(item.product.id); show('已删除', 'info'); }}
                            className="text-sm text-ink-400 hover:text-red-500"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommended */}
          {recommended.length > 0 && (
            <section className="mt-10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={20} className="text-gold-500" />
                <h2 className="text-lg font-bold text-ink-900">为你推荐</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recommended.map((p) => (
                  <Link
                    key={p.id}
                    to={`/products/${p.id}`}
                    className="rounded-xl border border-ink-100 bg-white p-3 hover:border-brand-200 hover:shadow-md transition-all group"
                  >
                    <div className="aspect-square rounded-lg bg-gradient-to-br from-ink-50 to-ink-100 flex items-center justify-center text-5xl mb-2 group-hover:scale-105 transition-transform duration-300">
                      {p.image}
                    </div>
                    <div className="text-sm font-medium text-ink-900 line-clamp-1 group-hover:text-brand-600 transition-colors">{p.name}</div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-brand-600 font-semibold">{formatPrice(p.price)}</span>
                      {p.originalPrice && <span className="text-xs text-ink-400 line-through">{formatPrice(p.originalPrice)}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Summary sidebar */}
        <aside className="lg:w-80 shrink-0">
          <div className="lg:sticky lg:top-24 space-y-4">
            {/* Coupon */}
            <div className="rounded-xl border border-ink-100 bg-white p-5">
              <div className="flex items-center gap-2 font-semibold text-ink-900 mb-3">
                <Tag size={18} className="text-brand-500" /> 优惠券
              </div>
              {couponApplied > 0 ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div>
                    <div className="text-sm font-medium text-emerald-700">已抵扣 {formatPrice(couponApplied)}</div>
                    <div className="text-xs text-emerald-600 mt-0.5">可叠加使用门槛优惠</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setCouponApplied(0); show('已取消优惠券', 'info'); }}
                    className="text-xs text-emerald-700 hover:underline"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCoupon(); }}
                    placeholder="输入优惠码"
                    maxLength={12}
                    className="flex-1 h-10 px-3 rounded-lg border border-ink-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
                    aria-label="优惠码"
                  />
                  <Button size="sm" onClick={handleApplyCoupon} disabled={!couponCode.trim()}>使用</Button>
                </div>
              )}
              <div className="mt-3 text-xs text-ink-400">
                试试：<span className="text-brand-500 font-medium">JOY50</span> · <span className="text-brand-500 font-medium">NEW15</span> · <span className="text-brand-500 font-medium">VIP30</span>
              </div>
            </div>

            {/* Price summary */}
            <div className="rounded-xl border border-ink-100 bg-white p-5">
              <div className="flex items-center gap-2 font-semibold text-ink-900 mb-4">
                <ShoppingBag size={18} className="text-brand-500" /> 订单摘要
              </div>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-500">商品金额 ({selectedCount} 件)</dt>
                  <dd className="tabular-nums">{formatPrice(selectedTotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-500">运费</dt>
                  <dd className={shipping === 0 ? 'text-emerald-600 font-medium' : ''}>
                    {shipping === 0 ? '包邮' : formatPrice(shipping)}
                  </dd>
                </div>
                {thresholdDiscount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-ink-500">满减优惠</dt>
                    <dd className="text-brand-600 tabular-nums">-{formatPrice(thresholdDiscount)}</dd>
                  </div>
                )}
                {couponApplied > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-ink-500">优惠券</dt>
                    <dd className="text-brand-600 tabular-nums">-{formatPrice(couponApplied)}</dd>
                  </div>
                )}
              </dl>

              {/* Progress tips */}
              {selectedTotal > 0 && (
                <div className="mt-4 space-y-2">
                  {freeShippingLeft > 0 && freeShippingLeft <= selectedTotal + 50 && (
                    <div className="p-2.5 rounded-lg bg-amber-50 text-xs text-amber-700 flex items-center gap-2">
                      <AlertCircle size={14} />
                      再买 <span className="font-semibold">{formatPrice(freeShippingLeft)}</span> 即可包邮
                    </div>
                  )}
                  {discountLeft > 0 && discountLeft <= selectedTotal + 100 && (
                    <div className="p-2.5 rounded-lg bg-brand-50 text-xs text-brand-700 flex items-center gap-2">
                      <Sparkles size={14} />
                      再买 <span className="font-semibold">{formatPrice(discountLeft)}</span> 可享满 300 减 50
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-ink-100 mt-4 pt-4 flex justify-between items-baseline">
                <span className="font-medium text-ink-900">应付金额</span>
                <span className="text-3xl font-bold text-brand-600 tabular-nums">{formatPrice(finalTotal)}</span>
              </div>

              <Button
                className="w-full mt-5 h-12 text-base font-semibold"
                size="lg"
                onClick={handleCheckout}
                disabled={selectedItems.length === 0}
              >
                {`去结算 (${selectedCount})`}
              </Button>

              <button
                type="button"
                onClick={() => navigate('/categories')}
                className="w-full mt-3 text-sm text-ink-500 hover:text-brand-600 flex items-center justify-center gap-1 transition-colors"
              >
                <ChevronLeft size={14} /> 继续购物
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
