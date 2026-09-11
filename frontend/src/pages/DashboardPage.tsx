import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Package,
  AlertTriangle,
  FileSpreadsheet,
  IndianRupee,
  PlusCircle,
  ArrowRight,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DashboardMetrics, SalesChallan, StockMovement } from '../types';

export const DashboardPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentChallans, setRecentChallans] = useState<SalesChallan[]>([]);
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/dashboard');
      if (res.data.success) {
        setMetrics(res.data.metrics);
        setRecentChallans(res.data.recentChallans);
        setRecentMovements(res.data.recentMovements);
      }
    } catch (err) {
      console.error('Error loading dashboard metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return <Badge variant="success">Confirmed</Badge>;
      case 'Draft':
        return <Badge variant="warning">Draft</Badge>;
      case 'Cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Navbar
        title={`Welcome back, ${user?.name}`}
        subtitle={`Wholesale Operations Dashboard | Logged in as ${user?.role}`}
      />

      <main className="p-8 space-y-8">
        {/* Quick Action Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold">Wholesale Operations Hub</h3>
            <p className="text-blue-100 text-sm mt-1">
              Manage customers, oversee stock levels, and generate sales dispatch challans with zero negative stock errors.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {hasRole('ADMIN', 'SALES') && (
              <Link
                to="/challans/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-semibold rounded-lg text-sm shadow transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Sales Challan</span>
              </Link>
            )}
            {hasRole('ADMIN', 'SALES') && (
              <Link
                to="/customers"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-800/80 hover:bg-blue-800 text-white font-semibold rounded-lg text-sm border border-blue-500/40 transition"
              >
                <Users className="w-4 h-4" />
                <span>Customer CRM</span>
              </Link>
            )}
            {hasRole('ADMIN', 'WAREHOUSE') && (
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-800/80 hover:bg-blue-800 text-white font-semibold rounded-lg text-sm border border-blue-500/40 transition"
              >
                <Package className="w-4 h-4" />
                <span>Stock Management</span>
              </Link>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Customers"
            value={metrics?.totalCustomers ?? '...'}
            icon={Users}
            color="blue"
            subtitle="Wholesale, Retail & Leads"
          />
          <StatCard
            title="Product Catalog"
            value={metrics?.totalProducts ?? '...'}
            icon={Package}
            color="purple"
            subtitle="Active inventory items"
          />
          <StatCard
            title="Low Stock Alerts"
            value={metrics?.lowStockCount ?? '...'}
            icon={AlertTriangle}
            color={metrics && metrics.lowStockCount > 0 ? 'rose' : 'emerald'}
            subtitle={metrics && metrics.lowStockCount > 0 ? 'Needs reorder attention' : 'Stock levels healthy'}
          />
          <StatCard
            title="Gross Challan Value"
            value={metrics ? `₹${metrics.totalRevenue.toLocaleString('en-IN')}` : '...'}
            icon={IndianRupee}
            color="emerald"
            subtitle={`${metrics?.totalChallans ?? 0} Challans generated`}
          />
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Sales Challans (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Sales Challans</h3>
                <p className="text-xs text-slate-500">Latest dispatch records & customer orders</p>
              </div>
              <Link
                to="/challans"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Challan #</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentChallans.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-xs">
                        No challans recorded yet.
                      </td>
                    </tr>
                  ) : (
                    recentChallans.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-3.5 font-semibold text-slate-900">{c.challanNumber}</td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-slate-800">{c.customer.businessName}</p>
                          <p className="text-xs text-slate-400">{c.customer.customerName}</p>
                        </td>
                        <td className="px-5 py-3.5">{getStatusBadge(c.status)}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-slate-900">
                          ₹{c.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <Link
                            to={`/challans/${c.id}`}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition"
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Stock Movement Stream (1 Col) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Stock Audit Log</h3>
                <p className="text-xs text-slate-500">Live inventory IN/OUT stream</p>
              </div>
              <Link
                to="/stock-logs"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>Logs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-5 flex-1 space-y-4 overflow-y-auto">
              {recentMovements.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No stock movements recorded.</p>
              ) : (
                recentMovements.map((m) => (
                  <div key={m.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white ${
                        m.movementType === 'IN' ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    >
                      {m.movementType === 'IN' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {m.product?.name || 'Item'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{m.reason}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(m.createdAt).toLocaleDateString('en-GB')}</span>
                        <span>•</span>
                        <span>By {m.createdBy}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-bold ${
                          m.movementType === 'IN' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {m.movementType === 'IN' ? `+${m.quantity}` : `-${m.quantity}`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
