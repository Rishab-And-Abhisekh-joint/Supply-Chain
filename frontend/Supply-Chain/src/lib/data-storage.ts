// lib/data-storage.ts
// Utility functions for localStorage data management

export function getStoredData<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(`supply_chain_${key}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
  
  export function setStoredData<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`supply_chain_${key}`, JSON.stringify(data));
      // Dispatch event for cross-component sync
      window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { key } }));
    } catch (error) {
      console.error('Failed to store data:', error);
    }
  }
  
  export function clearStoredData(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`supply_chain_${key}`);
    window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { key } }));
  }
  
  export function getAllStoredKeys(): string[] {
    if (typeof window === 'undefined') return [];
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('supply_chain_')) {
        keys.push(key.replace('supply_chain_', ''));
      }
    }
    return keys;
  }
  