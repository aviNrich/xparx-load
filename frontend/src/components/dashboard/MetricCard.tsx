import React from 'react';
import { ArrowUpRight, MoreHorizontal } from 'lucide-react';

interface MetricCardProps {
  icon: string;
  title: string;
  ordersCount: string;
  amount: string;
  percentage: string;
  color: string;
}

export function MetricCard({ icon, title, ordersCount, amount, percentage, color }: MetricCardProps) {
  const getIcon = () => {
    switch (icon) {
      case 'amazon':
        return (
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
            <path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-1.006.654-1.244.743-2.64 1.316-4.185 1.726-1.53.406-3.045.61-4.516.61-2.265 0-4.463-.42-6.588-1.256-2.11-.825-3.98-2.013-5.61-3.55-.147-.138-.2-.25-.18-.336.015-.09.076-.15.18-.21z"/>
            <path d="M21.697 16.468c-.315-.39-.84-.56-1.576-.51-.735.05-1.54.24-2.41.57-.87.33-1.66.78-2.37 1.35-.71.57-1.23 1.23-1.56 1.98-.165.375-.255.78-.255 1.2 0 .45.105.84.315 1.17.21.33.525.57.945.72.42.15.885.18 1.395.09.51-.09 1.005-.3 1.485-.63.48-.33.885-.78 1.215-1.35.33-.57.495-1.23.495-1.98 0-.36-.06-.69-.18-.99-.12-.3-.315-.54-.585-.72zM18.27 17.73c.315 0 .585.09.81.27.225.18.39.42.495.72.105.3.15.63.15.99 0 .57-.135 1.065-.405 1.485-.27.42-.63.735-1.08.945-.45.21-.945.285-1.485.225-.54-.06-.99-.24-1.35-.54-.36-.3-.54-.66-.54-1.08 0-.36.075-.705.225-1.035.15-.33.375-.63.675-.9.3-.27.66-.495 1.08-.675.42-.18.87-.27 1.35-.27.045 0 .09 0 .135.015z"/>
          </svg>
        );
      case 'walmart':
        return (
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
            <path d="M12.796 11.576l3.715-1.174-3.715-1.185v2.359zm4.356-1.174l-4.356 1.376V6.815l4.356 1.376v2.211zm-9.423 0l-3.716-1.174 3.716-1.185v2.359zm-4.356-1.174l4.356 1.376V6.815l-4.356 1.376v2.211zm4.356 3.925l3.716 1.185-3.716 1.174v-2.359zm4.356 1.563l-4.356-1.376v4.963l4.356-1.376v-2.211zm4.356-1.563l-3.715 1.185 3.715 1.174v-2.359zm-4.356 1.563l4.356-1.376v4.963l-4.356-1.376v-2.211z"/>
          </svg>
        );
      case 'tiktok':
        return (
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
          </svg>
        );
      default:
        return <div className="w-8 h-8 bg-neutral-200 rounded" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
            {getIcon()}
          </div>
          <div>
            <h3 className="text-neutral-900 font-semibold text-lg">{title}</h3>
            <p className="text-neutral-500 text-sm">{ordersCount}</p>
          </div>
        </div>
        <button className="text-neutral-400 hover:text-neutral-600">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-end justify-between">
        <div className="text-3xl font-bold text-neutral-900">{amount}</div>
        <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
          <ArrowUpRight className="w-4 h-4" />
          <span>{percentage}</span>
        </div>
      </div>

      <button className="mt-4 text-neutral-600 text-sm hover:text-neutral-900 flex items-center gap-1 group">
        See detail
        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </button>
    </div>
  );
}
