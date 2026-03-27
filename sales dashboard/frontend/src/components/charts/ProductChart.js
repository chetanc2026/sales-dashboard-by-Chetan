import React from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

const ProductChart = ({ data, darkMode }) => {
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f87171', '#a78bfa'];

  const chartData = data.slice(0, 6).map((item) => ({
    name: item.product,
    value: parseFloat(item.revenue),
  }));

  return (
    <div className={`rounded-lg shadow-lg p-6 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
      <h3 className="text-xl font-bold mb-4">🎯 Product Revenue Distribution</h3>
      {chartData && chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `$${value.toFixed(0)}`} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center py-8 text-gray-500">No data available</p>
      )}
    </div>
  );
};

export default ProductChart;
