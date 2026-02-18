import { LayoutGrid, List } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ViewToggleProps {
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
  className?: string;
}

export function ViewToggle({ view, onViewChange, className }: ViewToggleProps) {
  return (
    <div className={cn('flex items-center border rounded-lg overflow-hidden', className)}>
      <button
        type="button"
        onClick={() => onViewChange('grid')}
        className={cn(
          'p-2 transition-colors',
          view === 'grid'
            ? 'bg-primary-50 text-primary-600'
            : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'
        )}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onViewChange('list')}
        className={cn(
          'p-2 transition-colors',
          view === 'list'
            ? 'bg-primary-50 text-primary-600'
            : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'
        )}
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
