import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sparkles, LogIn, AlertCircle, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const redirectUrl = new URLSearchParams(location.search).get('redirect') || '/';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await login(data);
      navigate(redirectUrl);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.detail || "Invalid email or password. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const fillSampleFarmer = () => {
    setValue('email', 'kisan@prabhakar.com');
    setValue('password', 'Kisan@12345');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-xl space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1B4D3E] to-[#2E7D32] flex items-center justify-center mx-auto text-white shadow-md shadow-emerald-900/10 mb-3">
            <Sparkles className="w-6 h-6 text-[#F59E0B]" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">Sign In to Your Account</h2>
          <p className="text-xs text-gray-500 mt-1">Prabhakar Agro Mart — Farmer Portal</p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Email Address</label>
            <div className="relative">
              <input
                {...register('email')}
                type="email"
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
            {errors.email && <p className="text-[10px] text-red-600 mt-0.5">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-gray-700">Password</label>
            </div>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#1B4D3E] hover:bg-[#0E382A] text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-md disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" /> {loading ? "Signing in..." : "Sign In to Farmer Account"}
          </button>
        </form>

        {/* Demo Fast Fill Button */}
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
          <p className="text-[11px] text-emerald-900 font-medium">Quick Demo Farmer Login:</p>
          <button
            type="button"
            onClick={fillSampleFarmer}
            className="text-xs font-bold text-[#1B4D3E] hover:underline mt-0.5"
          >
            Auto-fill with Demo Farmer (kisan@prabhakar.com)
          </button>
        </div>

        <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
          New to Prabhakar Agro Mart?{' '}
          <Link to={`/register?redirect=${redirectUrl}`} className="font-bold text-[#1B4D3E] hover:underline">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
};
