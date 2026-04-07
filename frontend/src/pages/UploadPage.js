import React, { useState } from 'react';
import { dataAPI } from '../services/api';
import toast from 'react-hot-toast';

const UploadPage = ({ onUploadSuccess, embedded = false }) => {
  const [schema, setSchema] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  const UPLOAD_FLAG_KEY = 'dashboardHasUploadedSalesData';

  React.useEffect(() => {
    const fetchSchema = async () => {
      try {
        const response = await dataAPI.getSchema();
        setSchema(response.data);
      } catch (error) {
        toast.error('Failed to fetch schema');
      }
    };
    fetchSchema();
  }, []);

  const validateFile = (fileToValidate) => {
    if (!fileToValidate) return false;

    // Check file size
    if (fileToValidate.size > MAX_FILE_SIZE) {
      toast.error(`File size exceeds maximum of 20MB. Your file is ${(fileToValidate.size / 1024 / 1024).toFixed(2)}MB`);
      return false;
    }

    // Check file type
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileName = fileToValidate.name.toLowerCase();
    const hasValidExtension = validTypes.some((type) => fileName.endsWith(type));
    
    if (!hasValidExtension) {
      toast.error('Only CSV, XLSX, and XLS files are supported');
      return false;
    }

    return true;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const droppedFile = droppedFiles[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      } else {
        setFile(null);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      } else {
        setFile(null);
        e.target.value = '';
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setLoading(true);
    try {
      const response = await dataAPI.uploadFile(file);
      localStorage.setItem(UPLOAD_FLAG_KEY, 'true');
      toast.success(`Successfully uploaded ${response.data.rowsInserted} rows!`);
      window.dispatchEvent(new Event('dashboard-data-updated'));
      setFile(null);
      onUploadSuccess?.();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Upload failed';
      toast.error(errorMessage);
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={`${embedded ? 'py-8 px-6' : 'min-h-screen bg-gray-100 py-12 px-4'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Upload Sales Data</h1>
          <p className="text-lg text-gray-600">Import your Excel or CSV file to populate the dashboard</p>
        </div>

        <div className="mb-8 bg-yellow-50 border border-yellow-300 rounded-lg p-5">
          <p className="font-semibold text-yellow-900 mb-2">Note: Your file must include these exact columns:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-yellow-900">
            <span>Region</span>
            <span>State</span>
            <span>City</span>
            <span>Product</span>
            <span>Sales</span>
            <span>Revenue</span>
            <span>Date</span>
            <span>Units Sold</span>
          </div>
          <p className="text-xs text-yellow-800 mt-3">✓ Maximum file size: 20MB | ✓ Supported formats: CSV, XLSX, XLS</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Area */}
          <div className="lg:col-span-2">
            <form onSubmit={handleUpload}>
              {/* Drag & Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-3 border-dashed rounded-lg p-12 text-center transition ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
                }`}
              >
                <p className="text-5xl mb-4">📁</p>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Drag and drop your file</h3>
                <p className="text-gray-600 mb-4">or click to browse</p>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  id="file-input"
                />
                <label
                  htmlFor="file-input"
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700"
                >
                  Browse Files
                </label>
              </div>

              {/* Selected File */}
              {file && (
                <div className="mt-6 p-4 bg-green-50 border border-green-300 rounded-lg">
                  <p className="text-green-800">
                    ✅ <strong>{file.name}</strong> selected
                  </p>
                  <p className="text-sm text-green-700">Size: {formatFileSize(file.size)}</p>
                </div>
              )}

              {/* Upload Button */}
              <button
                type="submit"
                disabled={!file || loading}
                className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition"
              >
                {loading ? 'Uploading...' : 'Upload File'}
              </button>
            </form>
          </div>

          {/* Schema Info */}
          {schema && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Required Format</h3>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3">Columns:</h4>
                <div className="space-y-2">
                  {schema.requiredColumns.map((col) => (
                    <div key={col} className="flex items-center text-sm">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                      <span className="font-mono text-gray-700">{col}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3">Data Types:</h4>
                <div className="space-y-2 text-sm">
                  {Object.entries(schema.dataTypes).map(([col, type]) => (
                    <div key={col} className="flex justify-between">
                      <span className="font-mono text-gray-600">{col}</span>
                      <span className="text-gray-500">{type}</span>
                    </div>
                  ))}
                </div>
              </div>

              {schema.example && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Example Row:</h4>
                  <div className="bg-gray-50 p-3 rounded text-xs space-y-1">
                    {Object.entries(schema.example[0]).map(([key, value]) => (
                      <div key={key} className="text-gray-600">
                        <strong>{key}:</strong> {value}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
