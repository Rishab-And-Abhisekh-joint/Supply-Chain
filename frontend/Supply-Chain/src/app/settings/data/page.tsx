"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Upload, Database, Cloud, FileJson, Trash2, Download, CheckCircle,
  AlertCircle, RefreshCw, Server, FolderOpen, Info, Loader2, CloudOff,
} from "lucide-react";

interface StoredFile {
  key: string;
  recordCount: number;
  lastUpdated: string;
  size: string;
  source: string;
}

type TabType = "json" | "s3" | "api";

function getUserEmail(): string {
  if (typeof window === "undefined") return "demo@example.com";
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) return JSON.parse(userStr).email || "demo@example.com";
  } catch { }
  return "demo@example.com";
}

export default function DataManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>("json");
  const [storedFiles, setStoredFiles] = useState<StoredFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [dataSource, setDataSource] = useState<"mongodb" | "postgresql" | "none">("none");
  const [uploadStatus, setUploadStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });
  const [s3Config, setS3Config] = useState({ bucket: "", region: "us-east-1", accessKey: "", secretKey: "" });
  const [s3Status, setS3Status] = useState<"idle" | "testing" | "connected" | "error">("idle");
  const [apiConfig, setApiConfig] = useState({ baseUrl: "", authToken: "" });
  const [apiStatus, setApiStatus] = useState<"idle" | "testing" | "connected" | "error">("idle");

  const dataTypes = [
    { key: "inventory", label: "Inventory", description: "Product stock and SKU data" },
    { key: "warehouses", label: "Warehouses", description: "Warehouse locations and capacity" },
    { key: "orders", label: "Orders", description: "Order history and status" },
    { key: "vehicles", label: "Vehicles", description: "Fleet and driver information" },
    { key: "team", label: "Team", description: "Team members and roles" },
    { key: "deliveries", label: "Deliveries", description: "Delivery schedules and routes" },
  ];

  const loadStoredFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/data", { headers: { "X-User-Email": getUserEmail() } });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const files: StoredFile[] = [];
          Object.entries(result.data).forEach(([key, data]) => {
            if (Array.isArray(data) && data.length > 0) {
              files.push({
                key,
                recordCount: data.length,
                lastUpdated: new Date().toLocaleString(),
                size: `${(JSON.stringify(data).length / 1024).toFixed(1)} KB`,
                source: result.source || "database",
              });
            }
          });
          setStoredFiles(files);
          setDataSource(result.source === "mongodb" ? "mongodb" : result.source === "postgresql" ? "postgresql" : "none");
        }
      }
    } catch (error) { console.error("Error loading stored files:", error); }
    setIsLoading(false);
  }, []);

  useEffect(() => { loadStoredFiles(); }, [loadStoredFiles]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const processFile = async (file: File) => {
    setIsUploading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const fileName = file.name.toLowerCase().replace(".json", "");
      const matchedType = dataTypes.find(t => fileName.includes(t.key) || t.key.includes(fileName));

      if (!matchedType) {
        setUploadStatus({ type: "error", message: `Could not determine data type from "${file.name}". Use: inventory.json, warehouses.json, orders.json, vehicles.json, team.json, or deliveries.json` });
        return;
      }
      if (!Array.isArray(data)) {
        setUploadStatus({ type: "error", message: "JSON file must contain an array of records" });
        return;
      }

      const response = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Email": getUserEmail() },
        body: JSON.stringify({ type: matchedType.key, data }),
      });
      const result = await response.json();

      if (result.success) {
        setUploadStatus({ type: "success", message: `Successfully uploaded ${data.length} ${matchedType.label} records to ${result.source || "database"}` });
        setDataSource(result.source === "mongodb" ? "mongodb" : "postgresql");
        await loadStoredFiles();
      } else {
        setUploadStatus({ type: "error", message: result.error || "Failed to upload data" });
      }
    } catch { setUploadStatus({ type: "error", message: "Invalid JSON file or upload failed" }); }
    setIsUploading(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    for (const file of Array.from(e.dataTransfer.files)) {
      if (file.type === "application/json" || file.name.endsWith(".json")) await processFile(file);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) for (const file of Array.from(e.target.files)) await processFile(file);
    e.target.value = "";
  };

  const deleteStoredData = async (key: string) => {
    if (!confirm(`Delete all ${key} data?`)) return;
    try {
      const response = await fetch(`/api/data?type=${key}`, { method: "DELETE", headers: { "X-User-Email": getUserEmail() } });
      if (response.ok) { setUploadStatus({ type: "success", message: `Deleted ${key} data` }); await loadStoredFiles(); }
    } catch { setUploadStatus({ type: "error", message: `Failed to delete ${key} data` }); }
  };

  const exportData = async (key: string) => {
    try {
      const response = await fetch(`/api/data?type=${key}`, { headers: { "X-User-Email": getUserEmail() } });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `${key}.json`;
          a.click();
        }
      }
    } catch { setUploadStatus({ type: "error", message: `Failed to export ${key} data` }); }
  };

  const testS3Connection = async () => {
    setS3Status("testing");
    await new Promise(r => setTimeout(r, 1500));
    setS3Status(s3Config.bucket && s3Config.region ? "connected" : "error");
  };

  const testApiConnection = async () => {
    setApiStatus("testing");
    try {
      const res = await fetch(`${apiConfig.baseUrl}/health`, { headers: apiConfig.authToken ? { Authorization: `Bearer ${apiConfig.authToken}` } : {} });
      setApiStatus(res.ok ? "connected" : "error");
    } catch { setApiStatus("error"); }
  };

  const tabs = [
    { id: "json" as TabType, label: "Upload JSON", icon: FileJson },
    { id: "s3" as TabType, label: "AWS S3", icon: Cloud },
    { id: "api" as TabType, label: "REST API", icon: Server },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Database className="h-7 w-7 text-blue-600" />Data Management</h1>
            <p className="text-gray-600 mt-1">Upload and manage your supply chain data</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${dataSource === "mongodb" ? "bg-green-100 text-green-700" : dataSource === "postgresql" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
            {dataSource === "mongodb" ? <><Cloud className="w-3 h-3" />MongoDB</> : dataSource === "postgresql" ? <><Database className="w-3 h-3" />PostgreSQL</> : <><CloudOff className="w-3 h-3" />No Database</>}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            <tab.icon className="h-4 w-4" />{tab.label}
          </button>
        ))}
      </div>

      {uploadStatus.type && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${uploadStatus.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {uploadStatus.type === "success" ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {uploadStatus.message}
          <button onClick={() => setUploadStatus({ type: null, message: "" })} className="ml-auto">×</button>
        </div>
      )}

      {activeTab === "json" && (
        <div className="space-y-6">
          <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}`}>
            {isUploading ? (
              <div className="flex flex-col items-center"><Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" /><p className="text-lg font-medium">Uploading...</p></div>
            ) : (
              <>
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700">Drag & drop JSON files here</p>
                <p className="text-gray-500 mt-1">or</p>
                <label className="mt-4 inline-block">
                  <input type="file" accept=".json" multiple onChange={handleFileInput} className="hidden" />
                  <span className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">Browse Files</span>
                </label>
              </>
            )}
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex gap-2">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Supported Data Types</h3>
                <p className="text-blue-700 text-sm mt-1">Name your files to match data types:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                  {dataTypes.map(type => (
                    <div key={type.key} className="bg-white rounded p-2 text-sm">
                      <code className="text-blue-600">{type.key}.json</code>
                      <p className="text-gray-500 text-xs mt-0.5">{type.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex gap-2">
              <Database className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-900">Data Storage</h3>
                <p className="text-green-700 text-sm mt-1">Uploaded data is synced across all pages:</p>
                <ul className="text-green-700 text-sm mt-2 space-y-1">
                  <li>• <strong>Inventory</strong> → Inventory page & Demand Forecasting</li>
                  <li>• <strong>Warehouses</strong> → Warehouses, Logistics & Demand Forecasting</li>
                  <li>• <strong>Orders</strong> → Orders page & Dashboard</li>
                  <li>• <strong>Vehicles</strong> → Fleet Management & Shipments</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "s3" && (
        <div className="bg-white border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Cloud className="h-5 w-5 text-orange-500" />AWS S3 Configuration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Bucket Name</label><input type="text" value={s3Config.bucket} onChange={e => setS3Config({ ...s3Config, bucket: e.target.value })} placeholder="my-bucket" className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Region</label><select value={s3Config.region} onChange={e => setS3Config({ ...s3Config, region: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="us-east-1">US East</option><option value="ap-south-1">Asia Pacific (Mumbai)</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Access Key ID</label><input type="password" value={s3Config.accessKey} onChange={e => setS3Config({ ...s3Config, accessKey: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Secret Access Key</label><input type="password" value={s3Config.secretKey} onChange={e => setS3Config({ ...s3Config, secretKey: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <button onClick={testS3Connection} disabled={s3Status === "testing"} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2">{s3Status === "testing" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}Test Connection</button>
            {s3Status === "connected" && <span className="text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" />Connected</span>}
            {s3Status === "error" && <span className="text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />Failed</span>}
          </div>
        </div>
      )}

      {activeTab === "api" && (
        <div className="bg-white border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Server className="h-5 w-5 text-purple-500" />REST API Configuration</h3>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label><input type="url" value={apiConfig.baseUrl} onChange={e => setApiConfig({ ...apiConfig, baseUrl: e.target.value })} placeholder="https://api.example.com/v1" className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Auth Token (Optional)</label><input type="password" value={apiConfig.authToken} onChange={e => setApiConfig({ ...apiConfig, authToken: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <button onClick={testApiConnection} disabled={apiStatus === "testing" || !apiConfig.baseUrl} className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2">{apiStatus === "testing" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Server className="h-4 w-4" />}Test Connection</button>
            {apiStatus === "connected" && <span className="text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" />Connected</span>}
            {apiStatus === "error" && <span className="text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />Failed</span>}
          </div>
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><FolderOpen className="h-5 w-5 text-gray-600" />Stored Data</h2>
          <button onClick={loadStoredFiles} disabled={isLoading} className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"><RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />Refresh</button>
        </div>

        {isLoading ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center"><Loader2 className="h-8 w-8 mx-auto text-blue-600 animate-spin mb-3" /><p className="text-gray-500">Loading...</p></div>
        ) : storedFiles.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center"><Database className="h-12 w-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No data uploaded yet</p></div>
        ) : (
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Data Type</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Records</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Size</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Source</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {storedFiles.map(file => (
                  <tr key={file.key} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><FileJson className="h-4 w-4 text-blue-500" /><span className="font-medium capitalize">{file.key}</span></div></td>
                    <td className="px-4 py-3 text-gray-600">{file.recordCount}</td>
                    <td className="px-4 py-3 text-gray-600">{file.size}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${file.source === "mongodb" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{file.source === "mongodb" ? "MongoDB" : "PostgreSQL"}</span></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => exportData(file.key)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Export"><Download className="h-4 w-4" /></button>
                        <button onClick={() => deleteStoredData(file.key)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}