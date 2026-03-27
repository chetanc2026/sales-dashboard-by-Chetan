import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import { Toaster } from 'react-hot-toast';

const PlaceholderPage = ({ title, description, onBack }) => (
  <div className="min-h-screen bg-gray-100 py-12 px-4">
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-3">{title}</h1>
      <p className="text-gray-600 mb-6">{description}</p>
      <button
        type="button"
        onClick={onBack}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Back to Dashboard
      </button>
    </div>
  </div>
);

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setCurrentPage('dashboard')} />;
  }

  return (
    <div>
      {currentPage === 'dashboard' && (
        <DashboardPage currentPage={currentPage} onNavigate={setCurrentPage} />
      )}
      {currentPage === 'upload' && <UploadPage onUploadSuccess={() => setCurrentPage('dashboard')} />}
      {currentPage === 'settings' && (
        <PlaceholderPage
          title="Settings"
          description="Settings module is now connected. You can add user/profile/system settings here."
          onBack={() => setCurrentPage('dashboard')}
        />
      )}
      {currentPage === 'reports' && (
        <PlaceholderPage
          title="Reports"
          description="Reports module is now connected. Add export and scheduled reports here."
          onBack={() => setCurrentPage('dashboard')}
        />
      )}
      {currentPage === 'analytics' && (
        <PlaceholderPage
          title="Analytics"
          description="Analytics module is now connected. Add advanced analytics views here."
          onBack={() => setCurrentPage('dashboard')}
        />
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;
