import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileDown,
  CheckCircle,
  XCircle,
  Building,
  Calendar,
  User,
  AlertCircle,
  Package,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Badge } from '../components/Badge';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SalesChallan } from '../types';

export const ChallanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();

  const [challan, setChallan] = useState<SalesChallan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchChallan();
  }, [id]);

  const fetchChallan = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/challans/${id}`);
      if (res.data.success) {
        setChallan(res.data.challan);
      }
    } catch (err) {
      console.error('Error fetching challan details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!window.confirm('Confirm this challan? Stock will be reduced from inventory.')) return;
    setActionError(null);
    setErrorDetails(null);
    setIsProcessing(true);

    try {
      await api.post(`/challans/${id}/confirm`);
      fetchChallan();
    } catch (err: any) {
      const resp = err.response?.data;
      setActionError(resp?.message || 'Failed to confirm challan.');
      if (resp?.details) setErrorDetails(resp.details);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this challan? If confirmed, items will be restocked.')) return;
    setActionError(null);
    setErrorDetails(null);
    setIsProcessing(true);

    try {
      await api.post(`/challans/${id}/cancel`);
      fetchChallan();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to cancel challan.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPDF = () => {
    window.open(`http://localhost:5000/api/challans/${id}/pdf`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!challan) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Sales Challan not found.</p>
        <Link to="/challans" className="text-blue-600 font-semibold mt-2 inline-block">
          Return to Challans List
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Navbar
        title={`Challan: ${challan.challanNumber}`}
        subtitle={`Dispatched to ${challan.customer.businessName} • Status: ${challan.status}`}
      />

      <main className="p-8 space-y-6 max-w-5xl mx-auto w-full">
        {/* Nav & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            to="/challans"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Challans</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={downloadPDF}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs border border-indigo-200 shadow-sm transition"
            >
              <FileDown className="w-4 h-4" />
              <span>Download PDF Invoice</span>
            </button>

            {challan.status === 'Draft' && hasRole('ADMIN', 'SALES', 'WAREHOUSE') && (
              <button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow transition disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm & Deduct Stock</span>
              </button>
            )}

            {challan.status !== 'Cancelled' && hasRole('ADMIN', 'SALES') && (
              <button
                onClick={handleCancel}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-xs border border-rose-200 transition disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel Challan</span>
              </button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {actionError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              <span>{actionError}</span>
            </div>
            {errorDetails && (
              <ul className="list-disc list-inside text-xs space-y-1 pl-7 text-rose-700">
                {errorDetails.map((det, idx) => (
                  <li key={idx}>
                    <strong>{det.product} ({det.sku})</strong>: Requested {det.requested}, Available: {det.available}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Meta Info Box */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Sales Challan Document
              </span>
              <h2 className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                {challan.challanNumber}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">Document Status:</span>
              <Badge
                variant={
                  challan.status === 'Confirmed'
                    ? 'success'
                    : challan.status === 'Draft'
                    ? 'warning'
                    : 'danger'
                }
                size="md"
              >
                {challan.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-sm">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Customer / Billed To</p>
              <p className="font-bold text-slate-900 text-base">{challan.customer.businessName}</p>
              <p className="text-xs text-slate-600 mt-0.5">Contact: {challan.customer.customerName}</p>
              <p className="text-xs text-slate-500 mt-0.5">Phone: {challan.customer.mobileNumber}</p>
              <p className="text-xs text-slate-500">{challan.customer.email}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Dispatch Details</p>
              <p className="text-xs text-slate-700 flex items-center gap-1.5 mt-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Date: {new Date(challan.createdDate).toLocaleDateString('en-GB')}</span>
              </p>
              <p className="text-xs text-slate-700 flex items-center gap-1.5 mt-1">
                <User className="w-4 h-4 text-slate-400" />
                <span>Created By: {challan.createdBy}</span>
              </p>
              <p className="text-xs text-slate-700 flex items-center gap-1.5 mt-1">
                <Building className="w-4 h-4 text-slate-400" />
                <span>GST: {challan.customer.gstNumber || 'Not registered'}</span>
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Remarks & Notes</p>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                {challan.notes || 'No specific dispatch remarks logged.'}
              </p>
            </div>
          </div>
        </div>

        {/* Snapshot Items Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <span>Snapshot Product Line Items</span>
            </h3>
            <span className="text-xs text-slate-500">Immutable captured unit prices</span>
          </div>

          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100/70 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Product Name</th>
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3 text-right">Unit Price</th>
                <th className="px-6 py-3 text-center">Quantity</th>
                <th className="px-6 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {challan.items.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-4 text-slate-400 text-xs">{index + 1}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{item.productName}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.productSku}</td>
                  <td className="px-6 py-4">
                    <Badge variant="neutral">{item.category}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right font-mono">
                    ₹{item.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-800">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900 font-mono">
                    ₹{item.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
              <tr>
                <td colSpan={5} className="px-6 py-4 text-right uppercase text-xs tracking-wider">
                  Total Order Quantity & Value:
                </td>
                <td className="px-6 py-4 text-center font-black text-blue-700">
                  {challan.totalQuantity} units
                </td>
                <td className="px-6 py-4 text-right font-black text-blue-700 text-base">
                  ₹{challan.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </main>
    </div>
  );
};
