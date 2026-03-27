const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');
const dataService = require('../services/dataService');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'application/vnd.ms-excel'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel/CSV files are allowed'));
    }
  }
});

// Get schema format
router.get('/schema', (req, res) => {
  const schema = {
    requiredColumns: ['Region', 'State', 'City', 'Product', 'Sales', 'Revenue', 'Date', 'Units Sold'],
    dataTypes: {
      Region: 'string',
      State: 'string',
      City: 'string',
      Product: 'string',
      Sales: 'number',
      Revenue: 'number',
      Date: 'date (YYYY-MM-DD)',
      'Units Sold': 'number'
    },
    example: [
      {
        Region: 'North',
        State: 'NY',
        City: 'New York',
        Product: 'Product A',
        Sales: 1250,
        Revenue: 45000,
        Date: '2024-01-15',
        'Units Sold': 500
      }
    ]
  };
  res.json(schema);
});

// Upload and process file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    const fileBuffer = req.file.buffer;
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Validate data
    const validationResult = dataService.validateData(data);
    if (!validationResult.valid) {
      return res.status(400).json({ success: false, message: validationResult.errors });
    }

    // Process and store data
    const processedData = dataService.processData(data);
    const result = await dataService.storeData(processedData, req.user.id);

    res.json({
      success: true,
      message: 'File uploaded and processed successfully',
      rowsInserted: result.rowCount,
      dataPreview: processedData.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get upload history
router.get('/uploads', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, filename, row_count, uploaded_at, uploaded_by 
       FROM uploads 
       WHERE uploaded_by = $1 
       ORDER BY uploaded_at DESC 
       LIMIT 10`,
      [req.user.id]
    );

    res.json({ success: true, uploads: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
