import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { Address } from '../types';
import { User as UserIcon, MapPin, Sprout, Save, Phone, Mail, Plus, Trash2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [farmAcres, setFarmAcres] = useState(user?.profile?.farm_size_acres || '');
  const [crops, setCrops] = useState(user?.profile?.primary_crops || '');
  const [altPhone, setAltPhone] = useState(user?.profile?.alternate_phone || '');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);

  useEffect(() => {
    if (user?.profile) {
      setFarmAcres(user.profile.farm_size_acres || '');
      setCrops(user.profile.primary_crops || '');
      setAltPhone(user.profile.alternate_phone || '');
    }
    authApi.getAddresses().then(setAddresses).catch(console.error);
  }, [user]);

  const handleSaveFarmProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateProfile({
        farm_size_acres: farmAcres || null,
        primary_crops: crops || null,
        alternate_phone: altPhone || null,
      });
      await refreshUser();
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err) {
      alert("Failed to update profile details.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!window.confirm("Delete this saved address?")) return;
    try {
      await authApi.deleteAddress(id);
      setAddresses(addresses.filter((a) => a.id !== id));
    } catch (err) {
      alert("Failed to delete address.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          Farmer Profile & Account
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Manage your agricultural profile, farm size, cultivated crops, and saved delivery addresses
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Farm Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1B4D3E] flex items-center justify-center font-bold">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900">
                  Farm & Agricultural Details
                </h2>
                <p className="text-xs text-gray-500">Helps us recommend appropriate crop protection and fertilizers</p>
              </div>
            </div>

            <form onSubmit={handleSaveFarmProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    disabled
                    value={user?.full_name || ''}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Total Farm Land Size (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 8.5"
                    value={farmAcres}
                    onChange={(e) => setFarmAcres(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Alternate / WhatsApp Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 00000"
                    value={altPhone}
                    onChange={(e) => setAltPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Primary Crops Cultivated</label>
                <input
                  type="text"
                  placeholder="e.g. Cotton, Soybean, Sugarcane, Pomegranate, Onion"
                  value={crops}
                  onChange={(e) => setCrops(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#1B4D3E] hover:bg-[#0E382A] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> Save Farm Details
                </button>
                {successMsg && (
                  <span className="text-xs font-bold text-emerald-700">✓ Details updated successfully!</span>
                )}
              </div>
            </form>
          </div>

          {/* Saved Addresses Section */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-gray-900 pb-3 border-b border-gray-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#D97706]" /> Saved Delivery Addresses
            </h2>

            {addresses.length === 0 ? (
              <p className="text-xs text-gray-500">No saved addresses found. Add an address during checkout.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((a) => (
                  <div key={a.id} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 relative text-xs">
                    <button
                      onClick={() => handleDeleteAddress(a.id)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="font-bold text-gray-900 mb-1">{a.recipient_name}</div>
                    <p className="text-gray-600">{a.address_line1}, {a.village_town}, {a.district} - {a.pin_code}</p>
                    <p className="text-gray-500 mt-2">Phone: {a.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Account Status & Advisory */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4 text-xs">
            <h3 className="font-extrabold text-gray-900 text-sm border-b border-gray-100 pb-3">
              Account Overview
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Account Type:</span>
                <span className="font-bold text-emerald-800">Verified Farmer</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Member Since:</span>
                <span className="font-medium text-gray-800">
                  {user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'Active'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Default Discount Tier:</span>
                <span className="font-bold text-[#D97706]">Standard Farmer Pricing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
