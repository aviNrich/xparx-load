import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LoadingStateProps {
  variant?: 'page' | 'inline';
  text?: string;
  className?: string;
}

export function LoadingState({ variant = 'page', text, className }: LoadingStateProps) {
  if (variant === 'inline') {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8', className)}>
        <Loader2 className="h-6 w-6 text-primary-500 animate-spin" />
        {text && <p className="text-sm text-neutral-500 mt-2">{text}</p>}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-40 rounded-lg bg-neutral-100 animate-pulse" />
      ))}
    </div>
  );
}
