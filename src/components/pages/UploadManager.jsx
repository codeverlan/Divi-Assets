import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAssets } from '../../context/AssetContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiUpload, FiFile, FiCheck, FiX, FiLoader } = FiIcons;

const UploadManager = () => {
  const { processZipFile, loading } = useAssets();
  const [dragOver, setDragOver] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [completedUploads, setCompletedUploads] = useState([]);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const zipFiles = files.filter(file => file.name.endsWith('.zip'));
    
    if (zipFiles.length === 0) {
      alert('Please select ZIP files only.');
      return;
    }

    const newUploads = zipFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      status: 'pending',
      progress: 0,
      error: null,
      extractedAssets: []
    }));

    setUploadQueue(prev => [...prev, ...newUploads]);
    
    // Process files one by one
    newUploads.forEach(upload => processFile(upload));
  };

  const processFile = async (upload) => {
    setUploadQueue(prev => prev.map(u => 
      u.id === upload.id ? { ...u, status: 'processing', progress: 50 } : u
    ));

    try {
      const extractedAssets = await processZipFile(upload.file);
      
      setUploadQueue(prev => prev.filter(u => u.id !== upload.id));
      setCompletedUploads(prev => [...prev, {
        ...upload,
        status: 'completed',
        progress: 100,
        extractedAssets
      }]);
    } catch (error) {
      setUploadQueue(prev => prev.map(u => 
        u.id === upload.id ? { 
          ...u, 
          status: 'error', 
          error: error.message 
        } : u
      ));
    }
  };

  const removeFromQueue = (uploadId) => {
    setUploadQueue(prev => prev.filter(u => u.id !== uploadId));
  };

  const clearCompleted = () => {
    setCompletedUploads([]);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Upload Manager
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload and extract your Divi asset ZIP files
        </p>
      </motion.div>

      {/* Upload Zone */}
      <motion.div variants={itemVariants}>
        <div
          className={`upload-zone ${dragOver ? 'drag-over' : ''} p-12 text-center cursor-pointer transition-all duration-300`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <SafeIcon icon={FiUpload} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Drop ZIP files here or click to browse
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Support for Divi layout packages, modules, and asset bundles
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".zip"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </motion.div>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Processing Queue
            </h2>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {uploadQueue.length} file(s)
            </span>
          </div>
          
          <div className="space-y-3">
            {uploadQueue.map((upload) => (
              <UploadItem
                key={upload.id}
                upload={upload}
                onRemove={() => removeFromQueue(upload.id)}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Completed Uploads */}
      {completedUploads.length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Completed
            </h2>
            <button
              onClick={clearCompleted}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Clear All
            </button>
          </div>
          
          <div className="space-y-3">
            {completedUploads.map((upload) => (
              <CompletedUploadItem key={upload.id} upload={upload} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Tips */}
      <motion.div variants={itemVariants}>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Upload Tips
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• ZIP files will be automatically extracted and organized</li>
            <li>• JSON files are parsed for Divi layout information</li>
            <li>• Images are processed and thumbnails are generated</li>
            <li>• Assets are automatically categorized and tagged</li>
            <li>• Large files may take longer to process</li>
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
};

const UploadItem = ({ upload, onRemove }) => {
  const getStatusIcon = () => {
    switch (upload.status) {
      case 'pending':
        return FiFile;
      case 'processing':
        return FiLoader;
      case 'completed':
        return FiCheck;
      case 'error':
        return FiX;
      default:
        return FiFile;
    }
  };

  const getStatusColor = () => {
    switch (upload.status) {
      case 'pending':
        return 'text-gray-500';
      case 'processing':
        return 'text-blue-500';
      case 'completed':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <SafeIcon 
            icon={getStatusIcon()} 
            className={`w-5 h-5 ${getStatusColor()} ${upload.status === 'processing' ? 'animate-spin' : ''}`}
          />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {upload.file.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {(upload.file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
            {upload.status}
          </span>
          {upload.status === 'pending' && (
            <button
              onClick={onRemove}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <SafeIcon icon={FiX} className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {upload.status === 'processing' && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${upload.progress}%` }}
            />
          </div>
        </div>
      )}
      
      {upload.error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
          <p className="text-sm text-red-800 dark:text-red-200">
            {upload.error}
          </p>
        </div>
      )}
    </div>
  );
};

const CompletedUploadItem = ({ upload }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <SafeIcon icon={FiCheck} className="w-5 h-5 text-green-500" />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {upload.file.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {upload.extractedAssets.length} assets extracted
            </p>
          </div>
        </div>
        
        <span className="text-sm text-green-600 dark:text-green-400">
          Completed
        </span>
      </div>
      
      {upload.extractedAssets.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Extracted Assets:
          </h4>
          <div className="flex flex-wrap gap-2">
            {upload.extractedAssets.slice(0, 5).map((asset) => (
              <span
                key={asset.id}
                className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded"
              >
                {asset.name}
              </span>
            ))}
            {upload.extractedAssets.length > 5 && (
              <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
                +{upload.extractedAssets.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadManager;