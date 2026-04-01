import React, { useEffect, useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import toast from 'react-hot-toast';
import { dashboardAPI } from '../../services/api';
import { formatIndianCompact, formatINRCompact } from '../../utils/numberFormat';

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null);

const asArray = (value) => (Array.isArray(value) ? value : []);

const safeDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toCsvValue = (value) => {
  const text = value === undefined || value === null ? '' : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const downloadTextFile = (filename, content, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const aggregateByKey = (rows, key, valueKey = 'revenue') => {
  const buckets = new Map();

  rows.forEach((row) => {
    const bucketName = row[key] || 'Unknown';
    const bucketValue = Number(row[valueKey]) || 0;
    buckets.set(bucketName, (buckets.get(bucketName) || 0) + bucketValue);
  });

  return Array.from(buckets.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((left, right) => right.value - left.value);
};

const aggregateByMonth = (rows) => {
  const buckets = new Map();

  rows.forEach((row) => {
    const date = safeDate(row.date);
    const monthKey = date ? date.toISOString().slice(0, 7) : 'Unknown';
    const rowValue = Number(row.revenue) || 0;
    buckets.set(monthKey, (buckets.get(monthKey) || 0) + rowValue);
  });

  return Array.from(buckets.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([month, value]) => ({
      month: month === 'Unknown' ? 'Unknown' : new Date(`${month}-01`).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      value,
    }));
};

const ReportsModule = ({ filters, darkMode }) => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [regions, setRegions] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const [dataRes, kpiRes, regionRes, productRes] = await Promise.allSettled([
          dashboardAPI.getData({ ...filters, limit: 1000 }),
          dashboardAPI.getKPIs(filters),
          dashboardAPI.getRegionSales(filters),
          dashboardAPI.getProductPerformance(filters),
        ]);

        if (!mounted) {
          return;
        }

        const dataPayload = dataRes.status === 'fulfilled' ? dataRes.value?.data : null;
        const rowsValue = firstDefined(dataPayload?.data, dataPayload?.rows, dataPayload?.result);
        setRows(asArray(rowsValue));

        const kpiPayload = kpiRes.status === 'fulfilled' ? kpiRes.value?.data : null;
        setKpis(firstDefined(kpiPayload?.kpis, kpiPayload?.data?.kpis, kpiPayload?.data) || null);

        const regionPayload = regionRes.status === 'fulfilled' ? regionRes.value?.data : null;
        const productPayload = productRes.status === 'fulfilled' ? productRes.value?.data : null;
        setRegions(asArray(firstDefined(regionPayload?.data, regionPayload?.regions, regionPayload?.result)));
        setProducts(asArray(firstDefined(productPayload?.data, productPayload?.products, productPayload?.result)));
      } catch (error) {
        toast.error('Failed to load reports module');
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

  const reportSummary = useMemo(() => {
    const totalRevenue = rows.reduce((sum, row) => sum + (Number(row.revenue) || 0), 0);
    const totalUnits = rows.reduce((sum, row) => sum + (Number(row.units_sold ?? row.unitsSold) || 0), 0);
    const latestDate = rows
      .map((row) => safeDate(row.date))
      .filter(Boolean)
      .sort((left, right) => right - left)[0];
    const regionsCovered = new Set(rows.map((row) => row.region).filter(Boolean)).size;
    const topProduct = products[0] || null;
    const topRegion = regions[0] || null;
    const kpiRevenue = Number(kpis?.totalRevenue || kpis?.revenue || 0) || 0;

    return {
      totalRevenue,
      totalUnits,
      latestDate,
      regionsCovered,
      topProduct,
      topRegion,
      kpiRevenue,
    };
  }, [kpis, products, regions, rows]);

  const chartData = useMemo(() => {
    const monthlyRevenue = aggregateByMonth(rows).slice(-10);
    const regionRevenue = regions.length > 0 ? regions.slice(0, 6).map((item) => ({
      name: item.region,
      value: Number(item.revenue) || 0,
    })) : aggregateByKey(rows, 'region').slice(0, 6).map((item) => ({ name: item.name, value: item.value }));
    const productRevenue = products.length > 0 ? products.slice(0, 6).map((item) => ({
      name: item.product,
      value: Number(item.revenue) || 0,
    })) : aggregateByKey(rows, 'product').slice(0, 6).map((item) => ({ name: item.name, value: item.value }));

    return {
      monthlyRevenue,
      regionRevenue,
      productRevenue,
    };
  }, [products, regions, rows]);

  const exportCsv = () => {
    if (!rows.length) {
      toast.error('No data available to export');
      return;
    }

    const headers = ['date', 'region', 'state', 'city', 'product', 'sales', 'units', 'revenue'];
    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((header) => {
        const value = header === 'units' ? (row.units_sold ?? row.unitsSold) : row[header];
        return toCsvValue(value);
      }).join(',')),
    ].join('\n');

    downloadTextFile('sales-report.csv', csv, 'text/csv;charset=utf-8');
    toast.success('Report exported as CSV');
  };

  const downloadSummary = () => {
    const lines = [
      'Sales Report Summary',
      `Total Revenue: ${formatINRCompact(reportSummary.totalRevenue)}`,
      `Total Units: ${formatIndianCompact(reportSummary.totalUnits)}`,
      `Regions Covered: ${formatIndianCompact(reportSummary.regionsCovered)}`,
      `Latest Date: ${reportSummary.latestDate ? reportSummary.latestDate.toLocaleDateString('en-IN') : 'N/A'}`,
      `Top Region: ${reportSummary.topRegion?.region || 'N/A'}`,
      `Top Product: ${reportSummary.topProduct?.product || 'N/A'}`,
    ].join('\n');

    downloadTextFile('sales-report-summary.txt', lines, 'text/plain;charset=utf-8');
  };

  const exportReportJson = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      filters,
      summary: reportSummary,
      rows: rows.slice(0, 100),
      regions: regions.slice(0, 10),
      products: products.slice(0, 10),
    };

    downloadTextFile('sales-report.json', JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
    toast.success('Report exported as JSON');
  };

  return (
    <div className={`p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className={`rounded-3xl p-6 shadow-lg border ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-500">Reports Module</p>
            <h2 className="text-3xl font-black mt-1">Executive summary and export-ready reporting</h2>
            <p className={`mt-2 max-w-2xl ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Review current performance, export the source rows, and generate a concise summary for management updates.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportCsv}
              className="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 transition"
            >
              Export CSV
            </button>
            <button
              onClick={downloadSummary}
              className={`px-4 py-2 rounded-lg font-semibold border transition ${darkMode ? 'border-slate-600 bg-slate-800 hover:bg-slate-700' : 'border-slate-300 bg-white hover:bg-slate-50'}`}
            >
              Download Summary
            </button>
            <button
              onClick={exportReportJson}
              className={`px-4 py-2 rounded-lg font-semibold border transition ${darkMode ? 'border-slate-600 bg-slate-800 hover:bg-slate-700' : 'border-slate-300 bg-white hover:bg-slate-50'}`}
            >
              Export JSON
            </button>
          </div>
        </div>

        {loading ? (
          <p className={darkMode ? 'text-slate-300' : 'text-slate-600'}>Loading report data...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <MetricCard label="Report Revenue" value={formatINRCompact(reportSummary.totalRevenue)} darkMode={darkMode} />
              <MetricCard label="KPI Revenue" value={formatINRCompact(reportSummary.kpiRevenue)} darkMode={darkMode} />
              <MetricCard label="Rows in Scope" value={formatIndianCompact(rows.length)} darkMode={darkMode} />
              <MetricCard label="Regions Covered" value={formatIndianCompact(reportSummary.regionsCovered)} darkMode={darkMode} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <DetailCard
                title="Top Region"
                value={reportSummary.topRegion?.region || 'N/A'}
                note={reportSummary.topRegion ? `${formatINRCompact(reportSummary.topRegion.revenue)} revenue` : 'No region data'}
                darkMode={darkMode}
              />
              <DetailCard
                title="Top Product"
                value={reportSummary.topProduct?.product || 'N/A'}
                note={reportSummary.topProduct ? `${formatINRCompact(reportSummary.topProduct.revenue)} revenue` : 'No product data'}
                darkMode={darkMode}
              />
              <DetailCard
                title="Latest Date"
                value={reportSummary.latestDate ? reportSummary.latestDate.toLocaleDateString('en-IN') : 'N/A'}
                note="Report window is anchored to available data"
                darkMode={darkMode}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ListPanel
                title="Top Regions"
                items={regions.slice(0, 5).map((item) => ({
                  label: item.region,
                  value: formatINRCompact(item.revenue),
                  sub: `${formatIndianCompact(item.sales || 0)} sales`,
                }))}
                darkMode={darkMode}
              />
              <ListPanel
                title="Top Products"
                items={products.slice(0, 5).map((item) => ({
                  label: item.product,
                  value: formatINRCompact(item.revenue),
                  sub: `${formatIndianCompact(item.units || 0)} units`,
                }))}
                darkMode={darkMode}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-6">
              <ChartCard title="Monthly Revenue" darkMode={darkMode}>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="month" stroke={darkMode ? '#94a3b8' : '#64748b'} />
                    <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} tickFormatter={(value) => formatIndianCompact(value)} />
                    <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#ffffff', border: 'none', borderRadius: 10 }} formatter={(value) => formatINRCompact(value)} />
                    <Area type="monotone" dataKey="value" stroke="#0ea5e9" fill="#0ea5e933" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Region Revenue" darkMode={darkMode}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData.regionRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} angle={-20} textAnchor="end" height={60} interval={0} />
                    <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} tickFormatter={(value) => formatIndianCompact(value)} />
                    <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#ffffff', border: 'none', borderRadius: 10 }} formatter={(value) => formatINRCompact(value)} />
                    <Bar dataKey="value" fill="#3b82f6">
                      {chartData.regionRevenue.map((entry, index) => (
                        <Cell key={entry.name} fill={['#3b82f6', '#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'][index % 6]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Product Revenue" darkMode={darkMode}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData.productRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} angle={-20} textAnchor="end" height={60} interval={0} />
                    <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} tickFormatter={(value) => formatIndianCompact(value)} />
                    <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#ffffff', border: 'none', borderRadius: 10 }} formatter={(value) => formatINRCompact(value)} />
                    <Bar dataKey="value" fill="#14b8a6">
                      {chartData.productRevenue.map((entry, index) => (
                        <Cell key={entry.name} fill={['#14b8a6', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'][index % 6]} />
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

const ListPanel = ({ title, items, darkMode }) => (
  <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
    <h3 className="text-lg font-bold mb-4">{title}</h3>
    <div className="space-y-3">
      {items.length > 0 ? items.map((item) => (
        <div key={item.label} className={`flex items-center justify-between rounded-xl px-3 py-3 ${darkMode ? 'bg-slate-900/60' : 'bg-slate-50'}`}>
          <div>
            <p className="font-semibold">{item.label}</p>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.sub}</p>
          </div>
          <p className="font-black">{item.value}</p>
        </div>
      )) : (
        <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>No data available</p>
      )}
    </div>
  </div>
);

const ChartCard = ({ title, darkMode, children }) => (
  <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
    <h3 className="text-lg font-bold mb-4">{title}</h3>
    {children}
  </div>
);

export default ReportsModule;