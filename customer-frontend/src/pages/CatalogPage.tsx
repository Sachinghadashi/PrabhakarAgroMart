import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Filter,
  X,
  Search,
  SlidersHorizontal,
  RotateCcw,
  PackageOpen,
} from 'lucide-react';
import { catalogApi, ProductQueryFilters } from '../api/catalogApi';
import { Product, Category, Brand } from '../types';
import { ProductCard } from '../components/product/ProductCard';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [cropsList, setCropsList] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter States from URL or defaults
  const activeCategory = searchParams.get('category') || '';
  const activeBrand = searchParams.get('brand') || '';
  const activeCrop = searchParams.get('crop') || '';
  const activeType = searchParams.get('type') || '';
  const activeSort = searchParams.get('sort') || '-created_at';
  const searchQuery = searchParams.get('search') || '';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';

  // Initial load of categories and brands
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [cats, brs, crps] = await Promise.all([
          catalogApi.getCategories(),
          catalogApi.getBrands(),
          catalogApi.getCrops(),
        ]);
        setCategories(cats);
        setBrands(brs);
        setCropsList(crps);
      } catch (err) {
        console.error("Failed to load catalog metadata", err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch products when query filters change
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const query: ProductQueryFilters = {};
        if (activeCategory) query.category_slug = activeCategory;
        if (activeBrand) query.brand_slug = activeBrand;
        if (activeCrop) query.crop = activeCrop;
        if (activeType) query.product_type = activeType;
        if (searchQuery) query.search = searchQuery;
        if (minPrice) query.min_price = Number(minPrice);
        if (maxPrice) query.max_price = Number(maxPrice);
        if (activeSort) query.ordering = activeSort;

        const data = await catalogApi.getProducts(query);
        setProducts(data.results);
        setTotalCount(data.count);
      } catch (err) {
        console.error("Failed to fetch products", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [activeCategory, activeBrand, activeCrop, activeType, activeSort, searchQuery, minPrice, maxPrice]);

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const productTypes = [
    { label: 'All Types', value: '' },
    { label: 'Chemical / Standard', value: 'CHEMICAL' },
    { label: 'Organic', value: 'ORGANIC' },
    { label: 'Bio Fertilizers / Pesticides', value: 'BIO' },
    { label: 'Hybrid Seeds', value: 'HYBRID' },
  ];

  const hasActiveFilters = !!(activeCategory || activeBrand || activeCrop || activeType || searchQuery || minPrice || maxPrice);

  const FilterSidebarContent = (
    <div className="space-y-6 text-sm">
      {/* Category Filter */}
      <div>
        <h4 className="font-extrabold text-gray-900 mb-3 flex items-center justify-between">
          Category
          {activeCategory && (
            <button onClick={() => updateParam('category', '')} className="text-xs text-red-600 font-semibold">
              Clear
            </button>
          )}
        </h4>
        <div className="space-y-1.5">
          <button
            onClick={() => updateParam('category', '')}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              !activeCategory ? 'bg-[#1B4D3E] text-white' : 'text-gray-700 hover:bg-emerald-50'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => updateParam('category', c.slug)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                activeCategory === c.slug
                  ? 'bg-[#1B4D3E] text-white'
                  : 'text-gray-700 hover:bg-emerald-50'
              }`}
            >
              <span>{c.name}</span>
              <span className={`text-[10px] ${activeCategory === c.slug ? 'text-emerald-200' : 'text-gray-400'}`}>
                {c.products_count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Brand Filter */}
      <div className="pt-4 border-t border-gray-100">
        <h4 className="font-extrabold text-gray-900 mb-3 flex items-center justify-between">
          Brand
          {activeBrand && (
            <button onClick={() => updateParam('brand', '')} className="text-xs text-red-600 font-semibold">
              Clear
            </button>
          )}
        </h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {brands.map((b) => (
            <label
              key={b.id}
              className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 hover:text-[#1B4D3E]"
            >
              <input
                type="radio"
                name="brand"
                checked={activeBrand === b.slug}
                onChange={() => updateParam('brand', b.slug)}
                className="text-[#1B4D3E] focus:ring-[#1B4D3E]"
              />
              <span className="flex-1 truncate">{b.name}</span>
              <span className="text-[10px] text-gray-400">({b.products_count})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Suitable Crop Filter */}
      <div className="pt-4 border-t border-gray-100">
        <h4 className="font-extrabold text-gray-900 mb-2">Suitable Crop</h4>
        <div className="flex flex-wrap gap-1.5">
          {cropsList.map((crop) => (
            <button
              key={crop}
              onClick={() => updateParam('crop', activeCrop === crop ? '' : crop)}
              className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-all ${
                activeCrop === crop
                  ? 'border-[#1B4D3E] bg-emerald-50 text-[#1B4D3E] font-bold'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {crop}
            </button>
          ))}
        </div>
      </div>

      {/* Product Type Filter */}
      <div className="pt-4 border-t border-gray-100">
        <h4 className="font-extrabold text-gray-900 mb-2">Product Type</h4>
        <div className="space-y-1.5">
          {productTypes.map((pt) => (
            <label key={pt.value} className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
              <input
                type="radio"
                name="product_type"
                checked={activeType === pt.value}
                onChange={() => updateParam('type', pt.value)}
                className="text-[#1B4D3E] focus:ring-[#1B4D3E]"
              />
              <span>{pt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="pt-4 border-t border-gray-100">
        <h4 className="font-extrabold text-gray-900 mb-2">Price Range (₹)</h4>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => updateParam('min_price', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => updateParam('max_price', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Breadcrumb & Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-200">
        <div>
          <div className="text-xs text-gray-500 mb-1">
            Home / <span className="text-[#1B4D3E] font-semibold">Agricultural Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Agricultural Products Catalog
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Showing <strong className="text-gray-900">{totalCount}</strong> verified agro inputs
          </p>
        </div>

        {/* Sort & Mobile Filter Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-2 shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#1B4D3E]" /> Filters
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium hidden sm:inline">Sort by:</span>
            <select
              value={activeSort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B4D3E] shadow-sm"
            >
              <option value="-created_at">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Product Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Pills Bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs">
          <span className="font-bold text-emerald-900">Active Filters:</span>
          {searchQuery && (
            <span className="px-2.5 py-1 bg-white text-gray-800 rounded-lg border border-gray-200 flex items-center gap-1 font-medium">
              Search: "{searchQuery}" <X className="w-3 h-3 cursor-pointer" onClick={() => updateParam('search', '')} />
            </span>
          )}
          {activeCategory && (
            <span className="px-2.5 py-1 bg-white text-gray-800 rounded-lg border border-gray-200 flex items-center gap-1 font-medium">
              Category: {categories.find((c) => c.slug === activeCategory)?.name || activeCategory}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateParam('category', '')} />
            </span>
          )}
          {activeBrand && (
            <span className="px-2.5 py-1 bg-white text-gray-800 rounded-lg border border-gray-200 flex items-center gap-1 font-medium">
              Brand: {brands.find((b) => b.slug === activeBrand)?.name || activeBrand}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateParam('brand', '')} />
            </span>
          )}
          {activeCrop && (
            <span className="px-2.5 py-1 bg-white text-gray-800 rounded-lg border border-gray-200 flex items-center gap-1 font-medium">
              Crop: {activeCrop}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateParam('crop', '')} />
            </span>
          )}
          <button
            onClick={clearAllFilters}
            className="text-xs text-red-600 font-bold hover:underline ml-auto"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Main Grid & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit sticky top-28">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-gray-100 text-[#1B4D3E] font-extrabold text-base">
            <Filter className="w-5 h-5 text-[#D97706]" /> Filter Products
          </div>
          {FilterSidebarContent}
        </div>

        {/* Product Grid Area */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-80 bg-gray-100 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm max-w-md mx-auto">
              <PackageOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">No Agro Products Match Your Filters</h3>
              <p className="text-xs text-gray-500 mb-6">
                Try widening your price range, choosing a different category, or clearing active keyword filters.
              </p>
              <button
                onClick={clearAllFilters}
                className="px-5 py-2.5 bg-[#1B4D3E] text-white text-xs font-bold rounded-xl hover:bg-[#0E382A]"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {mobileFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMobileFilterOpen(false)}>
          <div
            className="w-4/5 max-w-sm h-full bg-white shadow-2xl p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#D97706]" /> Filters
              </h3>
              <button onClick={() => setMobileFilterOpen(false)} className="p-1 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            {FilterSidebarContent}
          </div>
        </div>
      )}
    </div>
  );
};
