import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

const INDIA_STATES_GEO_URL = 'https://raw.githubusercontent.com/deldersveld/topojson/master/countries/india/india-states.json';

const normalize = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z]/g, '');

const getStateName = (properties) => (
  properties.st_nm
  || properties.ST_NM
  || properties.name
  || properties.NAME_1
  || properties.state
  || properties.STATE
  || ''
);

const HeatmapChart = ({ data, darkMode }) => {
  const revenueByState = useMemo(() => {
    const map = new Map();
    for (const row of data || []) {
      const key = normalize(row.state);
      const revenue = Number(row.revenue) || 0;
      map.set(key, (map.get(key) || 0) + revenue);
    }
    return map;
  }, [data]);

  const maxRevenue = Math.max(...Array.from(revenueByState.values()), 1);

  const getFillColor = (stateRevenue) => {
    if (!stateRevenue) {
      return darkMode ? '#334155' : '#e2e8f0';
    }
    const ratio = stateRevenue / maxRevenue;
    if (ratio > 0.75) return '#b91c1c';
    if (ratio > 0.5) return '#ea580c';
    if (ratio > 0.25) return '#f59e0b';
    return '#22c55e';
  };

  return (
    <div className={`rounded-lg shadow-lg p-6 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
      <h3 className="text-xl font-bold mb-4">🗺️ Regional Performance Map</h3>
      {data && data.length > 0 ? (
        <div>
          <div className="w-full h-[420px] rounded-lg overflow-hidden border border-slate-300/40">
            <ComposableMap projection="geoMercator" projectionConfig={{ center: [83, 23], scale: 900 }}>
              <Geographies geography={INDIA_STATES_GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const stateName = getStateName(geo.properties);
                    const stateRevenue = revenueByState.get(normalize(stateName)) || 0;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getFillColor(stateRevenue)}
                        stroke={darkMode ? '#0f172a' : '#ffffff'}
                        strokeWidth={0.7}
                        style={{
                          default: { outline: 'none' },
                          hover: { outline: 'none', fill: '#2563eb' },
                          pressed: { outline: 'none' },
                        }}
                      >
                        <title>{`${stateName || 'Unknown'}: ${Math.round(stateRevenue)}`}</title>
                      </Geography>
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
          </div>

          <div className="mt-4 flex items-center gap-3 text-xs">
            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Revenue Scale:</span>
            <span className="px-2 py-1 rounded bg-green-500/80 text-white">Low</span>
            <span className="px-2 py-1 rounded bg-amber-500/80 text-white">Medium</span>
            <span className="px-2 py-1 rounded bg-orange-600/80 text-white">High</span>
            <span className="px-2 py-1 rounded bg-red-700/80 text-white">Very High</span>
          </div>
        </div>
      ) : (
        <p className="text-center py-8 text-gray-500">No data available</p>
      )}
    </div>
  );
};

export default HeatmapChart;
