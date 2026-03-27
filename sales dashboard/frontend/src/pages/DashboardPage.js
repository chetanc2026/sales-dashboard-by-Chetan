import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import DashboardGrid from '../components/DashboardGrid';

const DashboardPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    region: null,
    state: null,
    city: null,
    product: null,
  });
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          filters={filters}
          onFiltersChange={setFilters}
          darkMode={darkMode}
          onDarkModeToggle={() => setDarkMode(!darkMode)}
        />
        <main className="flex-1 overflow-auto">
          <DashboardGrid filters={filters} darkMode={darkMode} />
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
