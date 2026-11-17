import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  ArrowRight,
  ShoppingBag,
  Tag,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Sprout,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { promotionsApi, CouponItem } from '../api/promotionsApi';
import { CartItemData } from '../types';

export const CartPage: React.FC = () => {
  const { cart, isLoading, updateQuantity, removeItem, clearCart, applyCoupon, removeCoupon } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponApplying, setCouponApplying] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<CouponItem[]>([]);

  useEffect(() => {
    promotionsApi.getCoupons().then((coupons) => {
      setAvailableCoupons(coupons.filter((c) => c.is_active));
    }).catch(console.error);
  }, []);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponApplying(true);
    setCouponError(null);
    try {
      await applyCoupon(couponInput.trim().toUpperCase());
      setCouponInput('');
    } catch (err: any) {
      setCouponError(err.response?.data?.error || "Invalid or ineligible coupon code.");
    } finally {
      setCouponApplying(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setCouponApplying(true);
    try {
      await removeCoupon();
    } finally {
      setCouponApplying(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-[#1B4D3E] rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Sign In to View Your Cart</h2>
        <p className="text-xs text-gray-500 mb-6">
          Your shopping cart is securely persisted in our database for your farmer account.
        </p>
        <Link
          to="/login"
          className="inline-block w-full py-3 bg-[#1B4D3E] hover:bg-[#0E382A] text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-emerald-50 text-[#1B4D3E] rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Your Shopping Cart is Empty</h2>
        <p className="text-xs text-gray-500 mb-6">
          Explore genuine fertilizers, hybrid seeds, and plant protection products to support your crop harvest.
        </p>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#1B4D3E] hover:bg-[#0E382A] text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
        >
          Browse Agricultural Catalog <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const subtotalNum = Number(cart.subtotal);
  const freeThreshold = Number(cart.free_shipping_threshold);
  const remainingForFreeShipping = Math.max(0, freeThreshold - subtotalNum);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          Your Shopping Cart
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          {cart.total_items_count} item{cart.total_items_count > 1 ? 's' : ''} in your cart | Authoritative pricing verified with database
        </p>
      </div>

      {/* Free Shipping Progress Indicator */}
      <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center gap-3">
        <Truck className="w-5 h-5 text-[#1B4D3E] shrink-0" />
        <div className="flex-1">
          {cart.qualifies_for_free_shipping ? (
            <p className="text-xs font-bold text-emerald-900">
              🎉 Congratulations! Your order qualifies for <strong>FREE Doorstep Delivery</strong>!
            </p>
          ) : (
            <div>
              <p className="text-xs font-medium text-emerald-900">
                Add <strong className="font-extrabold text-[#D97706]">₹{remainingForFreeShipping.toFixed(2)}</strong> more to get <strong>FREE Delivery</strong> (Free above ₹{cart.free_shipping_threshold})
              </p>
              <div className="w-full bg-emerald-200/60 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-[#1B4D3E] h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (subtotalNum / freeThreshold) * 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Out of Stock Warning Banner */}
      {cart.has_out_of_stock && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-900 text-xs font-semibold">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>One or more items in your cart are currently out of stock. Please adjust quantities to proceed to checkout.</span>
        </div>
      )}

      {/* Main Grid Layout: Items & Authoritative Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 divide-y divide-gray-100">
              {cart.items.map((item: CartItemData) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Thumbnail & Title */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 rounded-xl p-2 shrink-0 flex items-center justify-center border border-gray-100">
                      {item.primary_image ? (
                        <img src={item.primary_image} alt={item.product_name} className="w-full h-full object-contain mix-blend-multiply" />
                      ) : (
                        <Sprout className="w-8 h-8 text-[#1B4D3E]/40" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                        {item.brand_name}
                      </span>
                      <Link to={`/products/${item.product_slug}`} className="text-sm font-bold text-gray-900 hover:text-[#1B4D3E] line-clamp-1">
                        {item.product_name}
                      </Link>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Pack: <span className="font-semibold text-gray-700">{item.pack_size} {item.pack_unit}</span>
                      </div>
                      <div className="text-xs font-bold text-gray-900 mt-1">
                        ₹{item.unit_price} / unit
                      </div>
                    </div>
                  </div>

                  {/* Quantity Stepper & Line Total */}
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6">
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={isLoading}
                        className="px-2.5 py-1 text-gray-500 hover:bg-gray-100 font-bold text-sm"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-xs font-bold text-gray-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={isLoading || item.quantity >= item.available_stock}
                        className="px-2.5 py-1 text-gray-500 hover:bg-gray-100 font-bold text-sm disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right min-w-[70px]">
                      <div className="text-sm font-black text-gray-900">
                        ₹{item.line_total}
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={isLoading}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs">
              <Link to="/catalog" className="text-[#1B4D3E] font-bold hover:underline">
                ← Continue Shopping
              </Link>
              <button
                onClick={clearCart}
                className="text-red-600 font-semibold hover:underline"
              >
                Clear Entire Cart
              </button>
            </div>
          </div>
        </div>

        {/* Right: Authoritative Order Summary Box */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
            <h3 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3">
              Order Summary
            </h3>

            {/* Coupon Application Box */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-1.5">
                Have a Kisan Coupon?
              </label>
              {cart.coupon_code ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="text-xs font-extrabold text-emerald-900">{cart.coupon_code}</span>
                      <span className="text-[11px] text-emerald-700 block">-₹{cart.coupon_discount} discount</span>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    disabled={couponApplying}
                    className="text-xs font-bold text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder={availableCoupons.length > 0 ? `Enter coupon code (e.g. ${availableCoupons[0].code})` : "Enter coupon code"}
                      className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl uppercase font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                    />
                    <button
                      type="submit"
                      disabled={couponApplying || !couponInput.trim()}
                      className="px-4 py-2 bg-[#1B4D3E] text-white text-xs font-bold rounded-xl hover:bg-[#0E382A] disabled:opacity-50 transition-colors"
                    >
                      Apply
                    </button>
                  </form>
                  {availableCoupons.length > 0 && (
                    <div className="mt-2.5">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                        Active Offers in Database:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {availableCoupons.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => setCouponInput(c.code)}
                            className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[11px] font-mono font-bold hover:bg-emerald-100 transition-colors"
                            title={c.description}
                          >
                            {c.code} ({c.discount_type === 'PERCENTAGE' ? `${parseInt(c.discount_value)}%` : `₹${parseInt(c.discount_value)}`})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              {couponError && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{couponError}</p>
              )}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2.5 text-xs text-gray-600 pt-3 border-t border-gray-100">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-gray-900">₹{cart.subtotal}</span>
              </div>

              {Number(cart.coupon_discount) > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-₹{cart.coupon_discount}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping & Delivery Fee</span>
                <span className="font-bold text-gray-900">
                  {Number(cart.shipping_fee) === 0 ? (
                    <span className="text-emerald-700 font-bold uppercase">Free</span>
                  ) : (
                    `₹${cart.shipping_fee}`
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Applicable GST (5%)</span>
                <span className="font-bold text-gray-900">₹{cart.tax_amount}</span>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline text-sm">
                <span className="font-extrabold text-gray-900">Final Total Amount</span>
                <span className="text-2xl font-black text-[#0E382A]">
                  ₹{cart.total_amount}
                </span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={() => navigate('/checkout')}
              disabled={cart.has_out_of_stock || isLoading}
              className="w-full py-4 bg-[#1B4D3E] hover:bg-[#0E382A] text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 text-sm transition-all shadow-md shadow-emerald-950/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proceed to Secure Checkout <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Protected by Razorpay 256-bit Encryption & COD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
