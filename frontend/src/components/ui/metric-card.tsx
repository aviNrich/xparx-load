import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  suffix?: string;
  prefix?: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  description?: string;
  className?: string;
  loading?: boolean;
  decimals?: number;
  footer?: ReactNode;
}

export function MetricCard({
  title,
  value,
  previousValue,
  icon: Icon,
  iconColor = 'text-primary-600',
  iconBgColor = 'bg-primary-100',
  suffix = '',
  prefix = '',
  trend,
  trendValue,
  description,
  className,
  loading = false,
  decimals = 0,
  footer,
}: MetricCardProps) {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-success-600';
    if (trend === 'down') return 'text-error-600';
    return 'text-neutral-600';
  };

  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'bg-white rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden',
        className
      )}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-neutral-600 mb-1">{title}</p>
            {loading ? (
              <div className="h-8 w-32 bg-neutral-200 rounded animate-shimmer" />
            ) : (
              <div className="flex items-baseline gap-1">
                {prefix && <span className="text-2xl font-bold text-neutral-900">{prefix}</span>}
                <span className="text-3xl font-bold text-neutral-900">
                  <CountUp
                    end={value}
                    start={previousValue || 0}
                    duration={2}
                    separator=","
                    decimals={decimals}
                  />
                </span>
                {suffix && <span className="text-lg font-semibold text-neutral-600">{suffix}</span>}
              </div>
            )}
          </div>

          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              iconBgColor
            )}
          >
            <Icon className={cn('h-6 w-6', iconColor)} />
          </div>
        </div>

        {(trend || description) && (
          <div className="flex items-center justify-between">
            {trend && trendValue && (
              <div className={cn('flex items-center gap-1 text-sm font-medium', getTrendColor())}>
                <TrendIcon className="h-4 w-4" />
                <span>{trendValue}</span>
              </div>
            )}
            {description && (
              <p className="text-xs text-neutral-500 ml-auto">{description}</p>
            )}
          </div>
        )}

        {footer && (
          <div className="mt-4 pt-4 border-t border-neutral-100">
            {footer}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Loading skeleton for MetricCard
export function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-4 w-24 bg-neutral-200 rounded mb-2 animate-shimmer" />
          <div className="h-8 w-32 bg-neutral-200 rounded animate-shimmer" />
        </div>
        <div className="w-12 h-12 bg-neutral-200 rounded-xl animate-shimmer" />
      </div>
      <div className="h-3 w-20 bg-neutral-200 rounded animate-shimmer" />
    </div>
  );
}
