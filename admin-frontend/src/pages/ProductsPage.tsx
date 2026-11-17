import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  X,
  Layers,
  Sparkles,
  Image as ImageIcon,
  UploadCloud,
  ExternalLink,
} from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { Product, Category, Brand } from '../types';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBrand, setFormBrand] = useState<number | ''>('');
  const [formCategory, setFormCategory] = useState<number | ''>('');
  const [formType, setFormType] = useState('CHEMICAL');
  const [formCrops, setFormCrops] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formUsage, setFormUsage] = useState('');
  const [formSafety, setFormSafety] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');

  // Image Management Modal
  const [imageModalProduct, setImageModalProduct] = useState<Product | null>(null);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [imageSubmitting, setImageSubmitting] = useState(false);

  // Initial Variant State
  const [vSize, setVSize] = useState('1.00');
  const [vUnit, setVUnit] = useState('KG');
  const [vSku, setVSku] = useState('');
  const [vOrigPrice, setVOrigPrice] = useState('');
  const [vSellPrice, setVSellPrice] = useState('');
  const [vStock, setVStock] = useState('50');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, bRes] = await Promise.all([
        adminApi.getProducts({ search }),
        adminApi.getCategories(),
        adminApi.getBrands(),
      ]);
      setProducts(pRes.results);
      setCategories(cRes);
      setBrands(bRes);
      if (bRes.length > 0 && !formBrand) setFormBrand(bRes[0].id);
      if (cRes.length > 0 && !formCategory) setFormCategory(cRes[0].id);
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formSku || !formBrand || !formCategory || !vSellPrice) {
      alert("Please fill in all mandatory fields.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create Product
      const newProd = await adminApi.createProduct({
        name: formName,
        sku: formSku,
        brand: formBrand,
        category: formCategory,
        product_type: formType,
        suitable_crops: formCrops,
        description: formDesc,
        usage_instructions: formUsage,
        safety_info: formSafety,
        is_active: true,
      });

      // 2. Create Initial Variant
      await adminApi.createVariant({
        product: newProd.id,
        pack_size: vSize,
        pack_unit: vUnit,
        sku: vSku || `${formSku}-1`,
        original_price: vOrigPrice || null,
        selling_price: vSellPrice,
        stock_quantity: parseInt(vStock) || 0,
        is_active: true,
      });

      // 3. Attach Image if provided
      if (formImageUrl.trim()) {
        try {
          await adminApi.uploadProductImage(newProd.id, {
            external_url: formImageUrl.trim(),
            is_primary: true,
          });
        } catch (imgErr) {
          console.warn("Product created, but image link failed:", imgErr);
        }
      }

      setShowCreateModal(false);
      // Reset form
      setFormName('');
      setFormSku('');
      setFormCrops('');
      setFormDesc('');
      setVSellPrice('');
      setFormImageUrl('');
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenImageModal = (product: Product) => {
    setImageModalProduct(product);
    setEditImageUrl(product.primary_image || '');
  };

  const handleSaveProductImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageModalProduct || !editImageUrl.trim()) return;

    setImageSubmitting(true);
    try {
      await adminApi.uploadProductImage(imageModalProduct.id, {
        external_url: editImageUrl.trim(),
        is_primary: true,
      });
      setImageModalProduct(null);
      setEditImageUrl('');
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update product image.");
    } finally {
      setImageSubmitting(false);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await adminApi.updateProduct(product.slug, { is_active: !product.is_active });
      await fetchData();
    } catch (err) {
      alert("Failed to update product status.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Agricultural Products Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage agricultural inputs, pack sizes, regulatory specifications, and stock limits
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-[#1B4D3E] hover:bg-[#0E382A] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add New Agro Product
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search product name, SKU, crop suitability..."
          className="w-full text-xs focus:outline-none text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="p-3.5 w-16 text-center">Image</th>
                <th className="p-3.5">Product Name</th>
                <th className="p-3.5">Brand</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">SKU</th>
                <th className="p-3.5">Pack Sizes</th>
                <th className="p-3.5">Starting Price</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">Loading products...</td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="p-2.5 text-center">
                      <div className="w-12 h-12 mx-auto rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center p-1 group relative">
                        {p.primary_image ? (
                          <img
                            src={p.primary_image}
                            alt={p.name}
                            className="w-full h-full object-contain mix-blend-multiply"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-slate-400" />
                        )}
                        <button
                          onClick={() => handleOpenImageModal(p)}
                          title="Change / Add Image"
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl text-white"
                        >
                          <UploadCloud className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 max-w-xs">
                      <div className="truncate">{p.name}</div>
                      <button
                        onClick={() => handleOpenImageModal(p)}
                        className="text-[10px] text-emerald-700 font-semibold hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <ImageIcon className="w-3 h-3" /> {p.primary_image ? 'Update Image' : 'Add Image'}
                      </button>
                    </td>
                    <td className="p-3.5 text-slate-700">{p.brand_name}</td>
                    <td className="p-3.5 text-slate-700">{p.category_name}</td>
                    <td className="p-3.5 font-mono text-slate-500">{p.sku}</td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {p.variants?.map((v) => (
                          <span key={v.id} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] rounded font-semibold">
                            {v.pack_size} {v.pack_unit}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 font-black text-slate-900">
                      ₹{p.starting_price || '0.00'}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                      }`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenImageModal(p)}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900"
                        title="Manage Images"
                      >
                        Image
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`text-xs font-bold hover:underline ${p.is_active ? 'text-red-600' : 'text-emerald-700'}`}
                      >
                        {p.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-200 relative my-8">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-6 right-6 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#1B4D3E]" /> Add Agricultural Product
            </h3>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Mahadhan 19:19:19"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Master SKU *</label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="e.g. MD-NPK-19"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Brand *</label>
                  <select
                    value={formBrand}
                    onChange={(e) => setFormBrand(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Product Type *</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="CHEMICAL">Chemical / Standard</option>
                    <option value="ORGANIC">Organic</option>
                    <option value="BIO">Bio Fertilizer / Pesticide</option>
                    <option value="HYBRID">Hybrid Seed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Suitable Crops</label>
                <input
                  type="text"
                  value={formCrops}
                  onChange={(e) => setFormCrops(e.target.value)}
                  placeholder="e.g. Cotton, Soybean, Tomato, Sugarcane"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Description</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                ></textarea>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Product Image / Cloudinary Asset URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://res.cloudinary.com/... or public packshot URL"
                    className="w-full px-3 py-2 pl-9 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                  />
                  <UploadCloud className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Optional. Stored and served via Cloudinary CDN or media storage.
                </p>
              </div>

              {/* Initial Pack Size Variant Box */}
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-3">
                <h4 className="font-extrabold text-emerald-950">Initial Pack Size Variant:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Size</label>
                    <input
                      type="number"
                      step="0.01"
                      value={vSize}
                      onChange={(e) => setVSize(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Unit</label>
                    <select
                      value={vUnit}
                      onChange={(e) => setVUnit(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="KG">Kilogram (Kg)</option>
                      <option value="GM">Gram (g)</option>
                      <option value="LTR">Litre (L)</option>
                      <option value="ML">Millilitre (ml)</option>
                      <option value="PACK">Packet</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Selling Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={vSellPrice}
                      onChange={(e) => setVSellPrice(e.target.value)}
                      placeholder="e.g. 450.00"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Stock Quantity *</label>
                    <input
                      type="number"
                      value={vStock}
                      onChange={(e) => setVStock(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#1B4D3E] text-white font-bold rounded-xl hover:bg-[#0E382A] disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Save Product & Variant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cloudinary / Product Image Management Modal */}
      {imageModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setImageModalProduct(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-slate-900 mb-1 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-[#1B4D3E]" /> Manage Product Image
            </h3>
            <p className="text-xs text-slate-500 mb-4 truncate font-medium">
              {imageModalProduct.name} <span className="font-mono text-slate-400">({imageModalProduct.sku})</span>
            </p>

            <form onSubmit={handleSaveProductImage} className="space-y-4 text-xs">
              {/* Packshot Preview */}
              <div className="w-full h-44 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center p-3 overflow-hidden">
                {editImageUrl ? (
                  <img
                    src={editImageUrl}
                    alt="Preview"
                    className="w-full h-full object-contain mix-blend-multiply"
                    onError={(e) => {
                      (e.target as any).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                    }}
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                    <span>No image set</span>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Cloudinary Asset URL or Media URL *
                </label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    placeholder="https://res.cloudinary.com/... or hosted packshot URL"
                    className="w-full px-3 py-2 pl-9 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                  />
                  <UploadCloud className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Product images stored in Cloudinary will automatically sync and serve across catalog and product pages.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setImageModalProduct(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={imageSubmitting}
                  className="px-4 py-2 bg-[#1B4D3E] text-white font-bold rounded-xl hover:bg-[#0E382A] disabled:opacity-50 transition-colors shadow-sm"
                >
                  {imageSubmitting ? "Saving..." : "Save Product Image"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
