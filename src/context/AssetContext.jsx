import React, { createContext, useContext, useState, useEffect } from 'react';
import { AssetIndexer } from '../utils/AssetIndexer';

const AssetContext = createContext();

export const useAssets = () => {
  const context = useContext(AssetContext);
  if (!context) {
    throw new Error('useAssets must be used within an AssetProvider');
  }
  return context;
};

export const AssetProvider = ({ children }) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);

  const indexer = new AssetIndexer();

  useEffect(() => {
    loadAssetsFromStorage();
  }, []);

  const loadAssetsFromStorage = () => {
    try {
      const storedAssets = localStorage.getItem('diviAssets');
      if (storedAssets) {
        setAssets(JSON.parse(storedAssets));
      }
    } catch (error) {
      console.error('Error loading assets from storage:', error);
    }
  };

  const saveAssetsToStorage = (newAssets) => {
    try {
      localStorage.setItem('diviAssets', JSON.stringify(newAssets));
    } catch (error) {
      console.error('Error saving assets to storage:', error);
    }
  };

  const addAssets = (newAssets) => {
    const updatedAssets = [...assets, ...newAssets];
    setAssets(updatedAssets);
    saveAssetsToStorage(updatedAssets);
  };

  const updateAsset = (assetId, updates) => {
    const updatedAssets = assets.map(asset => 
      asset.id === assetId ? { ...asset, ...updates } : asset
    );
    setAssets(updatedAssets);
    saveAssetsToStorage(updatedAssets);
  };

  const deleteAsset = (assetId) => {
    const updatedAssets = assets.filter(asset => asset.id !== assetId);
    setAssets(updatedAssets);
    saveAssetsToStorage(updatedAssets);
  };

  const processZipFile = async (file) => {
    setLoading(true);
    try {
      const processedAssets = await indexer.processZipFile(file);
      addAssets(processedAssets);
      return processedAssets;
    } catch (error) {
      console.error('Error processing zip file:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const searchAssets = (term, category = 'all', tags = []) => {
    return indexer.searchAssets(assets, term, category, tags);
  };

  const getCategories = () => {
    const categories = new Set();
    assets.forEach(asset => {
      if (asset.category) {
        categories.add(asset.category);
      }
    });
    return Array.from(categories);
  };

  const getAllTags = () => {
    const tags = new Set();
    assets.forEach(asset => {
      if (asset.tags) {
        asset.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags);
  };

  const getAssetById = (id) => {
    return assets.find(asset => asset.id === id);
  };

  const value = {
    assets,
    loading,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedTags,
    setSelectedTags,
    addAssets,
    updateAsset,
    deleteAsset,
    processZipFile,
    searchAssets,
    getCategories,
    getAllTags,
    getAssetById,
    indexer
  };

  return (
    <AssetContext.Provider value={value}>
      {children}
    </AssetContext.Provider>
  );
};