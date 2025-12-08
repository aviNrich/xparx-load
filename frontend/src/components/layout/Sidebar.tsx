import React, { useState } from 'react';
import { LayoutDashboard, BarChart3, Lightbulb, Bell, Package,Map, ChevronDown, ChevronRight, Settings, MessageCircle, Database } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
}

export function Sidebar({ activeItem, onItemClick }: SidebarProps) {
  const [productsExpanded, setProductsExpanded] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const topMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { id: 'sources', label: 'Source Manager', icon: Database, path: '/sources' },
    { id: 'mappings', label: 'Mappings', icon: Map, path: '/mappings' },
  ];

  const bottomMenuItems = [
    { id: 'schema', label: 'Schema', icon: Bell, badge: '8', path:'/schema' },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'feedback', label: 'Feedback', icon: MessageCircle },
  ];

  // Combine all menu items and find the single active item
  const allMenuItems = [...topMenuItems, ...bottomMenuItems];
  const currentPath = location.pathname;

  // Find which item should be active based on current path or activeItem prop
  const activeMenuItemId = allMenuItems.find(item =>
    item.path ? item.path === currentPath : item.id === activeItem
  )?.id;

  const handleMenuClick = (item: typeof topMenuItems[0]) => {
    if (item.path) {
      navigate(item.path);
    } else {
      onItemClick(item.id);
    }
  };

  // const productCategories = [
  //   { id: 'fashion', label: 'Fashion' },
  //   { id: 'home-decor', label: 'Home Decor' },
  //   { id: 'skincare', label: 'Skincare' },
  //   { id: 'snacks', label: 'Snacks' },
  // ];

  return (
    <div className="w-56 h-screen bg-sidebar-bg border-r border-neutral-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-semibold text-neutral-900">Sparx Load</span>
        </div>
      </div>

      {/* New Source Button */}
      <div className="p-3">
        <button
          onClick={() => {
            navigate('/sources', { state: { openDialog: true } });
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors"
        >
          <span>+</span>
          <span>New Source</span>
        </button>
      </div>

      {/* Team Workspace Section */}
      <div className="px-3 mb-2">
        <div className="text-xs font-medium text-neutral-500 px-3 py-2">Team Workspace</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {topMenuItems.map((item) => {
            // Check if this item is the single active item
            const isActive = activeMenuItemId === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => handleMenuClick(item)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'bg-primary-500 text-white'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-primary-500 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}

          {/* Products with dropdown */}
          {/* <li>
            <button
              onClick={() => setProductsExpanded(!productsExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4" />
                <span>Products</span>
              </div>
              {productsExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {productsExpanded && (
              <ul className="ml-6 mt-1 space-y-1">
                {productCategories.map((category) => (
                  <li key={category.id}>
                    <button
                      onClick={() => onItemClick(category.id)}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                        activeItem === category.id
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      {category.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li> */}
        </ul>
      </nav>

      {/* General Section */}
      <div className="border-t border-neutral-200 p-3">
        <div className="text-xs font-medium text-neutral-500 px-3 py-2">Settings</div>
        <ul className="space-y-1">
          {bottomMenuItems.map((item) => {
            // Check if this item is the single active item
            const isActive = activeMenuItemId === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => handleMenuClick(item)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'bg-primary-500 text-white'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-primary-500 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* User Profile */}
      <div className="border-t border-neutral-200 p-3">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-medium">AA</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-neutral-900 truncate">Super user</div>
            <div className="text-xs text-neutral-500 truncate">admin@xparx.io</div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
