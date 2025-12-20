'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CreditCard, Building2, Plus, Trash2, Check, AlertCircle, Loader2,
  ChevronLeft, Smartphone, Landmark, Star, Eye, EyeOff, Shield,
  CheckCircle, Info, RefreshCw, X, Wallet
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface PaymentMethod {
  id: string;
  methodType: 'card' | 'upi' | 'netbanking';
  isDefault: boolean;
  cardLastFour?: string;
  cardBrand?: string;
  cardExpiry?: string;
  cardHolderName?: string;
  upiId?: string;
  bankName?: string;
  accountHolder?: string;
  nickname?: string;
  createdAt: string;
}

interface BankAccount {
  id: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName?: string;
  accountType: string;
  isVerified: boolean;
  isPrimary: boolean;
  createdAt: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function getUserEmail(): string {
  if (typeof window === 'undefined') return 'demo@example.com';
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr).email || 'demo@example.com';
  } catch { }
  return 'demo@example.com';
}

function maskAccountNumber(num: string): string {
  if (!num || num.length < 4) return num;
  return '•'.repeat(num.length - 4) + num.slice(-4);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PaymentSettingsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  
  // Form states
  const [methodType, setMethodType] = useState<'card' | 'upi' | 'netbanking'>('upi');
  const [cardForm, setCardForm] = useState({
    cardNumber: '', cardExpiry: '', cardCvv: '', cardHolderName: '', nickname: ''
  });
  const [upiForm, setUpiForm] = useState({ upiId: '', nickname: '' });
  const [bankForm, setBankForm] = useState({
    accountHolderName: '', accountNumber: '', confirmAccountNumber: '',
    ifscCode: '', bankName: '', branchName: '', accountType: 'savings'
  });

  // ============================================================================
  // LOAD DATA
  // ============================================================================

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/payments/methods?type=all', {
        headers: { 'X-User-Email': getUserEmail() }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPaymentMethods(data.paymentMethods || []);
          setBankAccount(data.bankAccount || null);
        }
      }
    } catch (e) {
      console.error('Error loading payment data:', e);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ============================================================================
  // ADD PAYMENT METHOD
  // ============================================================================

  const handleAddPaymentMethod = async () => {
    setIsSaving(true);
    setError(null);

    try {
      let payload: any = { type: 'payment_method', methodType, isDefault: paymentMethods.length === 0 };

      if (methodType === 'card') {
        if (!cardForm.cardNumber || !cardForm.cardExpiry || !cardForm.cardHolderName) {
          setError('Please fill all card details');
          setIsSaving(false);
          return;
        }
        // Extract card info
        const cleanNumber = cardForm.cardNumber.replace(/\s/g, '');
        payload.cardLastFour = cleanNumber.slice(-4);
        payload.cardBrand = getCardBrand(cleanNumber);
        payload.cardExpiry = cardForm.cardExpiry;
        payload.cardHolderName = cardForm.cardHolderName;
        payload.nickname = cardForm.nickname || `${payload.cardBrand} •••• ${payload.cardLastFour}`;
      } else if (methodType === 'upi') {
        if (!upiForm.upiId || !upiForm.upiId.includes('@')) {
          setError('Please enter a valid UPI ID');
          setIsSaving(false);
          return;
        }
        payload.upiId = upiForm.upiId;
        payload.nickname = upiForm.nickname || upiForm.upiId;
      }

      const res = await fetch('/api/payments/methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Email': getUserEmail() },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Payment method added successfully');
        setShowAddMethod(false);
        setCardForm({ cardNumber: '', cardExpiry: '', cardCvv: '', cardHolderName: '', nickname: '' });
        setUpiForm({ upiId: '', nickname: '' });
        loadData();
      } else {
        setError(data.error || 'Failed to add payment method');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to add payment method');
    }
    setIsSaving(false);
  };

  // ============================================================================
  // SAVE BANK ACCOUNT
  // ============================================================================

  const handleSaveBankAccount = async () => {
    setIsSaving(true);
    setError(null);

    if (!bankForm.accountHolderName || !bankForm.accountNumber || !bankForm.ifscCode || !bankForm.bankName) {
      setError('Please fill all required fields');
      setIsSaving(false);
      return;
    }

    if (bankForm.accountNumber !== bankForm.confirmAccountNumber) {
      setError('Account numbers do not match');
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/payments/methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Email': getUserEmail() },
        body: JSON.stringify({ type: 'bank_account', ...bankForm }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Bank account saved successfully');
        setShowBankForm(false);
        loadData();
      } else {
        setError(data.error || 'Failed to save bank account');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to save bank account');
    }
    setIsSaving(false);
  };

  // ============================================================================
  // DELETE PAYMENT METHOD
  // ============================================================================

  const handleDeleteMethod = async (id: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return;

    try {
      const res = await fetch(`/api/payments/methods?id=${id}&type=method`, {
        method: 'DELETE',
        headers: { 'X-User-Email': getUserEmail() },
      });
      if (res.ok) {
        setSuccess('Payment method removed');
        loadData();
      }
    } catch (e) {
      setError('Failed to remove payment method');
    }
  };

  // ============================================================================
  // SET DEFAULT METHOD
  // ============================================================================

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch('/api/payments/methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-User-Email': getUserEmail() },
        body: JSON.stringify({ id, type: 'set_default' }),
      });
      if (res.ok) {
        setSuccess('Default payment method updated');
        loadData();
      }
    } catch (e) {
      setError('Failed to update default');
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  function getCardBrand(number: string): string {
    const n = number.replace(/\s/g, '');
    if (n.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'Mastercard';
    if (/^3[47]/.test(n)) return 'Amex';
    if (/^6(?:011|5)/.test(n)) return 'Discover';
    if (/^35(?:2[89]|[3-8])/.test(n)) return 'JCB';
    return 'Card';
  }

  function formatCardNumber(value: string): string {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19);
  }

  function formatExpiry(value: string): string {
    const clean = value.replace(/\D/g, '');
    if (clean.length >= 2) return `${clean.slice(0, 2)}/${clean.slice(2, 4)}`;
    return clean;
  }

  // ============================================================================
  // FETCH BANK NAME BY IFSC
  // ============================================================================

  const fetchBankByIfsc = async (ifsc: string) => {
    if (ifsc.length !== 11) return;
    try {
      const res = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
      if (res.ok) {
        const data = await res.json();
        setBankForm(prev => ({
          ...prev,
          bankName: data.BANK || prev.bankName,
          branchName: data.BRANCH || prev.branchName,
        }));
      }
    } catch (e) {
      console.log('IFSC lookup failed');
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/settings" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" />Back to Settings
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Wallet className="w-7 h-7 text-blue-600" />Payment Settings
        </h1>
        <p className="text-gray-500 mt-1">Manage payment methods and bank account for receiving payments</p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />{error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />{success}
          <button onClick={() => setSuccess(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />Payment Methods
            </h2>
            <button
              onClick={() => setShowAddMethod(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />Add Method
            </button>
          </div>

          <p className="text-sm text-gray-500">Add UPI, cards, or net banking for making payments</p>

          {/* Existing Payment Methods */}
          <div className="space-y-3">
            {paymentMethods.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-8 text-center">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No payment methods added</p>
                <button
                  onClick={() => setShowAddMethod(true)}
                  className="mt-3 text-blue-600 text-sm font-medium hover:underline"
                >
                  Add your first payment method
                </button>
              </div>
            ) : (
              paymentMethods.map(method => (
                <div key={method.id} className="bg-white border rounded-xl p-4 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {method.methodType === 'card' ? (
                        <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-white" />
                        </div>
                      ) : method.methodType === 'upi' ? (
                        <div className="w-12 h-8 bg-gradient-to-r from-green-600 to-green-400 rounded flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-white" />
                        </div>
                      ) : (
                        <div className="w-12 h-8 bg-gradient-to-r from-purple-600 to-purple-400 rounded flex items-center justify-center">
                          <Landmark className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">
                          {method.methodType === 'card' && `${method.cardBrand} •••• ${method.cardLastFour}`}
                          {method.methodType === 'upi' && method.upiId}
                          {method.methodType === 'netbanking' && method.bankName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {method.methodType === 'card' && `Expires ${method.cardExpiry}`}
                          {method.methodType === 'upi' && 'UPI'}
                          {method.methodType === 'netbanking' && 'Net Banking'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {method.isDefault ? (
                        <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          <Star className="w-3 h-3 fill-current" />Default
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetDefault(method.id)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteMethod(method.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bank Account Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-green-600" />Bank Account
            </h2>
            {bankAccount && (
              <button
                onClick={() => {
                  setBankForm({
                    accountHolderName: bankAccount.accountHolderName,
                    accountNumber: bankAccount.accountNumber,
                    confirmAccountNumber: bankAccount.accountNumber,
                    ifscCode: bankAccount.ifscCode,
                    bankName: bankAccount.bankName,
                    branchName: bankAccount.branchName || '',
                    accountType: bankAccount.accountType,
                  });
                  setShowBankForm(true);
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                Edit
              </button>
            )}
          </div>

          <p className="text-sm text-gray-500">Your bank account for receiving payments from customers</p>

          {bankAccount ? (
            <div className="bg-white border rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{bankAccount.bankName}</p>
                    {bankAccount.isVerified && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                        <Shield className="w-3 h-3" />Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{bankAccount.accountHolderName}</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Account Number</p>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {showAccountNumber ? bankAccount.accountNumber : maskAccountNumber(bankAccount.accountNumber)}
                        </p>
                        <button onClick={() => setShowAccountNumber(!showAccountNumber)} className="text-gray-400 hover:text-gray-600">
                          {showAccountNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500">IFSC Code</p>
                      <p className="font-medium">{bankAccount.ifscCode}</p>
                    </div>
                    {bankAccount.branchName && (
                      <div className="col-span-2">
                        <p className="text-gray-500">Branch</p>
                        <p className="font-medium">{bankAccount.branchName}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500">Account Type</p>
                      <p className="font-medium capitalize">{bankAccount.accountType}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-1">No bank account added</p>
              <p className="text-xs text-gray-400 mb-4">Add your bank account to receive payments from customers</p>
              <button
                onClick={() => setShowBankForm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
              >
                Add Bank Account
              </button>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">How payments work</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Customers pay using UPI, cards, or net banking</li>
                  <li>• Payments are processed via Razorpay securely</li>
                  <li>• Settlements arrive in your bank account within 2-3 days</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Payment Method Modal */}
      {showAddMethod && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add Payment Method</h3>
              <button onClick={() => setShowAddMethod(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Method Type Selection */}
              <div className="flex gap-2">
                <button
                  onClick={() => setMethodType('upi')}
                  className={`flex-1 p-3 border-2 rounded-xl text-center ${methodType === 'upi' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                >
                  <Smartphone className={`w-6 h-6 mx-auto mb-1 ${methodType === 'upi' ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium">UPI</span>
                </button>
                <button
                  onClick={() => setMethodType('card')}
                  className={`flex-1 p-3 border-2 rounded-xl text-center ${methodType === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                >
                  <CreditCard className={`w-6 h-6 mx-auto mb-1 ${methodType === 'card' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium">Card</span>
                </button>
              </div>

              {/* UPI Form */}
              {methodType === 'upi' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                    <input
                      type="text"
                      value={upiForm.upiId}
                      onChange={e => setUpiForm(prev => ({ ...prev, upiId: e.target.value }))}
                      placeholder="yourname@upi"
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter your GPay, PhonePe, Paytm, or bank UPI ID</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nickname (Optional)</label>
                    <input
                      type="text"
                      value={upiForm.nickname}
                      onChange={e => setUpiForm(prev => ({ ...prev, nickname: e.target.value }))}
                      placeholder="My GPay"
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              )}

              {/* Card Form */}
              {methodType === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardForm.cardNumber}
                      onChange={e => setCardForm(prev => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }))}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                      <input
                        type="text"
                        value={cardForm.cardExpiry}
                        onChange={e => setCardForm(prev => ({ ...prev, cardExpiry: formatExpiry(e.target.value) }))}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                      <input
                        type="password"
                        value={cardForm.cardCvv}
                        onChange={e => setCardForm(prev => ({ ...prev, cardCvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                        placeholder="•••"
                        maxLength={4}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Holder Name</label>
                    <input
                      type="text"
                      value={cardForm.cardHolderName}
                      onChange={e => setCardForm(prev => ({ ...prev, cardHolderName: e.target.value.toUpperCase() }))}
                      placeholder="NAME ON CARD"
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleAddPaymentMethod}
                disabled={isSaving}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Add Payment Method
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Account Modal */}
      {showBankForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Bank Account Details</h3>
              <button onClick={() => setShowBankForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name *</label>
                <input
                  type="text"
                  value={bankForm.accountHolderName}
                  onChange={e => setBankForm(prev => ({ ...prev, accountHolderName: e.target.value }))}
                  placeholder="As per bank records"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number *</label>
                <input
                  type="text"
                  value={bankForm.accountNumber}
                  onChange={e => setBankForm(prev => ({ ...prev, accountNumber: e.target.value.replace(/\D/g, '') }))}
                  placeholder="Enter account number"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Account Number *</label>
                <input
                  type="text"
                  value={bankForm.confirmAccountNumber}
                  onChange={e => setBankForm(prev => ({ ...prev, confirmAccountNumber: e.target.value.replace(/\D/g, '') }))}
                  placeholder="Re-enter account number"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
                {bankForm.confirmAccountNumber && bankForm.accountNumber !== bankForm.confirmAccountNumber && (
                  <p className="text-xs text-red-500 mt-1">Account numbers do not match</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code *</label>
                <input
                  type="text"
                  value={bankForm.ifscCode}
                  onChange={e => {
                    const val = e.target.value.toUpperCase().slice(0, 11);
                    setBankForm(prev => ({ ...prev, ifscCode: val }));
                    if (val.length === 11) fetchBankByIfsc(val);
                  }}
                  placeholder="e.g., SBIN0001234"
                  maxLength={11}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">Bank details will auto-fill</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
                <input
                  type="text"
                  value={bankForm.bankName}
                  onChange={e => setBankForm(prev => ({ ...prev, bankName: e.target.value }))}
                  placeholder="Bank name"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                <input
                  type="text"
                  value={bankForm.branchName}
                  onChange={e => setBankForm(prev => ({ ...prev, branchName: e.target.value }))}
                  placeholder="Branch name"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <select
                  value={bankForm.accountType}
                  onChange={e => setBankForm(prev => ({ ...prev, accountType: e.target.value }))}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="savings">Savings</option>
                  <option value="current">Current</option>
                </select>
              </div>

              <button
                onClick={handleSaveBankAccount}
                disabled={isSaving}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                Save Bank Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}