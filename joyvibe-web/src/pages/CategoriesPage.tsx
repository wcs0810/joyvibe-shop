import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, ArrowUpDown, Star, Search, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/Button';
import { categories, products } from '@/data/products';
import { cn } from '@/lib/utils';

type SortKey = 'default' | 'sales' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'default', label: '综合' },
  { value: 'sales', label: '销量' },
  { value: 'newest', label: '新品' },
  { value: 'rating', label: '评分' },
  { value: 'price-asc', label: '价格↑' },
  { value: 'price-desc', label: '价格↓' },
];

const allTags = ['热销', '新品', '自营', '热门', '专业', '4K'];

export default function CategoriesPage() {
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get('cat') ?? '';
  const initialQuery = searchParams.get('q') ?? '';

  const [activeCat, setActiveCat] = useState(initialCat);
  const [sort, setSort] = useState<SortKey>('default');
  const [query, setQuery] = useState(initialQuery);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(6000);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [minRating, setMinRating] = useState(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const PRICE_MIN = 0;
  const PRICE_MAX = 6000;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const clearAll = () => {
    setActiveCat('');
    setQuery('');
    setSort('default');
    setPriceMin(0);
    setPriceMax(PRICE_MAX);
    setSelectedTags(new Set());
    setMinRating(0);
  };

  const hasFilters = activeCat || query || priceMin > 0 || priceMax < PRICE_MAX || selectedTags.size > 0 || minRating > 0;

  const filtered = useMemo(() => {
    let result = products;
    if (activeCat) result = result.filter((p) => p.category === activeCat);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
      );
    }
    result = result.filter((p) => p.price >= priceMin && p.price <= priceMax);
    if (selectedTags.size > 0) {
      result = result.filter((p) => p.tags?.some((t) => selectedTags.has(t)));
    }
    if (minRating > 0) {
      result = result.filter((p) => p.rating >= minRating);
    }
    const sorted = [...result];
    switch (sort) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'sales':
        sorted.sort((a, b) => b.sales - a.sales);
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        sorted.sort((a, b) => b.id.localeCompare(a.id));
        break;
    }
    return sorted;
  }, [activeCat, sort, query, priceMin, priceMax, selectedTags, minRating]);

  const FilterPanel = () => (
    <div className="space-y-5">
      {/* Category */}
      <div className="rounded-xl border border-ink-100 bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-900 mb-3">
          <Filter size={16} /> 商品分类
        </div>
        <ul className="space-y-1">
          <li>
            <button
              type="button"
              onClick={() => setActiveCat('')}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                !activeCat
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-ink-600 hover:bg-ink-50',
              )}
            >
              全部商品 ({products.length})
            </button>
          </li>
          {categories.map((cat) => {
            const count = products.filter((p) => p.category === cat.id).length;
            return (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => setActiveCat(cat.id)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between',
                    activeCat === cat.id
                      ? 'bg-brand-50 text-brand-700 font-medium'
                      : 'text-ink-600 hover:bg-ink-50',
                  )}
                >
                  <span>{cat.name}</span>
                  <span className="text-xs text-ink-400">{count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Price Range */}
      <div className="rounded-xl border border-ink-100 bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-900 mb-3">
          <ArrowUpDown size={16} /> 价格区间
        </div>
        <div className="flex items-center gap-2 text-sm mb-3">
          <span className="w-20 text-center py-1.5 rounded-lg bg-ink-50 text-ink-700 tabular-nums">¥{priceMin}</span>
          <span className="text-ink-400">—</span>
          <span className="w-20 text-center py-1.5 rounded-lg bg-ink-50 text-ink-700 tabular-nums">¥{priceMax}</span>
        </div>
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={100}
          value={priceMax}
          onChange={(e) => setPriceMax(Math.max(priceMin, Number(e.target.value)))}
          className="w-full accent-brand-500"
          aria-label="最高价格"
        />
        <div className="flex justify-between text-xs text-ink-400 mt-1">
          <span>¥{PRICE_MIN}</span>
          <span>¥{PRICE_MAX}</span>
        </div>
        <div className="flex gap-1.5 mt-3">
          {[[0, 200], [200, 800], [800, 2000], [2000, 6000]].map(([lo, hi]) => {
            const active = priceMin === lo && priceMax === hi;
            return (
              <button
                key={`${lo}-${hi}`}
                type="button"
                onClick={() => { setPriceMin(lo); setPriceMax(hi); }}
                className={cn(
                  'px-2 py-1 text-xs rounded transition-colors',
                  active
                    ? 'bg-brand-500 text-white'
                    : 'bg-ink-50 text-ink-600 hover:bg-ink-100',
                )}
              >
                {lo === 0 ? '¥0' : `¥${lo}`}-¥{hi}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rating */}
      <div className="rounded-xl border border-ink-100 bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-900 mb-3">
          <Star size={16} /> 用户评分
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[0, 3, 4, 4.5].map((r) => {
            const active = minRating === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setMinRating(r)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1',
                  active
                    ? 'bg-brand-500 text-white'
                    : 'bg-ink-50 text-ink-600 hover:bg-ink-100',
                )}
              >
                {r === 0 ? '不限' : (
                  <>
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    {r === 3 ? '3+' : r === 4 ? '4+' : '4.5+'}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tags */}
      <div className="rounded-xl border border-ink-100 bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-900 mb-3">
          <SlidersHorizontal size={16} /> 商品标签
        </div>
        <div className="flex flex-wrap gap-1.5">
          {allTags.map((tag) => {
            const active = selectedTags.has(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-full border transition-colors',
                  active
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'bg-white border-ink-200 text-ink-600 hover:border-brand-300',
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container-app py-8">
      <h1 className="text-2xl font-bold text-ink-900 mb-6">全部商品</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Desktop Sidebar */}
        <aside className="lg:w-64 shrink-0 hidden lg:block">
          <FilterPanel />
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="rounded-xl border border-ink-100 bg-white p-4 mb-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                  <input
                    type="search"
                    placeholder="搜索商品..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full h-10 pl-10 pr-10 rounded-lg border border-ink-200 bg-white text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                      aria-label="清除搜索"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile filter button */}
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 h-10 px-3 rounded-lg border border-ink-200 text-sm font-medium text-ink-600"
              >
                <Filter size={16} /> 筛选
                {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />}
              </button>

              {/* Sort tabs */}
              <div className="flex gap-1 flex-wrap">
                {sortOptions.map((opt) => {
                  const active = sort === opt.value;
                  const isPriceOpt = opt.value === 'price-asc' || opt.value === 'price-desc';
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSort(opt.value)}
                      className={cn(
                        'px-3.5 h-10 rounded-lg text-sm font-medium transition-colors flex items-center gap-1',
                        active
                          ? 'bg-brand-500 text-white shadow-sm'
                          : 'bg-ink-50 text-ink-600 hover:bg-ink-100',
                      )}
                    >
                      {isPriceOpt && <ArrowUpDown size={14} />}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active filter chips */}
            {hasFilters && (
              <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-ink-100">
                <span className="text-xs text-ink-500">已选：</span>
                {activeCat && categories.find((c) => c.id === activeCat) && (
                  <FilterChip label={categories.find((c) => c.id === activeCat)!.name} onRemove={() => setActiveCat('')} />
                )}
                {query && <FilterChip label={`"${query}"`} onRemove={() => setQuery('')} />}
                {(priceMin > 0 || priceMax < PRICE_MAX) && (
                  <FilterChip label={`¥${priceMin}-¥${priceMax}`} onRemove={() => { setPriceMin(0); setPriceMax(PRICE_MAX); }} />
                )}
                {[...selectedTags].map((t) => (
                  <FilterChip key={t} label={t} onRemove={() => toggleTag(t)} />
                ))}
                {minRating > 0 && (
                  <FilterChip label={`${minRating}星以上`} onRemove={() => setMinRating(0)} />
                )}
                <button type="button" onClick={clearAll} className="ml-auto text-xs text-brand-600 hover:underline font-medium">
                  清除全部
                </button>
              </div>
            )}
          </div>

          {/* Results header */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-ink-500">共 <span className="font-semibold text-ink-900">{filtered.length}</span> 件商品</div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 rounded-xl border border-ink-100 bg-white">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-ink-900 mb-2">没有找到相关商品</h3>
              <p className="text-ink-500 mb-6">试试换个关键词或调整筛选条件</p>
              <Button variant="outline" onClick={clearAll}>清除全部筛选</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="筛选">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFilterOpen(false)} />
          <div className="relative ml-auto w-[90%] max-w-md h-full bg-white overflow-y-auto animate-slide-in">
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-ink-100 bg-white">
              <span className="font-semibold text-ink-900">筛选</span>
              <button type="button" onClick={() => setMobileFilterOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100" aria-label="关闭">
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <FilterPanel />
            </div>
            <div className="sticky bottom-0 flex gap-2 p-4 border-t border-ink-100 bg-white">
              <Button variant="outline" className="flex-1" onClick={clearAll}>重置</Button>
              <Button className="flex-1" onClick={() => setMobileFilterOpen(false)}>查看 {filtered.length} 件</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-brand-50 text-brand-700 font-medium">
      {label}
      <button type="button" onClick={onRemove} className="hover:text-brand-900" aria-label={`移除 ${label}`}>
        <X size={10} />
      </button>
    </span>
  );
}
