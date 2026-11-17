import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types';
import { adminApi } from '../api/adminApi';

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentialsOrEmail: { email: string; password: string } | string, maybePassword?: string) => Promise<void>;
  logout: () => void;
  isSuperAdmin: boolean;
  canManageProducts: boolean;
  canManageInventory: boolean;
  canManageOrders: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('pam_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentAdmin = async () => {
    try {
      const data = await adminApi.getMe();
      setAdminUser(data);
      localStorage.setItem('pam_admin_user', JSON.stringify(data));
    } catch {
      logout();
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('pam_admin_token');
    if (token) {
      fetchCurrentAdmin().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }

    const handleAutoLogout = () => {
      logout();
    };

    window.addEventListener('admin:logout', handleAutoLogout);
    return () => window.removeEventListener('admin:logout', handleAutoLogout);
  }, []);

  const login = async (credentialsOrEmail: { email: string; password: string } | string, maybePassword?: string) => {
    setIsLoading(true);
    try {
      const payload = typeof credentialsOrEmail === 'string'
        ? { email: credentialsOrEmail, password: maybePassword || '' }
        : credentialsOrEmail;
      const data = await adminApi.login(payload);
      localStorage.setItem('pam_admin_token', data.access);
      if (data.user) {
        setAdminUser(data.user);
        localStorage.setItem('pam_admin_user', JSON.stringify(data.user));
      } else {
        await fetchCurrentAdmin();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('pam_admin_token');
    localStorage.removeItem('pam_admin_user');
    setAdminUser(null);
  };

  const role = adminUser?.role;
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const canManageProducts = isSuperAdmin || role === 'PRODUCT_MANAGER';
  const canManageInventory = isSuperAdmin || role === 'INVENTORY_MANAGER';
  const canManageOrders = isSuperAdmin || role === 'ORDER_MANAGER' || role === 'SUPPORT';

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isAuthenticated: !!adminUser,
        isLoading,
        login,
        logout,
        isSuperAdmin,
        canManageProducts,
        canManageInventory,
        canManageOrders,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
