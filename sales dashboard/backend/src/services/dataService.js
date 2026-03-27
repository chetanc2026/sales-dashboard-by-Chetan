const pool = require('../config/database');

class DataService {
  validateData(data) {
    const requiredColumns = ['Region', 'State', 'City', 'Product', 'Sales', 'Revenue', 'Date', 'Units Sold'];
    const errors = [];

    if (!data || data.length === 0) {
      return { valid: false, errors: ['No data rows found'] };
    }

    const headers = Object.keys(data[0]);
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));

    if (missingColumns.length > 0) {
      return { valid: false, errors: [`Missing columns: ${missingColumns.join(', ')}`] };
    }

    // Validate data types
    for (let i = 0; i < Math.min(data.length, 5); i++) {
      const row = data[i];
      
      if (typeof row.Sales !== 'number' || typeof row.Revenue !== 'number' || typeof row['Units Sold'] !== 'number') {
        errors.push(`Row ${i + 1}: Sales, Revenue, and Units Sold must be numbers`);
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(row.Date) && isNaN(Date.parse(row.Date))) {
        errors.push(`Row ${i + 1}: Invalid date format`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  processData(data) {
    return data.map(row => ({
      ...row,
      Date: new Date(row.Date).toISOString().split('T')[0],
      Sales: parseFloat(row.Sales),
      Revenue: parseFloat(row.Revenue),
      'Units Sold': parseInt(row['Units Sold'])
    }));
  }

  async storeData(data, userId) {
    try {
      const values = data.map((row, idx) => [
        row.Region,
        row.State,
        row.City,
        row.Product,
        row.Sales,
        row.Revenue,
        row.Date,
        row['Units Sold'],
        userId
      ]);

      const multiInsert = values.map((val, i) => {
        const offset = i * 9 + 1;
        return `($${offset}, $${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`;
      }).join(',');

      const flatValues = values.flat();

      const query = `
        INSERT INTO sales_data (region, state, city, product, sales, revenue, date, units_sold, uploaded_by)
        VALUES ${multiInsert}
        RETURNING id
      `;

      const result = await pool.query(query, flatValues);
      return result;
    } catch (error) {
      throw new Error(`Failed to store data: ${error.message}`);
    }
  }
}

module.exports = new DataService();
