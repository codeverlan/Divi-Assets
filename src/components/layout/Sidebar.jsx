import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiHome, FiFolder, FiUpload, FiSettings, FiX } = FiIcons;

const Sidebar = ({ isOpen, onClose }) => {
  const menuItems = [
    { path: '/', icon: FiHome, label: 'Dashboard' },
    { path: '/library', icon: FiFolder, label: 'Asset Library' },
    { path: '/upload', icon: FiUpload, label: 'Upload Manager' },
    { path: '/settings', icon: FiSettings, label: 'Settings' }
  ];

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: '-100%' }
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        variants={sidebarVariants}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 z-50 w-64 h-full bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700 lg:translate-x-0 lg:static lg:z-auto"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 lg:hidden">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <SafeIcon icon={FiX} className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <nav className="p-4 pt-20 lg:pt-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-divi-primary text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <SafeIcon icon={item.icon} className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gradient-to-r from-divi-primary to-divi-secondary rounded-lg p-4 text-white">
            <h3 className="font-semibold text-sm mb-1">Storage Used</h3>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-2 mb-2">
              <div className="bg-white h-2 rounded-full" style={{ width: '65%' }}></div>
            </div>
            <p className="text-xs opacity-90">650 MB of 1 GB used</p>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;