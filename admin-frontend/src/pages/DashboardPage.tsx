import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  ShoppingBag,
  Clock,
  Truck,
  Users,
  AlertTriangle,
  PackageCheck,
  TrendingUp,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { adminApi } from '../api/adminApi';
import { DashboardMetrics } from '../types';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [range, setRange] = useState<string>('7d');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMetrics = async (selectedRange: string) => {
    setLoading(true);
    try {
      const data = await adminApi.getDashboardMetrics(selectedRange);
      setMetrics(data);
    } catch (err) {
      console.error("Failed to load dashboard metrics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(range);
  }, [range]);

  return (
    <div className="space-y-8">
      {/* Header & Date Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Agricultural Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time database analytics | Revenue counted strictly from paid and fulfilled orders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white border border-slate-200 rounded-xl p-1 flex shadow-sm text-xs font-bold">
            {['today', '7d', '30d'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  range === r ? 'bg-[#1B4D3E] text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === 'today' ? 'Today' : r === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchMetrics(range)}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-[#1B4D3E] shadow-sm"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 1. Primary Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Paid Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Paid Sales</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#1B4D3E] flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            ₹{metrics?.total_revenue || '0.00'}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">
            Period Revenue: ₹{metrics?.period_revenue || '0.00'}
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Orders</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {metrics?.total_orders ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            In Period: {metrics?.period_orders ?? 0} orders
          </p>
        </div>

        {/* Pending & Awaiting Shipment */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Awaiting Shipment</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {metrics?.awaiting_shipment ?? 0}
          </div>
          <p className="text-[11px] text-amber-700 font-semibold mt-1">
            {metrics?.pending_orders ?? 0} pending confirmation
          </p>
        </div>

        {/* Inventory Stock Health */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Stock Alerts</span>
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-red-600">
              {metrics?.out_of_stock_products ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-semibold">Out of Stock</span>
          </div>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">
            {metrics?.low_stock_products ?? 0} low stock warnings
          </p>
        </div>
      </div>

      {/* 2. Interactive Sales Trends Chart */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#1B4D3E]" /> Paid Revenue Trends (INR)
            </h3>
            <p className="text-xs text-slate-400">Daily sales performance over selected timeframe</p>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics?.sales_trend || []}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B4D3E" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#1B4D3E" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val}`} />
              <Tooltip
                formatter={(value: any) => [`₹${value}`, 'Revenue']}
                contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#1B4D3E" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Bottom Row: Recent Orders & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders Table */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#D97706]" /> Recent Customer Orders
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-2.5 rounded-l-lg">Order #</th>
                  <th className="p-2.5">Customer</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right rounded-r-lg">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics?.recent_orders && metrics.recent_orders.length > 0 ? (
                  metrics.recent_orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-mono font-bold text-slate-800">{o.order_number}</td>
                      <td className="p-2.5 text-slate-700">{o.customer_name}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          o.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-black text-slate-900">₹{o.total_amount}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-400">No orders placed yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#1B4D3E]" /> Top Performing Agro Products
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-2.5 rounded-l-lg">Product Name</th>
                  <th className="p-2.5 text-center">Units Sold</th>
                  <th className="p-2.5 text-right rounded-r-lg">Revenue (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics?.top_products && metrics.top_products.length > 0 ? (
                  metrics.top_products.map((tp, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-bold text-slate-900">{tp.name}</td>
                      <td className="p-2.5 text-center font-bold text-slate-700">{tp.units_sold}</td>
                      <td className="p-2.5 text-right font-black text-emerald-800">₹{tp.revenue}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-slate-400">No sales transactions completed yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
