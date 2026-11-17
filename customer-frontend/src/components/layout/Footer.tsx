import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  CheckCircle2,
} from 'lucide-react';
import { catalogApi } from '../../api/catalogApi';
import { Category } from '../../types';

export const Footer: React.FC = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    catalogApi.getCategories().then(setCategories).catch(console.error);
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="bg-[#0A261C] text-gray-300 pt-14 pb-8 border-t-4 border-[#D97706]">
      {/* 1. Value Props Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 bg-[#0E382A] rounded-2xl border border-emerald-900/50">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-950 text-[#F59E0B]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">100% Genuine Agro-Inputs</h4>
              <p className="text-xs text-gray-400 mt-0.5">Sourced directly from certified agricultural manufacturers.</p>
            </div>
          </div>
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-950 text-[#F59E0B]">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Fast Rural Doorstep Delivery</h4>
              <p className="text-xs text-gray-400 mt-0.5">Free shipping on orders above ₹999 across all talukas.</p>
            </div>
          </div>
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-950 text-[#F59E0B]">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Cash on Delivery & UPI</h4>
              <p className="text-xs text-gray-400 mt-0.5">Secure Razorpay gateway or pay cash at your doorstep.</p>
            </div>
          </div>
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-950 text-[#F59E0B]">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Expert Agronomy Advice</h4>
              <p className="text-xs text-gray-400 mt-0.5">Dedicated agronomy guidance for dosage and pest management.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
        {/* Brand Column */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1B4D3E] to-[#2E7D32] flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-6 h-6 text-[#F59E0B]" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-white">Prabhakar Agro Mart</div>
              <p className="text-[10px] text-[#F59E0B] font-bold tracking-wider uppercase">Your Trusted Partner in Agriculture</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed mb-6 max-w-sm">
            Prabhakar Agro Mart is a digital agricultural marketplace providing farmers across India with premium quality seeds, fertilizers, insecticides, fungicides, and herbicides with transparent pricing and doorstep delivery.
          </p>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
              <span>Agro Trade Hub, Station Road, Solapur, Maharashtra 413001, India</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-[#D97706] shrink-0" />
              <a href="tel:+919876543210" className="hover:text-white font-medium">+91 98765 43210 / +91 98765 00001</a>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-[#D97706] shrink-0" />
              <a href="mailto:support@prabhakaragromart.com" className="hover:text-white font-medium">support@prabhakaragromart.com</a>
            </div>
          </div>
        </div>

        {/* Categories Column */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-emerald-900 pb-2">
            Categories
          </h4>
          <ul className="space-y-2 text-xs">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link to={`/catalog?category=${cat.slug}`} className="hover:text-[#F59E0B] transition-colors">
                  {cat.name}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/catalog" className="hover:text-[#F59E0B] transition-colors font-semibold">
                All Agricultural Products
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Support Column */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-emerald-900 pb-2">
            Farmer Support
          </h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/orders" className="hover:text-[#F59E0B] transition-colors">Track Your Order</Link></li>
            <li><Link to="/orders" className="hover:text-[#F59E0B] transition-colors">Download Tax Invoices</Link></li>
            <li><Link to="/profile" className="hover:text-[#F59E0B] transition-colors">My Farm Details</Link></li>
            <li><Link to="/cart" className="hover:text-[#F59E0B] transition-colors">Shopping Cart</Link></li>
            <li><span className="text-gray-400">PIN Code Delivery Service</span></li>
          </ul>
        </div>

        {/* Newsletter & Legal */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-emerald-900 pb-2">
            Seasonal Advisory
          </h4>
          <p className="text-xs text-gray-400 mb-3">
            Receive Kharif/Rabi crop advisories, dosage tips, and exclusive farmer discounts.
          </p>
          {subscribed ? (
            <div className="flex items-center gap-1.5 p-2 bg-emerald-900/50 text-emerald-300 rounded-lg text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Subscribed successfully!
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-2">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter mobile or email"
                className="w-full px-3 py-2 bg-[#0E382A] border border-emerald-900 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#D97706]"
              />
              <button
                type="submit"
                className="w-full py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
              >
                Join Farmer Club
              </button>
            </form>
          )}

          <div className="mt-4 pt-3 border-t border-emerald-950 text-[11px] text-gray-500">
            GSTIN: 27AAAAA0000A1Z5<br />
            Govt. Pesticide License No: AGRO/MH/SLP/2026
          </div>
        </div>
      </div>

      {/* 3. Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-emerald-950/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
        <div>
          © {new Date().getFullYear()} Prabhakar Agro Mart. All rights reserved. Built for Indian Farmers.
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-gray-400">Payment Modes Accepted:</span>
          <span className="px-2 py-0.5 bg-[#0E382A] text-emerald-300 rounded font-bold text-[10px]">UPI</span>
          <span className="px-2 py-0.5 bg-[#0E382A] text-emerald-300 rounded font-bold text-[10px]">Razorpay</span>
          <span className="px-2 py-0.5 bg-[#0E382A] text-emerald-300 rounded font-bold text-[10px]">Debit/Credit</span>
          <span className="px-2 py-0.5 bg-[#0E382A] text-emerald-300 rounded font-bold text-[10px]">Cash On Delivery</span>
        </div>
      </div>
    </footer>
  );
};
