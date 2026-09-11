import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  Building,
  Calendar,
  Clock,
  Plus,
  FileText,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Badge } from '../components/Badge';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Customer, CustomerFollowUp } from '../types';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Add Note Modal
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/customers/${id}`);
      if (res.data.success) {
        setCustomer(res.data.customer);
      }
    } catch (err) {
      console.error('Error fetching customer details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setNoteError(null);
    setIsSubmittingNote(true);

    try {
      await api.post(`/customers/${id}/notes`, {
        note: noteText,
        followUpDate: nextFollowUpDate || null,
      });
      setIsNoteModalOpen(false);
      setNoteText('');
      setNextFollowUpDate('');
      fetchCustomerDetails();
    } catch (err: any) {
      setNoteError(err.response?.data?.message || 'Failed to add follow-up note.');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Customer not found.</p>
        <Link to="/customers" className="text-blue-600 font-semibold mt-2 inline-block">
          Return to Customer CRM
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Navbar
        title={customer.businessName}
        subtitle={`Customer Profile • ${customer.customerType} • ${customer.status}`}
      />

      <main className="p-8 space-y-6">
        {/* Back Link */}
        <Link
          to="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Customers</span>
        </Link>

        {/* Customer Header Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-700 text-xl flex-shrink-0">
              {customer.businessName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900">{customer.businessName}</h2>
                <Badge variant={customer.status === 'Active' ? 'success' : customer.status === 'Lead' ? 'primary' : 'danger'}>
                  {customer.status}
                </Badge>
                <Badge variant="purple">{customer.customerType}</Badge>
              </div>
              <p className="text-sm text-slate-600 font-medium mt-1">Contact: {customer.customerName}</p>
              <p className="text-xs text-slate-400 mt-0.5">{customer.address}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Mobile</p>
              <p className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-blue-500" />
                {customer.mobileNumber}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Email</p>
              <p className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                {customer.email}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">GSTIN</p>
              <p className="font-mono text-slate-800 mt-0.5 font-semibold">
                {customer.gstNumber || 'N/A'}
              </p>
            </div>
            {hasRole('ADMIN', 'SALES') && (
              <button
                onClick={() => setIsNoteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Follow-up Note</span>
              </button>
            )}
          </div>
        </div>

        {/* 2 Column Details: Follow-ups Timeline + Order Challans */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CRM Follow-Up Notes Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">CRM Follow-Up History</h3>
              </div>
              {hasRole('ADMIN', 'SALES') && (
                <button
                  onClick={() => setIsNoteModalOpen(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Note</span>
                </button>
              )}
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto">
              {!customer.followUps || customer.followUps.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No follow-up notes logged yet.
                </div>
              ) : (
                customer.followUps.map((fu) => (
                  <div key={fu.id} className="relative pl-6 pb-4 border-l-2 border-blue-200 last:border-0 last:pb-0">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white"></div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                      <p className="text-xs text-slate-800 font-medium leading-relaxed">{fu.note}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-600">Logged by: {fu.createdBy}</span>
                        <span>{new Date(fu.createdAt).toLocaleString('en-GB')}</span>
                      </div>
                      {fu.followUpDate && (
                        <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                          <Calendar className="w-3 h-3" />
                          <span>Next Follow-up scheduled: {new Date(fu.followUpDate).toLocaleDateString('en-GB')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Customer Sales Challans */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Sales Challans</h3>
              </div>
              {hasRole('ADMIN', 'SALES') && (
                <Link
                  to="/challans/new"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Challan</span>
                </Link>
              )}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto">
              {!customer.challans || customer.challans.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No sales challans recorded for this customer yet.
                </div>
              ) : (
                customer.challans.map((ch) => (
                  <div
                    key={ch.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between hover:bg-slate-100 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{ch.challanNumber}</span>
                        <Badge
                          variant={
                            ch.status === 'Confirmed'
                              ? 'success'
                              : ch.status === 'Draft'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {ch.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {ch.totalQuantity} items • Date: {new Date(ch.createdDate).toLocaleDateString('en-GB')}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">₹{ch.totalAmount.toLocaleString('en-IN')}</p>
                      <Link
                        to={`/challans/${ch.id}`}
                        className="text-[11px] font-semibold text-blue-600 hover:underline mt-0.5 inline-block"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Follow-Up Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Record Follow-up Note</h3>
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {noteError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{noteError}</span>
              </div>
            )}

            <form onSubmit={handleAddNote} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Follow-up Notes / Discussion Summary *
                </label>
                <textarea
                  rows={4}
                  required
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="e.g. Spoke with client regarding new stock arrivals. Requested quotation for 50 units."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Next Follow-up Date (Optional)
                </label>
                <input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNote}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50"
                >
                  {isSubmittingNote ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
