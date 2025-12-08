import React from 'react';
import { TrendingUp, ExternalLink } from 'lucide-react';

interface CategoryTab {
  id: string;
  label: string;
  icon?: string;
}

export function MarketDemands() {
  const categories: CategoryTab[] = [
    { id: 'fashion', label: 'Fashion', icon: '👕' },
    { id: 'home-decor', label: 'Home Decor', icon: '🏠' },
    { id: 'skin-care', label: 'Skin Care', icon: '💄' },
    { id: 'snacks', label: 'Snacks', icon: '🍿' },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Top Market Demands</h2>
          <p className="text-sm text-neutral-500 mt-1">The following are some market needs</p>
        </div>
        <button className="text-primary-600 text-sm hover:text-primary-700 flex items-center gap-1">
          See more
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((category, index) => (
          <button
            key={category.id}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
              index === 0
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {category.icon && <span>{category.icon}</span>}
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      {/* Chart Area */}
      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-neutral-400 pr-2">
          <span>Age 17 - 30</span>
        </div>

        {/* Chart content */}
        <div className="ml-16">
          {/* Metric Display */}
          <div className="flex items-baseline gap-3 mb-4">
            <div className="text-4xl font-bold text-neutral-900">12.000</div>
            <div className="flex items-center gap-1 text-green-600 text-sm font-medium bg-green-50 px-2 py-1 rounded">
              <TrendingUp className="w-3 h-3" />
              <span>17.3%</span>
            </div>
          </div>

          {/* Gradient Chart */}
          <div className="relative h-48 w-full">
            <svg viewBox="0 0 800 200" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="chartGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="chartGradient3" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="1" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              {/* First wave (lightest) */}
              <path
                d="M 0 100 Q 200 60, 400 80 T 800 90 L 800 200 L 0 200 Z"
                fill="url(#chartGradient1)"
              />

              {/* Second wave (medium) */}
              <path
                d="M 0 120 Q 200 80, 400 100 T 800 110 L 800 200 L 0 200 Z"
                fill="url(#chartGradient2)"
              />

              {/* Third wave (darkest) */}
              <path
                d="M 0 140 Q 200 100, 400 120 T 800 130 L 800 200 L 0 200 Z"
                fill="url(#chartGradient3)"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
