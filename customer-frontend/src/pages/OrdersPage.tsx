import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  Printer,
  X,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { orderApi } from '../api/orderApi';
import { Order, InvoiceData } from '../types';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState<boolean>(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderApi.getOrders();
      setOrders(data);
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm("Are you sure you want to cancel this order? Reserved stock will be returned to inventory.")) {
      return;
    }
    setCancellingId(orderId);
    try {
      await orderApi.cancelOrder(orderId, "Customer cancelled from portal");
      await fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to cancel order.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleViewInvoice = async (orderId: number) => {
    setInvoiceLoading(true);
    try {
      const inv = await orderApi.getInvoice(orderId);
      setSelectedInvoice(inv);
    } catch (err) {
      alert("Failed to load tax invoice.");
    } finally {
      setInvoiceLoading(false);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Delivered</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 bg-red-100 text-red-800 text-[11px] font-bold rounded-lg flex items-center gap-1"><XCircle className="w-3 h-3" /> Cancelled</span>;
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-lg flex items-center gap-1"><Truck className="w-3 h-3" /> {status.replace('_', ' ')}</span>;
      default:
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-lg flex items-center gap-1"><Clock className="w-3 h-3" /> {status.replace('_', ' ')}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          My Agricultural Orders
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Track fulfillment status, courier details, and download official GST tax invoices
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-40 bg-gray-100 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm max-w-md mx-auto">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Orders Found</h3>
          <p className="text-xs text-gray-500 mb-6">You haven't placed any agricultural orders yet.</p>
          <Link
            to="/catalog"
            className="px-5 py-2.5 bg-[#1B4D3E] text-white text-xs font-bold rounded-xl hover:bg-[#0E382A]"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
              {/* Order Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-extrabold text-sm sm:text-base text-gray-900">
                      {order.order_number}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Placed on: {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleViewInvoice(order.id)}
                    disabled={invoiceLoading}
                    className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-[#1B4D3E]" /> Tax Invoice
                  </button>

                  {order.status in { PENDING_PAYMENT: 1, CONFIRMED: 1, PROCESSING: 1 } && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={cancellingId === order.id}
                      className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Cancel Order
                    </button>
                  )}
                </div>
              </div>

              {/* Courier & Payment Status Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-2xl text-xs">
                <div>
                  <span className="text-gray-500 block">Payment Mode:</span>
                  <span className="font-bold text-gray-900">
                    {order.payment_method === 'RAZORPAY' ? 'Razorpay Online' : 'Cash on Delivery (COD)'}
                  </span>
                  <span className={`ml-2 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                    order.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {order.payment_status}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 block">Tracking Number:</span>
                  <span className="font-mono font-bold text-gray-900">
                    {order.tracking_number || 'Awaiting Dispatch'}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 block">Total Amount:</span>
                  <span className="text-base font-black text-[#0E382A]">₹{order.total_amount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tax Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 sm:p-10 border border-gray-100 relative my-8">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Invoice Header */}
            <div className="border-b-2 border-[#1B4D3E] pb-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-[#0E382A]">{selectedInvoice.company.name}</h2>
                  <p className="text-xs text-[#D97706] font-bold">{selectedInvoice.company.tagline}</p>
                  <p className="text-[11px] text-gray-500 mt-1 max-w-xs">{selectedInvoice.company.address}</p>
                  <p className="text-[11px] font-mono text-gray-700 mt-1">GSTIN: {selectedInvoice.company.gstin}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase font-extrabold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                    Tax Invoice
                  </span>
                  <p className="text-xs font-mono font-bold text-gray-900 mt-2">{selectedInvoice.invoice_number}</p>
                  <p className="text-[11px] text-gray-500">{selectedInvoice.date}</p>
                </div>
              </div>
            </div>

            {/* Billed To */}
            <div className="grid grid-cols-2 gap-6 text-xs mb-6 p-4 bg-gray-50 rounded-2xl">
              <div>
                <span className="text-gray-400 font-bold uppercase tracking-wider block mb-1">Customer / Farmer:</span>
                <p className="font-bold text-gray-900">{selectedInvoice.customer.name}</p>
                <p className="text-gray-600">{selectedInvoice.customer.phone || selectedInvoice.customer.email}</p>
              </div>
              <div>
                <span className="text-gray-400 font-bold uppercase tracking-wider block mb-1">Delivery Destination:</span>
                <p className="text-gray-700 leading-tight">
                  {selectedInvoice.shipping_address.address_line1}, {selectedInvoice.shipping_address.village_town}, {selectedInvoice.shipping_address.district} - {selectedInvoice.shipping_address.pin_code}
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#1B4D3E] text-white">
                  <tr>
                    <th className="p-2.5 rounded-l-lg">Item</th>
                    <th className="p-2.5">Pack</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Unit Price</th>
                    <th className="p-2.5 text-right rounded-r-lg">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedInvoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-bold text-gray-900">{item.product_name}</td>
                      <td className="p-2.5 text-gray-600">{item.pack_size}</td>
                      <td className="p-2.5 text-center font-bold text-gray-800">{item.quantity}</td>
                      <td className="p-2.5 text-right font-mono">₹{item.unit_price}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-gray-900">₹{item.total_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financials Totals */}
            <div className="border-t border-gray-200 pt-4 space-y-1.5 text-xs max-w-xs ml-auto">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-mono font-bold">₹{selectedInvoice.financials.subtotal}</span>
              </div>
              {Number(selectedInvoice.financials.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-mono font-bold">-₹{selectedInvoice.financials.discount_amount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping:</span>
                <span className="font-mono font-bold">₹{selectedInvoice.financials.shipping_charge}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax / GST:</span>
                <span className="font-mono font-bold">₹{selectedInvoice.financials.tax_amount}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 text-sm font-black text-[#0E382A]">
                <span>Total Amount:</span>
                <span>₹{selectedInvoice.financials.total_amount}</span>
              </div>
            </div>

            {/* Print Button */}
            <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-[#1B4D3E] text-white text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-[#0E382A]"
              >
                <Printer className="w-4 h-4" /> Print Tax Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
