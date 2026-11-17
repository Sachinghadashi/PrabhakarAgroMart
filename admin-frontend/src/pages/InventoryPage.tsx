import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/adminApi';
import { InventoryItem, InventoryTransaction } from '../types';
import { 
  Boxes, 
  Search, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  SlidersHorizontal,
  RefreshCw,
  PlusCircle,
  FileSpreadsheet
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'transactions'>('inventory');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Adjustment Modal
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentDiff, setAdjustmentDiff] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getInventory(statusFilter || undefined);
      setInventory(data);
    } catch (err: any) {
      console.error('Failed to load inventory', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getInventoryTransactions();
      setTransactions(data);
    } catch (err: any) {
      console.error('Failed to load transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'inventory') {
      fetchInventory();
    } else {
      fetchTransactions();
    }
  }, [activeTab, statusFilter]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustError('');

    if (!selectedItem) return;
    if (adjustmentDiff === 0) {
      setAdjustError('Adjustment quantity cannot be 0.');
      return;
    }
    if (!adjustmentReason.trim()) {
      setAdjustError('A mandatory reason is required for compliance and audit logs.');
      return;
    }

    try {
      setSubmitting(true);
      await adminApi.adjustInventory({
        variant_id: selectedItem.variant,
        quantity_diff: adjustmentDiff,
        reason: adjustmentReason.trim(),
      });
      setSelectedItem(null);
      setAdjustmentDiff(0);
      setAdjustmentReason('');
      fetchInventory();
    } catch (err: any) {
      setAdjustError(err.response?.data?.error || 'Failed to apply inventory adjustment.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredInventory = inventory.filter((item) =>
    item.product_name.toLowerCase().includes(search.toLowerCase()) ||
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-emerald-600" />
            Inventory & Warehouse Control
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time stock reservation, low-stock threshold triggers, and audit-logged manual adjustments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={adminApi.getInventoryExportCSVUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Inventory CSV
          </a>
          <button
            onClick={() => (activeTab === 'inventory' ? fetchInventory() : fetchTransactions())}
            className="p-2 border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-50 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 flex items-center gap-2 transition ${
            activeTab === 'inventory'
              ? 'border-b-2 border-emerald-600 text-emerald-700 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Stock Levels ({inventory.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 flex items-center gap-2 transition ${
            activeTab === 'transactions'
              ? 'border-b-2 border-emerald-600 text-emerald-700 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          Audit Movement History
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search SKU or product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Stock Statuses</option>
                <option value="low_stock">Low Stock Alerts Only</option>
                <option value="out_of_stock">Out of Stock Only</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600" />
                Loading warehouse inventory...
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Boxes className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="font-medium">No inventory records matching your query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-4">SKU / Code</th>
                      <th className="py-3 px-4">Agricultural Product</th>
                      <th className="py-3 px-4">Pack Size</th>
                      <th className="py-3 px-4 text-right">Physical Stock</th>
                      <th className="py-3 px-4 text-right">Reserved (Active Carts/Orders)</th>
                      <th className="py-3 px-4 text-right font-bold text-slate-900">Available Stock</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredInventory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono text-xs text-slate-600 font-medium">
                          {item.sku}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{item.product_name}</div>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-slate-600">
                          {item.pack_display}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">
                          {item.current_stock}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-amber-600 font-medium">
                          {item.reserved_stock > 0 ? `-${item.reserved_stock}` : '0'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {item.available_stock}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.is_out_of_stock ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Out of Stock
                            </span>
                          ) : item.is_low_stock ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Low Stock Alert
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                              Healthy
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setAdjustmentDiff(0);
                              setAdjustmentReason('');
                              setAdjustError('');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
                          >
                            <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
                            Adjust
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Transactions Tab */
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600" />
              Loading audit transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <History className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No stock movement transactions recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Variant SKU</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Quantity</th>
                    <th className="py-3 px-4">Mandatory Reason</th>
                    <th className="py-3 px-4">Order Ref</th>
                    <th className="py-3 px-4">Authorized By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-700">
                        {tx.variant_sku}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${
                          tx.transaction_type === 'STOCK_IN' || tx.quantity > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {tx.quantity > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                        {tx.reason}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        {tx.reference_order || '—'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 font-medium">
                        {tx.performed_by_name || 'System / Batch'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Manual Inventory Adjustment Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in duration-150">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Manual Stock Adjustment</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedItem.sku} • {selectedItem.pack_display}</p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
              {adjustError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {adjustError}
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Current Stock:</span>{' '}
                  <span className="font-bold font-mono text-slate-900">{selectedItem.current_stock}</span>
                </div>
                <div>
                  <span className="text-slate-500">New Result:</span>{' '}
                  <span className="font-bold font-mono text-emerald-700">
                    {selectedItem.current_stock + (Number(adjustmentDiff) || 0)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Quantity Adjustment (+/- units) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    placeholder="+25 or -5"
                    value={adjustmentDiff || ''}
                    onChange={(e) => setAdjustmentDiff(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter positive number to add stock (e.g. supplier delivery), or negative to decrement (damage/audit write-off).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Mandatory Adjustment Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Received shipment PO-4091 from Bayer Solapur depot, or Damaged during transit inspection..."
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Committing...' : 'Commit Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
