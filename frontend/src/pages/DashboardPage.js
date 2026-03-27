import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import DashboardGrid from '../components/DashboardGrid';
import UploadPage from './UploadPage';

const PlaceholderPage = ({ title, description }) => (
  <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center mt-8">
    <h1 className="text-3xl font-bold text-gray-900 mb-3">{title}</h1>
    <p className="text-gray-600">{description}</p>
  </div>
);

const DashboardPage = ({ currentPage, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem('dashboardFilters');
    return saved ? JSON.parse(saved) : {
      startDate: null,
      endDate: null,
      region: null,
      state: null,
      city: null,
      product: null,
    };
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('dashboardFilters', JSON.stringify(filters));
  }, [filters]);

  const renderPageContent = () => {
    if (currentPage === 'upload') {
      return <UploadPage embedded onUploadSuccess={() => onNavigate?.('dashboard')} />;
    }

    if (currentPage === 'settings') {
      return (
        <PlaceholderPage
          title="Settings"
          description="Settings module is connected. Add user, profile, and system settings here."
        />
      );
    }

    if (currentPage === 'reports') {
      return (
        <PlaceholderPage
          title="Reports"
          description="Reports module is connected. Add export and scheduled reporting here."
        />
      );
    }

    if (currentPage === 'analytics') {
      return (
        <PlaceholderPage
          title="Analytics"
          description="Analytics module is connected. Add advanced analysis views here."
        />
      );
    }

    return <DashboardGrid filters={filters} darkMode={darkMode} />;
  };

  const renderPageContent = () => {
    if (currentPage === 'upload') {
      return <UploadPage embedded onUploadSuccess={() => onNavigate?.('dashboard')} />;
    }

    if (currentPage === 'settings') {
      return (
        <PlaceholderPage
          title="Settings"
          description="Settings module is connected. Add user, profile, and system settings here."
        />
      );
    }

    if (currentPage === 'reports') {
      return (
        <PlaceholderPage
          title="Reports"
          description="Reports module is connected. Add export and scheduled reporting here."
        />
      );
    }

    if (currentPage === 'analytics') {
      return (
        <PlaceholderPage
          title="Analytics"
          description="Analytics module is connected. Add advanced analysis views here."
        />
      );
    }

    return <DashboardGrid filters={filters} darkMode={darkMode} />;
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
      <Sidebar isOpen={sidebarOpen} currentPage={currentPage} onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          filters={filters}
          onFiltersChange={setFilters}
          darkMode={darkMode}
          onDarkModeToggle={() => setDarkMode(!darkMode)}
        />
        <main className="flex-1 overflow-auto">
          {renderPageContent()}
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
