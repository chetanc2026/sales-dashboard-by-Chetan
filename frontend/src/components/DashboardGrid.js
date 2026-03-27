import React, { useEffect, useState } from 'react';
import KPICard from './KPICard';
import RegionChart from './charts/RegionChart';
import ProductChart from './charts/ProductChart';
import TrendChart from './charts/TrendChart';
import HeatmapChart from './charts/HeatmapChart';
import InsightsPanel from './InsightsPanel';
import { dashboardAPI } from '../services/api';
import toast from 'react-hot-toast';

const DashboardGrid = ({ filters, darkMode }) => {
  const [kpis, setKpis] = useState(null);
  const [regionData, setRegionData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [kpiRes, regionRes, prodRes, trendRes, heatmapRes, insightRes] = await Promise.all([
          dashboardAPI.getKPIs(filters),
          dashboardAPI.getRegionSales(filters),
          dashboardAPI.getProductPerformance(filters),
          dashboardAPI.getTrends(filters),
          dashboardAPI.getGeoHeatmap(filters),
          dashboardAPI.getInsights(filters),
        ]);

        setKpis(kpiRes.data.kpis);
        setRegionData(regionRes.data.data);
        setProductData(prodRes.data.data);
        setTrendData(trendRes.data.data);
        setHeatmapData(heatmapRes.data.data);
        setInsights(insightRes.data.insights);
      } catch (error) {
        toast.error('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <p className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* KPI Section */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <KPICard
            title="Total Revenue"
            value={`$${(kpis.totalRevenue || 0).toFixed(0)}`}
            icon="💰"
            trend="+12.5%"
            darkMode={darkMode}
          />
          <KPICard
            title="Total Sales"
            value={`${(kpis.totalSales || 0).toFixed(0)}`}
            icon="🛒"
            trend="+8.2%"
            darkMode={darkMode}
          />
          <KPICard
            title="Units Sold"
            value={`${(kpis.totalUnits || 0).toLocaleString()}`}
            icon="📦"
            trend="+15.3%"
            darkMode={darkMode}
          />
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RegionChart data={regionData} darkMode={darkMode} />
        <ProductChart data={productData} darkMode={darkMode} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendChart data={trendData} darkMode={darkMode} />
        </div>
        <InsightsPanel insights={insights} darkMode={darkMode} />
      </div>

      <div className="grid grid-cols-1 gap-6 mt-8">
        <HeatmapChart data={heatmapData} darkMode={darkMode} />
      </div>
    </div>
  );
};

export default DashboardGrid;
