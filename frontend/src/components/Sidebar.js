import React from 'react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, currentPage, onNavigate }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'upload', label: 'Upload Data', icon: '📁' },
    { id: 'reports', label: 'Reports', icon: '📈' },
    { id: 'analytics', label: 'Analytics', icon: '🔍' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside
      className={`${
        isOpen ? 'w-64' : 'w-20'
      } bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 flex flex-col`}
      role="navigation"
      aria-label="Application sidebar menu"
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-20 border-b border-blue-700">
        <span className="text-3xl" aria-hidden="true">📊</span>
        {isOpen && <span className="ml-3 font-bold text-lg">Dashboard</span>}
      </div>

      {/* Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2" aria-label="Main navigation">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate?.(item.id)}
            className="w-full flex items-center px-4 py-3 rounded-lg hover:bg-blue-700 transition"
            aria-current={currentPage === item.id ? 'page' : undefined}
            aria-label={item.label}
          >
            <span className="text-xl" aria-hidden="true">{item.icon}</span>
            {isOpen && <span className="ml-3">{item.label}</span>}
            {currentPage === item.id && (
              <span className="ml-auto w-2 h-2 rounded-full bg-blue-200" aria-hidden="true"></span>
            )}
          </button>
        ))}
      </nav>

      {/* User Profile */}
      <div className="border-t border-blue-700 p-4">
        {isOpen ? (
          <>
            <div className="text-sm mb-3">
              <p className="font-semibold">{user?.name}</p>
              <p className="text-blue-300 text-xs">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition"
              aria-label="Logout from application"
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={logout}
            className="w-full px-2 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition"
            title="Logout"
            aria-label="Logout"
          >
            🚪
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
