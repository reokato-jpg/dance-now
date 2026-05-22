"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Customer {
  id: string;
  phone: string;
  email?: string;
  lastName?: string;
  firstName?: string;
  birthday?: string;
  genres: string[];
}

interface AuthState {
  customer: Customer | null;
  pendingPhone: string | null;
  _hasHydrated: boolean;
  setPendingPhone: (phone: string) => void;
  setCustomer: (customer: Customer) => void;
  clearCustomer: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      customer: null,
      pendingPhone: null,
      _hasHydrated: false,
      setPendingPhone: (phone) => set({ pendingPhone: phone }),
      setCustomer: (customer) => set({ customer, pendingPhone: null }),
      clearCustomer: () => set({ customer: null, pendingPhone: null }),
      setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),
    }),
    {
      name: "dance-now-auth",
      // Only persist user data, not the transient hydration flag
      partialize: (state) => ({
        customer: state.customer,
        pendingPhone: state.pendingPhone,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
