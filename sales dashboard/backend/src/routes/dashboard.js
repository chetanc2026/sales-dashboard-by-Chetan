const express = require('express');
const pool = require('../config/database');
const dashboardService = require('../services/dashboardService');

const router = express.Router();

// Get KPIs
router.get('/kpis', async (req, res) => {
  try {
    const { startDate, endDate, region, product } = req.query;
    const kpis = await dashboardService.getKPIs({ startDate, endDate, region, product });
    res.json({ success: true, kpis });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get region-wise sales
router.get('/region-sales', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await dashboardService.getRegionSales({ startDate, endDate });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get product performance
router.get('/product-performance', async (req, res) => {
  try {
    const { startDate, endDate, region } = req.query;
    const data = await dashboardService.getProductPerformance({ startDate, endDate, region });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get monthly trends
router.get('/trends', async (req, res) => {
  try {
    const { startDate, endDate, metric } = req.query;
    const data = await dashboardService.getTrends({ startDate, endDate, metric });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get geographic heatmap data
router.get('/geo-heatmap', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await dashboardService.getGeoHeatmap({ startDate, endDate });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get insights
router.get('/insights', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const insights = await dashboardService.generateInsights({ startDate, endDate });
    res.json({ success: true, insights });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get detailed data with filters
router.get('/data', async (req, res) => {
  try {
    const { startDate, endDate, region, state, city, product, page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM sales_data WHERE 1=1';
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
    if (state) {
      query += ` AND state = $${params.length + 1}`;
      params.push(state);
    }
    if (city) {
      query += ` AND city = $${params.length + 1}`;
      params.push(city);
    }
    if (product) {
      query += ` AND product = $${params.length + 1}`;
      params.push(product);
    }

    query += ` ORDER BY date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
