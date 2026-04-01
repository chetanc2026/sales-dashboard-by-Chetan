import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatIndianCompact, formatINRCompact } from '../../utils/numberFormat';

const RegionChart = ({ data, darkMode }) => {
  return (
    <div className={`rounded-lg shadow-lg p-6 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
      <h3 className="text-xl font-bold mb-4">📍 Sales by Region</h3>
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#444' : '#e5e7eb'} />
            <XAxis dataKey="region" stroke={darkMode ? '#999' : '#666'} />
            <YAxis stroke={darkMode ? '#999' : '#666'} tickFormatter={(value) => formatIndianCompact(value)} />
            <Tooltip
              contentStyle={{ backgroundColor: darkMode ? '#333' : '#fff' }}
              labelStyle={{ color: darkMode ? '#fff' : '#000' }}
              formatter={(value, name) => (
                name === 'Revenue' ? formatINRCompact(value) : formatIndianCompact(value)
              )}
            />
            <Legend />
            <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
            <Bar dataKey="units" fill="#8b5cf6" name="Units Sold" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center py-8 text-gray-500">No data available</p>
      )}
    </div>
  );
};

export default RegionChart;
