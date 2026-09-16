import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-md bg-gradient-to-r from-ink-100 via-ink-50 to-ink-100 bg-[length:400px_100px]',
        className,
      )}
      aria-hidden="true"
      {...props}
    />
  );
}
