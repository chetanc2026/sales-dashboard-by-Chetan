import React from 'react';

const KPICard = ({ title, value, icon, trend, darkMode }) => {
  const trendIsPositive = trend?.startsWith('+');

  return (
    <div
      className={`rounded-lg shadow-lg p-6 ${
        darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      } hover:shadow-xl transition`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{title}</h3>
        <span className="text-3xl">{icon}</span>
      </div>

      <div className="mb-4">
        <p className="text-3xl font-bold">{value}</p>
      </div>

      {trend && (
        <div className={`flex items-center ${trendIsPositive ? 'text-green-500' : 'text-red-500'}`}>
          <span className="text-lg mr-1">{trendIsPositive ? '📈' : '📉'}</span>
          <span className="text-sm font-semibold">{trend} from last period</span>
        </div>
      )}
    </div>
  );
};

export default KPICard;
