import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sprout,
  AlertTriangle,
  FileText,
  ChevronRight,
  Info,
  Building2,
  Share2,
} from 'lucide-react';
import { catalogApi } from '../api/catalogApi';
import { ProductDetail, ProductVariant } from '../types';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/product/ProductCard';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart, isLoading: cartLoading } = useCart();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [added, setAdded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'specs' | 'usage' | 'safety'>('specs');

  useEffect(() => {
    if (!slug) return;
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await catalogApi.getProductBySlug(slug);
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
        if (data.images && data.images.length > 0) {
          setSelectedImage(data.images[0].image_url || data.images[0].image);
        } else {
          setSelectedImage(data.primary_image);
        }
      } catch (err) {
        console.error("Failed to load product detail", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="h-96 bg-gray-100 rounded-3xl animate-pulse"></div>
          <div className="space-y-4">
            <div className="h-8 bg-gray-100 rounded w-3/4 animate-pulse"></div>
            <div className="h-6 bg-gray-100 rounded w-1/4 animate-pulse"></div>
            <div className="h-32 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-gray-800">Agricultural Product Not Found</h2>
        <Link to="/catalog" className="mt-4 inline-block px-5 py-2.5 bg-[#1B4D3E] text-white rounded-xl font-bold text-xs">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const currentPrice = selectedVariant?.selling_price || product.starting_price;
  const originalPrice = selectedVariant?.original_price;
  const discount = selectedVariant?.discount_percent || 0;
  const inStock = selectedVariant ? selectedVariant.in_stock : true;

  const handleAddToCart = async () => {
    if (!selectedVariant || !inStock) return;
    const success = await addToCart(selectedVariant.id, quantity);
    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const handleBuyNow = async () => {
    if (!selectedVariant || !inStock) return;
    const success = await addToCart(selectedVariant.id, quantity);
    if (success) {
      navigate('/cart');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-gray-500 flex items-center gap-1.5 flex-wrap">
        <Link to="/" className="hover:text-[#1B4D3E]">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <Link to="/catalog" className="hover:text-[#1B4D3E]">Products</Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <Link to={`/catalog?category=${product.category_slug}`} className="hover:text-[#1B4D3E]">
          {product.category_name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-gray-900 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase Box */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 bg-white p-6 sm:p-10 rounded-3xl border border-gray-100 shadow-sm">
        {/* Left: Gallery Column */}
        <div className="space-y-4">
          <div className="w-full h-80 sm:h-[420px] bg-gradient-to-br from-[#F5F8F5] to-[#EBF3EC] rounded-2xl p-6 flex items-center justify-center relative overflow-hidden border border-gray-100">
            {discount > 0 && (
              <span className="absolute top-4 left-4 z-10 px-3 py-1 bg-[#D97706] text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-sm">
                Save {discount}%
              </span>
            )}

            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-contain mix-blend-multiply"
              />
            ) : (
              <div className="text-center text-emerald-800/40">
                <Sprout className="w-24 h-24 stroke-[1.2] mx-auto text-[#1B4D3E]/40 mb-2" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900/60">
                  {product.category_name}
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails Row */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img) => {
                const url = img.image_url || img.image;
                return (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(url)}
                    className={`w-16 h-16 rounded-xl border-2 p-1 bg-white overflow-hidden shrink-0 transition-all ${
                      selectedImage === url ? 'border-[#1B4D3E] shadow-md' : 'border-gray-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={img.alt_text || product.name} className="w-full h-full object-contain" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100 text-center text-[11px] text-gray-600">
            <div className="p-2.5 bg-gray-50 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-[#1B4D3E] mx-auto mb-1" />
              <span className="font-bold text-gray-800 block">100% Genuine</span>
              Manufacturer Sealed
            </div>
            <div className="p-2.5 bg-gray-50 rounded-xl">
              <Truck className="w-4 h-4 text-[#1B4D3E] mx-auto mb-1" />
              <span className="font-bold text-gray-800 block">Fast Delivery</span>
              Rural Doorstep Service
            </div>
            <div className="p-2.5 bg-gray-50 rounded-xl">
              <RotateCcw className="w-4 h-4 text-[#1B4D3E] mx-auto mb-1" />
              <span className="font-bold text-gray-800 block">Secure Payment</span>
              UPI, Cards & COD
            </div>
          </div>
        </div>

        {/* Right: Info & Purchase Controls */}
        <div className="space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-emerald-800 font-bold uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#D97706]" /> {product.brand_name}
              </span>
              <span className="text-gray-400 font-mono text-[11px]">SKU: {selectedVariant?.sku || product.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Suitable Crops Pill List */}
            {product.suitable_crops && (
              <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
                <span className="font-bold text-gray-700">Suitable For:</span>
                {product.suitable_crops.split(',').map((crop) => (
                  <span
                    key={crop}
                    className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 font-medium rounded-full text-[11px] border border-emerald-100"
                  >
                    {crop.trim()}
                  </span>
                ))}
              </div>
            )}

            {/* Price Box */}
            <div className="mt-5 p-4 bg-[#F8FAF8] rounded-2xl border border-emerald-900/10 flex items-baseline justify-between">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-[#0E382A]">
                    ₹{currentPrice}
                  </span>
                  {originalPrice && Number(originalPrice) > Number(currentPrice) && (
                    <span className="text-base text-gray-400 line-through">
                      ₹{originalPrice}
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      {discount}% OFF
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Inclusive of all taxes (GST 5% itemized at checkout)
                </p>
              </div>

              <div>
                {inStock ? (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-full inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> In Stock
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-red-100 text-red-800 font-extrabold text-xs rounded-full">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>

            {/* Pack Size Variants Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="mt-6">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-2">
                  Available Pack Sizes:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedVariant?.id === v.id
                          ? 'border-[#1B4D3E] bg-[#1B4D3E] text-white shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300 text-gray-800'
                      }`}
                    >
                      <div className="text-xs font-extrabold">
                        {v.pack_size} {v.pack_unit}
                      </div>
                      <div className={`text-xs mt-0.5 font-bold ${selectedVariant?.id === v.id ? 'text-[#F59E0B]' : 'text-gray-900'}`}>
                        ₹{v.selling_price}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mt-6 flex items-center gap-4">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Quantity:
              </label>
              <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 text-sm font-bold"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-xs font-extrabold text-gray-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 text-sm font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAddToCart}
              disabled={!inStock || cartLoading}
              className={`flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                added
                  ? 'bg-emerald-600 text-white'
                  : inStock
                  ? 'bg-[#1B4D3E] hover:bg-[#0E382A] text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-4 h-4" /> Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" /> Add to Cart
                </>
              )}
            </button>

            <button
              onClick={handleBuyNow}
              disabled={!inStock || cartLoading}
              className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md ${
                inStock
                  ? 'bg-[#D97706] hover:bg-[#B45309] text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Buy Now with Fast Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Tabs: Specifications, Usage, Chemical Safety */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm">
        <div className="flex border-b border-gray-200 gap-6 text-sm font-bold mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'specs' ? 'border-[#1B4D3E] text-[#1B4D3E]' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" /> Technical Specifications
          </button>
          <button
            onClick={() => setActiveTab('usage')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'usage' ? 'border-[#1B4D3E] text-[#1B4D3E]' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Info className="w-4 h-4" /> Application & Dosage Guide
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'safety' ? 'border-[#1B4D3E] text-[#1B4D3E]' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Regulatory & Safety Information
          </button>
        </div>

        {activeTab === 'specs' && (
          <div className="space-y-6">
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed max-w-3xl">
              {product.description}
            </p>

            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="max-w-2xl overflow-hidden border border-gray-200 rounded-2xl">
                <table className="w-full text-xs text-left">
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(product.specifications).map(([key, val]) => (
                      <tr key={key} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-bold text-gray-700 bg-gray-50 w-1/3">{key}</td>
                        <td className="px-4 py-3 text-gray-900">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="max-w-3xl space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
              <Sprout className="w-5 h-5 text-[#1B4D3E] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-[#1B4D3E] mb-1">Recommended Application Instructions</h4>
                {product.usage_instructions ? (
                  <p>{product.usage_instructions}</p>
                ) : (
                  <p className="text-gray-500 italic">No application instructions recorded for this product in the catalog database.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'safety' && (
          <div className="max-w-3xl space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-900 mb-1">Agricultural Chemical Safety Guidelines</h4>
                {product.safety_info ? (
                  <p>{product.safety_info}</p>
                ) : (
                  <p className="text-gray-500 italic">No specific regulatory safety data recorded for this product in the catalog database.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Related Products Section */}
      {product.related_products && product.related_products.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            Frequently Bought with This Agro Input
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {product.related_products.map((rp) => (
              <ProductCard key={rp.id} product={rp} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
