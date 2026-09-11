import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, KeyRound, Mail, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('password123');
    setError(null);
    // Directly submit
    setIsLoading(true);
    api.post('/auth/login', { email: quickEmail, password: 'password123' })
      .then((res) => {
        if (res.data.success) {
          login(res.data.token, res.data.user);
          navigate('/');
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Quick login failed.');
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-blue-600 items-center justify-center text-white shadow-xl shadow-blue-500/20 mb-3">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Mini ERP + CRM Portal</h1>
          <p className="text-sm text-slate-400 mt-1">Wholesale & Distribution Operations</p>
        </div>

        {/* Login Box */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-100">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Sign In</h2>
            <p className="text-xs text-slate-500 mt-1">Access role-based operational tools</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@minierp.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow-md shadow-blue-600/20 transition disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins for Evaluator */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>One-Click Role Logins (Case Study Evaluator):</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@minierp.com')}
                className="p-2 text-left rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 font-medium transition"
              >
                <span className="block font-bold">Admin</span>
                <span className="text-[10px] text-purple-700">admin@minierp.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('sales@minierp.com')}
                className="p-2 text-left rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 font-medium transition"
              >
                <span className="block font-bold">Sales</span>
                <span className="text-[10px] text-blue-700">sales@minierp.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('warehouse@minierp.com')}
                className="p-2 text-left rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 font-medium transition"
              >
                <span className="block font-bold">Warehouse</span>
                <span className="text-[10px] text-amber-700">warehouse@minierp.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('accounts@minierp.com')}
                className="p-2 text-left rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-medium transition"
              >
                <span className="block font-bold">Accounts</span>
                <span className="text-[10px] text-emerald-700">accounts@minierp.com</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2.5">
              Default password for all roles: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">password123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
