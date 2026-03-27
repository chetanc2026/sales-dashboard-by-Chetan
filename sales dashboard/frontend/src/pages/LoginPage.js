import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const LoginPage = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@dashboards.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const demoCredentials = [
    { role: 'Admin', email: 'admin@dashboards.com', password: 'admin123' },
    { role: 'Manager', email: 'manager@dashboards.com', password: 'manager123' },
    { role: 'User', email: 'user@dashboards.com', password: 'user123' },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;
      login(user, token);
      toast.success(`Welcome, ${user.name}!`);
      onLoginSuccess?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (cred) => {
    setEmail(cred.email);
    setPassword(cred.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-5xl font-bold text-white mb-4">📊</div>
          <h1 className="text-4xl font-bold text-white mb-2">Sales Dashboard</h1>
          <p className="text-blue-200">Enterprise Analytics Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Sign In</h2>
            <p className="text-blue-100 mt-1">Access your sales analytics</p>
          </div>

          <form onSubmit={handleLogin} className="px-8 py-8">
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">📝 Demo Credentials</h3>
            <div className="space-y-2">
              {demoCredentials.map((cred) => (
                <button
                  key={cred.email}
                  type="button"
                  onClick={() => fillDemoCredentials(cred)}
                  className="w-full text-left px-4 py-2 bg-white border border-gray-300 rounded hover:bg-blue-50 transition text-sm"
                >
                  <span className="font-semibold text-gray-700">{cred.role}</span>
                  <span className="text-gray-500 text-xs ml-2">{cred.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-200 mt-8 text-sm">
          © 2024 Sales Dashboard. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
