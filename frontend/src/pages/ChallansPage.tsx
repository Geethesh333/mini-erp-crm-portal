import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  Search,
  Plus,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  FileDown,
  Building,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Badge } from '../components/Badge';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SalesChallan } from '../types';

export const ChallansPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [challans, setChallans] = useState<SalesChallan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchChallans();
  }, [search, statusFilter]);

  const fetchChallans = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/challans', {
        params: { search, status: statusFilter },
      });
      if (res.data.success) {
        setChallans(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching challans:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    if (!window.confirm('Are you sure you want to confirm and dispatch this Challan? Stock will be reduced.')) return;
    setActionError(null);
    try {
      await api.post(`/challans/${id}/confirm`);
      fetchChallans();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to confirm challan.');
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this Challan?')) return;
    setActionError(null);
    try {
      await api.post(`/challans/${id}/cancel`);
      fetchChallans();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to cancel challan.');
    }
  };

  const downloadPDF = (id: string, challanNumber: string) => {
    const token = localStorage.getItem('token');
    const url = `http://localhost:5000/api/challans/${id}/pdf`;
    window.open(url, '_blank');
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
        title="Sales Challans & Dispatch"
        subtitle="Manage dispatch documentation, order line snapshots, stock decrement, and invoice PDF exports"
      />

      <main className="p-8 space-y-6">
        {actionError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-rose-600 hover:text-rose-800 text-xs font-bold">
              Dismiss
            </button>
          </div>
        )}

        {/* Filters and New Challan Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Challan #, customer name, business..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {hasRole('ADMIN', 'SALES') && (
            <Link
              to="/challans/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow-sm transition flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Sales Challan</span>
            </Link>
          )}
        </div>

        {/* Challans Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Challan #</th>
                  <th className="px-6 py-3.5">Customer / Business</th>
                  <th className="px-6 py-3.5 text-center">Items Qty</th>
                  <th className="px-6 py-3.5 text-right">Total Amount</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Created Date & By</th>
                  <th className="px-6 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs mt-2">Loading sales challans...</p>
                    </td>
                  </tr>
                ) : challans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                      No sales challans recorded.
                    </td>
                  </tr>
                ) : (
                  challans.map((ch) => (
                    <tr key={ch.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-bold text-slate-900 font-mono">
                        {ch.challanNumber}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">{ch.customer.businessName}</p>
                        <p className="text-xs text-slate-400">{ch.customer.customerName}</p>
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-800">
                        {ch.totalQuantity} units
                        <p className="text-[11px] text-slate-400 font-normal">
                          {ch.items?.length || 0} line items
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">
                        ₹{ch.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(ch.status)}</td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-800 font-medium">
                          {new Date(ch.createdDate).toLocaleDateString('en-GB')}
                        </p>
                        <p className="text-[11px] text-slate-400">By {ch.createdBy}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            to={`/challans/${ch.id}`}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View Challan Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => downloadPDF(ch.id, ch.challanNumber)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            title="Download PDF Invoice"
                          >
                            <FileDown className="w-4 h-4 text-indigo-600" />
                          </button>

                          {ch.status === 'Draft' && hasRole('ADMIN', 'SALES', 'WAREHOUSE') && (
                            <button
                              onClick={() => handleConfirm(ch.id)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Confirm Challan (Reduces Stock)"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          {ch.status !== 'Cancelled' && hasRole('ADMIN', 'SALES') && (
                            <button
                              onClick={() => handleCancel(ch.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Cancel Challan"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
