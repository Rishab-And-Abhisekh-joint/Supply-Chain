'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Cloud, Database, Check, X, FileJson, Trash2, RefreshCw, Settings, Eye } from 'lucide-react';

interface DataConfig {
  source: 'local' | 's3' | 'api';
  s3Bucket?: string;
  s3Region?: string;
  apiUrl?: string;
}

interface UploadedFile {
  name: string;
  size: number;
  uploadedAt: string;
  data: any;
}

// Store data in memory/localStorage for use across the app
const DATA_STORAGE_KEY = 'supplychain_data';

export function getStoredData(key: string): any {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(`${DATA_STORAGE_KEY}_${key}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setStoredData(key: string, data: any): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${DATA_STORAGE_KEY}_${key}`, JSON.stringify(data));
    // Dispatch event so other components can react
    window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { key, data } }));
  } catch (error) {
    console.error('Failed to store data:', error);
  }
}

export function clearStoredData(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${DATA_STORAGE_KEY}_${key}`);
  window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { key, data: null } }));
}

// Hook to use stored data with auto-refresh
export function useStoredData<T>(key: string, fallback: T): T {
  const [data, setData] = useState<T>(fallback);

  useEffect(() => {
    const stored = getStoredData(key);
    if (stored) setData(stored);

    const handleUpdate = (e: CustomEvent) => {
      if (e.detail.key === key) {
        setData(e.detail.data || fallback);
      }
    };

    window.addEventListener('dataUpdated', handleUpdate as EventListener);
    return () => window.removeEventListener('dataUpdated', handleUpdate as EventListener);
  }, [key, fallback]);

  return data;
}

export default function DataUploadManager() {
  const [activeTab, setActiveTab] = useState<'upload' | 'aws' | 'api'>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile>>({});
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AWS Config
  const [s3Bucket, setS3Bucket] = useState('');
  const [s3Region, setS3Region] = useState('ap-south-1');
  const [awsConnected, setAwsConnected] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  // API Config  
  const [apiUrl, setApiUrl] = useState('');
  const [apiConnected, setApiConnected] = useState(false);

  // Load saved files on mount
  useEffect(() => {
    const savedFiles: Record<string, UploadedFile> = {};
    const keys = ['inventory', 'orders', 'warehouses', 'vehicles', 'team', 'notifications', 'analytics'];
    keys.forEach(key => {
      const data = getStoredData(key);
      if (data) {
        savedFiles[key] = {
          name: `${key}.json`,
          size: JSON.stringify(data).length,
          uploadedAt: new Date().toISOString(),
          data
        };
      }
    });
    setUploadedFiles(savedFiles);

    // Load AWS config
    const savedBucket = localStorage.getItem('aws_s3_bucket');
    const savedRegion = localStorage.getItem('aws_s3_region');
    if (savedBucket) setS3Bucket(savedBucket);
    if (savedRegion) setS3Region(savedRegion);

    // Load API config
    const savedApiUrl = localStorage.getItem('api_url');
    if (savedApiUrl) setApiUrl(savedApiUrl);
  }, []);

  const handleFileUpload = async (files: FileList) => {
    setUploading(true);
    setMessage(null);

    const validTypes = ['inventory', 'orders', 'warehouses', 'vehicles', 'team', 'notifications', 'analytics'];
    let successCount = 0;
    let errorCount = 0;

    for (const file of Array.from(files)) {
      if (!file.name.endsWith('.json')) {
        errorCount++;
        continue;
      }

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        // Determine the data type from filename
        const baseName = file.name.replace('.json', '').toLowerCase();
        const dataType = validTypes.find(t => baseName.includes(t)) || baseName;

        // Store the data
        setStoredData(dataType, data);
        
        setUploadedFiles(prev => ({
          ...prev,
          [dataType]: {
            name: file.name,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            data
          }
        }));

        successCount++;
      } catch (error) {
        console.error(`Failed to parse ${file.name}:`, error);
        errorCount++;
      }
    }

    setUploading(false);
    
    if (successCount > 0 && errorCount === 0) {
      setMessage({ type: 'success', text: `Successfully uploaded ${successCount} file(s)` });
    } else if (successCount > 0 && errorCount > 0) {
      setMessage({ type: 'success', text: `Uploaded ${successCount} file(s), ${errorCount} failed` });
    } else {
      setMessage({ type: 'error', text: 'Failed to upload files. Make sure they are valid JSON.' });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const deleteFile = (key: string) => {
    clearStoredData(key);
    setUploadedFiles(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    setMessage({ type: 'success', text: `Removed ${key} data` });
  };

  const testS3Connection = async () => {
    setTestingConnection(true);
    setMessage(null);

    try {
      // Test by trying to fetch a file from S3
      const testUrl = `https://${s3Bucket}.s3.${s3Region}.amazonaws.com/data/inventory.json`;
      const response = await fetch(testUrl, { method: 'HEAD' });
      
      if (response.ok || response.status === 403) {
        // 403 means bucket exists but needs auth - still valid
        setAwsConnected(true);
        localStorage.setItem('aws_s3_bucket', s3Bucket);
        localStorage.setItem('aws_s3_region', s3Region);
        setMessage({ type: 'success', text: 'S3 bucket connected! Data will load from S3.' });
      } else {
        setMessage({ type: 'error', text: 'Could not connect to S3 bucket. Check bucket name and permissions.' });
      }
    } catch (error) {
      // Network error might mean CORS - try loading data anyway
      localStorage.setItem('aws_s3_bucket', s3Bucket);
      localStorage.setItem('aws_s3_region', s3Region);
      setAwsConnected(true);
      setMessage({ type: 'success', text: 'S3 config saved. Make sure CORS is enabled on your bucket.' });
    }

    setTestingConnection(false);
  };

  const loadFromS3 = async () => {
    setUploading(true);
    setMessage(null);

    const files = ['inventory', 'orders', 'warehouses', 'vehicles', 'team', 'notifications'];
    let loaded = 0;

    for (const file of files) {
      try {
        const url = `https://${s3Bucket}.s3.${s3Region}.amazonaws.com/data/${file}.json`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setStoredData(file, data);
          setUploadedFiles(prev => ({
            ...prev,
            [file]: {
              name: `${file}.json`,
              size: JSON.stringify(data).length,
              uploadedAt: new Date().toISOString(),
              data
            }
          }));
          loaded++;
        }
      } catch (error) {
        console.log(`Could not load ${file} from S3`);
      }
    }

    setUploading(false);
    setMessage({ type: loaded > 0 ? 'success' : 'error', text: loaded > 0 ? `Loaded ${loaded} files from S3` : 'No files found in S3' });
  };

  const testApiConnection = async () => {
    setTestingConnection(true);
    setMessage(null);

    try {
      const response = await fetch(`${apiUrl}/api/health`, { method: 'GET' });
      if (response.ok) {
        setApiConnected(true);
        localStorage.setItem('api_url', apiUrl);
        setMessage({ type: 'success', text: 'API connected successfully!' });
      } else {
        setMessage({ type: 'error', text: 'API not responding. Check URL.' });
      }
    } catch (error) {
      localStorage.setItem('api_url', apiUrl);
      setApiConnected(true);
      setMessage({ type: 'success', text: 'API URL saved. Connection will be tested when loading data.' });
    }

    setTestingConnection(false);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Management</h1>
        <p className="text-gray-500">Upload JSON files or connect to AWS S3 / API</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'upload' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload JSON
          </div>
        </button>
        <button
          onClick={() => setActiveTab('aws')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'aws' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4" />
            AWS S3
          </div>
        </button>
        <button
          onClick={() => setActiveTab('api')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'api' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            REST API
          </div>
        </button>
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition ${
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".json"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
            />
            {uploading ? (
              <RefreshCw className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
            ) : (
              <FileJson className="w-12 h-12 mx-auto text-gray-400" />
            )}
            <p className="mt-4 text-lg font-medium text-gray-700">
              {uploading ? 'Uploading...' : 'Drop JSON files here or click to upload'}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Supports: inventory.json, orders.json, warehouses.json, vehicles.json, team.json, notifications.json
            </p>
          </div>

          {/* Uploaded Files */}
          {Object.keys(uploadedFiles).length > 0 && (
            <div className="bg-white rounded-xl border shadow-sm">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">Uploaded Data</h3>
              </div>
              <div className="divide-y">
                {Object.entries(uploadedFiles).map(([key, file]) => (
                  <div key={key} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileJson className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{key}</p>
                        <p className="text-sm text-gray-500">
                          {formatBytes(file.size)} • {Array.isArray(file.data) ? `${file.data.length} records` : 'Object'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                      <button
                        onClick={() => deleteFile(key)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AWS Tab */}
      {activeTab === 'aws' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">AWS S3 Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">S3 Bucket Name</label>
                <input
                  type="text"
                  value={s3Bucket}
                  onChange={(e) => setS3Bucket(e.target.value)}
                  placeholder="my-supplychain-bucket"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AWS Region</label>
                <select
                  value={s3Region}
                  onChange={(e) => setS3Region(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ap-south-1">Asia Pacific (Mumbai)</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">Europe (Ireland)</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={testS3Connection}
                  disabled={!s3Bucket || testingConnection}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {testingConnection ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save & Test Connection
                </button>
                {awsConnected && (
                  <button
                    onClick={loadFromS3}
                    disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    <Cloud className="w-4 h-4" />
                    Load Data from S3
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">S3 Setup Instructions</h4>
            <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
              <li>Create an S3 bucket with public read access (or use signed URLs)</li>
              <li>Create a <code className="bg-yellow-100 px-1 rounded">data/</code> folder in your bucket</li>
              <li>Upload your JSON files: inventory.json, orders.json, etc.</li>
              <li>Enable CORS on your bucket for web access</li>
            </ol>
          </div>
        </div>
      )}

      {/* API Tab */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">REST API Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Base URL</label>
                <input
                  type="url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://api.yourcompany.com"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={testApiConnection}
                disabled={!apiUrl || testingConnection}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {testingConnection ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save & Test Connection
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Required API Endpoints</h4>
            <div className="text-sm text-blue-800 font-mono space-y-1">
              <p>GET /api/inventory</p>
              <p>GET /api/orders</p>
              <p>GET /api/warehouses</p>
              <p>GET /api/vehicles</p>
              <p>GET /api/team</p>
              <p>GET /api/notifications</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
