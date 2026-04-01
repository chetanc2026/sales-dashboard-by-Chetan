import React, { useState, useEffect, useCallback } from 'react';
import { dashboardAPI } from '../services/api';

const TopBar = ({ onMenuClick, filters, onFiltersChange, darkMode, onDarkModeToggle }) => {
  const [dateRange, setDateRange] = useState('all');
  const [referenceDate, setReferenceDate] = useState(null);

  const fetchLatestReferenceDate = useCallback(async () => {
    try {
      const response = await dashboardAPI.getData({ limit: 1 });
      const rows = Array.isArray(response.data?.data) ? response.data.data : [];
      const latestDate = rows[0]?.date ? new Date(rows[0].date) : new Date();
      if (!Number.isNaN(latestDate.getTime())) {
        setReferenceDate(latestDate);
        return latestDate;
      }
      const fallbackDate = new Date();
      setReferenceDate(fallbackDate);
      return fallbackDate;
    } catch (error) {
      const fallbackDate = new Date();
      setReferenceDate(fallbackDate);
      return fallbackDate;
    }
  }, []);

  const handleDateRangeChange = useCallback(async (range) => {
    setDateRange(range);
    const latestReferenceDate = await fetchLatestReferenceDate();
    const endDate = latestReferenceDate || (referenceDate ? new Date(referenceDate) : new Date());
    let startDate = new Date(endDate);

    switch (range) {
      case '7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'ytd':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      case 'all':
        startDate = new Date('2020-01-01');
        break;
      default:
        return;
    }

    onFiltersChange({
      ...filters,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
  }, [fetchLatestReferenceDate, filters, onFiltersChange, referenceDate]);

  useEffect(() => {
    void fetchLatestReferenceDate();
  }, [fetchLatestReferenceDate]);

  useEffect(() => {
    if (!filters.startDate && !filters.endDate) {
      void handleDateRangeChange('all');
    }
  }, [filters.startDate, filters.endDate, handleDateRangeChange]);

  useEffect(() => {
    const onDashboardDataUpdated = () => {
      void handleDateRangeChange(dateRange);
    };

    window.addEventListener('dashboard-data-updated', onDashboardDataUpdated);
    return () => {
      window.removeEventListener('dashboard-data-updated', onDashboardDataUpdated);
    };
  }, [dateRange, handleDateRangeChange]);

  return (
    <div
      className={`${
        darkMode
          ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-slate-700'
          : 'bg-gradient-to-r from-white via-sky-50 to-amber-50 border-slate-200'
      } border-b shadow-sm p-4`}
    >
      <div className="flex items-center justify-between mb-4">
        {/* Menu Button */}
        <button
          onClick={onMenuClick}
          className={`p-2 rounded transition ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
          aria-label="Toggle sidebar menu"
          aria-expanded="true"
        >
          ☰
        </button>

        {/* Title */}
        <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Sales Analytics Dashboard
        </h1>

        {/* Right Controls */}
        <div className="flex items-center gap-3" role="toolbar" aria-label="Dashboard controls">
          <button
            onClick={onDarkModeToggle}
            className={`p-2 rounded transition ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-white hover:bg-slate-100 border border-slate-200'}`}
            aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button 
            className={`p-2 rounded transition ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-white hover:bg-slate-100 border border-slate-200'}`}
            aria-label="Notifications"
          >
            🔔
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="flex gap-2" role="group" aria-label="Date range filter">
        {['7days', '30days', '90days', 'ytd', 'all'].map((range) => (
          <button
            key={range}
            onClick={() => {
              void handleDateRangeChange(range);
            }}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              dateRange === range
                ? 'bg-blue-600 text-white'
                : darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-pressed={dateRange === range}
            aria-label={`Filter by ${range === '7days' ? 'last 7 days' : range === '30days' ? 'last 30 days' : range === '90days' ? 'last 90 days' : range === 'ytd' ? 'year to date' : 'all time'}`}
          >
            {range === '7days' && 'Last 7 Days'}
            {range === '30days' && 'Last 30 Days'}
            {range === '90days' && 'Last 90 Days'}
            {range === 'ytd' && 'Year to Date'}
            {range === 'all' && 'All Time'}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TopBar;
