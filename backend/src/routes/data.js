const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const pool = require('../config/database');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const valid = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv',
      'text/plain',
    ];
    if (valid.includes(file.mimetype) || /\.(xlsx|xls|csv)$/i.test(file.originalname || '')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only Excel or CSV files are allowed'));
  },
});

const requiredColumns = ['Region', 'State', 'City', 'Product', 'Sales', 'Revenue', 'Date', 'Units Sold'];

const normalizeKey = (key) => String(key || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const parseNumber = (value) => {
  if (value == null || value === '') return NaN;
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/,/g, '').trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
};

const parseDate = (value) => {
  if (value == null || value === '') return null;
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    const dt = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
    return dt.toISOString().slice(0, 10);
  }
  const dt = new Date(String(value));
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString().slice(0, 10);
};

const INSERT_BATCH_SIZE = 500;

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sales_data (
      id SERIAL PRIMARY KEY,
      region VARCHAR(100) NOT NULL,
      state VARCHAR(100) NOT NULL,
      city VARCHAR(100) NOT NULL,
      product VARCHAR(255) NOT NULL,
      sales NUMERIC NOT NULL,
      revenue NUMERIC NOT NULL,
      date DATE NOT NULL,
      units_sold INTEGER NOT NULL,
      uploaded_by INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS uploads (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      row_count INTEGER NOT NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      uploaded_by INTEGER NOT NULL
    );
  `);
}

router.get('/schema', (req, res) => {
  res.json({
    requiredColumns,
    dataTypes: {
      Region: 'string',
      State: 'string',
      City: 'string',
      Product: 'string',
      Sales: 'number',
      Revenue: 'number',
      Date: 'date (YYYY-MM-DD)',
      'Units Sold': 'number',
    },
    example: [
      {
        Region: 'North',
        State: 'Delhi',
        City: 'New Delhi',
        Product: 'Product A',
        Sales: 1200,
        Revenue: 45000,
        Date: '2025-01-15',
        'Units Sold': 320,
      },
    ],
  });
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    await ensureTables();

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (!rows.length) {
      return res.status(400).json({ success: false, message: 'No data rows found in file' });
    }

    const headers = Object.keys(rows[0]);
    const normalizedHeaderMap = new Map(headers.map((h) => [normalizeKey(h), h]));

    const requiredHeaderMap = {
      region: 'Region',
      state: 'State',
      city: 'City',
      product: 'Product',
      sales: 'Sales',
      revenue: 'Revenue',
      date: 'Date',
      unitssold: 'Units Sold',
    };

    const missing = Object.keys(requiredHeaderMap)
      .filter((k) => !normalizedHeaderMap.has(k))
      .map((k) => requiredHeaderMap[k]);

    if (missing.length) {
      return res.status(400).json({ success: false, message: `Missing columns: ${missing.join(', ')}` });
    }

    const col = {
      region: normalizedHeaderMap.get('region'),
      state: normalizedHeaderMap.get('state'),
      city: normalizedHeaderMap.get('city'),
      product: normalizedHeaderMap.get('product'),
      sales: normalizedHeaderMap.get('sales'),
      revenue: normalizedHeaderMap.get('revenue'),
      date: normalizedHeaderMap.get('date'),
      unitsSold: normalizedHeaderMap.get('unitssold'),
    };

    const cleaned = [];
    const validationErrors = [];

    rows.forEach((r, index) => {
      const record = {
        region: String(r[col.region] || '').trim(),
        state: String(r[col.state] || '').trim(),
        city: String(r[col.city] || '').trim(),
        product: String(r[col.product] || '').trim(),
        sales: parseNumber(r[col.sales]),
        revenue: parseNumber(r[col.revenue]),
        date: parseDate(r[col.date]),
        unitsSold: Math.round(parseNumber(r[col.unitsSold])),
      };

      if (!record.region || !record.state || !record.city || !record.product) {
        validationErrors.push(`Row ${index + 2}: text fields cannot be empty`);
        return;
      }
      if (!Number.isFinite(record.sales) || !Number.isFinite(record.revenue) || !Number.isFinite(record.unitsSold)) {
        validationErrors.push(`Row ${index + 2}: Sales, Revenue, Units Sold must be numbers`);
        return;
      }
      if (!record.date) {
        validationErrors.push(`Row ${index + 2}: invalid date`);
        return;
      }
      cleaned.push(record);
    });

    if (!cleaned.length) {
      return res.status(400).json({ success: false, message: validationErrors.slice(0, 5).join('; ') || 'No valid rows after validation' });
    }

    if (validationErrors.length) {
      return res.status(400).json({
        success: false,
        message: `Validation failed for ${validationErrors.length} rows. ${validationErrors.slice(0, 5).join('; ')}`,
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userId = req.user?.id || 1;
      for (let start = 0; start < cleaned.length; start += INSERT_BATCH_SIZE) {
        const batch = cleaned.slice(start, start + INSERT_BATCH_SIZE);
        const values = [];
        const placeholders = batch.map((row, index) => {
          const base = index * 9;
          values.push(
            row.region,
            row.state,
            row.city,
            row.product,
            row.sales,
            row.revenue,
            row.date,
            row.unitsSold,
            userId
          );
          return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9})`;
        });

        await client.query(
          `INSERT INTO sales_data (region, state, city, product, sales, revenue, date, units_sold, uploaded_by)
           VALUES ${placeholders.join(', ')}`,
          values
        );
      }

      await client.query(
        `INSERT INTO uploads (filename, row_count, uploaded_by) VALUES ($1, $2, $3)`,
        [req.file.originalname || 'upload.xlsx', cleaned.length, userId]
      );

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    return res.json({
      success: true,
      message: 'File uploaded and processed successfully',
      rowsInserted: cleaned.length,
      dataPreview: cleaned.slice(0, 5),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Upload failed' });
  }
});

router.get('/uploads', async (req, res) => {
  try {
    await ensureTables();
    const userId = req.user?.id || 1;
    const result = await pool.query(
      `SELECT id, filename, row_count, uploaded_at, uploaded_by
       FROM uploads
       WHERE uploaded_by = $1
       ORDER BY uploaded_at DESC
       LIMIT 20`,
      [userId]
    );

    return res.json({ success: true, uploads: result.rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch uploads' });
  }
});

module.exports = router;
