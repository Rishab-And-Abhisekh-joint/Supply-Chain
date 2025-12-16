'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User, Mail, Phone, Lock, Building2, MapPin, CreditCard,
  Upload, Camera, Store, Warehouse, FileText, CheckCircle2,
  ArrowRight, ArrowLeft, Globe, Shield, Smartphone, Database,
  Cloud, FileJson, Table, AlertCircle, Eye, EyeOff, Loader2
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type UserRole = 'retail_seller' | 'warehouse_keeper';
type PaymentMethod = 'gpay' | 'phonepe' | 'paytm' | 'card' | 'upi';
type DataUploadMethod = 'json' | 's3' | 'manual' | 'skip';

interface CountryCode {
  code: string;
  country: string;
  flag: string;
  dialCode: string;
}

interface FormData {
  // Step 1: Personal Info
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phone: string;
  password: string;
  confirmPassword: string;
  
  // Step 2: License Verification
  licenseNumber: string;
  licenseType: string;
  licenseExpiry: string;
  licensePhoto: File | null;
  licensePhotoPreview: string;
  
  // Step 3: Role Selection
  role: UserRole | '';
  businessName: string;
  businessRegistration: string;
  
  // Step 4: Location
  address: string;
  city: string;
  state: string;
  pincode: string;
  coordinates: { lat: number; lng: number } | null;
  useGPS: boolean;
  
  // Step 5: Payment Methods
  paymentMethods: PaymentMethod[];
  upiId: string;
  bankAccountNumber: string;
  bankIfsc: string;
  cardLast4: string;
  
  // Step 6: Data Upload
  dataUploadMethod: DataUploadMethod;
  inventoryFile: File | null;
  s3Bucket: string;
  s3AccessKey: string;
  s3SecretKey: string;
  
  // Step 7: Review
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeMarketing: boolean;
}

interface ValidationErrors {
  [key: string]: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COUNTRY_CODES: CountryCode[] = [
  { code: 'IN', country: 'India', flag: '🇮🇳', dialCode: '+91' },
  { code: 'US', country: 'United States', flag: '🇺🇸', dialCode: '+1' },
  { code: 'GB', country: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
  { code: 'AE', country: 'UAE', flag: '🇦🇪', dialCode: '+971' },
  { code: 'SG', country: 'Singapore', flag: '🇸🇬', dialCode: '+65' },
  { code: 'AU', country: 'Australia', flag: '🇦🇺', dialCode: '+61' },
  { code: 'CA', country: 'Canada', flag: '🇨🇦', dialCode: '+1' },
  { code: 'DE', country: 'Germany', flag: '🇩🇪', dialCode: '+49' },
  { code: 'FR', country: 'France', flag: '🇫🇷', dialCode: '+33' },
  { code: 'JP', country: 'Japan', flag: '🇯🇵', dialCode: '+81' },
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry'
];

const STEPS = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'License Verification', icon: FileText },
  { id: 3, title: 'Role Selection', icon: Building2 },
  { id: 4, title: 'Location', icon: MapPin },
  { id: 5, title: 'Payment Methods', icon: CreditCard },
  { id: 6, title: 'Data Upload', icon: Database },
  { id: 7, title: 'Review & Submit', icon: CheckCircle2 },
];

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  countryCode: 'IN',
  phone: '',
  password: '',
  confirmPassword: '',
  licenseNumber: '',
  licenseType: '',
  licenseExpiry: '',
  licensePhoto: null,
  licensePhotoPreview: '',
  role: '',
  businessName: '',
  businessRegistration: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  coordinates: null,
  useGPS: false,
  paymentMethods: [],
  upiId: '',
  bankAccountNumber: '',
  bankIfsc: '',
  cardLast4: '',
  dataUploadMethod: 'skip',
  inventoryFile: null,
  s3Bucket: '',
  s3AccessKey: '',
  s3SecretKey: '',
  agreeTerms: false,
  agreePrivacy: false,
  agreeMarketing: false,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SignupRegistration() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inventoryFileRef = useRef<HTMLInputElement>(null);

  // Update form field
  const updateField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Validate current step
  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {};

    switch (step) {
      case 1:
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Phone must be 10 digits';
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        break;

      case 2:
        if (!formData.licenseNumber.trim()) newErrors.licenseNumber = 'License number is required';
        if (!formData.licenseType) newErrors.licenseType = 'License type is required';
        if (!formData.licenseExpiry) newErrors.licenseExpiry = 'Expiry date is required';
        break;

      case 3:
        if (!formData.role) newErrors.role = 'Please select a role';
        if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
        break;

      case 4:
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.state) newErrors.state = 'State is required';
        if (!formData.pincode.trim()) newErrors.pincode = 'PIN code is required';
        else if (!/^\d{6}$/.test(formData.pincode)) newErrors.pincode = 'PIN code must be 6 digits';
        break;

      case 5:
        if (formData.paymentMethods.length === 0) newErrors.paymentMethods = 'Select at least one payment method';
        if (formData.paymentMethods.includes('upi') && !formData.upiId.trim()) {
          newErrors.upiId = 'UPI ID is required';
        }
        break;

      case 6:
        if (formData.dataUploadMethod === 's3') {
          if (!formData.s3Bucket.trim()) newErrors.s3Bucket = 'S3 bucket is required';
          if (!formData.s3AccessKey.trim()) newErrors.s3AccessKey = 'Access key is required';
          if (!formData.s3SecretKey.trim()) newErrors.s3SecretKey = 'Secret key is required';
        }
        break;

      case 7:
        if (!formData.agreeTerms) newErrors.agreeTerms = 'You must agree to the terms';
        if (!formData.agreePrivacy) newErrors.agreePrivacy = 'You must agree to the privacy policy';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation handlers
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 7));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // GPS location handler
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setErrors(prev => ({ ...prev, coordinates: 'Geolocation is not supported' }));
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateField('coordinates', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        updateField('useGPS', true);
        setIsGettingLocation(false);
      },
      (error) => {
        setErrors(prev => ({ ...prev, coordinates: 'Unable to get location: ' + error.message }));
        setIsGettingLocation(false);
      }
    );
  };

  // File upload handlers
  const handleLicensePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateField('licensePhoto', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        updateField('licensePhotoPreview', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInventoryFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateField('inventoryFile', file);
    }
  };

  // Payment method toggle
  const togglePaymentMethod = (method: PaymentMethod) => {
    const current = formData.paymentMethods;
    if (current.includes(method)) {
      updateField('paymentMethods', current.filter(m => m !== method));
    } else {
      updateField('paymentMethods', [...current, method]);
    }
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!validateStep(7)) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    
    // Show success (in real app, redirect to dashboard)
    alert('Registration successful! Welcome to the Supply Chain Platform.');
  };

  // Get country code display
  const getCountryCode = () => {
    const country = COUNTRY_CODES.find(c => c.code === formData.countryCode);
    return country ? `${country.flag} ${country.dialCode}` : '+91';
  };

  // ============================================================================
  // STEP RENDERERS
  // ============================================================================

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            placeholder="John"
            className={errors.firstName ? 'border-red-500' : ''}
          />
          {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            placeholder="Doe"
            className={errors.lastName ? 'border-red-500' : ''}
          />
          {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="john@example.com"
            className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
          />
        </div>
        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number *</Label>
        <div className="flex gap-2">
          <Select value={formData.countryCode} onValueChange={(v) => updateField('countryCode', v)}>
            <SelectTrigger className="w-32">
              <SelectValue>{getCountryCode()}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {COUNTRY_CODES.map(country => (
                <SelectItem key={country.code} value={country.code}>
                  {country.flag} {country.dialCode} ({country.country})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="9876543210"
              className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
            />
          </div>
        </div>
        {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password *</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => updateField('password', e.target.value)}
            placeholder="••••••••"
            className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password *</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => updateField('confirmPassword', e.target.value)}
            placeholder="••••••••"
            className={`pl-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
          />
        </div>
        {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
      </div>

      <Separator />

      <Button variant="outline" className="w-full" type="button">
        <Globe className="h-4 w-4 mr-2" />
        Continue with Google
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="licenseNumber">License Number *</Label>
        <Input
          id="licenseNumber"
          value={formData.licenseNumber}
          onChange={(e) => updateField('licenseNumber', e.target.value)}
          placeholder="Enter your business license number"
          className={errors.licenseNumber ? 'border-red-500' : ''}
        />
        {errors.licenseNumber && <p className="text-xs text-red-500">{errors.licenseNumber}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="licenseType">License Type *</Label>
        <Select value={formData.licenseType} onValueChange={(v) => updateField('licenseType', v)}>
          <SelectTrigger className={errors.licenseType ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select license type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gst">GST Registration</SelectItem>
            <SelectItem value="trade">Trade License</SelectItem>
            <SelectItem value="fssai">FSSAI License</SelectItem>
            <SelectItem value="import_export">Import/Export License</SelectItem>
            <SelectItem value="msme">MSME Registration</SelectItem>
          </SelectContent>
        </Select>
        {errors.licenseType && <p className="text-xs text-red-500">{errors.licenseType}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="licenseExpiry">License Expiry Date *</Label>
        <Input
          id="licenseExpiry"
          type="date"
          value={formData.licenseExpiry}
          onChange={(e) => updateField('licenseExpiry', e.target.value)}
          className={errors.licenseExpiry ? 'border-red-500' : ''}
        />
        {errors.licenseExpiry && <p className="text-xs text-red-500">{errors.licenseExpiry}</p>}
      </div>

      <div className="space-y-2">
        <Label>License Photo (Optional)</Label>
        <div 
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {formData.licensePhotoPreview ? (
            <div className="space-y-2">
              <img 
                src={formData.licensePhotoPreview} 
                alt="License preview" 
                className="max-h-40 mx-auto rounded"
              />
              <p className="text-sm text-muted-foreground">Click to change</p>
            </div>
          ) : (
            <>
              <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG up to 5MB
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLicensePhotoUpload}
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>Select Your Role *</Label>
        <RadioGroup 
          value={formData.role} 
          onValueChange={(v) => updateField('role', v as UserRole)}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <RadioGroupItem value="retail_seller" id="retail_seller" className="peer sr-only" />
            <Label
              htmlFor="retail_seller"
              className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              <Store className="h-12 w-12 mb-3 text-blue-500" />
              <span className="text-lg font-semibold">Retail Seller</span>
              <span className="text-sm text-muted-foreground text-center mt-2">
                Sell products through your retail store or online shop
              </span>
            </Label>
          </div>
          <div>
            <RadioGroupItem value="warehouse_keeper" id="warehouse_keeper" className="peer sr-only" />
            <Label
              htmlFor="warehouse_keeper"
              className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              <Warehouse className="h-12 w-12 mb-3 text-green-500" />
              <span className="text-lg font-semibold">Warehouse Keeper</span>
              <span className="text-sm text-muted-foreground text-center mt-2">
                Manage inventory and fulfill orders from your warehouse
              </span>
            </Label>
          </div>
        </RadioGroup>
        {errors.role && <p className="text-xs text-red-500">{errors.role}</p>}
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="businessName">Business Name *</Label>
        <Input
          id="businessName"
          value={formData.businessName}
          onChange={(e) => updateField('businessName', e.target.value)}
          placeholder="Your Business Name"
          className={errors.businessName ? 'border-red-500' : ''}
        />
        {errors.businessName && <p className="text-xs text-red-500">{errors.businessName}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessRegistration">Business Registration Number (Optional)</Label>
        <Input
          id="businessRegistration"
          value={formData.businessRegistration}
          onChange={(e) => updateField('businessRegistration', e.target.value)}
          placeholder="CIN / Registration Number"
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="address">Street Address *</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => updateField('address', e.target.value)}
          placeholder="Enter your complete address"
          rows={3}
          className={errors.address ? 'border-red-500' : ''}
        />
        {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => updateField('city', e.target.value)}
            placeholder="Mumbai"
            className={errors.city ? 'border-red-500' : ''}
          />
          {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="pincode">PIN Code *</Label>
          <Input
            id="pincode"
            value={formData.pincode}
            onChange={(e) => updateField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="400001"
            className={errors.pincode ? 'border-red-500' : ''}
          />
          {errors.pincode && <p className="text-xs text-red-500">{errors.pincode}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="state">State *</Label>
        <Select value={formData.state} onValueChange={(v) => updateField('state', v)}>
          <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            {INDIAN_STATES.map(state => (
              <SelectItem key={state} value={state}>{state}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.state && <p className="text-xs text-red-500">{errors.state}</p>}
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>GPS Location (Optional)</Label>
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleGetLocation}
            disabled={isGettingLocation}
            className="flex-1"
          >
            {isGettingLocation ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4 mr-2" />
            )}
            {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
          </Button>
        </div>
        {formData.coordinates && (
          <div className="p-3 bg-green-50 rounded-lg text-sm">
            <CheckCircle2 className="h-4 w-4 inline mr-2 text-green-500" />
            Location captured: {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
          </div>
        )}
        {errors.coordinates && <p className="text-xs text-red-500">{errors.coordinates}</p>}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>Select Payment Methods *</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { id: 'gpay', name: 'Google Pay', icon: '💳', color: 'bg-blue-50 border-blue-200' },
            { id: 'phonepe', name: 'PhonePe', icon: '📱', color: 'bg-purple-50 border-purple-200' },
            { id: 'paytm', name: 'Paytm', icon: '💰', color: 'bg-cyan-50 border-cyan-200' },
            { id: 'card', name: 'Credit/Debit Card', icon: '💳', color: 'bg-orange-50 border-orange-200' },
            { id: 'upi', name: 'UPI ID', icon: '🔗', color: 'bg-green-50 border-green-200' },
          ].map(method => (
            <div
              key={method.id}
              onClick={() => togglePaymentMethod(method.id as PaymentMethod)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                formData.paymentMethods.includes(method.id as PaymentMethod)
                  ? `${method.color} border-primary`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={formData.paymentMethods.includes(method.id as PaymentMethod)}
                  className="pointer-events-none"
                />
                <span className="text-xl">{method.icon}</span>
                <span className="text-sm font-medium">{method.name}</span>
              </div>
            </div>
          ))}
        </div>
        {errors.paymentMethods && <p className="text-xs text-red-500">{errors.paymentMethods}</p>}
      </div>

      {formData.paymentMethods.includes('upi') && (
        <div className="space-y-2">
          <Label htmlFor="upiId">UPI ID *</Label>
          <Input
            id="upiId"
            value={formData.upiId}
            onChange={(e) => updateField('upiId', e.target.value)}
            placeholder="yourname@upi"
            className={errors.upiId ? 'border-red-500' : ''}
          />
          {errors.upiId && <p className="text-xs text-red-500">{errors.upiId}</p>}
        </div>
      )}

      {formData.paymentMethods.includes('card') && (
        <div className="space-y-4 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium">Card details will be collected during first transaction</p>
        </div>
      )}
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>How would you like to upload your data?</Label>
        <RadioGroup 
          value={formData.dataUploadMethod} 
          onValueChange={(v) => updateField('dataUploadMethod', v as DataUploadMethod)}
          className="space-y-3"
        >
          <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted cursor-pointer">
            <RadioGroupItem value="json" id="json" />
            <FileJson className="h-5 w-5 text-blue-500" />
            <Label htmlFor="json" className="flex-1 cursor-pointer">
              <span className="font-medium">Upload JSON File</span>
              <p className="text-sm text-muted-foreground">Upload inventory/sales data as JSON</p>
            </Label>
          </div>
          <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted cursor-pointer">
            <RadioGroupItem value="s3" id="s3" />
            <Cloud className="h-5 w-5 text-orange-500" />
            <Label htmlFor="s3" className="flex-1 cursor-pointer">
              <span className="font-medium">Connect AWS S3</span>
              <p className="text-sm text-muted-foreground">Sync data from your S3 bucket</p>
            </Label>
          </div>
          <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted cursor-pointer">
            <RadioGroupItem value="manual" id="manual" />
            <Table className="h-5 w-5 text-green-500" />
            <Label htmlFor="manual" className="flex-1 cursor-pointer">
              <span className="font-medium">Manual Entry</span>
              <p className="text-sm text-muted-foreground">Enter data manually after registration</p>
            </Label>
          </div>
          <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted cursor-pointer">
            <RadioGroupItem value="skip" id="skip" />
            <ArrowRight className="h-5 w-5 text-gray-500" />
            <Label htmlFor="skip" className="flex-1 cursor-pointer">
              <span className="font-medium">Skip for Now</span>
              <p className="text-sm text-muted-foreground">Configure data upload later</p>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {formData.dataUploadMethod === 'json' && (
        <div 
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => inventoryFileRef.current?.click()}
        >
          {formData.inventoryFile ? (
            <div className="space-y-2">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
              <p className="font-medium">{formData.inventoryFile.name}</p>
              <p className="text-sm text-muted-foreground">Click to change file</p>
            </div>
          ) : (
            <>
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Click to upload inventory/sales JSON file
              </p>
            </>
          )}
          <input
            ref={inventoryFileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleInventoryFileUpload}
          />
        </div>
      )}

      {formData.dataUploadMethod === 's3' && (
        <div className="space-y-4 p-4 bg-muted rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="s3Bucket">S3 Bucket Name *</Label>
            <Input
              id="s3Bucket"
              value={formData.s3Bucket}
              onChange={(e) => updateField('s3Bucket', e.target.value)}
              placeholder="my-inventory-bucket"
              className={errors.s3Bucket ? 'border-red-500' : ''}
            />
            {errors.s3Bucket && <p className="text-xs text-red-500">{errors.s3Bucket}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="s3AccessKey">Access Key ID *</Label>
            <Input
              id="s3AccessKey"
              value={formData.s3AccessKey}
              onChange={(e) => updateField('s3AccessKey', e.target.value)}
              placeholder="AKIAIOSFODNN7EXAMPLE"
              className={errors.s3AccessKey ? 'border-red-500' : ''}
            />
            {errors.s3AccessKey && <p className="text-xs text-red-500">{errors.s3AccessKey}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="s3SecretKey">Secret Access Key *</Label>
            <Input
              id="s3SecretKey"
              type="password"
              value={formData.s3SecretKey}
              onChange={(e) => updateField('s3SecretKey', e.target.value)}
              placeholder="••••••••••••••••"
              className={errors.s3SecretKey ? 'border-red-500' : ''}
            />
            {errors.s3SecretKey && <p className="text-xs text-red-500">{errors.s3SecretKey}</p>}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep7 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Review Your Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{formData.firstName} {formData.lastName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{formData.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium">{getCountryCode()} {formData.phone}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Role</p>
              <p className="font-medium capitalize">{formData.role?.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Business</p>
              <p className="font-medium">{formData.businessName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">License</p>
              <p className="font-medium">{formData.licenseNumber}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Address</p>
              <p className="font-medium">{formData.address}, {formData.city}, {formData.state} - {formData.pincode}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Payment Methods</p>
              <div className="flex gap-2 mt-1">
                {formData.paymentMethods.map(method => (
                  <Badge key={method} variant="outline" className="capitalize">{method}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="agreeTerms"
            checked={formData.agreeTerms}
            onCheckedChange={(checked) => updateField('agreeTerms', checked as boolean)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="agreeTerms" className="text-sm cursor-pointer">
              I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> *
            </Label>
          </div>
        </div>
        {errors.agreeTerms && <p className="text-xs text-red-500 ml-7">{errors.agreeTerms}</p>}

        <div className="flex items-start space-x-3">
          <Checkbox
            id="agreePrivacy"
            checked={formData.agreePrivacy}
            onCheckedChange={(checked) => updateField('agreePrivacy', checked as boolean)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="agreePrivacy" className="text-sm cursor-pointer">
              I agree to the <a href="#" className="text-primary hover:underline">Privacy Policy</a> *
            </Label>
          </div>
        </div>
        {errors.agreePrivacy && <p className="text-xs text-red-500 ml-7">{errors.agreePrivacy}</p>}

        <div className="flex items-start space-x-3">
          <Checkbox
            id="agreeMarketing"
            checked={formData.agreeMarketing}
            onCheckedChange={(checked) => updateField('agreeMarketing', checked as boolean)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="agreeMarketing" className="text-sm cursor-pointer">
              I would like to receive marketing emails and updates (optional)
            </Label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
      default: return null;
    }
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Join Our Supply Chain Platform</h1>
          <p className="text-muted-foreground mt-2">Complete your registration in 7 simple steps</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              
              return (
                <div 
                  key={step.id} 
                  className={`flex flex-col items-center ${
                    isCurrent ? 'text-primary' : isCompleted ? 'text-green-500' : 'text-muted-foreground'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                    isCurrent ? 'bg-primary text-white' : 
                    isCompleted ? 'bg-green-500 text-white' : 'bg-muted'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className="text-xs hidden md:block">{step.title}</span>
                </div>
              );
            })}
          </div>
          <Progress value={(currentStep / 7) * 100} className="h-2" />
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(STEPS[currentStep - 1].icon, { className: "h-5 w-5" })}
              Step {currentStep}: {STEPS[currentStep - 1].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderCurrentStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button 
            variant="outline" 
            onClick={handlePrev}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          {currentStep < 7 ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Complete Registration
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}