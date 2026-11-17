import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  User as UserIcon,
  Search,
  Menu,
  X,
  PhoneCall,
  Sparkles,
  ChevronDown,
  LogOut,
  PackageCheck,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { catalogApi } from '../../api/catalogApi';
import { Category } from '../../types';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItemsCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    catalogApi.getCategories().then((cats) => {
      setCategories(cats);
    }).catch((err) => {
      console.error("Failed to load navigation categories", err);
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'All Products', path: '/catalog' },
    ...categories.map((c) => ({
      name: c.name,
      path: `/catalog?category=${c.slug}`,
    })),
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-sm border-b border-gray-100">
      {/* 1. Announcement Bar */}
      <div className="bg-[#0E382A] text-white text-xs sm:text-sm py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-[#D97706] text-white px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">
              Free Delivery
            </span>
            <span className="text-gray-200">
              On all orders above <strong className="text-[#F59E0B]">₹999</strong> | 100% Genuine Agro-Inputs Guaranteed
            </span>
          </div>
          <div className="flex items-center gap-4 text-gray-300">
            <span className="flex items-center gap-1.5 hover:text-white transition-colors">
              <PhoneCall className="w-3.5 h-3.5 text-[#F59E0B]" />
              Kisan Helpline: <a href="tel:+919876543210" className="font-semibold text-white">+91 98765 43210</a>
            </span>
            <span className="hidden md:inline-block text-gray-500">|</span>
            <span className="hidden md:flex items-center gap-1 text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              Direct from Manufacturers
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Branding & Search Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-4">
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-gray-600 hover:text-[#1B4D3E] focus:outline-none"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#1B4D3E] to-[#2E7D32] flex items-center justify-center text-white shadow-md shadow-emerald-900/10 group-hover:scale-105 transition-transform">
            <Sparkles className="w-6 h-6 text-[#F59E0B]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-[#0E382A] tracking-tight">
                Prabhakar
              </span>
              <span className="text-xl sm:text-2xl font-bold text-[#D97706] tracking-tight">
                Agro Mart
              </span>
            </div>
            <p className="text-[10px] text-gray-500 font-medium tracking-wide uppercase">
              Your Trusted Partner in Agriculture
            </p>
          </div>
        </Link>

        {/* Search Bar (Desktop) */}
        <div className="hidden lg:flex flex-1 max-w-xl mx-8">
          <form onSubmit={handleSearch} className="w-full relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fertilizers, seeds, fungicides, crops (e.g. Cotton, Tomato)..."
              className="w-full pl-11 pr-24 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4D3E] focus:bg-white transition-all shadow-inner"
            />
            <Search className="absolute left-4 w-4 h-4 text-gray-400" />
            <button
              type="submit"
              className="absolute right-1.5 px-4 py-1.5 bg-[#1B4D3E] text-white text-xs font-semibold rounded-full hover:bg-[#0E382A] transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* User Account & Cart Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 text-sm text-gray-700 hover:text-[#1B4D3E] hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#1B4D3E] font-bold flex items-center justify-center text-xs">
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-gray-800 leading-tight">
                    {user?.full_name}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium">Farmer Account</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden md:block" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-[#1B4D3E]"
                  >
                    <UserIcon className="w-4 h-4" /> My Profile & Farm
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-[#1B4D3E]"
                  >
                    <PackageCheck className="w-4 h-4" /> My Orders & Invoices
                  </Link>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-sm font-semibold text-[#1B4D3E] hover:bg-emerald-50 rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="hidden sm:inline-flex px-3.5 py-1.5 text-sm font-semibold text-white bg-[#1B4D3E] hover:bg-[#0E382A] rounded-lg transition-colors shadow-sm"
              >
                Register
              </Link>
            </div>
          )}

          {/* Cart Icon with Counter */}
          <Link
            to="/cart"
            className="relative flex items-center gap-2 p-2 sm:px-3 sm:py-2 bg-emerald-50 text-[#1B4D3E] hover:bg-emerald-100 rounded-xl transition-all"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5 text-[#1B4D3E]" />
            <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">Cart</span>
            {totalItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 sm:static bg-[#D97706] text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                {totalItemsCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="lg:hidden px-4 pb-3">
        <form onSubmit={handleSearch} className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agro products..."
            className="w-full pl-10 pr-20 py-2 bg-gray-50 border border-gray-200 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
          />
          <Search className="absolute left-3.5 w-4 h-4 text-gray-400" />
          <button
            type="submit"
            className="absolute right-1 px-3 py-1 bg-[#1B4D3E] text-white text-xs font-semibold rounded-full"
          >
            Go
          </button>
        </form>
      </div>

      {/* 3. Navigation Bar (Desktop Links) */}
      <nav className="hidden lg:block bg-[#1B4D3E] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = location.pathname + location.search === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                    isActive
                      ? 'bg-[#0E382A] text-[#F59E0B] border-b-2 border-[#F59E0B]'
                      : 'text-gray-100 hover:bg-[#0E382A] hover:text-[#F59E0B]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-emerald-200">
            <Link to="/orders" className="hover:text-white transition-colors flex items-center gap-1">
              <PackageCheck className="w-3.5 h-3.5 text-[#F59E0B]" />
              Track Shipment
            </Link>
          </div>
        </div>
      </nav>

      {/* 4. Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="w-4/5 max-w-sm h-full bg-white shadow-2xl p-6 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1B4D3E] flex items-center justify-center text-white">
                    <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                  </div>
                  <span className="font-extrabold text-[#0E382A]">Prabhakar Agro Mart</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-6 flex flex-col space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-emerald-50 hover:text-[#1B4D3E]"
                  >
                    {link.name}
                  </Link>
                ))}
                <Link
                  to="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-emerald-50 hover:text-[#1B4D3E]"
                >
                  Track Orders & Invoices
                </Link>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-700 rounded-xl text-sm font-bold"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2.5 bg-gray-100 text-gray-800 rounded-xl text-xs font-bold"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2.5 bg-[#1B4D3E] text-white rounded-xl text-xs font-bold"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
