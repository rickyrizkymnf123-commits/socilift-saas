'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, Organization, Brand, OrgRole } from '@/types/database';
import { useRouter } from 'next/navigation';

export interface ImpersonatedUser {
  id: string;
  email: string;
  display_name?: string | null;
  role: OrgRole;
  tier?: string;
  status?: string;
}

interface AuthContextType {
  user: Profile | null;
  currentOrg: Organization | null;
  currentBrand: Brand | null;
  brands: Brand[];
  role: OrgRole;
  isLoading: boolean;
  canEdit: boolean;
  canApprove: boolean;
  impersonatedUser: ImpersonatedUser | null;
  isImpersonating: boolean;
  startImpersonation: (user: ImpersonatedUser) => void;
  stopImpersonation: () => void;
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
  const [originalRole, setOriginalRole] = useState<OrgRole>('dashboard_admin');
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonatedUser | null>(null);
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
          setOriginalRole(data.role);
        }

        // Check for active impersonation in localStorage
        if (typeof window !== 'undefined') {
          const savedImpersonation = localStorage.getItem('socilift_impersonate_user');
          if (savedImpersonation) {
            try {
              const parsed: ImpersonatedUser = JSON.parse(savedImpersonation);
              setImpersonatedUser(parsed);
              setRole(parsed.role);
            } catch (err) {
              console.error(err);
            }
          }
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

  const startImpersonation = (targetUser: ImpersonatedUser) => {
    setImpersonatedUser(targetUser);
    setRole(targetUser.role);
    if (typeof window !== 'undefined') {
      localStorage.setItem('socilift_impersonate_user', JSON.stringify(targetUser));
    }
    router.push('/dashboard');
  };

  const stopImpersonation = () => {
    setImpersonatedUser(null);
    setRole(originalRole);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('socilift_impersonate_user');
    }
  };

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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('socilift_impersonate_user');
    }
    fetch('/api/auth/logout', { method: 'POST' }).then(() => {
      setUser(null);
      setImpersonatedUser(null);
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
        impersonatedUser,
        isImpersonating: impersonatedUser !== null,
        startImpersonation,
        stopImpersonation,
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
