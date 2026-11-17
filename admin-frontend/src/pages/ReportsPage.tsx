import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/adminApi';
import { DashboardMetrics } from '../types';
import { 
  BarChart3, 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  IndianRupee, 
  TrendingUp, 
  Boxes, 
  ShoppingBag,
  RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

export const ReportsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getDashboardMetrics(range);
      setMetrics(data);
    } catch (err: any) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [range]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-emerald-600" />
            Executive Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Authoritative revenue statements, product velocity metrics, inventory ledger summaries, and CSV exports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          >
            <option value="today">Today's Transactions</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All-time Aggregate</option>
          </select>

          <button
            onClick={fetchReports}
            className="p-2 border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-50 transition"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* CSV Export Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/80 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              Paid Orders & Sales Ledger (CSV)
            </div>
            <p className="text-xs text-emerald-700/80 mt-1 max-w-sm">
              Detailed export of order numbers, customer details, tax (GST) breakdowns, and payment methods.
            </p>
          </div>
          <a
            href={adminApi.getSalesExportCSVUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow transition"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </a>
        </div>

        <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/80 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
              <Boxes className="w-5 h-5 text-blue-600" />
              Warehouse Inventory Balance (CSV)
            </div>
            <p className="text-xs text-blue-700/80 mt-1 max-w-sm">
              Current stock, reserved active checkout locks, available capacity, and SKU valuations.
            </p>
          </div>
          <a
            href={adminApi.getInventoryExportCSVUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow transition"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </a>
        </div>
      </div>

      {/* Analytics Summary */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Paid Revenue</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">₹{metrics.period_revenue}</div>
            <span className="text-xs text-emerald-600 font-medium">Selected period</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Orders</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{metrics.period_orders}</div>
            <span className="text-xs text-slate-500 font-medium">Out of {metrics.total_orders} all-time</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">COD Pending Collection</span>
            <div className="text-2xl font-bold font-mono text-amber-700 mt-1">₹{metrics.cod_pending_amount}</div>
            <span className="text-xs text-amber-600 font-medium">Pending field collection</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Catalog</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{metrics.total_active_products}</div>
            <span className="text-xs text-slate-500 font-medium">{metrics.low_stock_products} low stock</span>
          </div>
        </div>
      )}

      {/* Sales Trend Bar Chart */}
      {metrics?.sales_trend && metrics.sales_trend.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Daily Revenue & Order Volume Breakdown
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.sales_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any, name: any) =>
                    name === 'Revenue (₹)' ? [`₹${Number(value).toLocaleString()}`, name] : [value, name]
                  }
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar yAxisId="left" dataKey="revenue" fill="#059669" name="Revenue (₹)" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="orders" fill="#3b82f6" name="Orders Count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Products Table */}
      {metrics?.top_products && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              Top Selling Agricultural Products
            </h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4 text-center">Units Sold</th>
                <th className="py-3 px-4 text-right">Generated Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics.top_products.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-semibold text-slate-800">{p.name}</td>
                  <td className="py-3 px-4 text-center font-mono font-semibold text-emerald-700">{p.units_sold} units</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">₹{p.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
