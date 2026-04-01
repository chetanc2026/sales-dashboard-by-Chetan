import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatINRCompact } from '../../utils/numberFormat';

const TrendChart = ({ data, darkMode }) => {
  const chartData = data.map((item) => ({
    month: item.month ? new Date(item.month).toLocaleDateString('en-US', { month: 'short' }) : 'N/A',
    revenue: parseFloat(item.value),
  }));

  return (
    <div className={`rounded-lg shadow-lg p-6 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
      <h3 className="text-xl font-bold mb-4">📈 Revenue Trends</h3>
      {chartData && chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#444' : '#e5e7eb'} />
            <XAxis dataKey="month" stroke={darkMode ? '#999' : '#666'} />
            <YAxis stroke={darkMode ? '#999' : '#666'} tickFormatter={(value) => formatINRCompact(value)} />
            <Tooltip
              contentStyle={{ backgroundColor: darkMode ? '#333' : '#fff' }}
              labelStyle={{ color: darkMode ? '#fff' : '#000' }}
              formatter={(value) => formatINRCompact(value)}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center py-8 text-gray-500">No data available</p>
      )}
    </div>
  );
};

export default TrendChart;
