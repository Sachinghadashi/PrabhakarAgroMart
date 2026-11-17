import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  MapPin,
  CreditCard,
  Banknote,
  CheckCircle2,
  ShieldCheck,
  Plus,
  ArrowRight,
  AlertCircle,
  Truck,
  Phone,
  Home,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { authApi } from '../api/authApi';
import { orderApi } from '../api/orderApi';
import { paymentApi } from '../api/paymentApi';
import { shippingApi } from '../api/shippingApi';
import { Address, CartItemData } from '../types';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const addressSchema = z.object({
  recipient_name: z.string().min(2, "Recipient name must be at least 2 characters"),
  phone: z.string().regex(/^\+?91?[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  address_line1: z.string().min(5, "Address line 1 is required"),
  address_line2: z.string().optional(),
  village_town: z.string().min(2, "Village or Town is required"),
  district: z.string().min(2, "District is required"),
  state: z.string().min(2, "State is required"),
  pin_code: z.string().regex(/^\d{6}$/, "PIN code must be a 6-digit number"),
  delivery_instructions: z.string().optional(),
  address_type: z.enum(['HOME', 'FARM', 'WAREHOUSE']),
});

type AddressFormData = z.infer<typeof addressSchema>;

export const CheckoutPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { cart, refreshCart } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'COD'>('RAZORPAY');
  const [notes, setNotes] = useState<string>('');
  const [showAddAddress, setShowAddAddress] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [serviceability, setServiceability] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      recipient_name: user?.full_name || '',
      phone: user?.phone || '',
      state: 'Maharashtra',
      address_type: 'FARM',
    },
  });

  const watchPin = watch('pin_code');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
      return;
    }

    const fetchAddresses = async () => {
      try {
        const list = await authApi.getAddresses();
        setAddresses(list);
        if (list.length > 0) {
          const defaultAddr = list.find((a) => a.is_default) || list[0];
          setSelectedAddressId(defaultAddr.id);
          checkPinServiceability(defaultAddr.pin_code);
        } else {
          setShowAddAddress(true);
        }
      } catch (err) {
        console.error("Failed to load addresses", err);
      }
    };

    fetchAddresses();
  }, [isAuthenticated, navigate]);

  const checkPinServiceability = async (pin: string) => {
    if (pin && pin.length === 6 && /^\d+$/.test(pin)) {
      try {
        const res = await shippingApi.checkServiceability(pin);
        setServiceability(res);
      } catch {
        setServiceability(null);
      }
    }
  };

  useEffect(() => {
    if (watchPin && watchPin.length === 6) {
      checkPinServiceability(watchPin);
    }
  }, [watchPin]);

  const onAddAddressSubmit = async (data: AddressFormData) => {
    setIsSubmitting(true);
    try {
      const created = await authApi.createAddress({
        ...data,
        is_default: addresses.length === 0,
      });
      setAddresses([...addresses, created]);
      setSelectedAddressId(created.id);
      setShowAddAddress(false);
      reset();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || "Failed to save delivery address.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setErrorMessage("Please select or add a delivery address.");
      return;
    }
    if (!cart || cart.items.length === 0) {
      navigate('/cart');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Create order and reserve stock on backend
      const order = await orderApi.checkout({
        address_id: selectedAddressId,
        payment_method: paymentMethod,
        notes,
      });

      // 2. Handle Razorpay Online Payment Flow
      if (paymentMethod === 'RAZORPAY') {
        const rzpData = await paymentApi.createRazorpayOrder(order.id);

        const options = {
          key: rzpData.key_id,
          amount: rzpData.amount,
          currency: rzpData.currency,
          name: rzpData.company_name,
          description: `Order ${order.order_number}`,
          order_id: rzpData.gateway_order_id,
          prefill: rzpData.prefill,
          theme: {
            color: '#1B4D3E',
          },
          handler: async (response: any) => {
            try {
              await paymentApi.verifyRazorpayPayment({
                order_id: order.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              await refreshCart();
              navigate(`/order-success/${order.order_number}`);
            } catch (vErr: any) {
              setErrorMessage("Payment verification failed. Please contact helpline if money was deducted.");
              setIsSubmitting(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsSubmitting(false);
              setErrorMessage("Payment window was closed. Your order is pending in 'My Orders'. You can retry payment anytime.");
            },
          },
        };

        if (window.Razorpay) {
          const rzpInstance = new window.Razorpay(options);
          rzpInstance.open();
        } else {
          setErrorMessage("Razorpay SDK could not be loaded. Please ensure you are online and refresh.");
          setIsSubmitting(false);
        }
      } else {
        // 3. Handle Cash on Delivery (COD) Flow
        await paymentApi.confirmCOD(order.id);
        await refreshCart();
        navigate(`/order-success/${order.order_number}`);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || err.message || "Failed to process checkout.");
      setIsSubmitting(false);
    }
  };

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const totalAmountNum = Number(cart?.total_amount || 0);
  const isCodEligible = totalAmountNum <= 50000;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          Secure Farmer Checkout
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Complete delivery details and select your preferred payment method
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Delivery Address & Payment Method */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Delivery Address */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1B4D3E] text-white flex items-center justify-center text-xs font-black">
                  1
                </div>
                <h2 className="text-base font-extrabold text-gray-900">
                  Select Delivery Address
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAddress(!showAddAddress)}
                className="text-xs font-bold text-[#1B4D3E] hover:text-[#0E382A] flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add New Address
              </button>
            </div>

            {/* Existing Addresses List */}
            {addresses.length > 0 && !showAddAddress && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => {
                      setSelectedAddressId(addr.id);
                      checkPinServiceability(addr.pin_code);
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedAddressId === addr.id
                        ? 'border-[#1B4D3E] bg-emerald-50/60 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-extrabold text-gray-900">{addr.recipient_name}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        {addr.address_type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {addr.address_line1}, {addr.village_town}, {addr.district}, {addr.state} - <strong>{addr.pin_code}</strong>
                    </p>
                    <div className="text-[11px] text-gray-500 mt-2 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#1B4D3E]" /> {addr.phone}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Address Form Modal / Inline */}
            {showAddAddress && (
              <form onSubmit={handleSubmit(onAddAddressSubmit)} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Recipient Name *</label>
                    <input
                      {...register('recipient_name')}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                    />
                    {errors.recipient_name && <p className="text-[10px] text-red-600 mt-0.5">{errors.recipient_name.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Mobile Number (10 Digits) *</label>
                    <input
                      {...register('phone')}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                    />
                    {errors.phone && <p className="text-[10px] text-red-600 mt-0.5">{errors.phone.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Gat / Survey No, Street or Land Landmark *</label>
                  <input
                    {...register('address_line1')}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                  />
                  {errors.address_line1 && <p className="text-[10px] text-red-600 mt-0.5">{errors.address_line1.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Village / Town *</label>
                    <input
                      {...register('village_town')}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                    />
                    {errors.village_town && <p className="text-[10px] text-red-600 mt-0.5">{errors.village_town.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">District *</label>
                    <input
                      {...register('district')}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                    />
                    {errors.district && <p className="text-[10px] text-red-600 mt-0.5">{errors.district.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">6-Digit PIN Code *</label>
                    <input
                      {...register('pin_code')}
                      maxLength={6}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                    />
                    {errors.pin_code && <p className="text-[10px] text-red-600 mt-0.5">{errors.pin_code.message}</p>}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-[#1B4D3E] text-white text-xs font-bold rounded-xl hover:bg-[#0E382A]"
                  >
                    Save Address
                  </button>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAddAddress(false)}
                      className="px-4 py-2.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* Serviceability Pill */}
            {serviceability && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-center justify-between text-emerald-900">
                <span className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-700" />
                  <span>Serviceable: <strong>{serviceability.zone}</strong> (Est: {serviceability.estimated_delivery_time})</span>
                </span>
                <span className="font-extrabold text-[10px] bg-emerald-100 px-2 py-0.5 rounded text-emerald-800">
                  Doorstep Delivery
                </span>
              </div>
            )}
          </div>

          {/* Step 2: Payment Method Selection */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-8 h-8 rounded-full bg-[#1B4D3E] text-white flex items-center justify-center text-xs font-black">
                2
              </div>
              <h2 className="text-base font-extrabold text-gray-900">
                Select Payment Mode
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Razorpay Online Option */}
              <div
                onClick={() => setPaymentMethod('RAZORPAY')}
                className={`p-5 rounded-2xl border cursor-pointer transition-all relative ${
                  paymentMethod === 'RAZORPAY'
                    ? 'border-[#1B4D3E] bg-emerald-50/60 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#1B4D3E] flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Online Payment</h4>
                    <p className="text-[11px] text-gray-500">UPI, RuPay, Debit/Credit, NetBanking</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Instant secure payment via Razorpay. Supports PhonePe, Google Pay, Paytm, and all major Indian banks.
                </p>
                {paymentMethod === 'RAZORPAY' && (
                  <CheckCircle2 className="w-5 h-5 text-[#1B4D3E] absolute top-4 right-4" />
                )}
              </div>

              {/* Cash on Delivery Option */}
              <div
                onClick={() => isCodEligible && setPaymentMethod('COD')}
                className={`p-5 rounded-2xl border cursor-pointer transition-all relative ${
                  !isCodEligible
                    ? 'opacity-50 cursor-not-allowed bg-gray-50'
                    : paymentMethod === 'COD'
                    ? 'border-[#1B4D3E] bg-emerald-50/60 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#D97706] flex items-center justify-center">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Cash on Delivery (COD)</h4>
                    <p className="text-[11px] text-gray-500">Pay cash upon delivery</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Pay cash to the delivery executive when the parcel reaches your doorstep. Available up to ₹50,000.
                </p>
                {paymentMethod === 'COD' && (
                  <CheckCircle2 className="w-5 h-5 text-[#1B4D3E] absolute top-4 right-4" />
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Optional Delivery Notes / Landmark Instructions:
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Near village water tank or primary school gate"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Right Column: Order Review & Confirmation CTA */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3">
              Order Review
            </h3>

            {/* Mini Items List */}
            <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 text-xs">
              {cart?.items.map((item: CartItemData) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between">
                  <div className="max-w-[170px] truncate">
                    <div className="font-bold text-gray-900 truncate">{item.product_name}</div>
                    <div className="text-[11px] text-gray-500">
                      {item.quantity} x {item.pack_size} {item.pack_unit}
                    </div>
                  </div>
                  <div className="font-black text-gray-900">₹{item.line_total}</div>
                </div>
              ))}
            </div>

            {/* Authoritative Financial Breakdown */}
            <div className="space-y-2 text-xs text-gray-600 pt-3 border-t border-gray-100">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-gray-900">₹{cart?.subtotal}</span>
              </div>
              {Number(cart?.coupon_discount) > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount ({cart?.coupon_code})</span>
                  <span>-₹{cart?.coupon_discount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping & Delivery Fee</span>
                <span className="font-bold text-gray-900">
                  {Number(cart?.shipping_fee) === 0 ? 'FREE' : `₹${cart?.shipping_fee}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span className="font-bold text-gray-900">₹{cart?.tax_amount}</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline text-sm">
                <span className="font-extrabold text-gray-900">Total Payable</span>
                <span className="text-2xl font-black text-[#0E382A]">
                  ₹{cart?.total_amount}
                </span>
              </div>
            </div>

            {/* Place Order CTA Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting || !selectedAddressId}
              className="w-full py-4 bg-[#1B4D3E] hover:bg-[#0E382A] text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 text-sm transition-all shadow-lg shadow-emerald-950/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                "Processing Order & Stock..."
              ) : paymentMethod === 'RAZORPAY' ? (
                <>Pay ₹{cart?.total_amount} via Razorpay <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>Confirm Cash on Delivery Order <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <div className="text-center pt-2 text-[11px] text-gray-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>100% Secure Transaction | Pessimistic Stock Reservation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
