import React, { useState, useEffect } from 'react';
import {
  ArrowUpDown,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  User,
  Package,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Badge } from '../components/Badge';
import { api } from '../services/api';
import { StockMovement } from '../types';

export const StockLogsPage: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchMovements();
  }, [typeFilter]);

  const fetchMovements = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/products/movements', {
        params: {
          movementType: typeFilter,
        },
      });
      if (res.data.success) {
        setMovements(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching stock movements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Navbar
        title="Stock Movement Audit Trail"
        subtitle="Complete log of inventory inward receipts, outward dispatches, and manual adjustments"
      />

      <main className="p-8 space-y-6">
        {/* Filters */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase">Movement Type:</span>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setTypeFilter('')}
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
                  typeFilter === '' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Movements
              </button>
              <button
                onClick={() => setTypeFilter('IN')}
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
                  typeFilter === 'IN' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Inward (IN)
              </button>
              <button
                onClick={() => setTypeFilter('OUT')}
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
                  typeFilter === 'OUT' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Outward (OUT)
              </button>
            </div>
          </div>
        </div>

        {/* Movements Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Product & SKU</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5 text-right">Quantity Changed</th>
                  <th className="px-6 py-3.5">Reason & Purpose</th>
                  <th className="px-6 py-3.5">Created By</th>
                  <th className="px-6 py-3.5">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs mt-2">Loading movement logs...</p>
                    </td>
                  </tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                      No stock movements recorded.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{m.product?.name}</p>
                        <p className="text-xs font-mono text-slate-400">{m.product?.sku}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            m.movementType === 'IN'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {m.movementType === 'IN' ? (
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          )}
                          <span>{m.movementType}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`font-mono text-sm font-bold ${
                            m.movementType === 'IN' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {m.movementType === 'IN' ? `+${m.quantity}` : `-${m.quantity}`} units
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">{m.reason}</td>
                      <td className="px-6 py-4 text-xs text-slate-600 flex items-center gap-1.5 mt-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{m.createdBy}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                        {new Date(m.createdAt).toLocaleString('en-GB')}
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
