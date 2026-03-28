import { create } from 'zustand';
import type { MapConfig } from '../types';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

interface AppState {
  country: string;
  language: string;
  configs: MapConfig[];
  toast: Toast | null;
  setCountry: (country: string) => void;
  setLanguage: (language: string) => void;
  setConfigs: (configs: MapConfig[]) => void;
  addConfig: (config: MapConfig) => void;
  updateConfig: (index: number, config: MapConfig) => void;
  deleteConfig: (index: number) => void;
  duplicateConfig: (index: number) => void;
  showToast: (message: string, type?: Toast['type']) => void;
  clearToast: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  country: 'de',
  language: 'de',
  configs: [],
  toast: null,

  setCountry: (country) => set({ country }),
  setLanguage: (language) => set({ language }),
  setConfigs: (configs) => set({ configs }),

  showToast: (message, type = 'success') => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 3500);
  },
  clearToast: () => set({ toast: null }),

  addConfig: (config) => {
    const configs = get().configs;
    const existingIndex = configs.findIndex((c) => c.ukey === config.ukey);
    if (existingIndex >= 0) {
      const updated = [...configs];
      updated[existingIndex] = config;
      set({ configs: updated });
    } else {
      set({ configs: [...configs, config] });
    }
  },

  updateConfig: (index, config) => {
    const configs = [...get().configs];
    configs[index] = config;
    set({ configs });
  },

  deleteConfig: (index) => {
    const configs = get().configs.filter((_, i) => i !== index);
    set({ configs });
  },

  duplicateConfig: (index) => {
    const configs = get().configs;
    const original = configs[index];
    const duplicate: MapConfig = {
      ...original,
      ukey: `${original.ukey}_copy`,
    };
    const updated = [...configs];
    updated.splice(index + 1, 0, duplicate);
    set({ configs: updated });
  },
}));
