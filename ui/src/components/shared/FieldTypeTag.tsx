import { cn } from '../../lib/utils';

interface FieldTypeTagProps {
  type: 'string' | 'integer' | 'date' | 'boolean' | 'enum';
  className?: string;
}

const typeConfig = {
  string: 'bg-info-50 text-info-700',
  integer: 'bg-primary-50 text-primary-700',
  date: 'bg-warning-50 text-warning-700',
  boolean: 'bg-success-50 text-success-700',
  enum: 'bg-neutral-100 text-neutral-700',
};

export function FieldTypeTag({ type, className }: FieldTypeTagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        typeConfig[type],
        className
      )}
    >
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}
