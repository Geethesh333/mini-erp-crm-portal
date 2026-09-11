import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  FileSpreadsheet,
  ArrowUpDown,
  Shield,
  LogOut,
  Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout, hasRole } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      label: 'Customer CRM',
      path: '/customers',
      icon: Users,
      visible: hasRole('ADMIN', 'SALES', 'ACCOUNTS'),
    },
    {
      label: 'Product Catalog',
      path: '/products',
      icon: Package,
      visible: hasRole('ADMIN', 'WAREHOUSE', 'SALES'),
    },
    {
      label: 'Stock Movements',
      path: '/stock-logs',
      icon: ArrowUpDown,
      visible: hasRole('ADMIN', 'WAREHOUSE'),
    },
    {
      label: 'Sales Challans',
      path: '/challans',
      icon: FileSpreadsheet,
      visible: true, // All roles can view challans according to permissions
    },
  ];

  const roleBadgeColors: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-800 border-purple-300',
    SALES: 'bg-blue-100 text-blue-800 border-blue-300',
    WAREHOUSE: 'bg-amber-100 text-amber-800 border-amber-300',
    ACCOUNTS: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">Mini ERP</h1>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">Operations Portal</p>
          </div>
        </div>
      </div>

      {/* User Role Card */}
      {user && (
        <div className="px-4 py-4 border-b border-slate-800/80 bg-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <span
                className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border mt-0.5 ${
                  roleBadgeColors[user.role] || 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {user.role} ROLE
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {navItems
          .filter((item) => item.visible)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/30">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
