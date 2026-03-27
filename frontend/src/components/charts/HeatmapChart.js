import React from 'react';

const HeatmapChart = ({ data, darkMode }) => {
  const regions = [...new Set(data?.map((d) => d.region) || [])];
  const states = [...new Set(data?.map((d) => d.state) || [])];

  const maxRevenue = Math.max(...(data?.map((d) => d.revenue) || [1]));

  const getIntensity = (value) => {
    const intensity = (value / maxRevenue) * 100;
    if (intensity > 75) return 'bg-red-600';
    if (intensity > 50) return 'bg-orange-500';
    if (intensity > 25) return 'bg-yellow-400';
    return 'bg-green-400';
  };

  return (
    <div className={`rounded-lg shadow-lg p-6 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
      <h3 className="text-xl font-bold mb-4">🔥 Regional Performance Heatmap</h3>
      {data && data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left">Region/State</th>
                {states.slice(0, 5).map((state) => (
                  <th key={state} className="p-2 text-center">
                    {state}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {regions.map((region) => (
                <tr key={region} className={darkMode ? 'border-gray-700' : 'border-gray-200'}>
                  <td className="p-2 font-semibold">{region}</td>
                  {states.slice(0, 5).map((state) => {
                    const cellData = data.find((d) => d.region === region && d.state === state);
                    return (
                      <td
                        key={`${region}-${state}`}
                        className={`p-2 text-center rounded ${cellData ? getIntensity(cellData.revenue) : 'bg-gray-300'}`}
                      >
                        {cellData ? `$${(cellData.revenue / 1000).toFixed(0)}k` : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center py-8 text-gray-500">No data available</p>
      )}
    </div>
  );
};

export default HeatmapChart;
