import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight, CreditCard, Smartphone, Landmark, Shield, Check, ArrowLeft, Wallet, Percent, QrCode, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProductImage } from '@/components/ProductImage';
import { useCart } from '@/store/CartContext';
import { useToast } from '@/store/ToastContext';
import { useOrder } from '@/store/OrderContext';
import { useAuth } from '@/store/AuthContext';
import { useNotification } from '@/store/NotificationContext';
import { formatPrice, cn } from '@/lib/utils';

const paymentMethods = [
  { key: 'wechat', label: '微信支付', icon: Smartphone, desc: '推荐 · 安全快捷', color: 'emerald' },
  { key: 'alipay', label: '支付宝', icon: CreditCard, desc: '支持花呗分期', color: 'sky' },
  { key: 'baitiao', label: '京东白条', icon: Percent, desc: '分期免息 · 最高12期', color: 'brand' },
  { key: 'balance', label: '悦界余额', icon: Wallet, desc: '余额 ¥2,580.00', color: 'amber' },
  { key: 'card', label: '银行卡', icon: Landmark, desc: '储蓄卡 / 信用卡', color: 'violet' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const { isAuthenticated, user } = useAuth();
  const { items: cartItems, removeItem } = useCart();
  const { createOrder, updateStatus } = useOrder();
  const { add: addNotification } = useNotification();

  const [payment, setPayment] = useState('wechat');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'confirm' | 'paying' | 'success'>('confirm');
  const [installment, setInstallment] = useState(3);
  const [cardNumber, setCardNumber] = useState('');
  const [saveCard, setSaveCard] = useState(true);
  // Snapshot of the paid amount — cart is emptied after order, so the success
  // screen must not recompute from now-empty cart items.
  const [paidTotal, setPaidTotal] = useState<number | null>(null);

  // Computed — use user's phone for address since addresses are in a modal
  const addresses = useMemo(() => {
    const raw = localStorage.getItem('jy_addresses');
    return raw ? JSON.parse(raw) : null;
  }, []);

  // Source of items for THIS checkout:
  // 1) items explicitly selected on the cart page (jy_checkout_items), or
  // 2) "buy now" payload, or
  // 3) fallback: all active (not saved-for-later) cart items.
  const checkoutItems = useMemo(() => {
    try {
      const raw = localStorage.getItem('jy_checkout_items');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore malformed payload */ }
    return cartItems.filter((i) => !i.saved);
  }, [cartItems]);

  const selectedAddress = addresses?.[0]
    ? { name: addresses[0].name, phone: addresses[0].phone, region: addresses[0].region, detail: addresses[0].detail }
    : { name: user?.username ?? '李同学', phone: user?.phone ?? '133****5831', region: '辽宁省 / 大连市 / 金普新区', detail: '金石滩金石路 39 号' };

  const totalPrice = checkoutItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const shipping = totalPrice >= 99 ? 0 : 10;
  const discount = totalPrice >= 300 ? 50 : 0;
  const finalTotal = Math.max(0, totalPrice + shipping - discount);

  // Payment/success states take priority over the empty-cart guard:
  // after a successful order the cart IS emptied, but the success screen must remain.
  if (step === 'paying') {
    return (
      <div className="container-app py-20 text-center">
        <div className="mx-auto w-24 h-24 rounded-full bg-brand-50 flex items-center justify-center mb-6">
          <svg className="animate-spin w-12 h-12 text-brand-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-ink-900 mb-2">正在安全支付...</h2>
        <p className="text-ink-500">请勿关闭页面，支付过程约需 1.5 秒</p>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="container-app py-20">
        <div className="max-w-lg mx-auto text-center">
          <div className="mx-auto w-28 h-28 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
            <Check size={64} className="text-emerald-500" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold text-ink-900 mb-3">下单成功！</h1>
          <p className="text-ink-500 mb-6">感谢您的购买，订单将尽快为您发货</p>
          <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 mb-8 text-left">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-ink-500">支付方式</span>
              <span className="font-medium text-ink-900">{paymentMethods.find((p) => p.key === payment)?.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-500">支付金额</span>
              <span className="text-xl font-bold text-brand-600">{formatPrice(paidTotal ?? finalTotal)}</span>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/')}>继续购物</Button>
            <Button onClick={() => navigate('/account')}>查看订单</Button>
          </div>
        </div>
      </div>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="container-app py-20 text-center">
        <div className="text-7xl mb-6">🛒</div>
        <h1 className="text-2xl font-bold text-ink-900 mb-2">购物车是空的</h1>
        <p className="text-ink-500 mb-8">请先添加商品再结算</p>
        <Button onClick={() => navigate('/categories')}>去购物</Button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container-app py-20 text-center">
        <div className="text-7xl mb-6">🔒</div>
        <h1 className="text-2xl font-bold text-ink-900 mb-2">请先登录</h1>
        <p className="text-ink-500 mb-8">登录后才能提交订单</p>
        <Button onClick={() => navigate('/')}>返回首页</Button>
      </div>
    );
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    setStep('paying');

    // Create order
    const order = await createOrder({
      items: checkoutItems.map((i) => ({ product: i.product, quantity: i.quantity })),
      address: selectedAddress,
      paymentMethod: paymentMethods.find((p) => p.key === payment)?.label ?? payment,
      shipping,
      discount,
    });

    // Simulate payment
    await new Promise((r) => setTimeout(r, 1500));
    await updateStatus(order.id, 'paid');

    // Add notification
    addNotification({
      type: 'order',
      title: '订单创建成功',
      message: `订单号 ${order.id}，共 ${order.items.length} 件商品，实付 ${formatPrice(order.total)}`,
      actionUrl: '/account',
    });

    // Remove only the purchased items from cart — keep "saved for later" items intact
    checkoutItems.forEach((i) => removeItem(i.product.id));
    try {
      localStorage.removeItem('jy_checkout_items');
    } catch { /* ignore */ }

    setStep('success');
    setPaidTotal(order.total ?? finalTotal);
    setSubmitting(false);
    show('支付成功！', 'success');
  };


  return (
    <div className="container-app py-8">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {['确认订单', '支付', '完成'].map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center text-sm font-bold">
                {i + 1}
              </div>
              <span className="text-sm font-medium text-ink-900">{label}</span>
            </div>
            {i < 2 && <ChevronRight size={20} className="mx-3 text-ink-300" />}
          </div>
        ))}
      </div>

      {/* Address */}
      <section className="rounded-xl border border-ink-100 bg-white p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={18} className="text-brand-500" />
          <h3 className="font-semibold text-ink-900">收货地址</h3>
        </div>
        <div className="p-4 rounded-lg bg-brand-50/60 border border-brand-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-ink-900">{selectedAddress.name}</span>
            <span className="text-sm text-ink-500">{selectedAddress.phone}</span>
            <Badge variant="brand">默认</Badge>
          </div>
          <p className="text-sm text-ink-600">{selectedAddress.region} · {selectedAddress.detail}</p>
        </div>
        <button type="button" className="mt-3 text-sm text-brand-600 hover:underline inline-flex items-center gap-1">
          更换地址 <ChevronRight size={14} />
        </button>
      </section>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-4">
          {/* Items */}
          <section className="rounded-xl border border-ink-100 bg-white p-6">
            <h3 className="font-semibold text-ink-900 mb-4">商品清单 ({checkoutItems.length} 件)</h3>
            <div className="space-y-4">
              {checkoutItems.map((item) => (
                <div key={item.product.id} className="flex gap-3 py-3 border-b border-ink-100 last:border-0">
                  <ProductImage
                    imageUrl={item.product.imageUrl}
                    fallback={item.product.image}
                    alt={item.product.name}
                    containerClassName="w-16 h-16 rounded-lg overflow-hidden shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink-900 line-clamp-1">{item.product.name}</div>
                    <div className="text-xs text-ink-500 mt-0.5">数量 × {item.quantity}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-brand-600 tabular-nums">
                      {formatPrice(item.product.price * item.quantity)}
                    </div>
                    <div className="text-xs text-ink-400">{formatPrice(item.product.price)} / 件</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-xl border border-ink-100 bg-white p-6">
            <h3 className="font-semibold text-ink-900 mb-4">支付方式</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {paymentMethods.map((m) => {
                const Icon = m.icon;
                const selected = payment === m.key;
                const colorMap: Record<string, string> = {
                  emerald: 'bg-emerald-100 text-emerald-600',
                  sky: 'bg-sky-100 text-sky-600',
                  brand: 'bg-brand-100 text-brand-600',
                  amber: 'bg-amber-100 text-amber-600',
                  violet: 'bg-violet-100 text-violet-600',
                };
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setPayment(m.key)}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
                      selected
                        ? 'border-brand-500 bg-brand-50/60'
                        : 'border-ink-100 bg-white hover:border-ink-200',
                    )}
                  >
                    <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', colorMap[m.color])}>
                      <Icon size={22} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-semibold text-ink-900 text-sm">{m.label}</div>
                      <div className="text-xs text-ink-500 truncate">{m.desc}</div>
                    </div>
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                      selected ? 'border-brand-500 bg-brand-500' : 'border-ink-200',
                    )}>
                      {selected && <Check size={12} className="text-white" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Payment method specific panel */}
            {payment === 'wechat' && (
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-4">
                <div className="w-28 h-28 rounded-lg bg-white p-2 flex items-center justify-center shrink-0">
                  <div className="w-full h-full bg-gradient-to-br from-ink-100 to-ink-200 rounded flex flex-col items-center justify-center text-ink-400">
                    <QrCode size={36} />
                    <span className="text-[10px] mt-1">微信扫码</span>
                  </div>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-ink-900 mb-1">请使用微信扫描二维码支付</p>
                  <p className="text-ink-500 mb-2">支付金额 <span className="text-brand-600 font-bold">{formatPrice(finalTotal)}</span></p>
                  <p className="text-xs text-ink-400">二维码有效期 15 分钟</p>
                </div>
              </div>
            )}

            {payment === 'alipay' && (
              <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-100 flex items-center gap-4">
                <div className="w-28 h-28 rounded-lg bg-white p-2 flex items-center justify-center shrink-0">
                  <div className="w-full h-full bg-gradient-to-br from-ink-100 to-ink-200 rounded flex flex-col items-center justify-center text-ink-400">
                    <QrCode size={36} />
                    <span className="text-[10px] mt-1">支付宝扫码</span>
                  </div>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-ink-900 mb-1">请使用支付宝扫码支付</p>
                  <p className="text-ink-500 mb-2">支持花呗分期付款</p>
                  <p className="text-xs text-ink-400">可在支付页面选择分期期数</p>
                </div>
              </div>
            )}

            {payment === 'baitiao' && (
              <div className="p-4 rounded-xl bg-brand-50/60 border border-brand-100">
                <p className="text-sm font-medium text-ink-900 mb-3">选择分期期数（免息）</p>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 6, 12, 24].map((n) => {
                    const monthly = (finalTotal / n).toFixed(2);
                    const selected = installment === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setInstallment(n)}
                        className={cn(
                          'p-3 rounded-lg border-2 text-center transition-all',
                          selected ? 'border-brand-500 bg-white' : 'border-ink-100 bg-white/60 hover:border-ink-200',
                        )}
                      >
                        <div className="text-sm font-bold text-ink-900">{n} 期</div>
                        <div className="text-xs text-brand-600 mt-0.5">¥{monthly}/期</div>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-500">
                  <Percent size={12} className="text-brand-500" />
                  本单免息，无手续费，按期还款即可
                </div>
              </div>
            )}

            {payment === 'balance' && (
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-700">账户余额</span>
                  <span className="font-bold text-ink-900">¥2,580.00</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-ink-700">本单应付</span>
                  <span className="font-bold text-brand-600">{formatPrice(finalTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-amber-200">
                  <span className="text-ink-700">支付后余额</span>
                  <span className="font-medium text-ink-900">{formatPrice(2580 - finalTotal)}</span>
                </div>
              </div>
            )}

            {payment === 'card' && (
              <div className="p-4 rounded-xl bg-violet-50/60 border border-violet-100 space-y-3">
                <div>
                  <label className="block text-xs text-ink-600 mb-1">银行卡号</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 19))}
                    placeholder="请输入银行卡号"
                    className="w-full h-10 px-3 rounded-lg border border-ink-200 bg-white text-sm focus:outline-none focus:border-violet-400 font-mono tracking-wider"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-ink-600 mb-1">有效期</label>
                    <input type="text" placeholder="MM/YY" className="w-full h-10 px-3 rounded-lg border border-ink-200 bg-white text-sm focus:outline-none focus:border-violet-400" />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-600 mb-1">CVV</label>
                    <input type="password" placeholder="***" maxLength={4} className="w-full h-10 px-3 rounded-lg border border-ink-200 bg-white text-sm focus:outline-none focus:border-violet-400" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs text-ink-600 cursor-pointer">
                  <input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} className="rounded text-violet-500" />
                  保存此卡以便下次快速支付
                </label>
              </div>
            )}

            {/* Security note */}
            <div className="mt-4 flex items-center gap-2 text-xs text-ink-400">
              <Lock size={12} />
              <span>本平台支付流程符合 PCI DSS 安全标准，交易信息全程加密传输</span>
            </div>
          </section>
        </div>

        {/* Summary sidebar */}
        <aside className="lg:w-80 shrink-0">
          <div className="lg:sticky lg:top-24 rounded-xl border border-ink-100 bg-white p-6">
            <h3 className="font-semibold text-ink-900 mb-4">订单摘要</h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-500">商品金额</dt>
                <dd className="tabular-nums">{formatPrice(totalPrice)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">运费</dt>
                <dd className={shipping === 0 ? 'text-emerald-600' : ''}>
                  {shipping === 0 ? '包邮' : formatPrice(shipping)}
                </dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ink-500">满减优惠</dt>
                  <dd className="text-brand-600 tabular-nums">-{formatPrice(discount)}</dd>
                </div>
              )}
            </dl>
            <div className="border-t border-ink-100 mt-4 pt-4">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm text-ink-700">应付金额</span>
                <span className="text-3xl font-bold text-brand-600 tabular-nums">{formatPrice(finalTotal)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 p-2 rounded-lg bg-emerald-50 text-xs text-emerald-700">
              <Shield size={14} />
              悦界保障：7 天无理由 · 假一赔十
            </div>
            <Button
              size="lg"
              className="w-full mt-5 h-12 text-base font-semibold"
              onClick={handleSubmit}
              disabled={submitting}
            >
              提交订单 · 支付 {formatPrice(finalTotal)}
            </Button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full mt-3 text-sm text-ink-500 hover:text-ink-700 flex items-center justify-center gap-1"
            >
              <ArrowLeft size={14} /> 返回修改
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
