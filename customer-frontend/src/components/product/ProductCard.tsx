import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Check, Sprout, AlertCircle } from 'lucide-react';
import { Product, ProductVariant } from '../../types';
import { useCart } from '../../context/CartContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, isLoading } = useCart();
  const variants = product.variants || [];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    variants[0] || null
  );
  const [added, setAdded] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedVariant || !selectedVariant.in_stock) return;

    const success = await addToCart(selectedVariant.id, 1);
    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    }
  };

  const currentPrice = selectedVariant ? selectedVariant.selling_price : product.starting_price;
  const originalPrice = selectedVariant?.original_price;
  const discount = selectedVariant?.discount_percent || 0;
  const inStock = selectedVariant ? selectedVariant.in_stock : true;

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 hover:border-emerald-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
      <Link to={`/products/${product.slug}`} className="block relative">
        {/* Top Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
          {product.is_bestseller && (
            <span className="px-2.5 py-1 bg-[#D97706] text-white text-[10px] font-extrabold uppercase rounded-md tracking-wider shadow-sm">
              Best Seller
            </span>
          )}
          {discount > 0 && (
            <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-md shadow-sm">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Product Image / Illustration Box */}
        <div className="w-full h-48 sm:h-52 bg-gradient-to-br from-[#F5F8F5] to-[#EBF3EC] flex items-center justify-center p-4 relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
          {product.primary_image ? (
            <img
              src={product.primary_image}
              alt={product.name}
              className="w-full h-full object-contain mix-blend-multiply"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-emerald-800/40">
              <Sprout className="w-16 h-16 stroke-[1.2] text-[#1B4D3E]/30" />
              <span className="text-[11px] font-semibold text-emerald-900/50 mt-1 uppercase tracking-wider">
                {product.category_name}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Product Content Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span className="font-semibold text-emerald-800 uppercase tracking-wider">
              {product.brand_name}
            </span>
            <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
              {product.product_type}
            </span>
          </div>

          <Link to={`/products/${product.slug}`} className="block">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-[#1B4D3E] transition-colors line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Suitable Crops Tag */}
          {product.suitable_crops && (
            <p className="text-[11px] text-gray-500 mt-1.5 truncate">
              <span className="font-medium text-gray-700">Crops:</span> {product.suitable_crops}
            </p>
          )}

          {/* Pack Size Variant Selector */}
          {variants.length > 0 && (
            <div className="mt-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Select Pack Size:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedVariant(v);
                    }}
                    className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
                      selectedVariant?.id === v.id
                        ? 'border-[#1B4D3E] bg-[#1B4D3E] text-white shadow-sm'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {v.pack_size} {v.pack_unit}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pricing & Add to Cart Footer */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-[#0E382A]">
                ₹{currentPrice}
              </span>
              {originalPrice && Number(originalPrice) > Number(currentPrice) && (
                <span className="text-xs text-gray-400 line-through">
                  ₹{originalPrice}
                </span>
              )}
            </div>
            <div className="text-[10px] font-semibold">
              {inStock ? (
                <span className="text-emerald-700 flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> In Stock
                </span>
              ) : (
                <span className="text-red-600 flex items-center gap-0.5">
                  <AlertCircle className="w-3 h-3" /> Out of Stock
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!inStock || isLoading}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              added
                ? 'bg-emerald-600 text-white'
                : inStock
                ? 'bg-[#1B4D3E] hover:bg-[#0E382A] text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5" /> Added
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" /> Add
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
