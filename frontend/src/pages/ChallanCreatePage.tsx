import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Building,
  Package,
  IndianRupee,
  FileCheck,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { api } from '../services/api';
import { Customer, Product } from '../types';

interface LineItemForm {
  productId: string;
  quantity: number;
}

export const ChallanCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItemForm[]>([
    { productId: '', quantity: 1 },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any[] | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [custRes, prodRes] = await Promise.all([
        api.get('/customers?limit=100'),
        api.get('/products?limit=100'),
      ]);

      if (custRes.data.success) {
        setCustomers(custRes.data.data);
        if (custRes.data.data.length > 0) {
          setSelectedCustomerId(custRes.data.data[0].id);
        }
      }

      if (prodRes.data.success) {
        setProducts(prodRes.data.data);
        if (prodRes.data.data.length > 0) {
          setItems([{ productId: prodRes.data.data[0].id, quantity: 1 }]);
        }
      }
    } catch (err) {
      console.error('Error loading initial form data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addItemRow = () => {
    const defaultProdId = products.length > 0 ? products[0].id : '';
    setItems([...items, { productId: defaultProdId, quantity: 1 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, field: keyof LineItemForm, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Helper map for fast lookup
  const productMap = new Map(products.map((p) => [p.id, p]));
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Calculations
  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalAmount = items.reduce((sum, item) => {
    const prod = productMap.get(item.productId);
    const price = prod?.unitPrice || 0;
    return sum + price * (Number(item.quantity) || 0);
  }, 0);

  const handleSubmit = async (targetStatus: 'Draft' | 'Confirmed') => {
    setErrorMessage(null);
    setErrorDetails(null);

    // Validation
    if (!selectedCustomerId) {
      setErrorMessage('Please select a customer for this challan.');
      return;
    }

    if (items.length === 0 || items.some((i) => !i.productId || i.quantity <= 0)) {
      setErrorMessage('Please ensure each product item has a valid product and positive quantity.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/challans', {
        customerId: selectedCustomerId,
        status: targetStatus,
        notes: notes.trim() || null,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity),
        })),
      });

      if (res.data.success) {
        navigate(`/challans/${res.data.challan.id}`);
      }
    } catch (err: any) {
      const responseData = err.response?.data;
      setErrorMessage(responseData?.message || 'Failed to create sales challan.');
      if (responseData?.details) {
        setErrorDetails(responseData.details);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Navbar
        title="Create Sales Challan"
        subtitle="Automatic numbering • Product price snapshots • Atomic stock decrement logic"
      />

      <main className="p-8 space-y-6 max-w-6xl mx-auto w-full">
        {/* Top Back Nav */}
        <div className="flex items-center justify-between">
          <Link
            to="/challans"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Challans</span>
          </Link>
          <div className="text-xs text-slate-500 font-mono">
            Challan No: <span className="font-bold text-blue-600">AUTO-GENERATED ON SAVE</span>
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
            {errorDetails && (
              <ul className="list-disc list-inside text-xs space-y-1 pl-7 text-rose-700">
                {errorDetails.map((det, idx) => (
                  <li key={idx}>
                    <span className="font-semibold">{det.product} ({det.sku})</span>: Requested{' '}
                    <span className="font-bold">{det.requested}</span> units, but only{' '}
                    <span className="font-bold">{det.available}</span> in stock.
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Selection Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                <span>1. Select Customer Account</span>
              </h3>

              <div>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.businessName} ({c.customerName}) — {c.customerType} [{c.status}]
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomer && (
                <div className="p-3.5 bg-blue-50/50 rounded-lg border border-blue-100 text-xs grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 font-semibold">Contact:</span> {selectedCustomer.customerName}
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">Phone:</span> {selectedCustomer.mobileNumber}
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">GSTIN:</span> {selectedCustomer.gstNumber || 'Unregistered'}
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">Address:</span> {selectedCustomer.address}
                  </div>
                </div>
              )}
            </div>

            {/* Products Line Items Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>2. Product Line Items (Snapshots)</span>
                </h3>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => {
                  const prod = productMap.get(item.productId);
                  const isExceedingStock = prod ? item.quantity > prod.currentStock : false;
                  const lineSubtotal = (prod?.unitPrice || 0) * (item.quantity || 0);

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border transition ${
                        isExceedingStock
                          ? 'border-rose-300 bg-rose-50/30'
                          : 'border-slate-200 bg-slate-50/60'
                      }`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        {/* Product Dropdown (6 cols) */}
                        <div className="md:col-span-6">
                          <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                            Product
                          </label>
                          <select
                            value={item.productId}
                            onChange={(e) => updateItemRow(index, 'productId', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku}) — Stock: {p.currentStock}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity (2 cols) */}
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                            Qty
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemRow(index, 'quantity', parseInt(e.target.value) || 0)}
                            className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 ${
                              isExceedingStock ? 'border-rose-400 text-rose-700' : 'border-slate-200'
                            }`}
                          />
                        </div>

                        {/* Unit Price Snapshot (2 cols) */}
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                            Unit Price
                          </label>
                          <div className="px-3 py-2 bg-slate-100 rounded-lg text-xs font-mono text-slate-700 border border-slate-200">
                            ₹{prod?.unitPrice.toFixed(2) || '0.00'}
                          </div>
                        </div>

                        {/* Subtotal & Delete (2 cols) */}
                        <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-3 pt-4 md:pt-0">
                          <div className="text-right">
                            <label className="block text-[10px] font-semibold text-slate-400 uppercase">
                              Subtotal
                            </label>
                            <span className="text-xs font-bold text-slate-900">
                              ₹{lineSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItemRow(index)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Stock warning notice */}
                      {prod && (
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">
                            Available in warehouse: <strong className="text-slate-800">{prod.currentStock} units</strong> ({prod.location})
                          </span>
                          {isExceedingStock && (
                            <span className="text-rose-600 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Insufficient stock (Deduction will be blocked if Confirmed)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
                Dispatch / Challan Remarks (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Dispatched via Vehicle No MH-04-1234. Standard payment terms: 15 days."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Order Summary & Actions Panel (1 Col) */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 sticky top-24">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Challan Summary
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Line Items:</span>
                  <span className="font-semibold text-slate-900">{items.length}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Total Quantity:</span>
                  <span className="font-semibold text-slate-900">{totalQuantity} units</span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-base">Total Value:</span>
                  <span className="font-extrabold text-blue-700 text-xl">
                    ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit('Confirmed')}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Confirm & Dispatch</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit('Draft')}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition disabled:opacity-50"
                >
                  Save as Draft Order
                </button>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Business Rules:
                </p>
                <p>• <strong>Confirmed:</strong> Stock is reduced atomically. Stock cannot go negative.</p>
                <p>• <strong>Draft:</strong> Saves line items snapshot without deducting warehouse stock.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
