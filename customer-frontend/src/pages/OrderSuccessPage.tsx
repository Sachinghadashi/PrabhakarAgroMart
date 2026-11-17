import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, PackageCheck, ArrowRight, Home, PhoneCall, ShieldCheck } from 'lucide-react';

export const OrderSuccessPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
      <div className="w-20 h-20 bg-emerald-100 text-[#1B4D3E] rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-900/10 animate-bounce">
        <CheckCircle2 className="w-12 h-12 text-[#1B4D3E]" />
      </div>

      <div className="space-y-2">
        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black uppercase rounded-full tracking-wider">
          Order Placed Successfully
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
          Dhanyawad! Your Order is Confirmed
        </h1>
        <p className="text-sm text-gray-600 max-w-lg mx-auto">
          We have received your agricultural order. Your items and inventory have been reserved at our central Solapur warehouse.
        </p>
      </div>

      <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-lg mx-auto text-left space-y-3">
        <div className="flex justify-between items-center text-xs pb-3 border-b border-gray-100">
          <span className="text-gray-500">Order Number:</span>
          <span className="font-mono font-bold text-gray-900">{orderNumber}</span>
        </div>
        <div className="flex justify-between items-center text-xs pb-3 border-b border-gray-100">
          <span className="text-gray-500">Dispatch Hub:</span>
          <span className="font-semibold text-gray-900">Solapur Agro Distribution Center</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500">Estimated Delivery:</span>
          <span className="font-bold text-emerald-800">2 - 4 Business Days</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
        <Link
          to="/orders"
          className="px-6 py-3.5 bg-[#1B4D3E] hover:bg-[#0E382A] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
        >
          <PackageCheck className="w-4 h-4" /> View Order History & Invoice
        </Link>
        <Link
          to="/"
          className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <Home className="w-4 h-4" /> Return to Home
        </Link>
      </div>

      <div className="pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-500">
        <PhoneCall className="w-3.5 h-3.5 text-[#D97706]" />
        Questions regarding dispatch? Call Kisan Helpline: <a href="tel:+919876543210" className="font-bold text-gray-800">+91 98765 43210</a>
      </div>
    </div>
  );
};
