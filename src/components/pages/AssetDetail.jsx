import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAssets } from '../../context/AssetContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { 
  FiArrowLeft, FiDownload, FiEdit, FiTrash2, FiTag, FiCalendar, 
  FiFile, FiImage, FiCode, FiCopy, FiCheck, FiExternalLink 
} = FiIcons;

const AssetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAssetById, deleteAsset } = useAssets();
  const [copiedContent, setCopiedContent] = useState(null);
  const [showCopyOptions, setShowCopyOptions] = useState(false);
  
  const asset = getAssetById(id);

  if (!asset) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Asset not found
        </h2>
        <button
          onClick={() => navigate('/library')}
          className="px-4 py-2 bg-divi-primary text-white rounded-lg hover:bg-divi-secondary transition-colors"
        >
          Back to Library
        </button>
      </div>
    );
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      deleteAsset(id);
      navigate('/library');
    }
  };

  const handleCopyContent = async (content, type) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedContent(type);
      setTimeout(() => setCopiedContent(null), 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedContent(type);
      setTimeout(() => setCopiedContent(null), 2000);
    }
  };

  const handleDiviImport = () => {
    if (asset.copyableContent && asset.copyableContent.diviImport) {
      const importData = JSON.stringify(asset.copyableContent.diviImport);
      handleCopyContent(importData, 'divi-import');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/library')}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <SafeIcon icon={FiArrowLeft} className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {asset.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 capitalize">
              {asset.category} • {asset.type}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Copy to Divi Button */}
          {asset.copyableContent && (
            <div className="relative">
              <button
                onClick={() => setShowCopyOptions(!showCopyOptions)}
                className="px-4 py-2 bg-divi-primary text-white rounded-lg hover:bg-divi-secondary transition-colors flex items-center space-x-2"
              >
                <SafeIcon icon={FiCopy} className="w-4 h-4" />
                <span>Copy to Divi</span>
              </button>
              
              {showCopyOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <div className="p-2">
                    <button
                      onClick={handleDiviImport}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center space-x-2"
                    >
                      <SafeIcon icon={copiedContent === 'divi-import' ? FiCheck : FiExternalLink} className="w-4 h-4" />
                      <span>Divi Import Format</span>
                    </button>
                    <button
                      onClick={() => handleCopyContent(asset.copyableContent.raw, 'raw')}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center space-x-2"
                    >
                      <SafeIcon icon={copiedContent === 'raw' ? FiCheck : FiCode} className="w-4 h-4" />
                      <span>Raw JSON</span>
                    </button>
                    <button
                      onClick={() => handleCopyContent(asset.copyableContent.minified, 'minified')}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center space-x-2"
                    >
                      <SafeIcon icon={copiedContent === 'minified' ? FiCheck : FiCode} className="w-4 h-4" />
                      <span>Minified JSON</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2">
            <SafeIcon icon={FiDownload} className="w-4 h-4" />
            <span>Download</span>
          </button>
          
          <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <SafeIcon icon={FiEdit} className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleDelete}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors"
          >
            <SafeIcon icon={FiTrash2} className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Copy Success Message */}
      {copiedContent && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiCheck} className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-green-800 dark:text-green-200">
              Content copied to clipboard! You can now paste it into the Divi Builder.
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Preview
            </h2>
            
            <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              {asset.preview ? (
                <img
                  src={asset.preview}
                  alt={asset.name}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <SafeIcon
                    icon={asset.type === 'image' ? FiImage : FiCode}
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                  />
                  <p className="text-gray-600 dark:text-gray-400">
                    No preview available
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Details */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Details
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <SafeIcon icon={FiFile} className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">File Size</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatFileSize(asset.size)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <SafeIcon icon={FiCalendar} className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Upload Date</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(asset.uploadDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <SafeIcon icon={FiTag} className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Source</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {asset.sourceZip}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <SafeIcon icon={FiCode} className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Extension</p>
                  <p className="font-medium text-gray-900 dark:text-white uppercase">
                    {asset.extension}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {asset.tags && asset.tags.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {asset.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Metadata */}
          {asset.metadata && Object.keys(asset.metadata).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Metadata
              </h2>
              <div className="space-y-4">
                {asset.metadata.moduleCount && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Modules</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {asset.metadata.moduleCount}
                    </p>
                  </div>
                )}
                
                {asset.metadata.uniqueModules && asset.metadata.uniqueModules.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Module Types</p>
                    <div className="flex flex-wrap gap-1">
                      {asset.metadata.uniqueModules.map((module) => (
                        <span
                          key={module}
                          className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                        >
                          {module}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {asset.metadata.colors && asset.metadata.colors.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Colors</p>
                    <div className="flex flex-wrap gap-2">
                      {asset.metadata.colors.slice(0, 10).map((color, index) => (
                        <div
                          key={index}
                          className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                          style={{ backgroundColor: color }}
                          title={color}
                          onClick={() => handleCopyContent(color, `color-${index}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {asset.metadata.fonts && asset.metadata.fonts.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Fonts</p>
                    <div className="space-y-1">
                      {asset.metadata.fonts.slice(0, 5).map((font, index) => (
                        <button
                          key={index}
                          onClick={() => handleCopyContent(font, `font-${index}`)}
                          className="block text-sm text-gray-700 dark:text-gray-300 hover:text-divi-primary transition-colors"
                        >
                          {font}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {asset.metadata.animations && asset.metadata.animations.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Animations</p>
                    <div className="flex flex-wrap gap-1">
                      {asset.metadata.animations.map((animation) => (
                        <span
                          key={animation}
                          className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded"
                        >
                          {animation}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {asset.metadata.version && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Divi Version</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {asset.metadata.version}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Divi Import Instructions */}
      {asset.copyableContent && (
        <motion.div variants={itemVariants}>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
              How to Import into Divi
            </h3>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <p>1. Click "Copy to Divi" above and select "Divi Import Format"</p>
              <p>2. In your Divi Builder, go to the import section</p>
              <p>3. Choose "Import from Library" or "Import Layout"</p>
              <p>4. Paste the copied content</p>
              <p>5. Click "Import" to add this asset to your page</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* JSON Content */}
      {asset.jsonContent && (
        <motion.div variants={itemVariants}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                JSON Content
              </h2>
              <button
                onClick={() => handleCopyContent(JSON.stringify(asset.jsonContent, null, 2), 'json-content')}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2"
              >
                <SafeIcon icon={copiedContent === 'json-content' ? FiCheck : FiCopy} className="w-4 h-4" />
                <span>Copy JSON</span>
              </button>
            </div>
            <div className="json-viewer dark:bg-gray-900 max-h-96 overflow-y-auto scrollbar-thin">
              <pre className="text-sm">
                {JSON.stringify(asset.jsonContent, null, 2)}
              </pre>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AssetDetail;