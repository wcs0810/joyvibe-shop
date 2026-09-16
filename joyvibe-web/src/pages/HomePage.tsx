import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Eye, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProductCard } from '@/components/ProductCard';
import { categories, products } from '@/data/products';
import { getRecentlyViewed } from '@/store/OrderContext';

const subCategories: Record<string, string[]> = {
  digital: ['手机', '笔记本', '平板电脑', '智能手表', '耳机', '相机', '显示器', '充电器'],
  home: ['沙发', '床品', '收纳', '厨具', '灯具', '装饰', '绿植', '地毯'],
  food: ['零食', '饮料', '生鲜', '粮油', '茶酒', '咖啡', '保健品', '地方特产'],
  fashion: ['男装', '女装', '鞋靴', '箱包', '配饰', '运动', '内衣', '童装'],
  beauty: ['护肤', '彩妆', '香水', '洗护', '美发', '男士', '美容仪', '美甲'],
  gift: ['文创', '手办', '文具', '礼品盒', '收藏品', '定制', '节日', '盲盒'],
};

export default function HomePage() {
  const featured = products.slice(0, 10);
  const trending = products.filter((p) => p.tags?.includes('热销')).slice(0, 5);
  const [hoverCat, setHoverCat] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero + Category Sidebar (JD layout) */}
      <section className="container-app pt-6">
        <div className="flex gap-4">
          {/* Left category sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="rounded-xl border border-ink-100 bg-white overflow-hidden sticky top-20">
              <div className="px-4 py-3 bg-brand-500 text-white font-bold text-sm">全部分类</div>
              <ul className="py-2">
                {categories.map((cat) => (
                  <li
                    key={cat.id}
                    onMouseEnter={() => setHoverCat(cat.id)}
                    onMouseLeave={() => setHoverCat(null)}
                    className="relative"
                  >
                    <Link
                      to={`/categories?cat=${cat.id}`}
                      className="flex items-center justify-between px-4 py-2.5 text-sm text-ink-700 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">
                          {cat.icon === 'Smartphone' ? '📱' : cat.icon === 'Home' ? '🏠' : cat.icon === 'Coffee' ? '☕' : cat.icon === 'Shirt' ? '👕' : cat.icon === 'Sparkles' ? '✨' : cat.icon === 'Gift' ? '🎁' : '📦'}
                        </span>
                        {cat.name}
                      </span>
                      <ChevronRight size={14} className="text-ink-300" />
                    </Link>
                    {/* Flyout sub-categories */}
                    {hoverCat === cat.id && (
                      <div className="absolute left-full top-0 ml-0 w-64 bg-white border border-ink-100 rounded-r-xl shadow-elevation p-4 z-50">
                        <div className="grid grid-cols-2 gap-2">
                          {subCategories[cat.id]?.map((sub) => (
                            <Link
                              key={sub}
                              to={`/categories?cat=${cat.id}`}
                              className="text-xs text-ink-600 hover:text-brand-600 py-1 hover:underline"
                            >
                              {sub}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Hero Banner */}
          <div className="flex-1 min-w-0">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 p-12 md:p-16 text-white">
              <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/10" aria-hidden="true" />
              <div className="absolute -right-10 bottom-0 w-60 h-60 rounded-full bg-white/5" aria-hidden="true" />
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm mb-4 backdrop-blur-sm">
                  <Sparkles size={14} />
                  <span>夏日焕新季 · 限时特惠</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                  悦享生活<br />
                  <span className="bg-gradient-to-r from-gold-400 to-yellow-200 bg-clip-text text-transparent">
                    触手可及
                  </span>
                </h1>
                <p className="text-lg md:text-xl opacity-90 mb-8 max-w-lg">
                  精选全球好物，品质生活由此开启。全场低至 5 折，会员专享满 300 减 50。
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button size="lg" className="bg-white text-brand-700 hover:bg-ink-50" onClick={() => navigate('/campaign')}>
                    立即抢购 <ArrowRight size={18} />
                  </Button>
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={() => navigate('/categories')}>
                    浏览分类
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="container-app py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-ink-900">热门分类</h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/categories?cat=${cat.id}`}
              className="group flex flex-col items-center gap-3 p-5 rounded-xl border border-ink-100 bg-white hover:border-brand-200 hover:shadow-md transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-brand-50 flex items-center justify-center text-3xl group-hover:bg-brand-100 transition-colors">
                {cat.icon === 'Smartphone' ? '📱' : cat.icon === 'Home' ? '🏠' : cat.icon === 'Coffee' ? '☕' : cat.icon === 'Shirt' ? '👕' : cat.icon === 'Sparkles' ? '✨' : cat.icon === 'Gift' ? '🎁' : '📦'}
              </div>
              <div className="text-center">
                <div className="font-medium text-sm text-ink-900">{cat.name}</div>
                <div className="text-xs text-ink-500 mt-0.5">{cat.count}+ 件商品</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Products */}
      <section className="container-app py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-ink-900">🔥 限时特惠</h2>
          <Link to="/categories" className="text-sm text-brand-600 hover:text-brand-700 font-medium">查看全部 →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {trending.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container-app py-8 pb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-ink-900">为你推荐</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Recently Viewed */}
      {(() => {
        const recent = typeof window !== 'undefined' ? getRecentlyViewed() : [];
        if (recent.length === 0) return null;
        return (
          <section className="container-app py-4 pb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
                <Eye size={24} className="text-brand-500" /> 最近浏览
              </h2>
              <Link to="/categories" className="text-sm text-ink-500 hover:text-brand-600 flex items-center gap-1">
                更多 <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {recent.slice(0, 5).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        );
      })()}
    </div>
  );
}
