import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  ShoppingBag,
  Tag,
  BarChart3,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

export const AdminLayout: React.FC = () => {
  const { adminUser, logout, isSuperAdmin, canManageProducts, canManageInventory, canManageOrders } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, visible: true },
    { name: 'Products', path: '/products', icon: Package, visible: canManageProducts },
    { name: 'Categories', path: '/categories', icon: Layers, visible: canManageProducts },
    { name: 'Inventory & Stock', path: '/inventory', icon: Boxes, visible: canManageInventory },
    { name: 'Orders Fulfillment', path: '/orders', icon: ShoppingBag, visible: canManageOrders },
    { name: 'Coupons & Offers', path: '/coupons', icon: Tag, visible: isSuperAdmin },
    { name: 'Reports & Analytics', path: '/reports', icon: BarChart3, visible: isSuperAdmin },
    { name: 'Audit Logs', path: '/audit-logs', icon: ShieldAlert, visible: isSuperAdmin },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* 1. Desktop & Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] text-slate-300 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Logo Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1B4D3E] to-[#2E7D32] flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div>
                <div className="font-extrabold text-white text-base tracking-tight leading-tight">
                  Prabhakar Agro
                </div>
                <div className="text-[10px] text-[#D97706] font-bold uppercase tracking-wider">
                  Admin Console
                </div>
              </div>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems
              .filter((item) => item.visible)
              .map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#1B4D3E] text-white shadow-sm font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#F59E0B]' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
          </nav>
        </div>

        {/* User Card & Sign Out */}
        <div className="p-4 border-t border-slate-800">
          <div className="p-3 bg-slate-800/40 rounded-2xl mb-3 flex items-center justify-between">
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">{adminUser?.full_name}</div>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded-full font-bold uppercase tracking-wider mt-0.5 inline-block">
                {adminUser?.role?.replace('_', ' ')}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 bg-red-950/40 hover:bg-red-950/80 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Central Operations Hub
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#1B4D3E] hover:underline"
            >
              <span>Customer Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#1B4D3E] font-extrabold flex items-center justify-center text-xs">
              {adminUser?.full_name?.charAt(0) || 'A'}
            </div>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="flex-1 p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
