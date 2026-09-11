import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  ArrowUpDown,
  Edit2,
  X,
  AlertCircle,
  MapPin,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Badge } from '../components/Badge';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types';

export const ProductsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Add/Edit Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: 'Power Tools',
    unitPrice: 0,
    currentStock: 0,
    minStockAlert: 10,
    location: '',
  });
  const [productFormError, setProductFormError] = useState<string | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Adjust Stock Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    quantity: 1,
    movementType: 'IN' as 'IN' | 'OUT',
    reason: 'Purchase Inward Restock',
  });
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [isSavingAdjust, setIsSavingAdjust] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, lowStockFilter]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/products', {
        params: {
          search,
          category: categoryFilter,
          lowStock: lowStockFilter ? 'true' : 'false',
        },
      });
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      sku: '',
      category: 'Power Tools',
      unitPrice: 100,
      currentStock: 10,
      minStockAlert: 5,
      location: 'Warehouse A - Rack 01',
    });
    setProductFormError(null);
    setIsProductModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitPrice: p.unitPrice,
      currentStock: p.currentStock,
      minStockAlert: p.minStockAlert,
      location: p.location,
    });
    setProductFormError(null);
    setIsProductModalOpen(true);
  };

  const openAdjustModal = (p: Product) => {
    setAdjustingProduct(p);
    setAdjustForm({
      quantity: 5,
      movementType: 'IN',
      reason: 'Purchase Inward Restock',
    });
    setAdjustError(null);
    setIsAdjustModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductFormError(null);
    setIsSavingProduct(true);

    try {
      const payload = {
        name: productForm.name,
        sku: productForm.sku.toUpperCase(),
        category: productForm.category,
        unitPrice: Number(productForm.unitPrice),
        currentStock: Number(productForm.currentStock),
        minStockAlert: Number(productForm.minStockAlert),
        location: productForm.location,
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/products', payload);
      }

      setIsProductModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setProductFormError(err.response?.data?.message || 'Failed to save product.');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    setAdjustError(null);
    setIsSavingAdjust(true);

    try {
      await api.post(`/products/${adjustingProduct.id}/adjust-stock`, {
        quantity: Number(adjustForm.quantity),
        movementType: adjustForm.movementType,
        reason: adjustForm.reason,
      });

      setIsAdjustModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setAdjustError(err.response?.data?.message || 'Stock adjustment failed.');
    } finally {
      setIsSavingAdjust(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Navbar
        title="Product & Stock Management"
        subtitle="Catalog products, warehouse bins, stock alerts, and audit adjustments"
      />

      <main className="p-8 space-y-6">
        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product name, SKU, or warehouse location..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="Power Tools">Power Tools</option>
              <option value="Networking">Networking</option>
              <option value="Packaging Supplies">Packaging Supplies</option>
              <option value="Office Furniture">Office Furniture</option>
            </select>

            <button
              onClick={() => setLowStockFilter(!lowStockFilter)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                lowStockFilter
                  ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Low Stock Alerts Only</span>
            </button>
          </div>

          {hasRole('ADMIN', 'WAREHOUSE') && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow-sm transition flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          )}
        </div>

        {/* Product Catalog Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Product & SKU</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5 text-right">Unit Price</th>
                  <th className="px-6 py-3.5 text-center">Stock Level</th>
                  <th className="px-6 py-3.5">Warehouse Bin</th>
                  <th className="px-6 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs mt-2">Loading products...</p>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">{p.sku}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="neutral">{p.category}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-900">
                        ₹{p.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`text-base font-bold ${
                              p.isLowStock ? 'text-rose-600' : 'text-slate-900'
                            }`}
                          >
                            {p.currentStock} units
                          </span>
                          {p.isLowStock ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full mt-1 border border-rose-200">
                              <AlertTriangle className="w-3 h-3" /> Min: {p.minStockAlert}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              Alert threshold: {p.minStockAlert}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.location}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {hasRole('ADMIN', 'WAREHOUSE') && (
                            <button
                              onClick={() => openAdjustModal(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition"
                              title="Adjust Stock Quantity (IN / OUT)"
                            >
                              <ArrowUpDown className="w-3 h-3" />
                              <span>Adjust</span>
                            </button>
                          )}
                          {hasRole('ADMIN', 'WAREHOUSE') && (
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                              title="Edit Product Details"
                            >
                              <Edit2 className="w-4 h-4" />
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

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 my-8">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Edit Product Catalog Item' : 'Add New Inventory Product'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {productFormError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{productFormError}</span>
              </div>
            )}

            <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Heavy Duty Power Drill 750W"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    SKU / Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    placeholder="TOOL-DRL-001"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    placeholder="e.g. Power Tools"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Unit Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={productForm.unitPrice}
                    onChange={(e) => setProductForm({ ...productForm, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Min Stock Alert Qty *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.minStockAlert}
                    onChange={(e) => setProductForm({ ...productForm, minStockAlert: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {!editingProduct && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Initial Stock Count (Units)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.currentStock}
                    onChange={(e) => setProductForm({ ...productForm, currentStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Warehouse Location / Bin *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.location}
                  onChange={(e) => setProductForm({ ...productForm, location: e.target.value })}
                  placeholder="e.g. Warehouse A - Rack 04"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow transition disabled:opacity-50"
                >
                  {isSavingProduct ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && adjustingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Adjust Inventory Stock</h3>
                <p className="text-xs text-slate-500">{adjustingProduct.name} ({adjustingProduct.sku})</p>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {adjustError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{adjustError}</span>
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Current Stock in Warehouse:</span>
                <span className="text-sm font-bold text-slate-900">{adjustingProduct.currentStock} units</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Movement Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, movementType: 'IN' })}
                    className={`py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition ${
                      adjustForm.movementType === 'IN'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>+ Stock IN (Inward)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, movementType: 'OUT' })}
                    className={`py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition ${
                      adjustForm.movementType === 'OUT'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>- Stock OUT (Outward)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Reason for Adjustment *
                </label>
                <input
                  type="text"
                  required
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  placeholder="e.g. Purchase Inward, Cycle Count Audit, Damaged Unit"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAdjust}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50"
                >
                  {isSavingAdjust ? 'Updating...' : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
