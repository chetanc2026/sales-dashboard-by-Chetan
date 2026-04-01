import React, { useEffect, useState } from 'react';
import KPICard from './KPICard';
import RegionChart from './charts/RegionChart';
import ProductChart from './charts/ProductChart';
import TrendChart from './charts/TrendChart';
import HeatmapChart from './charts/HeatmapChart';
import InsightsPanel from './InsightsPanel';
import { KPICardSkeleton, ChartSkeleton, InsightsSkeleton } from './SkeletonLoaders';
import { dashboardAPI } from '../services/api';
import { formatIndianCompact, formatINRCompact } from '../utils/numberFormat';
import toast from 'react-hot-toast';

const asArray = (value) => (Array.isArray(value) ? value : []);

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null);

const getPayload = (settled) => (settled.status === 'fulfilled' ? settled.value?.data : null);

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const hasItems = (value) => Array.isArray(value) && value.length > 0;

const buildFallbackDatasets = (rows) => {
  const regionMap = new Map();
  const productMap = new Map();
  const trendMap = new Map();
  const heatmapMap = new Map();

  for (const row of rows) {
    const region = row.region || 'Unknown';
    const product = row.product || 'Unknown';
    const state = row.state || 'Unknown';
    const revenue = toNumber(row.revenue);
    const sales = toNumber(row.sales);
    const units = toNumber(row.units_sold ?? row.unitsSold);
    const date = new Date(row.date);
    const monthKey = Number.isNaN(date.getTime())
      ? 'Unknown'
      : `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`;

    if (!regionMap.has(region)) {
      regionMap.set(region, { region, revenue: 0, sales: 0, units: 0, transactions: 0 });
    }
    const regionEntry = regionMap.get(region);
    regionEntry.revenue += revenue;
    regionEntry.sales += sales;
    regionEntry.units += units;
    regionEntry.transactions += 1;

    if (!productMap.has(product)) {
      productMap.set(product, { product, revenue: 0, units: 0, transactions: 0 });
    }
    const productEntry = productMap.get(product);
    productEntry.revenue += revenue;
    productEntry.units += units;
    productEntry.transactions += 1;

    if (!trendMap.has(monthKey)) {
      trendMap.set(monthKey, { month: monthKey, value: 0 });
    }
    trendMap.get(monthKey).value += revenue;

    const heatmapKey = `${region}::${state}`;
    if (!heatmapMap.has(heatmapKey)) {
      heatmapMap.set(heatmapKey, { region, state, revenue: 0, units: 0 });
    }
    const heatmapEntry = heatmapMap.get(heatmapKey);
    heatmapEntry.revenue += revenue;
    heatmapEntry.units += units;
  }

  const regionData = Array.from(regionMap.values()).sort((a, b) => b.revenue - a.revenue);
  const productData = Array.from(productMap.values())
    .map((item) => ({
      ...item,
      avgRevenue: item.transactions ? item.revenue / item.transactions : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 12);
  const trendData = Array.from(trendMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  const heatmapData = Array.from(heatmapMap.values()).sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = regionData.reduce((sum, item) => sum + item.revenue, 0);
  const topRegion = regionData[0]?.region;
  const topRegionRevenue = regionData[0]?.revenue || 0;
  const uniqueProducts = productMap.size;
  const insights = [];

  if (topRegion) {
    insights.push({
      type: 'positive',
      title: 'Top Performing Region',
      message: `${topRegion} leads with ${formatINRCompact(topRegionRevenue)} in revenue`,
      icon: '🏆',
    });
  }

  if (totalRevenue > 500000) {
    insights.push({
      type: 'success',
      title: 'Strong Revenue Performance',
      message: `Total revenue exceeds ${formatINRCompact(500000)} threshold`,
      icon: '📈',
    });
  }

  insights.push({
    type: 'info',
    title: 'Product Portfolio',
    message: `${uniqueProducts} unique products in portfolio`,
    icon: '📦',
  });

  return { regionData, productData, trendData, heatmapData, insights };
};

const formatDate = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getDataSummary = (rows) => {
  const dates = rows
    .map((row) => row?.date)
    .filter(Boolean)
    .map((date) => new Date(date))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => left - right);

  if (!dates.length) {
    return null;
  }

  const earliestDate = dates[0];
  const latestDate = dates[dates.length - 1];
  const spanDays = Math.max(
    1,
    Math.round((latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  return {
    rowCount: rows.length,
    earliestDate,
    latestDate,
    spanDays,
  };
};

const DashboardGrid = ({ filters, darkMode }) => {
  const [kpis, setKpis] = useState(null);
  const [regionData, setRegionData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [insights, setInsights] = useState([]);
  const [dataSummary, setDataSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [kpiRes, regionRes, prodRes, trendRes, heatmapRes, insightRes, dataRes] = await Promise.allSettled([
          dashboardAPI.getKPIs(filters),
          dashboardAPI.getRegionSales(filters),
          dashboardAPI.getProductPerformance(filters),
          dashboardAPI.getTrends(filters),
          dashboardAPI.getGeoHeatmap(filters),
          dashboardAPI.getInsights(filters),
          dashboardAPI.getData({ ...filters, limit: 1000 }),
        ]);

        const kpiPayload = getPayload(kpiRes);
        const regionPayload = getPayload(regionRes);
        const productPayload = getPayload(prodRes);
        const trendPayload = getPayload(trendRes);
        const heatmapPayload = getPayload(heatmapRes);
        const insightPayload = getPayload(insightRes);
        const dataPayload = getPayload(dataRes);

        const kpiData = firstDefined(kpiPayload?.kpis, kpiPayload?.data?.kpis, kpiPayload?.data);
        const regionDataValue = firstDefined(regionPayload?.data, regionPayload?.regions, regionPayload?.result);
        const productDataValue = firstDefined(productPayload?.data, productPayload?.products, productPayload?.result);
        const trendDataValue = firstDefined(trendPayload?.data, trendPayload?.trends, trendPayload?.result);
        const heatmapDataValue = firstDefined(heatmapPayload?.data, heatmapPayload?.heatmap, heatmapPayload?.result);
        const insightDataValue = firstDefined(insightPayload?.insights, insightPayload?.data?.insights, insightPayload?.data);
        const rawDataRows = asArray(firstDefined(dataPayload?.data, dataPayload?.rows, dataPayload?.result));

        const fallback = buildFallbackDatasets(rawDataRows);

        setKpis(kpiData || null);
        setRegionData(hasItems(regionDataValue) ? asArray(regionDataValue) : fallback.regionData);
        setProductData(hasItems(productDataValue) ? asArray(productDataValue) : fallback.productData);
        setTrendData(hasItems(trendDataValue) ? asArray(trendDataValue) : fallback.trendData);
        setHeatmapData(hasItems(heatmapDataValue) ? asArray(heatmapDataValue) : fallback.heatmapData);
        setInsights(hasItems(insightDataValue) ? asArray(insightDataValue) : fallback.insights);
        setDataSummary(getDataSummary(rawDataRows));

        const failedCount = [kpiRes, regionRes, prodRes, trendRes, heatmapRes, insightRes, dataRes]
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

  return (
    <div className={`p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {dataSummary && (
        <div
          className={`rounded-2xl border p-5 mb-6 shadow-sm ${
            darkMode ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-sky-500">Data Coverage</p>
              <h2 className="text-lg font-bold">
                {dataSummary.rowCount} rows from {formatDate(dataSummary.earliestDate)} to {formatDate(dataSummary.latestDate)}
              </h2>
            </div>
            <div className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {dataSummary.spanDays <= 30
                ? 'This dataset spans a short date range, so 7/30/90 day filters may look similar.'
                : 'Date presets should now produce different views across the dataset.'}
            </div>
          </div>
        </div>
      )}

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
