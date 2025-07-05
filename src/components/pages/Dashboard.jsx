import React from 'react';
import { motion } from 'framer-motion';
import { useAssets } from '../../context/AssetContext';
import { Link } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiFolder, FiUpload, FiImage, FiCode, FiTrendingUp, FiPlus } = FiIcons;

const Dashboard = () => {
  const { assets } = useAssets();

  const stats = {
    totalAssets: assets.length,
    layouts: assets.filter(asset => asset.category === 'layout').length,
    images: assets.filter(asset => asset.type === 'image').length,
    modules: assets.filter(asset => asset.category === 'module').length,
  };

  const recentAssets = assets.slice(-5).reverse();

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
          Welcome back!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your Divi assets with ease. Upload, organize, and discover your design resources.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Assets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalAssets}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <SafeIcon icon={FiFolder} className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Layouts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.layouts}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <SafeIcon icon={FiCode} className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Images</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.images}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <SafeIcon icon={FiImage} className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Modules</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.modules}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <SafeIcon icon={FiTrendingUp} className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/upload"
            className="bg-gradient-to-r from-divi-primary to-divi-secondary text-white rounded-xl p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <SafeIcon icon={FiUpload} className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Upload Assets</h3>
                <p className="text-sm opacity-90">Add new Divi assets to your library</p>
              </div>
            </div>
          </Link>

          <Link
            to="/library"
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <SafeIcon icon={FiFolder} className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Browse Library</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Explore your asset collection</p>
              </div>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Recent Assets */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Assets</h2>
          <Link
            to="/library"
            className="text-divi-primary hover:text-divi-secondary transition-colors text-sm font-medium"
          >
            View All
          </Link>
        </div>

        {recentAssets.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentAssets.map((asset) => (
                <div key={asset.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                      {asset.type === 'image' ? (
                        <SafeIcon icon={FiImage} className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <SafeIcon icon={FiCode} className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{asset.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {asset.category} • {new Date(asset.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {asset.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <SafeIcon icon={FiPlus} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No assets yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Upload your first Divi asset to get started
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center px-4 py-2 bg-divi-primary text-white rounded-lg hover:bg-divi-secondary transition-colors"
            >
              <SafeIcon icon={FiUpload} className="w-4 h-4 mr-2" />
              Upload Assets
            </Link>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;