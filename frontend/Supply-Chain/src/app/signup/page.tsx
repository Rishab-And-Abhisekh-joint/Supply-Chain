'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import {
  User, Mail, Lock, Phone, Building, MapPin, CreditCard, FileText,
  CheckCircle, ArrowRight, ArrowLeft, Loader2, Eye, EyeOff, Truck,
  Package, Warehouse, BarChart3, Users, Shield, Upload, X, FileJson, AlertTriangle
} from 'lucide-react';

interface UploadedFile {
  name: string;
  type: string;
  data: any;
  status: 'success' | 'error';
  error?: string;
}

const roles = [
  { id: 'supplier', name: 'Supplier', icon: Package, description: 'Provide goods and materials' },
  { id: 'distributor', name: 'Distributor', icon: Truck, description: 'Transport and deliver products' },
  { id: 'warehouse_manager', name: 'Warehouse Manager', icon: Warehouse, description: 'Manage inventory storage' },
  { id: 'logistics_coordinator', name: 'Logistics Coordinator', icon: BarChart3, description: 'Coordinate supply chain' },
  { id: 'fleet_manager', name: 'Fleet Manager', icon: Truck, description: 'Manage vehicle fleet' },
  { id: 'admin', name: 'Administrator', icon: Shield, description: 'Full system access' },
];

const paymentMethods = [
  { id: 'bank_transfer', name: 'Bank Transfer' },
  { id: 'credit_card', name: 'Credit Card' },
  { id: 'upi', name: 'UPI' },
  { id: 'net_banking', name: 'Net Banking' },
];

const supportedJsonTypes = [
  { type: 'inventory', label: 'Inventory' },
  { type: 'warehouses', label: 'Warehouses' },
  { type: 'orders', label: 'Orders' },
  { type: 'vehicles', label: 'Vehicles' },
  { type: 'team', label: 'Team' },
  { type: 'deliveries', label: 'Deliveries' },
];

export default function SignupPage() {
  const { signup } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
    firstName: '', lastName: '', phone: '', role: '',
    company: '', licenseNumber: '',
    address: '', city: '', state: '', pincode: '',
    paymentMethod: '',
    jsonFiles: [] as { name: string; type: string; data: any }[],
  });

  const totalSteps = 8;

  const detectJsonType = (filename: string, data: any): string => {
    const lowerName = filename.toLowerCase();
    if (lowerName.includes('inventory') || lowerName.includes('product')) return 'inventory';
    if (lowerName.includes('warehouse')) return 'warehouses';
    if (lowerName.includes('order')) return 'orders';
    if (lowerName.includes('vehicle') || lowerName.includes('fleet')) return 'vehicles';
    if (lowerName.includes('team') || lowerName.includes('employee')) return 'team';
    if (lowerName.includes('delivery')) return 'deliveries';
    
    if (Array.isArray(data) && data.length > 0) {
      const s = data[0];
      if (s.sku || s.productName || s.currentStock) return 'inventory';
      if (s.capacity || s.warehouseId) return 'warehouses';
      if (s.orderNumber || s.customerName) return 'orders';
      if (s.vehicleNumber || s.licensePlate) return 'vehicles';
      if (s.role && s.department) return 'team';
      if (s.deliveryId || s.trackingNumber) return 'deliveries';
    }
    return 'unknown';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setIsUploading(true);
    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(files)) {
      if (!file.name.endsWith('.json')) {
        newFiles.push({ name: file.name, type: 'unknown', data: null, status: 'error', error: 'Only JSON files supported' });
        continue;
      }
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        newFiles.push({ name: file.name, type: detectJsonType(file.name, data), data, status: 'success' });
      } catch {
        newFiles.push({ name: file.name, type: 'unknown', data: null, status: 'error', error: 'Invalid JSON' });
      }
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);
    setFormData(prev => ({
      ...prev,
      jsonFiles: [...prev.jsonFiles, ...newFiles.filter(f => f.status === 'success').map(f => ({ name: f.name, type: f.type, data: f.data }))],
    }));
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({ ...prev, jsonFiles: prev.jsonFiles.filter((_, i) => i !== index) }));
  };

  const changeFileType = (index: number, newType: string) => {
    setUploadedFiles(prev => prev.map((f, i) => i === index ? { ...f, type: newType } : f));
    setFormData(prev => ({ ...prev, jsonFiles: prev.jsonFiles.map((f, i) => i === index ? { ...f, type: newType } : f) }));
  };

  const validateStep = (): boolean => {
    setError('');
    if (currentStep === 1) {
      if (!formData.email || !formData.password || !formData.confirmPassword) { setError('Fill all fields'); return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setError('Invalid email'); return false; }
      if (formData.password.length < 6) { setError('Password min 6 chars'); return false; }
      if (formData.password !== formData.confirmPassword) { setError('Passwords mismatch'); return false; }
    }
    if (currentStep === 2 && (!formData.firstName || !formData.lastName)) { setError('Enter full name'); return false; }
    if (currentStep === 3 && !formData.role) { setError('Select a role'); return false; }
    return true;
  };

  const handleNext = () => { if (validateStep() && currentStep < totalSteps) setCurrentStep(prev => prev + 1); };
  const handleBack = () => { if (currentStep > 1) setCurrentStep(prev => prev - 1); };

  const uploadJsonDataAfterSignup = async (userEmail: string) => {
    for (const file of formData.jsonFiles) {
      if (file.type === 'unknown') continue;
      try {
        await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-User-Email': userEmail },
          body: JSON.stringify({ type: file.type, data: Array.isArray(file.data) ? file.data : [file.data] }),
        });
      } catch (err) { console.error('Upload error:', err); }
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setIsLoading(true);
    setError('');

    const result = await signup({
      email: formData.email, password: formData.password,
      firstName: formData.firstName, lastName: formData.lastName,
      phone: formData.phone, role: formData.role, company: formData.company,
      address: formData.address, city: formData.city, state: formData.state, pincode: formData.pincode,
    });

    if (result.success && formData.jsonFiles.length > 0) {
      await uploadJsonDataAfterSignup(formData.email);
    } else if (!result.success) {
      setError(result.error || 'Signup failed');
    }
    setIsLoading(false);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8 overflow-x-auto pb-2">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <React.Fragment key={step}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${step < currentStep ? 'bg-green-500 text-white' : step === currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
            {step < currentStep ? <CheckCircle className="w-4 h-4" /> : step}
          </div>
          {step < totalSteps && <div className={`w-6 h-1 mx-0.5 rounded flex-shrink-0 ${step < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1: return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center mb-6">Create Your Account</h2>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="w-full pl-10 pr-4 py-3 border rounded-lg" placeholder="Email" /></div></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} className="w-full pl-10 pr-12 py-3 border rounded-lg" placeholder="Password" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type={showPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))} className="w-full pl-10 pr-4 py-3 border rounded-lg" placeholder="Confirm" /></div></div>
        </div>
      );
      case 2: return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center mb-6">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">First Name</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" value={formData.firstName} onChange={e => setFormData(p => ({ ...p, firstName: e.target.value }))} className="w-full pl-10 pr-4 py-3 border rounded-lg" placeholder="First" /></div></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" value={formData.lastName} onChange={e => setFormData(p => ({ ...p, lastName: e.target.value }))} className="w-full pl-10 pr-4 py-3 border rounded-lg" placeholder="Last" /></div></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="tel" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} className="w-full pl-10 pr-4 py-3 border rounded-lg" placeholder="+91" /></div></div>
        </div>
      );
      case 3: return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center mb-6">Select Your Role</h2>
          <div className="grid grid-cols-2 gap-4">
            {roles.map(role => { const Icon = role.icon; return (
              <div key={role.id} onClick={() => setFormData(p => ({ ...p, role: role.id }))} className={`p-4 border-2 rounded-xl cursor-pointer ${formData.role === role.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <Icon className={`w-8 h-8 mb-2 ${formData.role === role.id ? 'text-blue-600' : 'text-gray-400'}`} />
                <h3 className="font-medium">{role.name}</h3>
                <p className="text-xs text-gray-500">{role.description}</p>
              </div>
            ); })}
          </div>
        </div>
      );
      case 4: return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center mb-6">Company Details (Optional)</h2>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Company</label><div className="relative"><Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" value={formData.company} onChange={e => setFormData(p => ({ ...p, company: e.target.value }))} className="w-full pl-10 pr-4 py-3 border rounded-lg" placeholder="Company name" /></div></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">License Number</label><div className="relative"><FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" value={formData.licenseNumber} onChange={e => setFormData(p => ({ ...p, licenseNumber: e.target.value }))} className="w-full pl-10 pr-4 py-3 border rounded-lg" placeholder="License" /></div></div>
        </div>
      );
      case 5: return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center mb-6">Location (Optional)</h2>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><div className="relative"><MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" /><textarea value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} className="w-full pl-10 pr-4 py-3 border rounded-lg" placeholder="Address" rows={2} /></div></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input type="text" value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} className="w-full px-4 py-3 border rounded-lg" placeholder="City" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">State</label><input type="text" value={formData.state} onChange={e => setFormData(p => ({ ...p, state: e.target.value }))} className="w-full px-4 py-3 border rounded-lg" placeholder="State" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label><input type="text" value={formData.pincode} onChange={e => setFormData(p => ({ ...p, pincode: e.target.value }))} className="w-full px-4 py-3 border rounded-lg" placeholder="Pincode" /></div>
        </div>
      );
      case 6: return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center mb-6">Payment Method (Optional)</h2>
          <div className="space-y-3">
            {paymentMethods.map(method => (
              <div key={method.id} onClick={() => setFormData(p => ({ ...p, paymentMethod: method.id }))} className={`p-4 border-2 rounded-xl cursor-pointer flex items-center gap-4 ${formData.paymentMethod === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <CreditCard className={`w-6 h-6 ${formData.paymentMethod === method.id ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="font-medium">{method.name}</span>
              </div>
            ))}
          </div>
        </div>
      );
      case 7: return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center mb-4">Import Your Data (Optional)</h2>
          <p className="text-sm text-gray-500 text-center mb-4">Upload JSON files to pre-populate your dashboard.</p>
          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50">
            <input ref={fileInputRef} type="file" accept=".json" multiple onChange={handleFileUpload} className="hidden" />
            {isUploading ? <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" /> : <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />}
            <p className="text-gray-600 font-medium">Click to upload JSON files</p>
          </div>
          <div className="text-xs text-gray-500"><p className="font-medium mb-1">Supported:</p><div className="flex flex-wrap gap-2">{supportedJsonTypes.map(t => <span key={t.type} className="px-2 py-1 bg-gray-100 rounded">{t.label}</span>)}</div></div>
          {uploadedFiles.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-sm font-medium">Uploaded Files:</p>
              {uploadedFiles.map((file, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${file.status === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-3">
                    <FileJson className={`w-5 h-5 ${file.status === 'success' ? 'text-green-600' : 'text-red-600'}`} />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      {file.status === 'success' ? (
                        <select value={file.type} onChange={e => changeFileType(index, e.target.value)} className="text-xs border rounded px-2 py-1 mt-1">
                          {supportedJsonTypes.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
                          <option value="unknown">Unknown</option>
                        </select>
                      ) : <p className="text-xs text-red-600">{file.error}</p>}
                    </div>
                  </div>
                  <button onClick={() => removeFile(index)} className="p-1 text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
      case 8: return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center mb-6">Review & Submit</h2>
          <div className="bg-gray-50 rounded-xl p-6 space-y-3 max-h-64 overflow-y-auto">
            <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{formData.email}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{formData.firstName} {formData.lastName}</span></div>
            {formData.phone && <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium">{formData.phone}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">Role</span><span className="font-medium capitalize">{formData.role.replace('_', ' ')}</span></div>
            {formData.company && <div className="flex justify-between"><span className="text-gray-500">Company</span><span className="font-medium">{formData.company}</span></div>}
            {formData.city && <div className="flex justify-between"><span className="text-gray-500">Location</span><span className="font-medium">{formData.city}, {formData.state}</span></div>}
            {formData.jsonFiles.length > 0 && (
              <div className="pt-2 border-t"><span className="text-gray-500">Data to Import</span><div className="mt-1 flex flex-wrap gap-2">{formData.jsonFiles.map((f, i) => <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">{f.type}: {Array.isArray(f.data) ? f.data.length : 1}</span>)}</div></div>
            )}
          </div>
          <p className="text-sm text-gray-500 text-center">By clicking &quot;Create Account&quot;, you agree to our Terms of Service.</p>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center"><Package className="w-6 h-6 text-white" /></div>
            <span className="text-2xl font-bold text-gray-900">SupplyChain</span>
          </div>
          <p className="text-gray-500">Create your account to get started</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {renderStepIndicator()}
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}
          {renderStep()}

          <div className="flex gap-4 mt-8">
            {currentStep > 1 && <button onClick={handleBack} className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"><ArrowLeft className="w-5 h-5" />Back</button>}
            {currentStep < totalSteps ? (
              <button onClick={handleNext} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2">Next<ArrowRight className="w-5 h-5" /></button>
            ) : (
              <button onClick={handleSubmit} disabled={isLoading} className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2 disabled:bg-green-400">
                {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" />Creating...</> : <><CheckCircle className="w-5 h-5" />Create Account</>}
              </button>
            )}
          </div>
        </div>

        <p className="text-center mt-6 text-gray-600">Already have an account? <Link href="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link></p>
      </div>
    </div>
  );
}