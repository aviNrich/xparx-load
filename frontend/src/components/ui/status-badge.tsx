import { cn } from '../../lib/utils';
import { CheckCircle2, XCircle, AlertCircle, Clock, PlayCircle, PauseCircle } from 'lucide-react';

type Status = 'success' | 'error' | 'warning' | 'info' | 'active' | 'inactive' | 'running' | 'paused' | 'pending';

interface StatusBadgeProps {
  status: Status;
  label?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig = {
  success: {
    icon: CheckCircle2,
    label: 'Active',
    className: 'bg-success-50 text-success-700 border-success-200',
  },
  error: {
    icon: XCircle,
    label: 'Failed',
    className: 'bg-error-50 text-error-700 border-error-200',
  },
  warning: {
    icon: AlertCircle,
    label: 'Warning',
    className: 'bg-warning-50 text-warning-700 border-warning-200',
  },
  info: {
    icon: AlertCircle,
    label: 'Info',
    className: 'bg-info-50 text-info-700 border-info-200',
  },
  active: {
    icon: CheckCircle2,
    label: 'Active',
    className: 'bg-success-50 text-success-700 border-success-200',
  },
  inactive: {
    icon: XCircle,
    label: 'Inactive',
    className: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  },
  running: {
    icon: PlayCircle,
    label: 'Running',
    className: 'bg-info-50 text-info-700 border-info-200 animate-pulse-subtle',
  },
  paused: {
    icon: PauseCircle,
    label: 'Paused',
    className: 'bg-warning-50 text-warning-700 border-warning-200',
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    className: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  },
};

const sizeConfig = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export function StatusBadge({
  status,
  label,
  showIcon = true,
  size = 'sm',
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const displayLabel = label || config.label;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium transition-all',
        config.className,
        sizeConfig[size],
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {displayLabel}
    </span>
  );
}
