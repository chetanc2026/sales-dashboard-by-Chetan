const pool = require('../config/database');

class DashboardService {
  async getKPIs(filters) {
    const { startDate, endDate, region, product } = filters;
    let query = `
      SELECT 
        SUM(revenue) as total_revenue,
        SUM(sales) as total_sales,
        SUM(units_sold) as total_units,
        COUNT(DISTINCT region) as region_count,
        COUNT(DISTINCT product) as product_count,
        AVG(revenue) as avg_revenue
      FROM sales_data
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ` AND date >= $${params.length + 1}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND date <= $${params.length + 1}`;
      params.push(endDate);
    }
    if (region) {
      query += ` AND region = $${params.length + 1}`;
      params.push(region);
    }
    if (product) {
      query += ` AND product = $${params.length + 1}`;
      params.push(product);
    }

    const result = await pool.query(query, params);
    const row = result.rows[0] || {};

    return {
      totalRevenue: parseFloat(row.total_revenue) || 0,
      totalSales: parseFloat(row.total_sales) || 0,
      totalUnits: parseInt(row.total_units) || 0,
      regionCount: parseInt(row.region_count) || 0,
      productCount: parseInt(row.product_count) || 0,
      avgRevenue: parseFloat(row.avg_revenue) || 0
    };
  }

  async getRegionSales(filters) {
    const { startDate, endDate } = filters;
    let query = `
      SELECT 
        region,
        SUM(revenue) as revenue,
        SUM(sales) as sales,
        SUM(units_sold) as units,
        COUNT(*) as transaction_count
      FROM sales_data
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ` AND date >= $${params.length + 1}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND date <= $${params.length + 1}`;
      params.push(endDate);
    }

    query += ' GROUP BY region ORDER BY revenue DESC';

    const result = await pool.query(query, params);
    return result.rows.map(row => ({
      region: row.region,
      revenue: parseFloat(row.revenue),
      sales: parseFloat(row.sales),
      units: parseInt(row.units),
      transactions: parseInt(row.transaction_count)
    }));
  }

  async getProductPerformance(filters) {
    const { startDate, endDate, region } = filters;
    let query = `
      SELECT 
        product,
        SUM(revenue) as revenue,
        SUM(units_sold) as units,
        COUNT(*) as transactions,
        AVG(revenue) as avg_revenue
      FROM sales_data
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ` AND date >= $${params.length + 1}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND date <= $${params.length + 1}`;
      params.push(endDate);
    }
    if (region) {
      query += ` AND region = $${params.length + 1}`;
      params.push(region);
    }

    query += ' GROUP BY product ORDER BY revenue DESC';

    const result = await pool.query(query, params);
    return result.rows.map(row => ({
      product: row.product,
      revenue: parseFloat(row.revenue),
      units: parseInt(row.units),
      transactions: parseInt(row.transactions),
      avgRevenue: parseFloat(row.avg_revenue)
    }));
  }

  async getTrends(filters) {
    const { startDate, endDate, metric = 'revenue' } = filters;
    let query = `
      SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(${metric === 'revenue' ? 'revenue' : 'sales'}) as value
      FROM sales_data
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ` AND date >= $${params.length + 1}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND date <= $${params.length + 1}`;
      params.push(endDate);
    }

    query += ' GROUP BY month ORDER BY month ASC';

    const result = await pool.query(query, params);
    return result.rows.map(row => ({
      month: row.month,
      value: parseFloat(row.value)
    }));
  }

  async getGeoHeatmap(filters) {
    const { startDate, endDate } = filters;
    let query = `
      SELECT 
        region,
        state,
        SUM(revenue) as revenue,
        AVG(revenue) as avg_revenue
      FROM sales_data
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ` AND date >= $${params.length + 1}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND date <= $${params.length + 1}`;
      params.push(endDate);
    }

    query += ' GROUP BY region, state ORDER BY revenue DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  async generateInsights(filters) {
    const { startDate, endDate } = filters;
    const insights = [];

    try {
      // Top region insight
      const topRegion = await pool.query(`
        SELECT region, SUM(revenue) as revenue 
        FROM sales_data 
        WHERE 1=1 ${startDate ? 'AND date >= $1' : ''}
        GROUP BY region ORDER BY revenue DESC LIMIT 1
      `, startDate ? [startDate] : []);

      if (topRegion.rows.length > 0) {
        insights.push({
          type: 'positive',
          title: 'Top Performing Region',
          message: `${topRegion.rows[0].region} region leads with $${parseFloat(topRegion.rows[0].revenue).toFixed(0)} in revenue`,
          icon: '🏆'
        });
      }

      // Total revenue insight
      const revenue = await pool.query(`
        SELECT SUM(revenue) as total FROM sales_data
        WHERE 1=1 ${startDate ? 'AND date >= $1' : ''}
      `, startDate ? [startDate] : []);

      if (revenue.rows[0].total > 500000) {
        insights.push({
          type: 'success',
          title: 'Strong Revenue Performance',
          message: `Total revenue exceeds $500,000 threshold`,
          icon: '📈'
        });
      }

      // Product diversity
      const products = await pool.query(`
        SELECT COUNT(DISTINCT product) as count FROM sales_data
        WHERE 1=1 ${startDate ? 'AND date >= $1' : ''}
      `, startDate ? [startDate] : []);

      insights.push({
        type: 'info',
        title: 'Product Portfolio',
        message: `${products.rows[0].count} unique products in portfolio`,
        icon: '📦'
      });

    } catch (error) {
      console.error('Insight generation error:', error);
    }

    return insights;
  }
}

module.exports = new DashboardService();
