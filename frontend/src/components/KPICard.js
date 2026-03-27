import React from 'react';

const KPICard = ({ title, value, icon, trend, darkMode }) => {
  const trendIsPositive = trend?.startsWith('+');

  return (
    <div
      className={`rounded-2xl shadow-lg p-6 border ${
        darkMode ? 'bg-slate-800/80 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-200'
      } hover:shadow-xl hover:-translate-y-0.5 transition`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{title}</h3>
        <span className="text-3xl bg-gradient-to-br from-sky-500 to-cyan-400 bg-clip-text text-transparent">{icon}</span>
      </div>

      <div className="mb-4 pb-4 border-b border-dashed border-slate-300/40">
        <p className="text-3xl font-extrabold tracking-tight">{value}</p>
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
