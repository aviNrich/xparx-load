import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Plug,
  Database,
  GitBranch,
  History,
  HardDrive,
  Settings,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Plug, label: 'Connections', path: '/connections' },
  { icon: Database, label: 'Schemas', path: '/schemas' },
  { icon: GitBranch, label: 'Mappings', path: '/mappings' },
  { icon: History, label: 'Run History', path: '/runs' },
  { icon: HardDrive, label: 'Delta Lake', path: '/delta-lake' },
];

const bottomNavItems = [
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  return (
    <nav className="w-[60px] h-screen bg-white border-r border-neutral-200 flex flex-col items-center py-4 flex-shrink-0">
      <Link to="/" className="text-primary-500">
        <Sparkles className="h-6 w-6" />
      </Link>

      <div className="mt-8 flex flex-col items-center gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            title={item.label}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
                isActive
                  ? 'text-primary-600 bg-primary-50 relative before:absolute before:left-[-10px] before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[3px] before:bg-primary-500 before:rounded-r'
                  : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'
              )
            }
          >
            <item.icon className="h-5 w-5" />
          </NavLink>
        ))}
      </div>

      <div className="mt-auto flex flex-col items-center gap-1">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={item.label}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
                isActive
                  ? 'text-primary-600 bg-primary-50 relative before:absolute before:left-[-10px] before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[3px] before:bg-primary-500 before:rounded-r'
                  : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'
              )
            }
          >
            <item.icon className="h-5 w-5" />
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
