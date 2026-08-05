"use client";

import { create } from "zustand";

interface UserState {
  balance: number | null;
  setBalance: (n: number) => void;
  addBalance: (n: number) => void;
}

export const useUserStore = create<UserState>((set) => ({
  balance: null,
  setBalance: (n) => set({ balance: n }),
  addBalance: (n) => set((s) => ({ balance: (s.balance ?? 0) + n })),
}));
