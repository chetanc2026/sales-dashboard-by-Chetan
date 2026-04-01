import React, { useEffect, useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import { dashboardAPI } from '../../services/api';
import { formatIndianCompact, formatINRCompact } from '../../utils/numberFormat';

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null);
const asArray = (value) => (Array.isArray(value) ? value : []);

const AnalyticsModule = ({ filters, darkMode }) => {
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState([]);
  const [regionData, setRegionData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const [kpiRes, regionRes, productRes, trendRes] = await Promise.allSettled([
          dashboardAPI.getKPIs(filters),
          dashboardAPI.getRegionSales(filters),
          dashboardAPI.getProductPerformance(filters),
          dashboardAPI.getTrends(filters),
        ]);

        if (!mounted) {
          return;
        }

        const kpiPayload = kpiRes.status === 'fulfilled' ? kpiRes.value?.data : null;
        setKpis(firstDefined(kpiPayload?.kpis, kpiPayload?.data?.kpis, kpiPayload?.data) || null);

        const regionPayload = regionRes.status === 'fulfilled' ? regionRes.value?.data : null;
        const productPayload = productRes.status === 'fulfilled' ? productRes.value?.data : null;
        const trendPayload = trendRes.status === 'fulfilled' ? trendRes.value?.data : null;

        setRegionData(asArray(firstDefined(regionPayload?.data, regionPayload?.regions, regionPayload?.result)));
        setProductData(asArray(firstDefined(productPayload?.data, productPayload?.products, productPayload?.result)));
        setTrendData(asArray(firstDefined(trendPayload?.data, trendPayload?.trends, trendPayload?.result)));
      } catch (error) {
        toast.error('Failed to load analytics module');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [filters]);

  const analytics = useMemo(() => {
    const totalRevenue = trendData.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
    const averageRevenue = trendData.length ? totalRevenue / trendData.length : 0;
    const topRegion = regionData[0] || null;
    const topProduct = productData[0] || null;
    const revenueMomentum = trendData.length > 1
      ? ((Number(trendData[trendData.length - 1]?.value) || 0) - (Number(trendData[0]?.value) || 0))
      : 0;

    const chartTrends = trendData.map((item) => ({
      month: item.month ? new Date(item.month).toLocaleDateString('en-US', { month: 'short' }) : 'N/A',
      revenue: Number(item.value) || 0,
    }));

    const chartRegions = regionData.slice(0, 7).map((item) => ({
      name: item.region,
      revenue: Number(item.revenue) || 0,
      units: Number(item.units) || 0,
    }));

    const chartProducts = productData.slice(0, 6).map((item) => ({
      name: item.product,
      revenue: Number(item.revenue) || 0,
      units: Number(item.units) || 0,
    }));

    return {
      totalRevenue,
      averageRevenue,
      topRegion,
      topProduct,
      revenueMomentum,
      chartTrends,
      chartRegions,
      chartProducts,
    };
  }, [productData, regionData, trendData]);

  const regionColors = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];
  const productColors = ['#14b8a6', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];

  return (
    <div className={`p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className={`rounded-3xl p-6 shadow-lg border ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-500">Analytics Module</p>
          <h2 className="text-3xl font-black mt-1">Deeper performance analysis</h2>
          <p className={`mt-2 max-w-2xl ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Spot trend direction, compare geography and product mix, and evaluate whether recent momentum is strengthening or cooling.
          </p>
        </div>

        {loading ? (
          <p className={darkMode ? 'text-slate-300' : 'text-slate-600'}>Loading analytics data...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <MetricCard label="Total Trend Revenue" value={formatINRCompact(analytics.totalRevenue)} darkMode={darkMode} />
              <MetricCard label="Monthly Average" value={formatINRCompact(analytics.averageRevenue)} darkMode={darkMode} />
              <MetricCard label="Momentum" value={formatINRCompact(analytics.revenueMomentum)} darkMode={darkMode} />
              <MetricCard label="KPI Revenue" value={formatINRCompact(kpis?.totalRevenue || 0)} darkMode={darkMode} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <DetailCard title="Top Region" value={analytics.topRegion?.region || 'N/A'} note={analytics.topRegion ? formatINRCompact(analytics.topRegion.revenue) : 'No region data'} darkMode={darkMode} />
              <DetailCard title="Top Product" value={analytics.topProduct?.product || 'N/A'} note={analytics.topProduct ? formatINRCompact(analytics.topProduct.revenue) : 'No product data'} darkMode={darkMode} />
              <DetailCard title="Current KPI" value={kpis ? 'Live' : 'Fallback'} note="Analytics syncs with dashboard filters" darkMode={darkMode} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
              <ChartCard title="Revenue Trend" darkMode={darkMode}>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={analytics.chartTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="month" stroke={darkMode ? '#94a3b8' : '#64748b'} />
                    <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} tickFormatter={(value) => formatIndianCompact(value)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#ffffff', border: 'none', borderRadius: 10 }}
                      formatter={(value) => formatINRCompact(value)}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" fill="#0ea5e933" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Region Mix" darkMode={darkMode}>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={analytics.chartRegions} dataKey="revenue" nameKey="name" innerRadius={72} outerRadius={110} paddingAngle={4}>
                      {analytics.chartRegions.map((entry, index) => (
                        <Cell key={entry.name} fill={regionColors[index % regionColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatINRCompact(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <ChartCard title="Top Regions by Revenue" darkMode={darkMode}>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={analytics.chartRegions} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis type="number" stroke={darkMode ? '#94a3b8' : '#64748b'} tickFormatter={(value) => formatIndianCompact(value)} />
                    <YAxis type="category" dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} width={90} />
                    <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#ffffff', border: 'none', borderRadius: 10 }} formatter={(value) => formatINRCompact(value)} />
                    <Bar dataKey="revenue" name="Revenue" fill="#3b82f6">
                      {analytics.chartRegions.map((entry, index) => (
                        <Cell key={entry.name} fill={regionColors[index % regionColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Top Products by Revenue" darkMode={darkMode}>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={analytics.chartProducts}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} angle={-25} textAnchor="end" height={68} interval={0} />
                    <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} tickFormatter={(value) => formatIndianCompact(value)} />
                    <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#ffffff', border: 'none', borderRadius: 10 }} formatter={(value) => formatINRCompact(value)} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#14b8a6">
                      {analytics.chartProducts.map((entry, index) => (
                        <Cell key={entry.name} fill={productColors[index % productColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, darkMode }) => (
  <div className={`rounded-2xl p-4 border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
    <p className={`text-xs uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
    <p className="mt-2 text-2xl font-black">{value}</p>
  </div>
);

const DetailCard = ({ title, value, note, darkMode }) => (
  <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
    <p className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>{title}</p>
    <p className="mt-2 text-2xl font-black break-words">{value}</p>
    <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{note}</p>
  </div>
);

const ChartCard = ({ title, darkMode, children }) => (
  <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
    <h3 className="text-lg font-bold mb-4">{title}</h3>
    {children}
  </div>
);

export default AnalyticsModule;