import { useState, type ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ProductImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  imageUrl?: string;
  fallback: string;
  alt: string;
  containerClassName?: string;
}

export function ProductImage({
  imageUrl,
  fallback,
  alt,
  containerClassName,
  className,
  ...rest
}: ProductImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const showImage = imageUrl && !error;

  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      {showImage ? (
        <>
          {!loaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-ink-100 to-ink-200 animate-pulse" />
          )}
          <img
            src={imageUrl}
            alt={alt}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              loaded ? 'opacity-100' : 'opacity-0',
              className,
            )}
            {...rest}
          />
        </>
      ) : (
        <div
          className={cn(
            'w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-ink-50 to-ink-100',
            className,
          )}
          aria-label={alt}
        >
          {fallback}
        </div>
      )}
    </div>
  );
}
