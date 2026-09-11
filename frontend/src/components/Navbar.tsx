import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export const Navbar: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
  const { user, login } = useAuth();

  const handleQuickSwitchRole = async (targetEmail: string) => {
    try {
      const res = await api.post('/auth/login', {
        email: targetEmail,
        password: 'password123',
      });
      if (res.data.success) {
        login(res.data.token, res.data.user);
      }
    } catch (err) {
      console.error('Quick switch error:', err);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-xl font-bold text-slate-900 leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Quick Role Switcher for Case Study Evaluators */}
        <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <span className="px-2 font-semibold text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Switch Role:
          </span>
          <button
            onClick={() => handleQuickSwitchRole('admin@minierp.com')}
            className={`px-2 py-1 rounded font-medium transition ${
              user?.role === 'ADMIN' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => handleQuickSwitchRole('sales@minierp.com')}
            className={`px-2 py-1 rounded font-medium transition ${
              user?.role === 'SALES' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sales
          </button>
          <button
            onClick={() => handleQuickSwitchRole('warehouse@minierp.com')}
            className={`px-2 py-1 rounded font-medium transition ${
              user?.role === 'WAREHOUSE' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Warehouse
          </button>
          <button
            onClick={() => handleQuickSwitchRole('accounts@minierp.com')}
            className={`px-2 py-1 rounded font-medium transition ${
              user?.role === 'ACCOUNTS' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Accounts
          </button>
        </div>

        {/* Live operational badge */}
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          System Live
        </div>
      </div>
    </header>
  );
};
