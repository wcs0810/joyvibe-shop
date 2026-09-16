import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Store, Star, MapPin, Shield, Package, Calendar, ChevronRight, ShoppingCart } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { Badge } from '@/components/ui/Badge';
import { sellers, getSellerById } from '@/data/sellers';
import { products } from '@/data/products';

export default function StorePage() {
  const { id } = useParams<{ id: string }>();
  const seller = useMemo(() => getSellerById(id || ''), [id]);

  const storeProducts = useMemo(
    () => products.filter((p) => p.sellerId === id),
    [id],
  );

  if (!seller) {
    return (
      <div className="container-app py-24 text-center">
        <div className="text-6xl mb-4">🏪</div>
        <h1 className="text-2xl font-bold text-ink-900 mb-2">店铺不存在</h1>
        <p className="text-ink-500 mb-6">您访问的店铺可能已下架或链接有误</p>
        <Link to="/categories" className="inline-flex items-center gap-2 px-6 h-11 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors">
          浏览全部商品 <ChevronRight size={16} />
        </Link>
      </div>
    );
  }

  const totalSales = storeProducts.reduce((s, p) => s + p.sales, 0);
  const avgRating = storeProducts.length > 0
    ? storeProducts.reduce((s, p) => s + p.rating, 0) / storeProducts.length
    : 0;

  return (
    <div className="container-app py-6">
      {/* Store Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-brand-600 to-brand-800 mb-6">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 0, transparent 50%)' }} />
        <div className="relative p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white flex items-center justify-center text-4xl md:text-5xl font-bold text-brand-600 shadow-lg shrink-0">
            {seller.logo}
          </div>
          <div className="flex-1 text-white">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold">{seller.name}</h1>
              {seller.isOfficial && (
                <Badge className="bg-amber-400 text-amber-900 border-0">官方旗舰店</Badge>
              )}
            </div>
            <p className="text-white/90 mb-3">{seller.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/90">
              <span className="flex items-center gap-1.5"><MapPin size={14} /> {seller.location}</span>
              <span className="flex items-center gap-1.5"><Star size={14} /> 店铺评分 {seller.rating.toFixed(1)}</span>
              <span className="flex items-center gap-1.5"><Package size={14} /> 累计销量 {seller.sales.toLocaleString()}</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} /> 入驻于 {seller.established}</span>
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link to="/cart" className="inline-flex items-center gap-2 px-5 h-11 bg-white/20 backdrop-blur text-white rounded-lg font-medium hover:bg-white/30 transition-colors">
              <ShoppingCart size={18} /> 购物车
            </Link>
            <button className="inline-flex items-center gap-2 px-5 h-11 bg-white text-brand-600 rounded-lg font-bold hover:bg-white/90 transition-colors">
              <Store size={18} /> 关注店铺
            </button>
          </div>
        </div>
      </div>

      {/* Store Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: '店铺评分', value: seller.rating.toFixed(1), icon: Star },
          { label: '在售商品', value: storeProducts.length, icon: Package },
          { label: '累计销量', value: totalSales.toLocaleString(), icon: ShoppingCart },
          { label: '平均评分', value: avgRating.toFixed(1), icon: Star },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-ink-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-brand-500 shrink-0">
              <stat.icon size={20} />
            </div>
            <div>
              <div className="text-xs text-ink-500">{stat.label}</div>
              <div className="text-xl font-bold text-ink-900">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Store Service Promises */}
      <div className="bg-white rounded-xl border border-ink-100 p-4 mb-6 flex flex-wrap items-center gap-6">
        {[
          { icon: Shield, text: '正品保障' },
          { icon: Package, text: '7天无理由退换' },
          { icon: Store, text: '官方直营' },
          { icon: ShoppingCart, text: '满99包邮' },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-ink-600 text-sm">
            <s.icon size={16} className="text-brand-500" />
            {s.text}
          </div>
        ))}
      </div>

      {/* Products */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-ink-900">店铺商品 <span className="text-ink-400 text-base font-normal">({storeProducts.length}件)</span></h2>
      </div>

      {storeProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-ink-100">
          <div className="text-5xl mb-3">📦</div>
          <p className="text-ink-500">该店铺暂无在售商品</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {storeProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {/* All stores CTA */}
      <div className="mt-8 bg-white rounded-xl border border-ink-100 p-6 text-center">
        <p className="text-ink-500 text-sm mb-3">还想逛逛其他店铺？</p>
        <div className="flex flex-wrap justify-center gap-2">
          {sellers.filter((s) => s.id !== seller.id).slice(0, 5).map((s) => (
            <Link
              key={s.id}
              to={`/store/${s.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ink-200 text-sm text-ink-600 hover:border-brand-300 hover:text-brand-600 transition-colors"
            >
              <span className="w-5 h-5 rounded bg-ink-100 flex items-center justify-center text-xs">{s.logo}</span>
              {s.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
