import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Minus, Plus, Star, Truck, Shield, RotateCcw, Heart, Share2, MessageCircle, Award, Store, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { flyCart } from '@/lib/flyCart';
import { products } from '@/data/products';
import { getSellerById } from '@/data/sellers';
import { cn } from '@/lib/utils';
import { useCart } from '@/store/CartContext';
import { useToast } from '@/store/ToastContext';
import { useWishlist } from '@/store/WishlistContext';
import { trackRecentlyViewed } from '@/store/OrderContext';
import { formatPrice } from '@/lib/utils';
import { ProductImage } from '@/components/ProductImage';

type TabKey = 'detail' | 'specs' | 'reviews' | 'guess';

const reviewSamples = [
  { user: '张**生', rating: 5, date: '2026-09-12', content: '音质非常好，降噪效果惊艳！佩戴舒适，长时间使用也不压耳。', tag: '降噪效果棒', images: 3, reply: '感谢您的认可！我们会继续努力提供更好的产品和服务～' },
  { user: '王**红', rating: 5, date: '2026-09-08', content: '做工精致，钛灰色很高级。续航也很给力，一次充电用一周没问题。', tag: '做工精致', images: 2 },
  { user: '陈**明', rating: 4, date: '2026-08-30', content: '整体很满意，就是价格稍贵，但一分钱一分货。', tag: '性价比高', images: 0 },
  { user: '刘**丽', rating: 5, date: '2026-08-22', content: '给男朋友买的生日礼物，他超级喜欢！包装也很精美。', tag: '送礼合适', images: 4, reply: '祝您和男朋友生活愉快，欢迎再次光临！' },
];

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { show } = useToast();
  const { has, toggle } = useWishlist();
  const [qty, setQty] = useState(1);
  const [activeSpec, setActiveSpec] = useState<'钛灰' | '雪白' | '墨黑'>('钛灰');
  const [activeTab, setActiveTab] = useState<TabKey>('detail');
  const [reviewFilter, setReviewFilter] = useState('全部');
  const imageRef = useRef<HTMLDivElement>(null);

  const product = products.find((p) => p.id === id);
  const seller = product ? getSellerById(product.sellerId) : undefined;
  const liked = product ? has(product.id) : false;

  // Track recently viewed
  useEffect(() => {
    if (product) trackRecentlyViewed(product);
  }, [product]);

  if (!product) {
    return (
      <div className="container-app py-24 text-center">
        <h1 className="text-2xl font-bold text-ink-900 mb-4">商品不存在</h1>
        <Link to="/categories" className="text-brand-600 hover:underline">返回商品列表</Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product, qty);
    show(`已加入购物车：${product.name} × ${qty}`, 'success');
    // Fly animation
    if (imageRef.current) {
      flyCart(imageRef.current, product.imageUrl);
    }
  };

  const handleBuyNow = () => {
    // "Buy now" goes straight to checkout without polluting the cart
    try {
      localStorage.setItem('jy_checkout_items', JSON.stringify([{ product, quantity: qty }]));
    } catch { /* ignore */ }
    navigate('/checkout');
  };

  const guessLike = products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);
  const fallbackGuess = products.filter((p) => p.id !== product.id).slice(0, 4);
  const related = guessLike.length > 0 ? guessLike : fallbackGuess;

  const specColors = ['钛灰', '雪白', '墨黑'] as const;

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'detail', label: '商品详情' },
    { key: 'specs', label: '规格参数' },
    { key: 'reviews', label: '用户评价', count: 248 },
    { key: 'guess', label: '猜你喜欢' },
  ];

  return (
    <div className="container-app py-8">
      {/* Breadcrumb */}
      <nav aria-label="面包屑" className="flex items-center gap-2 text-sm text-ink-500 mb-6">
        <Link to="/" className="hover:text-brand-600">首页</Link>
        <ChevronRight size={14} />
        <Link to="/categories" className="hover:text-brand-600">全部商品</Link>
        <ChevronRight size={14} />
        <span className="text-ink-900 truncate">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Image */}
        <div className="space-y-4">
          <div ref={imageRef} className="aspect-square rounded-2xl shadow-card relative overflow-hidden group">
            <ProductImage
              imageUrl={product.imageUrl}
              fallback={product.image}
              alt={product.name}
              containerClassName="aspect-square"
            />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/5 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="px-4 py-2 rounded-lg bg-white/90 text-sm font-medium text-ink-900">长按查看大图</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[product.imageUrl, product.imageUrl, product.imageUrl, product.imageUrl].map((url, i) => (
              <button
                key={i}
                type="button"
                className={cn(
                  'aspect-square rounded-lg overflow-hidden transition-all',
                  i === 0 ? 'ring-2 ring-brand-500' : 'hover:ring-2 hover:ring-ink-200',
                )}
                aria-label={`查看图片 ${i + 1}`}
              >
                {url ? (
                  <img
                    src={url}
                    alt={`${product.name} ${i + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-ink-50 to-ink-100">
                    {product.image}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <h1 className="text-3xl font-bold text-ink-900 mb-3 leading-tight">{product.name}</h1>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-1">
              <Star size={16} className="fill-amber-400 text-amber-400" />
              <span className="text-sm font-medium text-ink-900">{product.rating}</span>
            </div>
            <span className="text-sm text-ink-500">{product.sales.toLocaleString()} 人购买</span>
            {product.tags?.map((tag) => (
              <Badge key={tag} variant={tag === '热销' ? 'danger' : tag === '新品' ? 'success' : 'gold'}>{tag}</Badge>
            ))}
          </div>

          <div className="rounded-xl bg-gradient-to-r from-brand-50 to-white border border-brand-100 p-5 mb-6">
            <div className="flex items-baseline gap-3">
              <span className="text-sm text-brand-600">¥</span>
              <span className="text-4xl font-bold text-brand-600 tabular-nums">{product.price.toFixed(2)}</span>
              {product.originalPrice && (
                <span className="text-sm text-ink-400 line-through">¥{product.originalPrice.toFixed(2)}</span>
              )}
              {product.originalPrice && (
                <Badge variant="danger">限时 · 省 ¥{(product.originalPrice - product.price).toFixed(0)}</Badge>
              )}
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-y-3 text-sm mb-6">
            <dt className="text-ink-500">促销</dt>
            <dd className="text-brand-600 font-medium">满 300 减 50 · 限时 5 折</dd>
            <dt className="text-ink-500">发货地</dt>
            <dd>{product.category === 'digital' ? '辽宁大连' : '上海仓'}</dd>
            <dt className="text-ink-500">运费</dt>
            <dd>包邮 · 7 天无理由退换</dd>
            <dt className="text-ink-500">服务</dt>
            <dd>正品保障 · 假一赔十</dd>
            <dt className="text-ink-500">库存</dt>
            <dd className={product.inventory < 20 ? 'text-brand-600 font-medium' : ''}>
              {product.inventory > 0
                ? `仅剩 ${product.inventory} 件${product.inventory < 20 ? '（抢完即止）' : ''}`
                : '暂时缺货'}
            </dd>
          </dl>

          {/* Spec Selector */}
          <div className="mb-6">
            <label className="text-sm font-medium text-ink-900 mb-2 block">颜色</label>
            <div className="flex gap-2">
              {specColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setActiveSpec(color)}
                  className={cn(
                    'px-4 h-10 rounded-lg text-sm font-medium transition-all border',
                    activeSpec === color
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300',
                  )}
                  aria-pressed={activeSpec === color}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-8">
            <label className="text-sm font-medium text-ink-900 mb-2 block">数量</label>
            <div className="inline-flex items-center border border-ink-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-11 h-11 flex items-center justify-center hover:bg-ink-50 text-ink-600"
                aria-label="减少数量"
              >
                <Minus size={16} />
              </button>
              <span className="w-14 h-11 flex items-center justify-center font-medium border-x border-ink-200 tabular-nums">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="w-11 h-11 flex items-center justify-center hover:bg-ink-50 text-ink-600"
                aria-label="增加数量"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-8">
            <Button size="lg" variant="outline" className="flex-1" onClick={handleAddToCart}>
              加入购物车
            </Button>
            <Button size="lg" className="flex-1" onClick={handleBuyNow}>
              立即购买
            </Button>
            <button
              type="button"
              onClick={() => { if (product) { toggle(product); show(liked ? '已取消收藏' : '已加入收藏', liked ? 'info' : 'success'); } }}
              className={cn(
                'w-12 h-12 rounded-xl border flex items-center justify-center transition-colors shrink-0',
                liked ? 'border-brand-200 bg-brand-50 text-brand-500' : 'border-ink-200 text-ink-500 hover:text-brand-500 hover:border-brand-200',
              )}
              aria-label={liked ? '取消收藏' : '加入收藏'}
            >
              <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Services */}
          <div className="flex flex-wrap gap-6 pt-6 border-t border-ink-100">
            <div className="flex items-center gap-2 text-sm text-ink-500">
              <Truck size={18} className="text-brand-500" /> 次日达
            </div>
            <div className="flex items-center gap-2 text-sm text-ink-500">
              <Shield size={18} className="text-brand-500" /> 正品保障
            </div>
            <div className="flex items-center gap-2 text-sm text-ink-500">
              <RotateCcw size={18} className="text-brand-500" /> 7 天退换
            </div>
            <div className="flex items-center gap-2 text-sm text-ink-500">
              <Share2 size={18} className="text-ink-400" /> 分享
            </div>
          </div>

          {/* Seller Info */}
          {seller && (
            <Link
              to={`/store/${seller.id}`}
              className="flex items-center gap-4 mt-6 p-4 rounded-xl bg-ink-50 hover:bg-ink-100 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-xl font-bold text-brand-600 shadow-sm shrink-0">
                {seller.logo}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink-900 group-hover:text-brand-600 transition-colors">{seller.name}</span>
                  {seller.isOfficial && <Badge variant="gold">官方</Badge>}
                </div>
                <div className="flex items-center gap-3 text-xs text-ink-500 mt-0.5">
                  <span className="flex items-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" /> {seller.rating}</span>
                  <span className="flex items-center gap-1"><Package size={12} /> {seller.sales.toLocaleString()} 销量</span>
                  <span className="flex items-center gap-1"><Store size={12} /> 进店逛逛</span>
                </div>
              </div>
              <ChevronRight size={20} className="text-ink-400 group-hover:text-brand-500 transition-colors" />
            </Link>
          )}
        </div>
      </div>

      {/* Multi-tab section (JD style) */}
      <section className="mt-12">
        <div className="flex items-center gap-1 border-b border-ink-200 mb-6 sticky top-16 bg-ink-50 z-10 py-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-6 py-3 text-sm font-medium relative transition-colors',
                activeTab === tab.key ? 'text-brand-600' : 'text-ink-500 hover:text-ink-900',
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1 text-xs text-ink-400">({tab.count})</span>
              )}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-brand-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-ink-100 bg-white">
          {/* Detail */}
          {activeTab === 'detail' && (
            <div className="p-8">
              <p className="text-ink-600 leading-relaxed text-base">{product.description}</p>
              <div className="mt-6 p-6 rounded-xl bg-gradient-to-r from-brand-50 via-white to-brand-50 border border-brand-100">
                <div className="flex items-center gap-2 mb-4">
                  <Award size={20} className="text-brand-500" />
                  <span className="font-semibold text-ink-900">产品亮点</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {['旗舰级音质', '智能降噪 45dB', '钛合金工艺', '30 小时续航', 'IPX4 防水', '多点连接'].map((h) => (
                    <div key={h} className="flex items-center gap-2 text-ink-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500" /> {h}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Specs */}
          {activeTab === 'specs' && (
            <div className="p-8">
              {product.specs ? (
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-y-1 text-sm">
                  {Object.entries(product.specs).map(([k, v]) => (
                    <div key={k} className="flex border-b border-ink-100">
                      <dt className="w-32 shrink-0 py-3 px-4 bg-ink-50 text-ink-500">{k}</dt>
                      <dd className="flex-1 py-3 px-4 text-ink-900">{v}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-center text-ink-500 py-12">暂无规格参数</p>
              )}
            </div>
          )}

          {/* Reviews */}
          {activeTab === 'reviews' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-ink-100">
                <div>
                  <span className="text-3xl font-bold text-brand-600 tabular-nums">{product.rating}</span>
                  <span className="text-sm text-ink-500 ml-1">/ 5.0</span>
                  <div className="flex items-center gap-0.5 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className={i < Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-ink-200'} />
                    ))}
                    <span className="text-xs text-ink-500 ml-2">共 248 条评价</span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <MessageCircle size={14} /> 写评价
                </Button>
              </div>

              {/* Review filter tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {['全部(248)', '好评(220)', '中评(23)', '差评(5)', '有图(86)', '降噪效果棒(142)', '做工精致(98)', '性价比高(76)'].map((tag) => {
                  const active = reviewFilter === tag.split('(')[0];
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setReviewFilter(tag.split('(')[0])}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs transition-colors',
                        active
                          ? 'bg-brand-500 text-white'
                          : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
                      )}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-5">
                {reviewSamples.map((r, i) => (
                  <article key={i} className="pb-5 border-b border-ink-100 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 text-xs font-bold">
                        {r.user.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-ink-900">{r.user}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} size={10} className={j < r.rating ? 'fill-amber-400 text-amber-400' : 'text-ink-200'} />
                        ))}
                      </div>
                      <span className="text-xs text-ink-400 ml-auto">{r.date}</span>
                    </div>
                    <p className="text-sm text-ink-700 leading-relaxed ml-10">{r.content}</p>

                    {/* Review images */}
                    {r.images > 0 && (
                      <div className="mt-2 ml-10 flex gap-2 flex-wrap">
                        {Array.from({ length: r.images }).map((_, j) => (
                          <div
                            key={j}
                            className="w-20 h-20 rounded-lg bg-gradient-to-br from-ink-100 to-ink-200 flex items-center justify-center text-2xl cursor-pointer hover:ring-2 hover:ring-brand-300 transition-all"
                          >
                            📷
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-2 ml-10">
                      <Badge variant="gold">{r.tag}</Badge>
                    </div>

                    {/* Seller reply */}
                    {r.reply && (
                      <div className="mt-3 ml-10 p-3 rounded-lg bg-ink-50 border border-ink-100">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs font-medium text-brand-600">商家回复</span>
                        </div>
                        <p className="text-xs text-ink-600 leading-relaxed">{r.reply}</p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Guess you like */}
          {activeTab === 'guess' && (
            <div className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {related.map((p) => (
                  <Link
                    key={p.id}
                    to={`/products/${p.id}`}
                    className="group"
                  >
                    <div className="aspect-square rounded-lg bg-gradient-to-br from-ink-50 to-ink-100 flex items-center justify-center text-5xl mb-3 group-hover:scale-105 transition-transform">
                      {p.image}
                    </div>
                    <div className="text-sm font-medium text-ink-900 line-clamp-1 group-hover:text-brand-600">{p.name}</div>
                    <div className="text-brand-600 font-semibold text-sm mt-1 tabular-nums">{formatPrice(p.price)}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
