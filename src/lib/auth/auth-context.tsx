'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, Organization, Brand, OrgRole } from '@/types/database';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: Profile | null;
  currentOrg: Organization | null;
  currentBrand: Brand | null;
  brands: Brand[];
  role: OrgRole;
  isLoading: boolean;
  canEdit: boolean;
  canApprove: boolean;
  switchBrand: (brandId: string) => void;
  switchRole: (role: OrgRole) => void;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
  refreshBrands: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<Profile | null>(null);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [role, setRole] = useState<OrgRole>('dashboard_admin');
  const [isLoading, setIsLoading] = useState(true);

  const fetchInitialData = async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setCurrentOrg(data.org);
        setBrands(data.brands || []);
        if (data.brands?.length > 0) {
          const savedBrandId = typeof window !== 'undefined' ? localStorage.getItem('socilift_active_brand') : null;
          const matched = data.brands.find((b: Brand) => b.id === savedBrandId) || data.brands[0];
          setCurrentBrand(matched);
        }
        if (data.role) {
          setRole(data.role);
        }
      }
    } catch (e) {
      console.error('Failed to load session', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const switchBrand = (brandId: string) => {
    const target = brands.find(b => b.id === brandId);
    if (target) {
      setCurrentBrand(target);
      if (typeof window !== 'undefined') {
        localStorage.setItem('socilift_active_brand', brandId);
      }
    }
  };

  const switchRole = (newRole: OrgRole) => {
    setRole(newRole);
  };

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        await fetchInitialData();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Login failed', e);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST' }).then(() => {
      setUser(null);
      router.push('/login');
    });
  };

  const refreshBrands = async () => {
    const res = await fetch('/api/brands');
    if (res.ok) {
      const data = await res.json();
      setBrands(data.brands);
      if (!currentBrand && data.brands.length > 0) {
        setCurrentBrand(data.brands[0]);
      }
    }
  };

  const canEdit = role === 'dashboard_admin' || role === 'manager' || role === 'creator';
  const canApprove = role === 'dashboard_admin' || role === 'manager';

  return (
    <AuthContext.Provider
      value={{
        user,
        currentOrg,
        currentBrand,
        brands,
        role,
        isLoading,
        canEdit,
        canApprove,
        switchBrand,
        switchRole,
        login,
        logout,
        refreshBrands,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
