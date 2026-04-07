const express = require('express');
const pool = require('../config/database');

const router = express.Router();

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
}

function normalizeFilterValues(value) {
  if (value === undefined || value === null) {
    return [];
  }

  const rawValues = Array.isArray(value) ? value : [value];
  return rawValues
    .flatMap((entry) => String(entry).split(','))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function applyDimensionFilter(fieldName, rawValue, conditions, params) {
  const values = normalizeFilterValues(rawValue);
  if (!values.length) {
    return;
  }

  if (values.length === 1) {
    params.push(values[0]);
    conditions.push(`${fieldName} = $${params.length}`);
    return;
  }

  params.push(values);
  conditions.push(`${fieldName} = ANY($${params.length})`);
}

function buildFilter({ startDate, endDate, region, state, city, product }, userId) {
  const conditions = ['uploaded_by = $1'];
  const params = [userId];

  if (startDate) {
    params.push(startDate);
    conditions.push(`date >= $${params.length}`);
  }
  if (endDate) {
    params.push(endDate);
    conditions.push(`date <= $${params.length}`);
  }
  applyDimensionFilter('region', region, conditions, params);
  applyDimensionFilter('state', state, conditions, params);
  applyDimensionFilter('city', city, conditions, params);
  applyDimensionFilter('product', product, conditions, params);

  return { whereSql: `WHERE ${conditions.join(' AND ')}`, params };
}

router.get('/kpis', async (req, res) => {
  try {
    await ensureTables();
    const userId = req.user?.id || 1;
    const { whereSql, params } = buildFilter(req.query, userId);

    const result = await pool.query(
      `SELECT
          COALESCE(SUM(revenue), 0) AS total_revenue,
          COALESCE(SUM(sales), 0) AS total_sales,
          COALESCE(SUM(units_sold), 0) AS total_units,
          COUNT(DISTINCT region) AS region_count,
          COUNT(DISTINCT product) AS product_count,
          COALESCE(AVG(revenue), 0) AS avg_revenue
       FROM sales_data
       ${whereSql}`,
      params
    );

    const row = result.rows[0] || {};
    return res.json({
      success: true,
      kpis: {
        totalRevenue: Number(row.total_revenue || 0),
        totalSales: Number(row.total_sales || 0),
        totalUnits: Number(row.total_units || 0),
        regionCount: Number(row.region_count || 0),
        productCount: Number(row.product_count || 0),
        avgRevenue: Number(row.avg_revenue || 0),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/region-sales', async (req, res) => {
  try {
    await ensureTables();
    const userId = req.user?.id || 1;
    const { whereSql, params } = buildFilter(req.query, userId);

    const result = await pool.query(
      `SELECT
         region,
         COALESCE(SUM(revenue), 0) AS revenue,
         COALESCE(SUM(sales), 0) AS sales,
         COALESCE(SUM(units_sold), 0) AS units,
         COUNT(*) AS transaction_count
       FROM sales_data
       ${whereSql}
       GROUP BY region
       ORDER BY revenue DESC`,
      params
    );

    return res.json({
      success: true,
      data: result.rows.map((r) => ({
        region: r.region,
        revenue: Number(r.revenue || 0),
        sales: Number(r.sales || 0),
        units: Number(r.units || 0),
        transactions: Number(r.transaction_count || 0),
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/product-performance', async (req, res) => {
  try {
    await ensureTables();
    const userId = req.user?.id || 1;
    const { whereSql, params } = buildFilter(req.query, userId);

    const result = await pool.query(
      `SELECT
         product,
         COALESCE(SUM(revenue), 0) AS revenue,
         COALESCE(SUM(units_sold), 0) AS units,
         COUNT(*) AS transactions,
         COALESCE(AVG(revenue), 0) AS avg_revenue
       FROM sales_data
       ${whereSql}
       GROUP BY product
       ORDER BY revenue DESC
       LIMIT 12`,
      params
    );

    return res.json({
      success: true,
      data: result.rows.map((r) => ({
        product: r.product,
        revenue: Number(r.revenue || 0),
        units: Number(r.units || 0),
        transactions: Number(r.transactions || 0),
        avgRevenue: Number(r.avg_revenue || 0),
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/trends', async (req, res) => {
  try {
    await ensureTables();
    const userId = req.user?.id || 1;
    const metric = req.query.metric === 'sales' ? 'sales' : 'revenue';
    const { whereSql, params } = buildFilter(req.query, userId);

    const result = await pool.query(
      `SELECT
         DATE_TRUNC('month', date)::date AS month,
         COALESCE(SUM(${metric}), 0) AS value
       FROM sales_data
       ${whereSql}
       GROUP BY month
       ORDER BY month ASC`,
      params
    );

    return res.json({
      success: true,
      data: result.rows.map((r) => ({
        month: r.month,
        value: Number(r.value || 0),
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/geo-heatmap', async (req, res) => {
  try {
    await ensureTables();
    const userId = req.user?.id || 1;
    const { whereSql, params } = buildFilter(req.query, userId);

    const result = await pool.query(
      `SELECT
         region,
         state,
         COALESCE(SUM(revenue), 0) AS revenue,
         COALESCE(SUM(units_sold), 0) AS units
       FROM sales_data
       ${whereSql}
       GROUP BY region, state
       ORDER BY revenue DESC`,
      params
    );

    return res.json({
      success: true,
      data: result.rows.map((r) => ({
        region: r.region,
        state: r.state,
        revenue: Number(r.revenue || 0),
        units: Number(r.units || 0),
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/insights', async (req, res) => {
  try {
    await ensureTables();
    const userId = req.user?.id || 1;
    const { whereSql, params } = buildFilter(req.query, userId);

    const [topRegion, totalRevenue, products] = await Promise.all([
      pool.query(
        `SELECT region, COALESCE(SUM(revenue), 0) AS revenue
         FROM sales_data
         ${whereSql}
         GROUP BY region
         ORDER BY revenue DESC
         LIMIT 1`,
        params
      ),
      pool.query(`SELECT COALESCE(SUM(revenue), 0) AS total FROM sales_data ${whereSql}`, params),
      pool.query(`SELECT COUNT(DISTINCT product) AS count FROM sales_data ${whereSql}`, params),
    ]);

    const insights = [];

    if (topRegion.rows.length > 0) {
      insights.push({
        type: 'positive',
        title: 'Top Performing Region',
        message: `${topRegion.rows[0].region} leads with $${Number(topRegion.rows[0].revenue).toFixed(0)} in revenue`,
        icon: '🏆',
      });
    }

    if (Number(totalRevenue.rows[0]?.total || 0) > 500000) {
      insights.push({
        type: 'success',
        title: 'Strong Revenue Performance',
        message: 'Total revenue exceeds $500,000 threshold',
        icon: '📈',
      });
    }

    insights.push({
      type: 'info',
      title: 'Product Portfolio',
      message: `${Number(products.rows[0]?.count || 0)} unique products in portfolio`,
      icon: '📦',
    });

    return res.json({ success: true, insights });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/data', async (req, res) => {
  try {
    await ensureTables();
    const userId = req.user?.id || 1;
    const { whereSql, params } = buildFilter(req.query, userId);
    const requestedLimit = Number.parseInt(req.query.limit || '1000', 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 5000)
      : 1000;

    const result = await pool.query(
      `SELECT region, state, city, product, sales, revenue, date, units_sold
       FROM sales_data
       ${whereSql}
       ORDER BY date DESC
       LIMIT $${params.length + 1}`,
      [...params, limit]
    );

    return res.json({ success: true, data: result.rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
