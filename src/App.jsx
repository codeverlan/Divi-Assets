import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/pages/Dashboard';
import AssetLibrary from './components/pages/AssetLibrary';
import UploadManager from './components/pages/UploadManager';
import AssetDetail from './components/pages/AssetDetail';
import { AssetProvider } from './context/AssetContext';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <AssetProvider>
      <Router>
        <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
          <Header
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            darkMode={darkMode}
            onDarkModeToggle={toggleDarkMode}
          />
          
          <div className="flex">
            <Sidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
            
            <main className="flex-1 lg:ml-64 pt-16 w-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="p-4 sm:p-6 w-full max-w-none"
              >
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/library" element={<AssetLibrary />} />
                  <Route path="/upload" element={<UploadManager />} />
                  <Route path="/asset/:id" element={<AssetDetail />} />
                </Routes>
              </motion.div>
            </main>
          </div>
        </div>
      </Router>
    </AssetProvider>
  );
}

export default App;