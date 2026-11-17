import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Sprout,
  Sparkles,
  Tag,
  ChevronRight,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { catalogApi } from '../api/catalogApi';
import { promotionsApi, CouponItem } from '../api/promotionsApi';
import { Product, Category } from '../types';
import { ProductCard } from '../components/product/ProductCard';

export const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestsellerProducts, setBestsellerProducts] = useState<Product[]>([]);
  const [activeCoupons, setActiveCoupons] = useState<CouponItem[]>([]);
  const [totalProductsCount, setTotalProductsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, feat, best, allProds, coupons] = await Promise.all([
          catalogApi.getCategories(),
          catalogApi.getProducts({ is_featured: true, page: 1 }),
          catalogApi.getProducts({ is_bestseller: true, page: 1 }),
          catalogApi.getProducts({ page: 1 }),
          promotionsApi.getCoupons().catch(() => []),
        ]);
        setCategories(cats);
        setFeaturedProducts(feat.results.slice(0, 4));
        setBestsellerProducts(best.results.slice(0, 4));
        setTotalProductsCount(allProds.count || allProds.results.length);
        setActiveCoupons(coupons.filter((c: CouponItem) => c.is_active));
      } catch (err) {
        console.error("Failed to load catalog data from database", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const primaryCoupon = activeCoupons.length > 0 ? activeCoupons[0] : null;

  return (
    <div className="space-y-14 sm:space-y-20 pb-16">
      {/* 1. Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0E382A] via-[#1B4D3E] to-[#124233] text-white py-16 sm:py-24">
        {/* Decorative background grid and blurs */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:24px_24px]"></div>
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-[#2E7D32]/30 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold tracking-wide backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-[#F59E0B]" />
              {categories.length > 0
                ? `${categories.length} Verified Product Categories Available`
                : 'Direct Farm Input Portal'}
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight sm:leading-none text-white">
              Premium Agro Inputs for <br />
              <span className="text-[#F59E0B]">Maximum Crop Yield</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-200 leading-relaxed font-normal max-w-2xl">
              Order certified hybrid seeds, balanced fertilizers, fungicides, and crop chemicals directly from the database catalog to your farm gate.
            </p>

            <div className="pt-2 flex flex-wrap gap-4 items-center">
              <Link
                to="/catalog"
                className="px-7 py-3.5 bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-amber-900/30 transition-all hover:gap-3"
              >
                Shop All Agro Products <ArrowRight className="w-5 h-5" />
              </Link>
              {categories.length > 0 && (
                <Link
                  to={`/catalog?category=${categories[0].slug}`}
                  className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition-colors backdrop-blur-sm"
                >
                  Explore {categories[0].name}
                </Link>
              )}
            </div>

            {/* Dynamic Metric Highlights from Database */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-emerald-800/60 text-xs sm:text-sm">
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-white">
                  {totalProductsCount}
                </div>
                <div className="text-gray-300">Total Products</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-[#F59E0B]">
                  {categories.length}
                </div>
                <div className="text-gray-300">Live Categories</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-white">
                  {activeCoupons.length}
                </div>
                <div className="text-gray-300">Active Promotions</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Agricultural Categories Section (from Database) */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#D97706]">
                Explore by Specialty
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
                Agricultural Product Categories
              </h2>
            </div>
            <Link
              to="/catalog"
              className="text-sm font-bold text-[#1B4D3E] hover:text-[#0E382A] flex items-center gap-1 group"
            >
              View All Categories <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/catalog?category=${cat.slug}`}
                className="group p-5 bg-white rounded-2xl border border-gray-100 hover:border-emerald-300 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/70 text-[#1B4D3E] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Sprout className="w-8 h-8 text-[#1B4D3E]" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-[#1B4D3E] transition-colors">
                  {cat.name}
                </h3>
                {cat.description && (
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                    {cat.description}
                  </p>
                )}
                <span className="mt-3 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  {cat.products_count ?? 0} Products
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 3. Featured Products Section (strictly is_featured=True from DB) */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#D97706]">
                <Sparkles className="w-4 h-4" /> Selected Catalog
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
                Featured Agricultural Products
              </h2>
            </div>
            <Link
              to="/catalog"
              className="text-sm font-bold text-[#1B4D3E] hover:text-[#0E382A] flex items-center gap-1 group"
            >
              Explore Catalog <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-80 bg-gray-100 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 4. Promotional Banner (strictly populated from active database coupons) */}
      {primaryCoupon && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#1B4D3E] to-[#2E7D32] rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-gray-900 rounded-full text-xs font-black uppercase tracking-wider">
                  <Tag className="w-3.5 h-3.5" /> Active Farmer Coupon
                </div>
                <h3 className="text-2xl sm:text-4xl font-extrabold">
                  {primaryCoupon.discount_type === 'PERCENTAGE'
                    ? `Get ${parseInt(primaryCoupon.discount_value)}% Off`
                    : `Get Flat ₹${parseInt(primaryCoupon.discount_value)} Off`}{' '}
                  with Code <span className="text-[#F59E0B] font-mono">{primaryCoupon.code}</span>
                </h3>
                <p className="text-sm text-emerald-100 max-w-xl">
                  {primaryCoupon.description} (Minimum order value: ₹{primaryCoupon.min_order_value}).
                </p>
              </div>
              <Link
                to="/catalog"
                className="px-6 py-3.5 bg-white text-[#1B4D3E] hover:bg-emerald-50 font-extrabold rounded-xl transition-all shadow-md shrink-0 text-sm"
              >
                Apply in Catalog
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 5. Best-Selling Products Section (strictly is_bestseller=True from DB) */}
      {bestsellerProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#D97706]">
                <TrendingUp className="w-4 h-4" /> Top Choices
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
                Best-Selling Agro Products
              </h2>
            </div>
            <Link
              to="/catalog"
              className="text-sm font-bold text-[#1B4D3E] hover:text-[#0E382A] flex items-center gap-1 group"
            >
              View All <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-80 bg-gray-100 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestsellerProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
