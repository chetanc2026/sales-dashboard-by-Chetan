import React, { useState, useEffect, useCallback, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { dashboardAPI } from '../services/api';
import toast from 'react-hot-toast';
import { formatINRCompact, formatIndianCompact } from '../utils/numberFormat';

const TopBar = ({ onMenuClick, filters, onFiltersChange, darkMode, onDarkModeToggle }) => {
  const [dateRange, setDateRange] = useState('all');
  const [referenceDate, setReferenceDate] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    regions: [],
    states: [],
    cities: [],
    products: [],
  });

  const escapeCsvValue = (value) => {
    const text = value === undefined || value === null ? '' : String(value);
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const triggerDownload = (filename, content, mimeType = 'text/csv;charset=utf-8') => {
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

  const normalizeOptionList = (values) => Array.from(new Set(values.filter(Boolean))).sort((left, right) => String(left).localeCompare(String(right)));

  const currentSlicerCount = useMemo(() => (
    ['region', 'state', 'city', 'product'].reduce((count, key) => count + (filters?.[key] ? 1 : 0), 0)
  ), [filters]);

  const fetchLatestReferenceDate = useCallback(async () => {
    try {
      const response = await dashboardAPI.getData({ limit: 1 });
      const rows = Array.isArray(response.data?.data) ? response.data.data : [];
      const latestDate = rows[0]?.date ? new Date(rows[0].date) : new Date();
      if (!Number.isNaN(latestDate.getTime())) {
        setReferenceDate(latestDate);
        return latestDate;
      }
      const fallbackDate = new Date();
      setReferenceDate(fallbackDate);
      return fallbackDate;
    } catch (error) {
      const fallbackDate = new Date();
      setReferenceDate(fallbackDate);
      return fallbackDate;
    }
  }, []);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await dashboardAPI.getData({ limit: 1000 });
      const rows = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data?.rows)
        ? response.data.rows
        : Array.isArray(response.data?.result)
        ? response.data.result
        : [];

      setFilterOptions({
        regions: normalizeOptionList(rows.map((row) => row.region)),
        states: normalizeOptionList(rows.map((row) => row.state)),
        cities: normalizeOptionList(rows.map((row) => row.city)),
        products: normalizeOptionList(rows.map((row) => row.product)),
      });
    } catch (error) {
      setFilterOptions({ regions: [], states: [], cities: [], products: [] });
    }
  }, []);

  const handleDateRangeChange = useCallback(async (range) => {
    setDateRange(range);
    const latestReferenceDate = await fetchLatestReferenceDate();
    const endDate = latestReferenceDate || (referenceDate ? new Date(referenceDate) : new Date());
    let startDate = new Date(endDate);

    switch (range) {
      case '7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'ytd':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      case 'all':
        startDate = new Date('2020-01-01');
        break;
      default:
        return;
    }

    onFiltersChange({
      ...filters,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
  }, [fetchLatestReferenceDate, filters, onFiltersChange, referenceDate]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const response = await dashboardAPI.getData({ ...filters, limit: 1000 });
      const rows = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data?.rows)
        ? response.data.rows
        : Array.isArray(response.data?.result)
        ? response.data.result
        : [];

      if (!rows.length) {
        toast.error('No data available to download');
        return;
      }

      const headers = ['date', 'region', 'state', 'city', 'product', 'sales', 'units', 'revenue'];
      const csv = [
        headers.join(','),
        ...rows.map((row) => headers.map((header) => {
          const value = header === 'units' ? (row.units_sold ?? row.unitsSold) : row[header];
          return escapeCsvValue(value);
        }).join(',')),
      ].join('\n');

      triggerDownload('sales-dashboard-data.csv', csv);
      toast.success('CSV download started');
    } catch (error) {
      toast.error('Failed to download data');
    } finally {
      setDownloading(false);
    }
  }, [filters]);

  const handlePdfExport = useCallback(async () => {
    setPdfExporting(true);
    try {
      const [kpiRes, dataRes] = await Promise.allSettled([
        dashboardAPI.getKPIs(filters),
        dashboardAPI.getData({ ...filters, limit: 1000 }),
      ]);

      const kpiPayload = kpiRes.status === 'fulfilled' ? kpiRes.value?.data : null;
      const dataPayload = dataRes.status === 'fulfilled' ? dataRes.value?.data : null;
      const rows = Array.isArray(dataPayload?.data)
        ? dataPayload.data
        : Array.isArray(dataPayload?.rows)
        ? dataPayload.rows
        : Array.isArray(dataPayload?.result)
        ? dataPayload.result
        : [];
      const kpis = kpiPayload?.kpis || kpiPayload?.data?.kpis || kpiPayload?.data || {};

      const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('Sales Dashboard Report', 40, 48);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 40, 68);
      doc.text(`Active slicers: ${currentSlicerCount}`, 40, 84);

      autoTable(doc, {
        startY: 104,
        head: [['Metric', 'Value']],
        body: [
          ['Total Revenue', formatINRCompact(kpis.totalRevenue || kpis.revenue || 0)],
          ['Total Sales', formatIndianCompact(kpis.totalSales || 0)],
          ['Total Units', formatIndianCompact(kpis.totalUnits || 0)],
          ['Rows Exported', formatIndianCompact(rows.length)],
        ],
        theme: 'grid',
        headStyles: { fillColor: [14, 165, 233] },
        styles: { fontSize: 10 },
      });

      const tableRows = rows.slice(0, 25).map((row) => [
        row.date ? new Date(row.date).toLocaleDateString('en-IN') : '',
        row.region || '',
        row.state || '',
        row.city || '',
        row.product || '',
        formatIndianCompact(row.sales || 0),
        formatIndianCompact(row.units_sold ?? row.unitsSold ?? 0),
        formatINRCompact(row.revenue || 0),
      ]);

      if (tableRows.length > 0) {
        autoTable(doc, {
          startY: doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 18 : 220,
          head: [['Date', 'Region', 'State', 'City', 'Product', 'Sales', 'Units', 'Revenue']],
          body: tableRows,
          theme: 'striped',
          styles: { fontSize: 8, cellPadding: 4 },
          headStyles: { fillColor: [30, 41, 59] },
          margin: { left: 40, right: 40 },
        });
      }

      doc.save('sales-dashboard-report.pdf');
      toast.success('PDF report downloaded');
    } catch (error) {
      toast.error('Failed to export PDF');
    } finally {
      setPdfExporting(false);
    }
  }, [currentSlicerCount, filters]);

  const updateSlicer = useCallback((key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value || null,
    });
  }, [filters, onFiltersChange]);

  const clearSlicers = useCallback(() => {
    onFiltersChange({
      ...filters,
      region: null,
      state: null,
      city: null,
      product: null,
    });
  }, [filters, onFiltersChange]);

  useEffect(() => {
    void fetchLatestReferenceDate();
    void fetchFilterOptions();
  }, [fetchFilterOptions, fetchLatestReferenceDate]);

  useEffect(() => {
    if (!filters.startDate && !filters.endDate) {
      void handleDateRangeChange('all');
    }
  }, [filters.startDate, filters.endDate, handleDateRangeChange]);

  useEffect(() => {
    const onDashboardDataUpdated = () => {
      void handleDateRangeChange(dateRange);
    };

    window.addEventListener('dashboard-data-updated', onDashboardDataUpdated);
    return () => {
      window.removeEventListener('dashboard-data-updated', onDashboardDataUpdated);
    };
  }, [dateRange, handleDateRangeChange]);

  return (
    <div
      className={`$
        darkMode
          ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-slate-700'
          : 'bg-gradient-to-r from-white via-sky-50 to-amber-50 border-slate-200'
      } border-b shadow-sm p-4`}
    >
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onMenuClick}
          className={`p-2 rounded transition ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
          aria-label="Toggle sidebar menu"
          aria-expanded="true"
        >
          ☰
        </button>

        <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Sales Analytics Dashboard
        </h1>

        <div className="flex items-center gap-3" role="toolbar" aria-label="Dashboard controls">
          <button
            onClick={onDarkModeToggle}
            className={`p-2 rounded transition ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-white hover:bg-slate-100 border border-slate-200'}`}
            aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button
            className={`p-2 rounded transition ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-white hover:bg-slate-100 border border-slate-200'}`}
            aria-label="Notifications"
          >
            🔔
          </button>
          <button
            onClick={() => {
              void handleDownload();
            }}
            disabled={downloading}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              downloading
                ? 'opacity-70 cursor-not-allowed bg-slate-500 text-white'
                : darkMode
                ? 'bg-sky-600 hover:bg-sky-500 text-white'
                : 'bg-sky-600 hover:bg-sky-700 text-white'
            }`}
            aria-label="Download current dashboard data as CSV"
          >
            {downloading ? 'Downloading…' : 'Download CSV'}
          </button>
          <button
            onClick={() => {
              void handlePdfExport();
            }}
            disabled={pdfExporting}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              pdfExporting
                ? 'opacity-70 cursor-not-allowed bg-amber-500 text-white'
                : darkMode
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
            aria-label="Download current dashboard report as PDF"
          >
            {pdfExporting ? 'Creating PDF…' : 'Download PDF'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap" role="group" aria-label="Date range filter">
        {['7days', '30days', '90days', 'ytd', 'all'].map((range) => (
          <button
            key={range}
            onClick={() => {
              void handleDateRangeChange(range);
            }}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              dateRange === range
                ? 'bg-blue-600 text-white'
                : darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-pressed={dateRange === range}
            aria-label={`Filter by ${range === '7days' ? 'last 7 days' : range === '30days' ? 'last 30 days' : range === '90days' ? 'last 90 days' : range === 'ytd' ? 'year to date' : 'all time'}`}
          >
            {range === '7days' && 'Last 7 Days'}
            {range === '30days' && 'Last 30 Days'}
            {range === '90days' && 'Last 90 Days'}
            {range === 'ytd' && 'Year to Date'}
            {range === 'all' && 'All Time'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mt-4" role="group" aria-label="Dashboard slicers">
        <SlicerSelect
          label="Region"
          value={filters.region || ''}
          onChange={(value) => updateSlicer('region', value)}
          options={filterOptions.regions}
          darkMode={darkMode}
        />
        <SlicerSelect
          label="State"
          value={filters.state || ''}
          onChange={(value) => updateSlicer('state', value)}
          options={filterOptions.states}
          darkMode={darkMode}
        />
        <SlicerSelect
          label="City"
          value={filters.city || ''}
          onChange={(value) => updateSlicer('city', value)}
          options={filterOptions.cities}
          darkMode={darkMode}
        />
        <SlicerSelect
          label="Product"
          value={filters.product || ''}
          onChange={(value) => updateSlicer('product', value)}
          options={filterOptions.products}
          darkMode={darkMode}
        />
        <div className="flex items-end gap-2">
          <button
            onClick={clearSlicers}
            disabled={!currentSlicerCount}
            className={`w-full px-4 py-3 rounded-lg text-sm font-semibold border transition ${
              !currentSlicerCount
                ? 'opacity-60 cursor-not-allowed border-slate-300 text-slate-400'
                : darkMode
                ? 'border-slate-600 bg-slate-800 hover:bg-slate-700 text-white'
                : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-900'
            }`}
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

const SlicerSelect = ({ label, value, onChange, options, darkMode }) => (
  <label className="block">
    <span className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${
        darkMode
          ? 'bg-slate-900 border-slate-700 text-white focus:border-sky-500'
          : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500'
      }`}
    >
      <option value="">All {label}s</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </label>
);

export default TopBar;
