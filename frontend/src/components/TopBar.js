import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { dashboardAPI } from '../services/api';
import toast from 'react-hot-toast';
import { formatINRCompact, formatIndianCompact } from '../utils/numberFormat';

const useClickOutside = (ref, onClickOutside) => {
  useEffect(() => {
    const handlePointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [onClickOutside, ref]);
};

const asArray = (value) => (Array.isArray(value) ? value : []);

const normalizeOptionList = (values) => Array.from(new Set(values.filter(Boolean))).sort((left, right) => String(left).localeCompare(String(right)));

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

const pickRows = (payload) => (Array.isArray(payload?.data)
  ? payload.data
  : Array.isArray(payload?.rows)
  ? payload.rows
  : Array.isArray(payload?.result)
  ? payload.result
  : []);

const formatFilterLabel = (label, values) => {
  if (!values || values.length === 0) {
    return `All ${label}s`;
  }

  if (values.length <= 2) {
    return values.join(', ');
  }

  return `${values.slice(0, 2).join(', ')} +${values.length - 2}`;
};

const summarizeFilters = (filters) => [
  ['Region', asArray(filters.region)],
  ['State', asArray(filters.state)],
  ['City', asArray(filters.city)],
  ['Product', asArray(filters.product)],
].filter(([, values]) => values.length > 0);

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
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef(null);

  useClickOutside(exportMenuRef, () => setExportMenuOpen(false));

  const currentSlicerCount = useMemo(() => (
    ['region', 'state', 'city', 'product'].reduce((count, key) => count + asArray(filters?.[key]).length, 0)
  ), [filters]);

  const selectedFilterSummary = useMemo(() => summarizeFilters(filters), [filters]);

  const fetchLatestReferenceDate = useCallback(async () => {
    try {
      const response = await dashboardAPI.getData({ limit: 1 });
      const rows = pickRows(response.data);
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
      const rows = pickRows(response.data);

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

    onFiltersChange((previous) => ({
      ...previous,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    }));
  }, [fetchLatestReferenceDate, onFiltersChange, referenceDate]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const response = await dashboardAPI.getData({ ...filters, limit: 1000 });
      const rows = pickRows(response.data);

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

  const handlePdfExport = useCallback(async (mode = 'detail') => {
    setPdfExporting(true);
    try {
      const [kpiRes, dataRes, regionRes, productRes] = await Promise.allSettled([
        dashboardAPI.getKPIs(filters),
        dashboardAPI.getData({ ...filters, limit: 1000 }),
        dashboardAPI.getRegionSales(filters),
        dashboardAPI.getProductPerformance(filters),
      ]);

      const kpiPayload = kpiRes.status === 'fulfilled' ? kpiRes.value?.data : null;
      const dataPayload = dataRes.status === 'fulfilled' ? dataRes.value?.data : null;
      const regionPayload = regionRes.status === 'fulfilled' ? regionRes.value?.data : null;
      const productPayload = productRes.status === 'fulfilled' ? productRes.value?.data : null;

      const rows = pickRows(dataPayload);
      const regions = pickRows(regionPayload).slice(0, 6);
      const products = pickRows(productPayload).slice(0, 6);
      const kpis = kpiPayload?.kpis || kpiPayload?.data?.kpis || kpiPayload?.data || {};

      const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });

      const addFooter = () => {
        const totalPages = doc.internal.getNumberOfPages();
        for (let page = 1; page <= totalPages; page += 1) {
          doc.setPage(page);
          doc.setFontSize(9);
          doc.setTextColor(100);
          doc.text(`Page ${page} of ${totalPages}`, 520, 810, { align: 'right' });
        }
      };

      const addTitle = (subtitle) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(15, 23, 42);
        doc.text('Sales Dashboard Export', 40, 48);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(55, 65, 81);
        doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 40, 68);
        doc.text(`Export mode: ${subtitle}`, 40, 82);
        doc.text(`Active slicers: ${currentSlicerCount}`, 40, 96);
      };

      const filterRows = selectedFilterSummary.length > 0
        ? selectedFilterSummary.map(([label, values]) => [label, values.join(', ')])
        : [['Filters', 'No slicers applied']];

      addTitle(mode === 'summary' ? 'Summary' : 'Detailed');

      autoTable(doc, {
        startY: 112,
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

      autoTable(doc, {
        startY: doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 16 : 180,
        head: [['Filter', 'Selection']],
        body: filterRows,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59] },
        styles: { fontSize: 9 },
      });

      if (regions.length > 0) {
        doc.addPage();
        addTitle('Top regions');

        autoTable(doc, {
          startY: 112,
          head: [['Top Regions', 'Revenue']],
          body: regions.map((row) => [row.region || row.name || 'N/A', formatINRCompact(row.revenue || 0)]),
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
          styles: { fontSize: 9 },
          margin: { left: 40, right: 40 },
        });
      }

      if (products.length > 0) {
        doc.addPage();
        addTitle('Top products');

        autoTable(doc, {
          startY: 112,
          head: [['Top Products', 'Revenue']],
          body: products.map((row) => [row.product || row.name || 'N/A', formatINRCompact(row.revenue || 0)]),
          theme: 'striped',
          headStyles: { fillColor: [20, 184, 166] },
          styles: { fontSize: 9 },
          margin: { left: 40, right: 40 },
        });
      }

      if (mode === 'detail' && rows.length > 0) {
        doc.addPage();
        addTitle('Detailed table');

        const tableRows = rows.slice(0, 35).map((row) => [
          row.date ? new Date(row.date).toLocaleDateString('en-IN') : '',
          row.region || '',
          row.state || '',
          row.city || '',
          row.product || '',
          formatIndianCompact(row.sales || 0),
          formatIndianCompact(row.units_sold ?? row.unitsSold ?? 0),
          formatINRCompact(row.revenue || 0),
        ]);

        autoTable(doc, {
          startY: 112,
          head: [['Date', 'Region', 'State', 'City', 'Product', 'Sales', 'Units', 'Revenue']],
          body: tableRows,
          theme: 'striped',
          styles: { fontSize: 8, cellPadding: 4 },
          headStyles: { fillColor: [30, 41, 59] },
          margin: { left: 40, right: 40 },
        });
      }

      addFooter();
      doc.save(mode === 'summary' ? 'sales-dashboard-summary.pdf' : 'sales-dashboard-report.pdf');
      toast.success(mode === 'summary' ? 'Summary PDF downloaded' : 'PDF report downloaded');
    } catch (error) {
      toast.error('Failed to export PDF');
    } finally {
      setPdfExporting(false);
    }
  }, [currentSlicerCount, filters, selectedFilterSummary]);

  const updateSlicer = useCallback((key, value) => {
    onFiltersChange((previous) => ({
      ...previous,
      [key]: value,
    }));
  }, [onFiltersChange]);

  const clearSlicers = useCallback(() => {
    onFiltersChange((previous) => ({
      ...previous,
      region: [],
      state: [],
      city: [],
      product: [],
    }));
  }, [onFiltersChange]);

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
      className={`${
        darkMode
          ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-slate-700'
          : 'bg-gradient-to-r from-white via-sky-50 to-amber-50 border-slate-200'
      } border-b shadow-sm p-4`}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between mb-4">
        <button
          onClick={onMenuClick}
          className={`p-2 rounded transition w-fit ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
          aria-label="Toggle sidebar menu"
          aria-expanded="true"
        >
          ☰
        </button>

        <div className="flex-1">
          <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Sales Analytics Dashboard
          </h1>
          <p className={`mt-1 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Multi-select filters, export options, and report-ready views.
          </p>
          {selectedFilterSummary.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedFilterSummary.map(([label, values]) => (
                <span
                  key={label}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700 border border-slate-200'}`}
                >
                  {label}: {formatFilterLabel(label, values)}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-end" role="toolbar" aria-label="Dashboard controls">
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

          <div ref={exportMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setExportMenuOpen((value) => !value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${darkMode ? 'bg-sky-600 hover:bg-sky-500 text-white' : 'bg-sky-600 hover:bg-sky-700 text-white'}`}
              aria-haspopup="menu"
              aria-expanded={exportMenuOpen}
            >
              Export ▾
            </button>
            {exportMenuOpen && (
              <div className={`absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border shadow-xl ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`} role="menu" aria-label="Export options">
                <button
                  type="button"
                  onClick={() => {
                    setExportMenuOpen(false);
                    void handleDownload();
                  }}
                  disabled={downloading}
                  className={`block w-full px-4 py-3 text-left text-sm transition ${darkMode ? 'hover:bg-slate-800 text-white' : 'hover:bg-slate-50 text-slate-900'}`}
                  role="menuitem"
                >
                  {downloading ? 'Preparing CSV…' : 'Download CSV'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExportMenuOpen(false);
                    void handlePdfExport('summary');
                  }}
                  disabled={pdfExporting}
                  className={`block w-full px-4 py-3 text-left text-sm transition ${darkMode ? 'hover:bg-slate-800 text-white' : 'hover:bg-slate-50 text-slate-900'}`}
                  role="menuitem"
                >
                  {pdfExporting ? 'Preparing PDF…' : 'Download PDF Summary'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExportMenuOpen(false);
                    void handlePdfExport('detail');
                  }}
                  disabled={pdfExporting}
                  className={`block w-full px-4 py-3 text-left text-sm transition ${darkMode ? 'hover:bg-slate-800 text-white' : 'hover:bg-slate-50 text-slate-900'}`}
                  role="menuitem"
                >
                  {pdfExporting ? 'Preparing PDF…' : 'Download PDF Detail'}
                </button>
              </div>
            )}
          </div>
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
        <MultiSelectSlicer
          label="Region"
          values={asArray(filters.region)}
          onChange={(value) => updateSlicer('region', value)}
          options={normalizeOptionList([...(filterOptions.regions || []), ...asArray(filters.region)])}
          darkMode={darkMode}
        />
        <MultiSelectSlicer
          label="State"
          values={asArray(filters.state)}
          onChange={(value) => updateSlicer('state', value)}
          options={normalizeOptionList([...(filterOptions.states || []), ...asArray(filters.state)])}
          darkMode={darkMode}
        />
        <MultiSelectSlicer
          label="City"
          values={asArray(filters.city)}
          onChange={(value) => updateSlicer('city', value)}
          options={normalizeOptionList([...(filterOptions.cities || []), ...asArray(filters.city)])}
          darkMode={darkMode}
        />
        <MultiSelectSlicer
          label="Product"
          values={asArray(filters.product)}
          onChange={(value) => updateSlicer('product', value)}
          options={normalizeOptionList([...(filterOptions.products || []), ...asArray(filters.product)])}
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

const MultiSelectSlicer = ({ label, values, onChange, options, darkMode }) => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useClickOutside(panelRef, () => setOpen(false));

  const toggleValue = (option) => {
    if (values.includes(option)) {
      onChange(values.filter((entry) => entry !== option));
      return;
    }

    onChange([...values, option]);
  };

  const selectAll = () => {
    onChange([...options]);
  };

  return (
    <div className="relative" ref={panelRef}>
      <span className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        {label}
      </span>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className={`flex w-full items-center justify-between rounded-lg border px-3 py-3 text-sm transition ${
          darkMode
            ? 'bg-slate-900 border-slate-700 text-white hover:border-sky-500'
            : 'bg-white border-slate-300 text-slate-900 hover:border-sky-500'
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate text-left">{formatFilterLabel(label, values)}</span>
        <span className="ml-3 text-xs opacity-70">{values.length}</span>
      </button>

      {open && (
        <div className={`absolute left-0 right-0 z-20 mt-2 rounded-2xl border p-3 shadow-xl ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center justify-between gap-2 pb-3">
            <button
              type="button"
              onClick={selectAll}
              className={`text-xs font-semibold ${darkMode ? 'text-sky-300' : 'text-sky-700'}`}
            >
              Select all
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}
            >
              Clear
            </button>
          </div>
          <div className="max-h-56 space-y-2 overflow-auto pr-1">
            {options.length > 0 ? options.map((option) => (
              <label
                key={option}
                className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                  darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                }`}
              >
                <span className="truncate pr-3">{option}</span>
                <input
                  type="checkbox"
                  checked={values.includes(option)}
                  onChange={() => toggleValue(option)}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
              </label>
            )) : (
              <p className={`px-3 py-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                No options available
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TopBar;
