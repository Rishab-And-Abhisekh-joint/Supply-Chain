// lib/settings-store.ts
// Centralized settings management with localStorage persistence

export interface UserProfile {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    avatar?: string;
    phone?: string;
    company?: string;
  }
  
  export interface NotificationSettings {
    lowStockAlerts: boolean;
    orderUpdates: boolean;
    deliveryAlerts: boolean;
    systemNotifications: boolean;
    emailDigest: boolean;
    pushNotifications: boolean;
    smsAlerts: boolean;
  }
  
  export interface AppearanceSettings {
    theme: 'light' | 'dark' | 'system';
    sidebarStyle: 'expanded' | 'collapsed';
    compactMode: boolean;
    animationsEnabled: boolean;
  }
  
  export interface RegionalSettings {
    language: string;
    timezone: string;
    currency: string;
    dateFormat: string;
    numberFormat: string;
  }
  
  export interface SecuritySettings {
    twoFactorEnabled: boolean;
    sessionTimeout: number; // minutes
    loginNotifications: boolean;
  }
  
  export interface AllSettings {
    profile: UserProfile;
    notifications: NotificationSettings;
    appearance: AppearanceSettings;
    regional: RegionalSettings;
    security: SecuritySettings;
  }
  
  const SETTINGS_KEY = 'supply_chain_settings';
  
  // Default settings
  export const defaultSettings: AllSettings = {
    profile: {
      firstName: 'Rishab',
      lastName: 'Acharjee',
      email: 'rishab.acharjee12345@gmail.com',
      role: 'Administrator',
      phone: '',
      company: 'SupplyChain Inc.',
    },
    notifications: {
      lowStockAlerts: true,
      orderUpdates: true,
      deliveryAlerts: true,
      systemNotifications: true,
      emailDigest: false,
      pushNotifications: true,
      smsAlerts: false,
    },
    appearance: {
      theme: 'light',
      sidebarStyle: 'expanded',
      compactMode: false,
      animationsEnabled: true,
    },
    regional: {
      language: 'en-US',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: 'en-IN',
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      loginNotifications: true,
    },
  };
  
  // Get all settings
  export function getSettings(): AllSettings {
    if (typeof window === 'undefined') return defaultSettings;
    
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all fields exist
        return {
          profile: { ...defaultSettings.profile, ...parsed.profile },
          notifications: { ...defaultSettings.notifications, ...parsed.notifications },
          appearance: { ...defaultSettings.appearance, ...parsed.appearance },
          regional: { ...defaultSettings.regional, ...parsed.regional },
          security: { ...defaultSettings.security, ...parsed.security },
        };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    
    return defaultSettings;
  }
  
  // Save all settings
  export function saveSettings(settings: AllSettings): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      // Dispatch event for other components to react
      window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: settings }));
      
      // Apply theme immediately
      applyTheme(settings.appearance.theme);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }
  
  // Update specific section
  export function updateSettings<K extends keyof AllSettings>(
    section: K,
    data: Partial<AllSettings[K]>
  ): AllSettings {
    const current = getSettings();
    const updated = {
      ...current,
      [section]: { ...current[section], ...data },
    };
    saveSettings(updated);
    return updated;
  }
  
  // Apply theme to document
  export function applyTheme(theme: 'light' | 'dark' | 'system'): void {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }
  
  // Format currency based on settings
  export function formatCurrency(amount: number, settings?: RegionalSettings): string {
    const regional = settings || getSettings().regional;
    
    const currencyMap: Record<string, string> = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
    };
    
    const symbol = currencyMap[regional.currency] || regional.currency;
    
    return `${symbol}${amount.toLocaleString(regional.numberFormat)}`;
  }
  
  // Format date based on settings
  export function formatDate(date: Date | string, settings?: RegionalSettings): string {
    const regional = settings || getSettings().regional;
    const d = typeof date === 'string' ? new Date(date) : date;
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    
    switch (regional.dateFormat) {
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'DD/MM/YYYY':
      default:
        return `${day}/${month}/${year}`;
    }
  }
  
  // Export user data
  export function exportUserData(): void {
    const settings = getSettings();
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supply-chain-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  }
  
  // Import user data
  export function importUserData(file: File): Promise<AllSettings> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          const merged: AllSettings = {
            profile: { ...defaultSettings.profile, ...data.profile },
            notifications: { ...defaultSettings.notifications, ...data.notifications },
            appearance: { ...defaultSettings.appearance, ...data.appearance },
            regional: { ...defaultSettings.regional, ...data.regional },
            security: { ...defaultSettings.security, ...data.security },
          };
          saveSettings(merged);
          resolve(merged);
        } catch (error) {
          reject(new Error('Invalid settings file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
  
  // Reset to defaults
  export function resetSettings(): AllSettings {
    saveSettings(defaultSettings);
    return defaultSettings;
  }