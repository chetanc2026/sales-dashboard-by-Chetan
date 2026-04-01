import React, { useMemo } from 'react';
import { geoMercator } from 'd3-geo';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { feature } from 'topojson-client';
import indiaStatesTopo from '../../data/indiaStatesTopo.json';
import { formatINRCompact } from '../../utils/numberFormat';

const normalize = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z]/g, '');

const STATE_ALIASES = {
  nctofdelhi: 'delhi',
  nationalcapitalterritoryofdelhi: 'delhi',
  orissa: 'odisha',
  pondicherry: 'puducherry',
  andamannicobar: 'andamannicobarislands',
  andamannicobarisland: 'andamannicobarislands',
  jammukashmir: 'jammuandkashmir',
  dadranagarhaveli: 'dadraandnagarhavelianddamananddiu',
  damandiu: 'dadraandnagarhavelianddamananddiu',
};

const getFeatureName = (properties) => (
  properties.name
  || properties.NAME_1
  || properties.st_nm
  || ''
);

const normalizeStateKey = (value) => STATE_ALIASES[normalize(value)] || normalize(value);

const HeatmapChart = ({ data, darkMode }) => {
  const indiaFeatureCollection = useMemo(
    () => feature(indiaStatesTopo, indiaStatesTopo.objects.default),
    []
  );

  const revenueByState = useMemo(() => {
    const map = new Map();
    for (const row of data || []) {
      const key = normalizeStateKey(row.state);
      if (!key) {
        continue;
      }
      const revenue = Number(row.revenue) || 0;
      map.set(key, (map.get(key) || 0) + revenue);
    }
    return map;
  }, [data]);

  const projection = useMemo(() => {
    return geoMercator().fitExtent(
      [[16, 16], [784, 404]],
      indiaFeatureCollection
    );
  }, [indiaFeatureCollection]);

  const maxRevenue = Math.max(...Array.from(revenueByState.values()), 1);

  const getFillColor = (stateRevenue) => {
    if (!stateRevenue) {
      return darkMode ? '#334155' : '#e2e8f0';
    }
    const ratio = stateRevenue / maxRevenue;
    if (ratio > 0.75) return '#1d4ed8';
    if (ratio > 0.5) return '#2563eb';
    if (ratio > 0.25) return '#60a5fa';
    return '#93c5fd';
  };

  return (
    <div className={`rounded-lg shadow-lg p-6 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
      <h3 className="text-xl font-bold mb-4">🗺️ Regional Performance Map</h3>
      {data && data.length > 0 ? (
        <div>
          <div className="w-full h-[420px] rounded-lg overflow-hidden border border-slate-300/40 bg-slate-50/40">
            <ComposableMap width={800} height={420} projection={projection}>
              <Geographies geography={indiaStatesTopo}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const stateName = getFeatureName(geo.properties);
                    const stateRevenue = revenueByState.get(normalizeStateKey(stateName)) || 0;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getFillColor(stateRevenue)}
                        stroke={darkMode ? '#cbd5e1' : '#ffffff'}
                        strokeWidth={1.2}
                        style={{
                          default: { outline: 'none', fillOpacity: 0.9, cursor: 'pointer' },
                          hover: { outline: 'none', fill: '#1d4ed8', fillOpacity: 1 },
                          pressed: { outline: 'none' },
                        }}
                      >
                        <title>{`${stateName || 'Unknown'}: ${formatINRCompact(stateRevenue)}`}</title>
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
