import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAssets } from '../../context/AssetContext';
import { Link } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiSearch, FiFilter, FiGrid, FiList, FiImage, FiCode, FiDownload, FiEye, FiCopy } = FiIcons;

const AssetLibrary = () => {
  const { assets, searchAssets, getCategories, getAllTags } = useAssets();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  const categories = getCategories();
  const allTags = getAllTags();

  const filteredAssets = useMemo(() => {
    let results = searchAssets(searchTerm, selectedCategory, selectedTags);
    
    // Apply sorting
    switch (sortBy) {
      case 'newest':
        results.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        break;
      case 'oldest':
        results.sort((a, b) => new Date(a.uploadDate) - new Date(b.uploadDate));
        break;
      case 'name':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'size':
        results.sort((a, b) => b.size - a.size);
        break;
      case 'category':
        results.sort((a, b) => a.category.localeCompare(b.category));
        break;
      default:
        break;
    }
    
    return results;
  }, [searchTerm, selectedCategory, selectedTags, assets, sortBy]);

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedTags([]);
  };

  const handleQuickCopy = async (asset) => {
    if (asset.copyableContent && asset.copyableContent.diviImport) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(asset.copyableContent.diviImport));
        console.log('Asset copied to clipboard');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
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
      <motion.div variants={itemVariants} className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Asset Library</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            {filteredAssets.length} assets available
            {categories.length > 0 && (
              <span className="ml-2">• {categories.length} categories</span>
            )}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-divi-primary focus:border-transparent outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A-Z</option>
            <option value="size">Size (Largest)</option>
            <option value="category">Category</option>
          </select>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-1 sm:flex-none justify-center"
            >
              <SafeIcon icon={FiFilter} className="w-4 h-4" />
              <span className="text-sm">Filters</span>
              {(selectedCategory !== 'all' || selectedTags.length > 0) && (
                <span className="ml-1 px-2 py-1 text-xs bg-divi-primary text-white rounded-full">
                  {selectedCategory !== 'all' ? 1 : 0 + selectedTags.length}
                </span>
              )}
            </button>
            
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
              >
                <SafeIcon icon={FiGrid} className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
              >
                <SafeIcon icon={FiList} className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div variants={itemVariants}>
        <div className="relative">
          <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search assets by name, category, tags, or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-divi-primary focus:border-transparent outline-none text-sm sm:text-base"
          />
        </div>
      </motion.div>

      {/* Dynamic Categories Display */}
      {categories.length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 text-xs sm:text-sm rounded-full transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-divi-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All ({assets.length})
            </button>
            {categories.map(category => {
              const count = assets.filter(asset => asset.category === category).length;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 text-xs sm:text-sm rounded-full transition-colors ${
                    selectedCategory === category
                      ? 'bg-divi-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {category.replace(/-/g, ' ')} ({count})
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Categories */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Categories</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value="all"
                        checked={selectedCategory === 'all'}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm">All Categories</span>
                    </label>
                    {categories.map(category => (
                      <label key={category} className="flex items-center">
                        <input
                          type="radio"
                          name="category"
                          value={category}
                          checked={selectedCategory === category}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm capitalize">{category.replace(/-/g, ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-1 text-xs sm:text-sm rounded-full transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-divi-primary text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredAssets.length} assets match your filters
                </span>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assets Grid/List */}
      <motion.div variants={itemVariants}>
        {filteredAssets.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredAssets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} onQuickCopy={handleQuickCopy} />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAssets.map((asset) => (
                  <AssetListItem key={asset.id} asset={asset} onQuickCopy={handleQuickCopy} />
                ))}
              </div>
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <SafeIcon icon={FiSearch} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No assets found</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Try adjusting your search terms or filters
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

const AssetCard = ({ asset, onQuickCopy }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        {asset.preview ? (
          <img
            src={asset.preview}
            alt={asset.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <SafeIcon
            icon={asset.type === 'image' ? FiImage : FiCode}
            className="w-8 h-8 text-gray-400"
          />
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-medium text-gray-900 dark:text-white truncate mb-1 text-sm sm:text-base">
          {asset.name}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 capitalize">
          {asset.category.replace(/-/g, ' ')}
        </p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {asset.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
            >
              {tag}
            </span>
          ))}
          {asset.tags.length > 2 && (
            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
              +{asset.tags.length - 2}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(asset.uploadDate).toLocaleDateString()}
          </span>
          <div className="flex items-center space-x-1">
            {asset.copyableContent && (
              <button
                onClick={() => onQuickCopy(asset)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-divi-primary transition-colors"
                title="Quick copy to clipboard"
              >
                <SafeIcon icon={FiCopy} className="w-4 h-4" />
              </button>
            )}
            <Link
              to={`/asset/${asset.id}`}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-divi-primary transition-colors"
            >
              <SafeIcon icon={FiEye} className="w-4 h-4" />
            </Link>
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-divi-primary transition-colors">
              <SafeIcon icon={FiDownload} className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AssetListItem = ({ asset, onQuickCopy }) => {
  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
          {asset.preview ? (
            <img
              src={asset.preview}
              alt={asset.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <SafeIcon
              icon={asset.type === 'image' ? FiImage : FiCode}
              className="w-5 h-5 text-gray-400"
            />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate text-sm sm:text-base">
            {asset.name}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 capitalize">
            {asset.category.replace(/-/g, ' ')} • {new Date(asset.uploadDate).toLocaleDateString()}
          </p>
        </div>
        
        <div className="hidden sm:flex items-center space-x-2">
          {asset.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
            >
              {tag}
            </span>
          ))}
          {asset.tags.length > 3 && (
            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
              +{asset.tags.length - 3}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          {asset.copyableContent && (
            <button
              onClick={() => onQuickCopy(asset)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-divi-primary transition-colors"
              title="Quick copy to clipboard"
            >
              <SafeIcon icon={FiCopy} className="w-4 h-4" />
            </button>
          )}
          <Link
            to={`/asset/${asset.id}`}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-divi-primary transition-colors"
          >
            <SafeIcon icon={FiEye} className="w-4 h-4" />
          </Link>
          <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-divi-primary transition-colors">
            <SafeIcon icon={FiDownload} className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssetLibrary;