import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatINRCompact, formatIndianCompact } from '../../utils/numberFormat';

const HeatmapChart = ({ data, darkMode }) => {
  const stateData = useMemo(() => {
    const byState = new Map();

    for (const row of data || []) {
      const state = row.state || row.region || 'Unknown';
      const revenue = Number(row.revenue) || 0;
      const units = Number(row.units ?? row.units_sold ?? row.unitsSold) || 0;

      if (!byState.has(state)) {
        byState.set(state, { state, revenue: 0, units: 0 });
      }

      const entry = byState.get(state);
      entry.revenue += revenue;
      entry.units += units;
    }

    return Array.from(byState.values()).sort((a, b) => b.revenue - a.revenue);
  }, [data]);

  const topStates = useMemo(() => stateData.slice(0, 10), [stateData]);

  const summary = useMemo(() => {
    const totalRevenue = stateData.reduce((sum, item) => sum + item.revenue, 0);
    const totalUnits = stateData.reduce((sum, item) => sum + item.units, 0);
    const topState = stateData[0] || null;
    const topShare = topState && totalRevenue > 0 ? (topState.revenue / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalUnits,
      statesCovered: stateData.length,
      topState,
      topShare,
    };
  }, [stateData]);

  const barPalette = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#14b8a6'];

  return (
    <div className={`rounded-lg shadow-lg p-6 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
      <h3 className="text-xl font-bold mb-4">📊 State Revenue Snapshot</h3>
      {data && data.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className={`rounded-lg p-3 border ${darkMode ? 'border-slate-700 bg-slate-900/30' : 'border-slate-200 bg-slate-50'}`}>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Revenue</p>
              <p className="text-lg font-bold">{formatINRCompact(summary.totalRevenue)}</p>
            </div>
            <div className={`rounded-lg p-3 border ${darkMode ? 'border-slate-700 bg-slate-900/30' : 'border-slate-200 bg-slate-50'}`}>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>States Covered</p>
              <p className="text-lg font-bold">{formatIndianCompact(summary.statesCovered)}</p>
            </div>
            <div className={`rounded-lg p-3 border ${darkMode ? 'border-slate-700 bg-slate-900/30' : 'border-slate-200 bg-slate-50'}`}>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Units Sold</p>
              <p className="text-lg font-bold">{formatIndianCompact(summary.totalUnits)}</p>
            </div>
            <div className={`rounded-lg p-3 border ${darkMode ? 'border-slate-700 bg-slate-900/30' : 'border-slate-200 bg-slate-50'}`}>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Top State Share</p>
              <p className="text-lg font-bold">{summary.topState ? `${summary.topState.state} (${summary.topShare.toFixed(1)}%)` : 'N/A'}</p>
            </div>
          </div>

          <div className={`rounded-xl p-3 border ${darkMode ? 'border-slate-700 bg-slate-900/20' : 'border-slate-200 bg-white'}`}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topStates} margin={{ top: 10, right: 12, left: 10, bottom: 56 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <XAxis
                  dataKey="state"
                  angle={-35}
                  textAnchor="end"
                  height={72}
                  stroke={darkMode ? '#94a3b8' : '#64748b'}
                  interval={0}
                />
                <YAxis
                  stroke={darkMode ? '#94a3b8' : '#64748b'}
                  tickFormatter={(value) => formatIndianCompact(value)}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#ffffff', border: 'none', borderRadius: 10 }}
                  labelStyle={{ color: darkMode ? '#e2e8f0' : '#1e293b' }}
                  formatter={(value) => formatINRCompact(value)}
                />
                <Bar dataKey="revenue" name="Revenue">
                  {topStates.map((entry, index) => (
                    <Cell key={entry.state} fill={barPalette[index % barPalette.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <p className="text-center py-8 text-gray-500">No data available</p>
      )}
    </div>
  );
};

export default HeatmapChart;
