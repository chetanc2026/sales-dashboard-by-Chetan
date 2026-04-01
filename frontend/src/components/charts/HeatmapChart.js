import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import indiaRegionsGeo from '../../data/indiaRegionsGeo.json';
import { formatINRCompact } from '../../utils/numberFormat';

const normalize = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z]/g, '');

const REGION_ALIASES = {
  north: 'North',
  south: 'South',
  east: 'East',
  west: 'West',
  central: 'Central',
  northeast: 'Northeast',
  northcentral: 'Central',
  northindia: 'North',
  southindia: 'South',
  eastindia: 'East',
  westindia: 'West',
};

const STATE_TO_REGION = {
  andhrapradesh: 'South',
  arunachalpradesh: 'Northeast',
  assam: 'Northeast',
  bihar: 'East',
  chhattisgarh: 'Central',
  delhi: 'North',
  goa: 'West',
  gujarat: 'West',
  haryana: 'North',
  himachalpradesh: 'North',
  jharkhand: 'East',
  karnataka: 'South',
  kerala: 'South',
  madhyapradesh: 'Central',
  maharashtra: 'West',
  manipur: 'Northeast',
  meghalaya: 'Northeast',
  mizoram: 'Northeast',
  nagaland: 'Northeast',
  odisha: 'East',
  orissa: 'East',
  punjab: 'North',
  rajasthan: 'North',
  sikkim: 'Northeast',
  tamilnadu: 'South',
  telangana: 'South',
  tripura: 'Northeast',
  uttarpradesh: 'North',
  uttarakhand: 'North',
  westbengal: 'East',
};

const getFeatureName = (properties) => (
  properties.name
  || properties.NAME
  || properties.name
  || ''
);

const resolveRegion = (row) => {
  const regionKey = normalize(row.region);
  if (REGION_ALIASES[regionKey]) {
    return REGION_ALIASES[regionKey];
  }

  const stateKey = normalize(row.state);
  if (STATE_TO_REGION[stateKey]) {
    return STATE_TO_REGION[stateKey];
  }

  return 'Central';
};

const HeatmapChart = ({ data, darkMode }) => {
  const revenueByRegion = useMemo(() => {
    const map = new Map();
    for (const row of data || []) {
      const key = resolveRegion(row);
      const revenue = Number(row.revenue) || 0;
      map.set(key, (map.get(key) || 0) + revenue);
    }
    return map;
  }, [data]);

  const maxRevenue = Math.max(...Array.from(revenueByRegion.values()), 1);

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
              <Geographies geography={indiaRegionsGeo}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const regionName = getFeatureName(geo.properties);
                    const regionRevenue = revenueByRegion.get(regionName) || 0;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getFillColor(regionRevenue)}
                        stroke={darkMode ? '#0f172a' : '#ffffff'}
                        strokeWidth={0.7}
                        style={{
                          default: { outline: 'none' },
                          hover: { outline: 'none', fill: '#2563eb' },
                          pressed: { outline: 'none' },
                        }}
                      >
                        <title>{`${regionName || 'Unknown'}: ${formatINRCompact(regionRevenue)}`}</title>
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
