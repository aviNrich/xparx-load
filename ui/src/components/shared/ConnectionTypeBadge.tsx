import { Database, FileText, FileJson, FileSpreadsheet } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ConnectionTypeBadgeProps {
  type: 'mysql' | 'postgresql' | 'file';
  fileType?: 'csv' | 'json' | 'excel';
  className?: string;
}

const dbConfig = {
  mysql: {
    icon: Database,
    label: 'MySQL',
    className: 'text-info-600 bg-info-50',
  },
  postgresql: {
    icon: Database,
    label: 'PostgreSQL',
    className: 'text-primary-600 bg-primary-50',
  },
};

const fileConfig = {
  csv: { icon: FileText, label: 'CSV' },
  json: { icon: FileJson, label: 'JSON' },
  excel: { icon: FileSpreadsheet, label: 'Excel' },
};

export function ConnectionTypeBadge({ type, fileType, className }: ConnectionTypeBadgeProps) {
  if (type === 'file') {
    const config = fileConfig[fileType ?? 'csv'];
    const Icon = config.icon;
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-success-600 bg-success-50',
          className
        )}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  }

  const config = dbConfig[type];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
