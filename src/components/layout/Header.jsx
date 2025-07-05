import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiMenu, FiSearch, FiSun, FiMoon, FiBell } = FiIcons;

const Header = ({ onMenuClick, darkMode, onDarkModeToggle }) => {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <SafeIcon icon={FiMenu} className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-divi-primary to-divi-secondary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
              Divi Asset Manager
            </h1>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white sm:hidden">
              Divi
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="hidden md:flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
            <SafeIcon icon={FiSearch} className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search assets..."
              className="bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 w-32 lg:w-48"
            />
          </div>
          
          <button
            onClick={onDarkModeToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <SafeIcon icon={darkMode ? FiSun : FiMoon} className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative">
            <SafeIcon icon={FiBell} className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-divi-primary rounded-full"></span>
          </button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;