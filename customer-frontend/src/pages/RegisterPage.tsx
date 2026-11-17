import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sparkles, UserPlus, AlertCircle, Lock, Mail, Phone, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const registerSchema = z
  .object({
    full_name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().regex(/^\+?91?[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const redirectUrl = new URLSearchParams(location.search).get('redirect') || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await registerAuth(data);
      navigate(redirectUrl);
    } catch (err: any) {
      const errData = err.response?.data;
      if (typeof errData === 'object') {
        const firstKey = Object.keys(errData)[0];
        setErrorMessage(`${firstKey}: ${errData[firstKey]}`);
      } else {
        setErrorMessage("Registration failed. Please check the entered fields.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-xl space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1B4D3E] to-[#2E7D32] flex items-center justify-center mx-auto text-white shadow-md shadow-emerald-900/10 mb-3">
            <Sparkles className="w-6 h-6 text-[#F59E0B]" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">Create Farmer Account</h2>
          <p className="text-xs text-gray-500 mt-1">Join 50,000+ Indian Farmers on Prabhakar Agro Mart</p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Full Name *</label>
            <div className="relative">
              <input
                {...register('full_name')}
                type="text"
                placeholder="Rameshwar Patil"
                className="w-full pl-9 pr-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
              />
              <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
            {errors.full_name && <p className="text-[10px] text-red-600 mt-0.5">{errors.full_name.message}</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Email Address *</label>
            <div className="relative">
              <input
                {...register('email')}
                type="email"
                placeholder="farmer@example.com"
                className="w-full pl-9 pr-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
            {errors.email && <p className="text-[10px] text-red-600 mt-0.5">{errors.email.message}</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Mobile Number (10 Digits) *</label>
            <div className="relative">
              <input
                {...register('phone')}
                type="tel"
                placeholder="9876543210"
                className="w-full pl-9 pr-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
              />
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
            {errors.phone && <p className="text-[10px] text-red-600 mt-0.5">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Password (min 8 chars) *</label>
            <div className="relative">
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
            {errors.password && <p className="text-[10px] text-red-600 mt-0.5">{errors.password.message}</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Confirm Password *</label>
            <div className="relative">
              <input
                {...register('password_confirmation')}
                type="password"
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
            {errors.password_confirmation && <p className="text-[10px] text-red-600 mt-0.5">{errors.password_confirmation.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#1B4D3E] hover:bg-[#0E382A] text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-md disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" /> {loading ? "Creating Account..." : "Register & Start Shopping"}
          </button>
        </form>

        <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
          Already have an account?{' '}
          <Link to={`/login?redirect=${redirectUrl}`} className="font-bold text-[#1B4D3E] hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};
