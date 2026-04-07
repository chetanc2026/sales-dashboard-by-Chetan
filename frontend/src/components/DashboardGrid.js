import React, { useEffect, useState } from 'react';
import KPICard from './KPICard';
import RegionChart from './charts/RegionChart';
import ProductChart from './charts/ProductChart';
import TrendChart from './charts/TrendChart';
import HeatmapChart from './charts/HeatmapChart';
import InsightsPanel from './InsightsPanel';
import { KPICardSkeleton, ChartSkeleton, InsightsSkeleton } from './SkeletonLoaders';
import { dashboardAPI, dataAPI } from '../services/api';
import { formatIndianCompact, formatINRCompact } from '../utils/numberFormat';
import toast from 'react-hot-toast';

const asArray = (value) => (Array.isArray(value) ? value : []);

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null);

const getPayload = (settled) => (settled.status === 'fulfilled' ? settled.value?.data : null);

const hasItems = (value) => Array.isArray(value) && value.length > 0;

const DashboardGrid = ({ filters, darkMode }) => {
  const [kpis, setKpis] = useState(null);
  const [regionData, setRegionData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [insights, setInsights] = useState([]);
  const [hasUploadedData, setHasUploadedData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const uploadsResponse = await dataAPI.getUploads();
        const uploadsPayload = uploadsResponse?.data;
        const uploads = asArray(firstDefined(uploadsPayload?.uploads, uploadsPayload?.data, uploadsPayload?.rows));
        const hasAnyUploads = uploads.length > 0;

        setHasUploadedData(hasAnyUploads);

        if (!hasAnyUploads) {
          setKpis(null);
          setRegionData([]);
          setProductData([]);
          setTrendData([]);
          setHeatmapData([]);
          setInsights([]);
          return;
        }

        const [kpiRes, regionRes, prodRes, trendRes, heatmapRes, insightRes] = await Promise.allSettled([
          dashboardAPI.getKPIs(filters),
          dashboardAPI.getRegionSales(filters),
          dashboardAPI.getProductPerformance(filters),
          dashboardAPI.getTrends(filters),
          dashboardAPI.getGeoHeatmap(filters),
          dashboardAPI.getInsights(filters),
        ]);

        const kpiPayload = getPayload(kpiRes);
        const regionPayload = getPayload(regionRes);
        const productPayload = getPayload(prodRes);
        const trendPayload = getPayload(trendRes);
        const heatmapPayload = getPayload(heatmapRes);
        const insightPayload = getPayload(insightRes);
        const kpiData = firstDefined(kpiPayload?.kpis, kpiPayload?.data?.kpis, kpiPayload?.data);
        const regionDataValue = firstDefined(regionPayload?.data, regionPayload?.regions, regionPayload?.result);
        const productDataValue = firstDefined(productPayload?.data, productPayload?.products, productPayload?.result);
        const trendDataValue = firstDefined(trendPayload?.data, trendPayload?.trends, trendPayload?.result);
        const heatmapDataValue = firstDefined(heatmapPayload?.data, heatmapPayload?.heatmap, heatmapPayload?.result);
        const insightDataValue = firstDefined(insightPayload?.insights, insightPayload?.data?.insights, insightPayload?.data);
        setKpis(kpiData || null);
        setRegionData(hasItems(regionDataValue) ? asArray(regionDataValue) : []);
        setProductData(hasItems(productDataValue) ? asArray(productDataValue) : []);
        setTrendData(hasItems(trendDataValue) ? asArray(trendDataValue) : []);
        setHeatmapData(hasItems(heatmapDataValue) ? asArray(heatmapDataValue) : []);
        setInsights(hasItems(insightDataValue) ? asArray(insightDataValue) : []);

        const failedCount = [kpiRes, regionRes, prodRes, trendRes, heatmapRes, insightRes]
          .filter((item) => item.status === 'rejected').length;

        if (failedCount === 6) {
          toast.error('Failed to fetch dashboard data');
        } else if (failedCount > 0) {
          toast.error('Some dashboard sections failed to load');
        }
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
      <div className={`p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        {/* Summary Skeleton */}
        <div className={`rounded-lg shadow-lg p-5 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`h-5 w-56 rounded mb-2 animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <div className={`h-4 w-80 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        </div>

        {/* KPI Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <KPICardSkeleton darkMode={darkMode} />
          <KPICardSkeleton darkMode={darkMode} />
          <KPICardSkeleton darkMode={darkMode} />
        </div>

        {/* Chart Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartSkeleton darkMode={darkMode} />
          <ChartSkeleton darkMode={darkMode} />
        </div>

        {/* Trend and Insights Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <ChartSkeleton darkMode={darkMode} />
          </div>
          <InsightsSkeleton darkMode={darkMode} />
        </div>

        {/* Heatmap Skeleton */}
        <div className="grid grid-cols-1 gap-6">
          <ChartSkeleton darkMode={darkMode} />
        </div>
      </div>
    );
  }

  if (hasUploadedData === false) {
    return (
      <div className={`p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div
          className={`rounded-2xl border p-8 shadow-sm text-center ${
            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-500">No Data Uploaded</p>
          <h2 className="text-2xl font-black mt-2">Upload a file to start the dashboard</h2>
          <p className={`mt-3 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Open the Upload section from the sidebar and upload your sales data. Charts, KPIs, and insights will appear after upload.
          </p>
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
            value={formatINRCompact(kpis.totalRevenue || 0)}
            icon="💰"
            trend="+12.5%"
            darkMode={darkMode}
          />
          <KPICard
            title="Total Sales"
            value={formatIndianCompact(kpis.totalSales || 0)}
            icon="🛒"
            trend="+8.2%"
            darkMode={darkMode}
          />
          <KPICard
            title="Units Sold"
            value={formatIndianCompact(kpis.totalUnits || 0)}
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
