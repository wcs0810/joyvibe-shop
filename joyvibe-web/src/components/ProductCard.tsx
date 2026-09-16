import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import { Badge } from './ui/Badge';
import { ProductImage } from './ProductImage';
import { formatPrice, cn } from '@/lib/utils';
import { useWishlist } from '@/store/WishlistContext';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { has, toggle } = useWishlist();
  const wished = has(product.id);

  const tagColors: Record<string, 'brand' | 'gold' | 'success' | 'danger'> = {
    热销: 'danger',
    新品: 'success',
    自营: 'gold',
    热门: 'brand',
  };

  return (
    <div
      className={cn(
        'group rounded-xl border border-ink-100 bg-white overflow-hidden',
        'transition-all duration-300 hover:shadow-elevation hover:-translate-y-1 hover:border-brand-200',
        className,
      )}
    >
      <div className="aspect-square relative overflow-hidden">
        <Link to={`/products/${product.id}`} aria-label={`查看 ${product.name} 详情`} className="block w-full h-full">
          <ProductImage
            imageUrl={product.imageUrl}
            fallback={product.image}
            alt={product.name}
            containerClassName="aspect-square transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        {product.originalPrice && (
          <Badge variant="brand" className="absolute top-3 left-3">
            -{Math.round((1 - product.price / product.originalPrice) * 100)}%
          </Badge>
        )}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(product); }}
          className={cn(
            'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all',
            wished ? 'bg-brand-500 text-white' : 'bg-white/80 backdrop-blur text-ink-400 hover:text-brand-500 hover:bg-white',
          )}
          aria-label={wished ? '取消收藏' : '加入收藏'}
        >
          <Heart size={16} fill={wished ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-1 mb-2">
          {product.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant={tagColors[tag] ?? 'default'}>
              {tag}
            </Badge>
          ))}
        </div>
        <Link to={`/products/${product.id}`}>
          <h3 className="font-medium text-ink-900 mb-2 line-clamp-2 min-h-[3rem] leading-relaxed group-hover:text-brand-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1 mb-2 text-xs text-ink-500">
          <Star size={12} className="fill-amber-400 text-amber-400" />
          <span>{product.rating.toFixed(1)}</span>
          <span className="mx-1">·</span>
          <span>{product.sales.toLocaleString()} 人购买</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-brand-600">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="text-sm text-ink-400 line-through">{formatPrice(product.originalPrice)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
