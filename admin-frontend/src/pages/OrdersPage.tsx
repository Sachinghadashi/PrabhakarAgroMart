import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/adminApi';
import { Order } from '../types';
import { 
  ShoppingBag, 
  Search, 
  SlidersHorizontal, 
  RefreshCw, 
  Eye, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Package, 
  IndianRupee,
  FileText,
  AlertCircle
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200',
  PACKED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  SHIPPED: 'bg-purple-50 text-purple-700 border-purple-200',
  OUT_FOR_DELIVERY: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  DELIVERED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
  REFUNDED: 'bg-slate-100 text-slate-700 border-slate-300',
};

const NEXT_STATUSES: Record<string, string[]> = {
  PENDING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: ['RETURN_REQUESTED'],
  RETURN_REQUESTED: ['RETURNED', 'REFUNDED'],
  CANCELLED: [],
  RETURNED: ['REFUNDED'],
  REFUNDED: [],
};

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  // Selected Order for Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierName, setCourierName] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (paymentFilter) params.payment_status = paymentFilter;

      const res = await adminApi.getOrders(params);
      setOrders(res.results);
    } catch (err: any) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, paymentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleStatusTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !targetStatus) return;

    if (targetStatus === 'SHIPPED' && (!trackingNumber.trim() || !courierName.trim())) {
      setActionError('Courier name and Tracking/AWB number are mandatory when marking an order as SHIPPED.');
      return;
    }

    try {
      setTransitioning(true);
      setActionError('');
      const updated = await adminApi.transitionOrderStatus(selectedOrder.id, {
        target_status: targetStatus,
        tracking_number: trackingNumber.trim() || undefined,
        courier_name: courierName.trim() || undefined,
      });

      setSelectedOrder(updated);
      setTargetStatus('');
      fetchOrders();
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to update order status transition.');
    } finally {
      setTransitioning(false);
    }
  };

  const handleCollectCOD = async () => {
    if (!selectedOrder) return;
    if (!window.confirm(`Confirm collection of cash payment of ₹${selectedOrder.total_amount} for Order #${selectedOrder.order_number}?`)) {
      return;
    }

    try {
      setTransitioning(true);
      setActionError('');
      await adminApi.markCODCollected(selectedOrder.id);
      setSelectedOrder({ ...selectedOrder, payment_status: 'PAID' });
      fetchOrders();
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to record COD collection.');
    } finally {
      setTransitioning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-emerald-600" />
            Order Fulfillment Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Dispatch verification, logistics AWB tracking, status lifecycle controls, and COD collection logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="p-2 border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-50 transition"
            title="Refresh orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Order # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Fulfillment Statuses</option>
              <option value="PENDING_PAYMENT">Pending Payment</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="PACKED">Packed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Payment States</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending (COD/Gateway)</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600" />
            Loading customer orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Package className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No orders found matching the filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Order Number</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-center">Fulfillment Status</th>
                  <th className="py-3 px-4 text-center">Payment</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900 text-xs">{order.order_number}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{order.items_count} items</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 text-xs">{order.customer_name}</div>
                      <div className="text-[11px] text-slate-500">{order.customer_email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded ${
                        order.payment_status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : order.payment_status === 'FAILED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {order.payment_method === 'COD' ? 'COD • ' : 'ONLINE • '}
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{order.total_amount}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setTargetStatus('');
                          setTrackingNumber(order.tracking_number || '');
                          setCourierName(order.courier_name || '');
                          setActionError('');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details & Transition Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900">Order #{selectedOrder.order_number}</h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[selectedOrder.status]}`}>
                    {selectedOrder.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Placed on {new Date(selectedOrder.created_at).toLocaleString()} • Customer: {selectedOrder.customer_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {actionError}
                </div>
              )}

              {/* Status Controls */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Fulfillment Lifecycle Transition
                </h4>

                {NEXT_STATUSES[selectedOrder.status]?.length > 0 ? (
                  <form onSubmit={handleStatusTransition} className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {NEXT_STATUSES[selectedOrder.status].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setTargetStatus(status)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                            targetStatus === status
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          → Transition to {status.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>

                    {targetStatus === 'SHIPPED' && (
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Courier Partner *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. DTDC, Delhivery, VRL Logistics"
                            value={courierName}
                            onChange={(e) => setCourierName(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Tracking / AWB Number *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="AWB12345678"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    )}

                    {targetStatus && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={transitioning}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                        >
                          {transitioning ? 'Updating...' : `Confirm: Mark as ${targetStatus.replace(/_/g, ' ')}`}
                        </button>
                      </div>
                    )}
                  </form>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Order is in terminal state ({selectedOrder.status}). No further forward transitions allowed.
                  </p>
                )}
              </div>

              {/* COD Payment Collection */}
              {selectedOrder.payment_method === 'COD' && selectedOrder.payment_status === 'PENDING' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">Cash on Delivery Pending Collection</h4>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Customer must pay ₹{selectedOrder.total_amount} in cash upon field delivery.
                    </p>
                  </div>
                  <button
                    onClick={handleCollectCOD}
                    disabled={transitioning}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                  >
                    Mark Cash Collected
                  </button>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Line Items
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="py-2.5 px-3">Item & Pack</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-900">{item.product_name}</span>
                            <span className="text-slate-500 block text-[11px]">{item.pack_size}</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">{item.sku}</td>
                          <td className="py-2.5 px-3 text-right font-mono">₹{item.unit_price}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-semibold">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹{item.total_price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Address & Summary Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                    Delivery Address
                  </h4>
                  <p className="font-semibold text-slate-900">{selectedOrder.shipping_address?.recipient_name}</p>
                  <p className="text-slate-600">{selectedOrder.shipping_address?.phone_number}</p>
                  <p className="text-slate-600">{selectedOrder.shipping_address?.address_line1}</p>
                  {selectedOrder.shipping_address?.address_line2 && (
                    <p className="text-slate-600">{selectedOrder.shipping_address?.address_line2}</p>
                  )}
                  <p className="text-slate-600">
                    {selectedOrder.shipping_address?.village_or_town}, {selectedOrder.shipping_address?.district},{' '}
                    {selectedOrder.shipping_address?.state} - <span className="font-mono font-bold">{selectedOrder.shipping_address?.pin_code}</span>
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 font-mono">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] font-sans mb-1">
                    Authoritative Financials
                  </h4>
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>₹{selectedOrder.subtotal}</span>
                  </div>
                  {Number(selectedOrder.discount_amount) > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount Applied:</span>
                      <span>-₹{selectedOrder.discount_amount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping Charges:</span>
                    <span>₹{selectedOrder.shipping_charge}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (5% Agricultural):</span>
                    <span>₹{selectedOrder.tax_amount}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1 text-sm font-sans">
                    <span>Final Amount:</span>
                    <span className="font-mono text-emerald-700">₹{selectedOrder.total_amount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition"
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                Print / Save PDF
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
