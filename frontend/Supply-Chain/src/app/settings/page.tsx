'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { 
  User, Bell, Shield, Database, 
  Palette, Globe, Save, ChevronRight, Check,
  Upload, Download, RefreshCw, Eye, EyeOff,
  Smartphone, Mail, AlertTriangle, Loader2,
  Camera, Trash2, Cloud, CloudOff
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
  phone?: string;
  company?: string;
}

interface NotificationSettings {
  lowStockAlerts: boolean;
  orderUpdates: boolean;
  deliveryAlerts: boolean;
  systemNotifications: boolean;
  emailDigest: boolean;
  pushNotifications: boolean;
  smsAlerts: boolean;
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  sidebarStyle: 'expanded' | 'collapsed';
  compactMode: boolean;
  animationsEnabled: boolean;
}

interface RegionalSettings {
  language: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  numberFormat: string;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  loginNotifications: boolean;
}

interface AllSettings {
  profile: UserProfile;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
  regional: RegionalSettings;
  security: SecuritySettings;
}

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

const defaultSettings: AllSettings = {
  profile: {
    firstName: 'User',
    lastName: '',
    email: 'demo@example.com',
    role: 'Administrator',
    phone: '',
    company: '',
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getUserEmail(): string {
  if (typeof window === 'undefined') return 'demo@example.com';
  
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.email || 'demo@example.com';
    }
  } catch {
    // ignore
  }
  return 'demo@example.com';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [settings, setSettings] = useState<AllSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [dataSource, setDataSource] = useState<'database' | 'localStorage' | 'default'>('default');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [twoFactorStep, setTwoFactorStep] = useState<'idle' | 'setup' | 'verify'>('idle');
  const [verificationCode, setVerificationCode] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // LOAD SETTINGS FROM API (PostgreSQL)
  // ============================================================================
  
  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/settings', {
        headers: {
          'X-User-Email': getUserEmail(),
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSettings(data.data);
          setDataSource(data.source || 'database');
        }
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem('supply_chain_settings');
        if (stored) {
          setSettings(JSON.parse(stored));
          setDataSource('localStorage');
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Fallback to localStorage
      const stored = localStorage.getItem('supply_chain_settings');
      if (stored) {
        setSettings(JSON.parse(stored));
        setDataSource('localStorage');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // ============================================================================
  // APPLY THEME
  // ============================================================================

  useEffect(() => {
    const root = document.documentElement;
    if (settings.appearance.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.appearance.theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
  }, [settings.appearance.theme]);

  // ============================================================================
  // SAVE SETTINGS TO API (PostgreSQL)
  // ============================================================================

  const saveSettings = async (section?: string, newSettings?: AllSettings) => {
    const settingsToSave = newSettings || settings;
    setIsSaving(true);
    setSaveStatus({ type: null, message: '' });
    
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': getUserEmail(),
        },
        body: JSON.stringify(settingsToSave),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Also save to localStorage as backup
        localStorage.setItem('supply_chain_settings', JSON.stringify(settingsToSave));
        setDataSource(data.source || 'database');
        setSaveStatus({ type: 'success', message: `${section || 'Settings'} saved successfully!` });
      } else {
        // Save to localStorage as fallback
        localStorage.setItem('supply_chain_settings', JSON.stringify(settingsToSave));
        setDataSource('localStorage');
        setSaveStatus({ type: 'success', message: `${section || 'Settings'} saved locally` });
      }
    } catch (error) {
      // Save to localStorage as fallback
      localStorage.setItem('supply_chain_settings', JSON.stringify(settingsToSave));
      setDataSource('localStorage');
      setSaveStatus({ type: 'success', message: `${section || 'Settings'} saved locally` });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus({ type: null, message: '' }), 3000);
    }
  };

  // ============================================================================
  // UPDATE FUNCTIONS
  // ============================================================================

  const updateProfile = (field: keyof UserProfile, value: string) => {
    setSettings(prev => ({
      ...prev,
      profile: { ...prev.profile, [field]: value }
    }));
  };

  const updateNotification = async (field: keyof NotificationSettings, value: boolean) => {
    const newSettings = {
      ...settings,
      notifications: { ...settings.notifications, [field]: value }
    };
    setSettings(newSettings);
    await saveSettings('Notification preference', newSettings);
  };

  const updateAppearance = async (field: keyof AppearanceSettings, value: string | boolean) => {
    const newSettings = {
      ...settings,
      appearance: { ...settings.appearance, [field]: value }
    };
    setSettings(newSettings);
    await saveSettings('Appearance', newSettings);
  };

  const updateRegional = (field: keyof RegionalSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      regional: { ...prev.regional, [field]: value }
    }));
  };

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      setSaveStatus({ type: 'error', message: 'New passwords do not match!' });
      return;
    }
    if (passwords.new.length < 8) {
      setSaveStatus({ type: 'error', message: 'Password must be at least 8 characters!' });
      return;
    }
    
    setIsSaving(true);
    
    // In production, this would call an authentication API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSaveStatus({ type: 'success', message: 'Password updated successfully!' });
    setPasswords({ current: '', new: '', confirm: '' });
    setIsSaving(false);
    setTimeout(() => setSaveStatus({ type: null, message: '' }), 3000);
  };

  const handleTwoFactorSetup = async () => {
    if (twoFactorStep === 'idle') {
      setTwoFactorStep('setup');
    } else if (twoFactorStep === 'setup') {
      setTwoFactorStep('verify');
    } else if (twoFactorStep === 'verify') {
      if (verificationCode.length === 6) {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const newSettings = {
          ...settings,
          security: { ...settings.security, twoFactorEnabled: true }
        };
        setSettings(newSettings);
        await saveSettings('Two-factor authentication', newSettings);
        
        setTwoFactorStep('idle');
        setVerificationCode('');
        setIsSaving(false);
      } else {
        setSaveStatus({ type: 'error', message: 'Please enter a valid 6-digit code' });
      }
    }
  };

  const disableTwoFactor = async () => {
    setIsSaving(true);
    
    const newSettings = {
      ...settings,
      security: { ...settings.security, twoFactorEnabled: false }
    };
    setSettings(newSettings);
    await saveSettings('Two-factor authentication', newSettings);
    
    setIsSaving(false);
  };

  const exportSettings = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supply-chain-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    setSaveStatus({ type: 'success', message: 'Settings exported!' });
    setTimeout(() => setSaveStatus({ type: null, message: '' }), 2000);
  };

  const importSettings = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      const merged: AllSettings = {
        profile: { ...defaultSettings.profile, ...imported.profile },
        notifications: { ...defaultSettings.notifications, ...imported.notifications },
        appearance: { ...defaultSettings.appearance, ...imported.appearance },
        regional: { ...defaultSettings.regional, ...imported.regional },
        security: { ...defaultSettings.security, ...imported.security },
      };
      setSettings(merged);
      await saveSettings('Imported settings', merged);
    } catch {
      setSaveStatus({ type: 'error', message: 'Invalid settings file' });
      setTimeout(() => setSaveStatus({ type: null, message: '' }), 3000);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetToDefaults = async () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      try {
        await fetch('/api/settings', {
          method: 'DELETE',
          headers: {
            'X-User-Email': getUserEmail(),
          },
        });
      } catch {
        // ignore
      }
      
      localStorage.removeItem('supply_chain_settings');
      setSettings({
        ...defaultSettings,
        profile: { ...defaultSettings.profile, email: getUserEmail() }
      });
      setSaveStatus({ type: 'success', message: 'Settings reset to defaults!' });
      setTimeout(() => setSaveStatus({ type: null, message: '' }), 3000);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limit file size to 500KB for database storage
      if (file.size > 500 * 1024) {
        setSaveStatus({ type: 'error', message: 'Image must be less than 500KB' });
        setTimeout(() => setSaveStatus({ type: null, message: '' }), 3000);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setSettings(prev => ({
          ...prev,
          profile: { ...prev.profile, avatar: base64 }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // ============================================================================
  // SECTIONS CONFIG
  // ============================================================================

  const sections = [
    { id: 'profile', label: 'Profile', icon: User, description: 'Manage your account details' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Configure alert preferences' },
    { id: 'security', label: 'Security', icon: Shield, description: 'Password and authentication' },
    { id: 'data', label: 'Data Management', icon: Database, description: 'Upload JSON or connect to AWS', link: '/settings/data' },
    { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Theme and display settings' },
    { id: 'language', label: 'Language & Region', icon: Globe, description: 'Localization preferences' },
  ];

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-500">Manage your account and preferences</p>
          </div>
          {/* Data source indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
            dataSource === 'database' 
              ? 'bg-green-100 text-green-700' 
              : dataSource === 'localStorage'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {dataSource === 'database' ? (
              <>
                <Cloud className="w-3 h-3" />
                Synced to cloud
              </>
            ) : dataSource === 'localStorage' ? (
              <>
                <CloudOff className="w-3 h-3" />
                Saved locally
              </>
            ) : (
              <>
                <CloudOff className="w-3 h-3" />
                Default settings
              </>
            )}
          </div>
        </div>
      </div>

      {/* Status Message */}
      {saveStatus.type && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          saveStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {saveStatus.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {saveStatus.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settings Menu */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            {sections.map((section) => (
              section.link ? (
                <Link
                  key={section.id}
                  href={section.link}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 border-b last:border-b-0 transition"
                >
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <section.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{section.label}</p>
                    <p className="text-xs text-gray-500">{section.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              ) : (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 border-b last:border-b-0 transition text-left ${
                    activeSection === section.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className={`p-2 rounded-lg ${activeSection === section.id ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <section.icon className={`w-5 h-5 ${activeSection === section.id ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${activeSection === section.id ? 'text-blue-600' : 'text-gray-900'}`}>
                      {section.label}
                    </p>
                    <p className="text-xs text-gray-500">{section.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              )
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 bg-white rounded-xl border shadow-sm p-4 space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-3">Quick Actions</p>
            <button
              onClick={exportSettings}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
            >
              <Download className="w-4 h-4" />
              Export Settings
            </button>
            <label className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
              <Upload className="w-4 h-4" />
              Import Settings
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={importSettings}
                className="hidden"
              />
            </label>
            <button
              onClick={loadSettings}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh from Server
            </button>
            <button
              onClick={resetToDefaults}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
              Reset to Defaults
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            
            {/* PROFILE SECTION */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Profile Settings</h2>
                
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {settings.profile.avatar ? (
                      <img 
                        src={settings.profile.avatar} 
                        alt="Avatar" 
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {settings.profile.firstName?.[0] || 'U'}{settings.profile.lastName?.[0] || ''}
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 p-1.5 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700">
                      <Camera className="w-4 h-4 text-white" />
                      <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    </label>
                  </div>
                  <div>
                    <label className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 inline-block">
                      Change Photo
                      <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    </label>
                    {settings.profile.avatar && (
                      <button
                        onClick={() => updateProfile('avatar', '')}
                        className="ml-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Max 500KB, JPG or PNG</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input 
                      type="text" 
                      value={settings.profile.firstName}
                      onChange={(e) => updateProfile('firstName', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input 
                      type="text" 
                      value={settings.profile.lastName}
                      onChange={(e) => updateProfile('lastName', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={settings.profile.email}
                    onChange={(e) => updateProfile('email', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input 
                    type="tel" 
                    value={settings.profile.phone || ''}
                    onChange={(e) => updateProfile('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input 
                    type="text" 
                    value={settings.profile.company || ''}
                    onChange={(e) => updateProfile('company', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <input 
                    type="text" 
                    value={settings.profile.role}
                    disabled 
                    className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500" 
                  />
                </div>
                
                <button 
                  onClick={() => saveSettings('Profile')}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            )}

            {/* NOTIFICATIONS SECTION */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Notification Preferences</h2>
                <p className="text-sm text-gray-500">Changes are saved automatically</p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-gray-500">Receive notifications in browser</p>
                      </div>
                    </div>
                    <ToggleSwitch 
                      checked={settings.notifications.pushNotifications}
                      onChange={(v) => updateNotification('pushNotifications', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Low Stock Alerts</p>
                      <p className="text-sm text-gray-500">Get notified when inventory is low</p>
                    </div>
                    <ToggleSwitch 
                      checked={settings.notifications.lowStockAlerts}
                      onChange={(v) => updateNotification('lowStockAlerts', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Order Updates</p>
                      <p className="text-sm text-gray-500">Notifications for order status changes</p>
                    </div>
                    <ToggleSwitch 
                      checked={settings.notifications.orderUpdates}
                      onChange={(v) => updateNotification('orderUpdates', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Delivery Alerts</p>
                      <p className="text-sm text-gray-500">Track delivery progress</p>
                    </div>
                    <ToggleSwitch 
                      checked={settings.notifications.deliveryAlerts}
                      onChange={(v) => updateNotification('deliveryAlerts', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">System Notifications</p>
                      <p className="text-sm text-gray-500">Important system updates</p>
                    </div>
                    <ToggleSwitch 
                      checked={settings.notifications.systemNotifications}
                      onChange={(v) => updateNotification('systemNotifications', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium">Email Digest</p>
                        <p className="text-sm text-gray-500">Daily summary via email</p>
                      </div>
                    </div>
                    <ToggleSwitch 
                      checked={settings.notifications.emailDigest}
                      onChange={(v) => updateNotification('emailDigest', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium">SMS Alerts</p>
                        <p className="text-sm text-gray-500">Critical alerts via SMS</p>
                      </div>
                    </div>
                    <ToggleSwitch 
                      checked={settings.notifications.smsAlerts}
                      onChange={(v) => updateNotification('smsAlerts', v)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECURITY SECTION */}
            {activeSection === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Security Settings</h2>
                
                {/* Change Password */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Change Password</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <div className="relative">
                      <input 
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwords.current}
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg pr-10 focus:ring-2 focus:ring-blue-500" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <div className="relative">
                      <input 
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg pr-10 focus:ring-2 focus:ring-blue-500" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input 
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                  <button 
                    onClick={handlePasswordChange}
                    disabled={isSaving || !passwords.current || !passwords.new || !passwords.confirm}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                    Update Password
                  </button>
                </div>
                
                {/* Two-Factor Authentication */}
                <div className="border-t pt-6">
                  <h3 className="font-medium mb-4">Two-Factor Authentication</h3>
                  
                  {settings.security.twoFactorEnabled ? (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-800">2FA is enabled</p>
                            <p className="text-sm text-green-600">Your account has extra security</p>
                          </div>
                        </div>
                        <button
                          onClick={disableTwoFactor}
                          disabled={isSaving}
                          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disable'}
                        </button>
                      </div>
                    </div>
                  ) : twoFactorStep === 'idle' ? (
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Enable 2FA</p>
                        <p className="text-sm text-gray-500">Add an extra layer of security</p>
                      </div>
                      <button 
                        onClick={handleTwoFactorSetup}
                        className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                      >
                        Setup
                      </button>
                    </div>
                  ) : twoFactorStep === 'setup' ? (
                    <div className="p-4 bg-blue-50 rounded-lg space-y-4">
                      <p className="font-medium text-blue-800">Step 1: Scan QR Code</p>
                      <div className="flex justify-center">
                        <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center border-2 border-dashed border-blue-300">
                          <span className="text-gray-400 text-sm text-center px-4">
                            QR Code would appear here in production
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-blue-700 text-center">
                        Scan this code with Google Authenticator or similar app
                      </p>
                      <button
                        onClick={handleTwoFactorSetup}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Next: Enter Code
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-blue-50 rounded-lg space-y-4">
                      <p className="font-medium text-blue-800">Step 2: Enter Verification Code</p>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit code"
                        className="w-full px-4 py-3 text-center text-2xl tracking-widest border rounded-lg focus:ring-2 focus:ring-blue-500"
                        maxLength={6}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setTwoFactorStep('idle'); setVerificationCode(''); }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleTwoFactorSetup}
                          disabled={isSaving}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                          Verify & Enable
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Session Settings */}
                <div className="border-t pt-6">
                  <h3 className="font-medium mb-4">Session Settings</h3>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Login Notifications</p>
                      <p className="text-sm text-gray-500">Get notified of new logins</p>
                    </div>
                    <ToggleSwitch 
                      checked={settings.security.loginNotifications}
                      onChange={async (v) => {
                        const newSettings = {
                          ...settings,
                          security: { ...settings.security, loginNotifications: v }
                        };
                        setSettings(newSettings);
                        await saveSettings('Login notifications', newSettings);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* APPEARANCE SECTION */}
            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Appearance Settings</h2>
                <p className="text-sm text-gray-500">Changes are applied and saved automatically</p>
                
                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
                  <div className="grid grid-cols-3 gap-4">
                    {(['light', 'dark', 'system'] as const).map((theme) => (
                      <button
                        key={theme}
                        onClick={() => updateAppearance('theme', theme)}
                        className={`p-4 border-2 rounded-lg text-center transition ${
                          settings.appearance.theme === theme 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-lg mx-auto mb-2 ${
                          theme === 'dark' ? 'bg-gray-800' : 
                          theme === 'system' ? 'bg-gradient-to-r from-white to-gray-800 border' : 
                          'bg-white border'
                        }`} />
                        <span className="capitalize">{theme}</span>
                        {settings.appearance.theme === theme && (
                          <Check className="w-4 h-4 text-blue-600 mx-auto mt-1" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Sidebar Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Sidebar Style</label>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => updateAppearance('sidebarStyle', 'expanded')}
                      className={`px-4 py-2 border-2 rounded-lg ${
                        settings.appearance.sidebarStyle === 'expanded'
                          ? 'border-blue-500 text-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      Expanded
                    </button>
                    <button 
                      onClick={() => updateAppearance('sidebarStyle', 'collapsed')}
                      className={`px-4 py-2 border-2 rounded-lg ${
                        settings.appearance.sidebarStyle === 'collapsed'
                          ? 'border-blue-500 text-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      Collapsed
                    </button>
                  </div>
                </div>

                {/* Other Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Compact Mode</p>
                      <p className="text-sm text-gray-500">Reduce spacing and padding</p>
                    </div>
                    <ToggleSwitch 
                      checked={settings.appearance.compactMode}
                      onChange={(v) => updateAppearance('compactMode', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Animations</p>
                      <p className="text-sm text-gray-500">Enable UI animations</p>
                    </div>
                    <ToggleSwitch 
                      checked={settings.appearance.animationsEnabled}
                      onChange={(v) => updateAppearance('animationsEnabled', v)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* LANGUAGE & REGION SECTION */}
            {activeSection === 'language' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Language & Region</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <select 
                    value={settings.regional.language}
                    onChange={(e) => updateRegional('language', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="hi-IN">Hindi</option>
                    <option value="ta-IN">Tamil</option>
                    <option value="te-IN">Telugu</option>
                    <option value="bn-IN">Bengali</option>
                    <option value="mr-IN">Marathi</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select 
                    value={settings.regional.timezone}
                    onChange={(e) => updateRegional('timezone', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+5:30)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Europe/Paris">Europe/Paris (CET)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select 
                    value={settings.regional.currency}
                    onChange={(e) => updateRegional('currency', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                    <option value="JPY">JPY (¥) - Japanese Yen</option>
                    <option value="AUD">AUD ($) - Australian Dollar</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                  <select 
                    value={settings.regional.dateFormat}
                    onChange={(e) => updateRegional('dateFormat', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number Format</label>
                  <select 
                    value={settings.regional.numberFormat}
                    onChange={(e) => updateRegional('numberFormat', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en-IN">Indian (1,00,000.00)</option>
                    <option value="en-US">US (100,000.00)</option>
                    <option value="de-DE">German (100.000,00)</option>
                  </select>
                </div>

                {/* Preview */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Date: {new Date().toLocaleDateString(settings.regional.language)}</p>
                    <p>Currency: {new Intl.NumberFormat(settings.regional.numberFormat, { 
                      style: 'currency', 
                      currency: settings.regional.currency 
                    }).format(123456.78)}</p>
                    <p>Number: {new Intl.NumberFormat(settings.regional.numberFormat).format(1234567.89)}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => saveSettings('Regional settings')}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TOGGLE SWITCH COMPONENT
// ============================================================================

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );
}