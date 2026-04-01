import React from 'react';

export const KPICardSkeleton = ({ darkMode }) => {
  return (
    <div
      className={`rounded-2xl shadow-lg p-6 border animate-pulse ${
        darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`h-5 rounded w-24 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
        <div className={`h-8 rounded w-8 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
      </div>
      <div className="mb-4 pb-4 border-b border-slate-300/40">
        <div className={`h-8 rounded w-32 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
      </div>
      <div className={`h-4 rounded w-40 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
    </div>
  );
};

export const ChartSkeleton = ({ darkMode }) => {
  return (
    <div className={`rounded-lg shadow-lg p-6 animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`h-6 rounded w-40 mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
      <div className={`h-64 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
    </div>
  );
};

export const InsightsSkeleton = ({ darkMode }) => {
  return (
    <div className={`rounded-lg shadow-lg p-6 animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`h-6 rounded w-48 mb-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="mb-4">
          <div className={`h-4 rounded w-full mb-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
          <div className={`h-4 rounded w-5/6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
        </div>
      ))}
    </div>
  );
};
