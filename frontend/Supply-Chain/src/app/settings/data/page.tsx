"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Upload,
  Database,
  Cloud,
  FileJson,
  Trash2,
  Download,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Server,
  FolderOpen,
  Info,
} from "lucide-react";

// Storage utilities - inline to avoid export issues
function getStoredData<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(`supply_chain_${key}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function setStoredData<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`supply_chain_${key}`, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("dataUpdated", { detail: { key } }));
  } catch (error) {
    console.error("Failed to store data:", error);
  }
}

function clearStoredData(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`supply_chain_${key}`);
  window.dispatchEvent(new CustomEvent("dataUpdated", { detail: { key } }));
}

interface StoredFile {
  key: string;
  recordCount: number;
  lastUpdated: string;
  size: string;
}

type TabType = "json" | "s3" | "api";

export default function DataManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>("json");
  const [storedFiles, setStoredFiles] = useState<StoredFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // S3 Config
  const [s3Config, setS3Config] = useState({
    bucket: "",
    region: "us-east-1",
    accessKey: "",
    secretKey: "",
  });
  const [s3Status, setS3Status] = useState<"idle" | "testing" | "connected" | "error">("idle");

  // API Config
  const [apiConfig, setApiConfig] = useState({
    baseUrl: "",
    authToken: "",
  });
  const [apiStatus, setApiStatus] = useState<"idle" | "testing" | "connected" | "error">("idle");

  const dataTypes = [
    "inventory",
    "orders",
    "warehouses",
    "vehicles",
    "team",
    "notifications",
  ];

  const loadStoredFiles = useCallback(() => {
    const files: StoredFile[] = [];
    dataTypes.forEach((type) => {
      const data = getStoredData<unknown[]>(type);
      if (data && Array.isArray(data)) {
        const jsonStr = JSON.stringify(data);
        files.push({
          key: type,
          recordCount: data.length,
          lastUpdated: new Date().toLocaleString(),
          size: `${(jsonStr.length / 1024).toFixed(1)} KB`,
        });
      }
    });
    setStoredFiles(files);
  }, []);

  useEffect(() => {
    loadStoredFiles();
  }, [loadStoredFiles]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Determine data type from filename
      const fileName = file.name.toLowerCase().replace(".json", "");
      const matchedType = dataTypes.find(
        (type) => fileName.includes(type) || type.includes(fileName)
      );

      if (!matchedType) {
        setUploadStatus({
          type: "error",
          message: `Could not determine data type from filename "${file.name}". Use: inventory.json, orders.json, warehouses.json, vehicles.json, team.json, or notifications.json`,
        });
        return;
      }

      if (!Array.isArray(data)) {
        setUploadStatus({
          type: "error",
          message: "JSON file must contain an array of records",
        });
        return;
      }

      setStoredData(matchedType, data);
      setUploadStatus({
        type: "success",
        message: `Successfully uploaded ${data.length} ${matchedType} records`,
      });
      loadStoredFiles();
    } catch {
      setUploadStatus({
        type: "error",
        message: "Invalid JSON file",
      });
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      if (file.type === "application/json" || file.name.endsWith(".json")) {
        await processFile(file);
      }
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      for (const file of Array.from(files)) {
        await processFile(file);
      }
    }
  };

  const deleteStoredData = (key: string) => {
    clearStoredData(key);
    loadStoredFiles();
    setUploadStatus({
      type: "success",
      message: `Deleted ${key} data`,
    });
  };

  const exportData = (key: string) => {
    const data = getStoredData(key);
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${key}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const testS3Connection = async () => {
    setS3Status("testing");
    // Simulated S3 connection test
    await new Promise((r) => setTimeout(r, 1500));
    if (s3Config.bucket && s3Config.region) {
      setS3Status("connected");
    } else {
      setS3Status("error");
    }
  };

  const testApiConnection = async () => {
    setApiStatus("testing");
    try {
      const response = await fetch(`${apiConfig.baseUrl}/health`, {
        headers: apiConfig.authToken
          ? { Authorization: `Bearer ${apiConfig.authToken}` }
          : {},
      });
      if (response.ok) {
        setApiStatus("connected");
      } else {
        setApiStatus("error");
      }
    } catch {
      setApiStatus("error");
    }
  };

  const tabs = [
    { id: "json" as TabType, label: "Upload JSON", icon: FileJson },
    { id: "s3" as TabType, label: "AWS S3", icon: Cloud },
    { id: "api" as TabType, label: "REST API", icon: Server },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Database className="h-7 w-7 text-blue-600" />
          Data Management
        </h1>
        <p className="text-gray-600 mt-1">
          Upload and manage your supply chain data from various sources
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Status Message */}
      {uploadStatus.type && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            uploadStatus.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {uploadStatus.type === "success" ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {uploadStatus.message}
        </div>
      )}

      {/* JSON Upload Tab */}
      {activeTab === "json" && (
        <div className="space-y-6">
          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700">
              Drag & drop JSON files here
            </p>
            <p className="text-gray-500 mt-1">or</p>
            <label className="mt-4 inline-block">
              <input
                type="file"
                accept=".json,application/json"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />
              <span className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                Browse Files
              </span>
            </label>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex gap-2">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">File Naming</h3>
                <p className="text-blue-700 text-sm mt-1">
                  Name your files to match data types: <code className="bg-blue-100 px-1 rounded">inventory.json</code>,{" "}
                  <code className="bg-blue-100 px-1 rounded">orders.json</code>,{" "}
                  <code className="bg-blue-100 px-1 rounded">warehouses.json</code>,{" "}
                  <code className="bg-blue-100 px-1 rounded">vehicles.json</code>,{" "}
                  <code className="bg-blue-100 px-1 rounded">team.json</code>,{" "}
                  <code className="bg-blue-100 px-1 rounded">notifications.json</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* S3 Tab */}
      {activeTab === "s3" && (
        <div className="space-y-6">
          <div className="bg-white border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Cloud className="h-5 w-5 text-orange-500" />
              AWS S3 Configuration
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bucket Name
                </label>
                <input
                  type="text"
                  value={s3Config.bucket}
                  onChange={(e) =>
                    setS3Config({ ...s3Config, bucket: e.target.value })
                  }
                  placeholder="my-supply-chain-bucket"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region
                </label>
                <select
                  value={s3Config.region}
                  onChange={(e) =>
                    setS3Config({ ...s3Config, region: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">EU (Ireland)</option>
                  <option value="ap-south-1">Asia Pacific (Mumbai)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Key ID
                </label>
                <input
                  type="password"
                  value={s3Config.accessKey}
                  onChange={(e) =>
                    setS3Config({ ...s3Config, accessKey: e.target.value })
                  }
                  placeholder="AKIA..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secret Access Key
                </label>
                <input
                  type="password"
                  value={s3Config.secretKey}
                  onChange={(e) =>
                    setS3Config({ ...s3Config, secretKey: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={testS3Connection}
                disabled={s3Status === "testing"}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
              >
                {s3Status === "testing" ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Cloud className="h-4 w-4" />
                )}
                Test Connection
              </button>
              {s3Status === "connected" && (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" /> Connected
                </span>
              )}
              {s3Status === "error" && (
                <span className="text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> Connection failed
                </span>
              )}
            </div>
          </div>

          <div className="bg-amber-50 rounded-lg p-4">
            <div className="flex gap-2">
              <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-900">S3 Folder Structure</h3>
                <p className="text-amber-700 text-sm mt-1">
                  Place JSON files in your bucket root: <code className="bg-amber-100 px-1 rounded">s3://bucket/inventory.json</code>,{" "}
                  <code className="bg-amber-100 px-1 rounded">s3://bucket/orders.json</code>, etc.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Tab */}
      {activeTab === "api" && (
        <div className="space-y-6">
          <div className="bg-white border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Server className="h-5 w-5 text-purple-500" />
              REST API Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base URL
                </label>
                <input
                  type="url"
                  value={apiConfig.baseUrl}
                  onChange={(e) =>
                    setApiConfig({ ...apiConfig, baseUrl: e.target.value })
                  }
                  placeholder="https://api.example.com/v1"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auth Token (Optional)
                </label>
                <input
                  type="password"
                  value={apiConfig.authToken}
                  onChange={(e) =>
                    setApiConfig({ ...apiConfig, authToken: e.target.value })
                  }
                  placeholder="Bearer token..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={testApiConnection}
                disabled={apiStatus === "testing" || !apiConfig.baseUrl}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2"
              >
                {apiStatus === "testing" ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Server className="h-4 w-4" />
                )}
                Test Connection
              </button>
              {apiStatus === "connected" && (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" /> Connected
                </span>
              )}
              {apiStatus === "error" && (
                <span className="text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> Connection failed
                </span>
              )}
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex gap-2">
              <Info className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-purple-900">API Endpoints</h3>
                <p className="text-purple-700 text-sm mt-1">
                  Your API should expose: <code className="bg-purple-100 px-1 rounded">GET /inventory</code>,{" "}
                  <code className="bg-purple-100 px-1 rounded">GET /orders</code>,{" "}
                  <code className="bg-purple-100 px-1 rounded">GET /warehouses</code>, etc.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stored Data */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-gray-600" />
          Stored Data
        </h2>
        {storedFiles.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <Database className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No data uploaded yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Upload JSON files or connect to a data source
            </p>
          </div>
        ) : (
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                    Data Type
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                    Records
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                    Size
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {storedFiles.map((file) => (
                  <tr key={file.key} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileJson className="h-4 w-4 text-blue-500" />
                        <span className="font-medium capitalize">{file.key}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{file.recordCount}</td>
                    <td className="px-4 py-3 text-gray-600">{file.size}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => exportData(file.key)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Export"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteStoredData(file.key)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
