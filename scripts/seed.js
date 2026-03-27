const pool = require('../backend/src/config/database');

async function seed() {
  try {
    console.log('🌱 Seeding database with sample data...');

    const uploadResult = await pool.query(
      `INSERT INTO uploads (filename, row_count, uploaded_by)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ['seed-sample-data.xlsx', 11, 1]
    );
    const uploadId = uploadResult.rows[0].id;

    const sampleData = [
      // North Region
      { region: 'North', state: 'NY', city: 'New York', product: 'Laptop', sales: 1250, revenue: 45000, date: '2024-01-15', units_sold: 50 },
      { region: 'North', state: 'NY', city: 'New York', product: 'Mouse', sales: 450, revenue: 5400, date: '2024-01-15', units_sold: 225 },
      { region: 'North', state: 'MA', city: 'Boston', product: 'Keyboard', sales: 380, revenue: 9500, date: '2024-01-16', units_sold: 95 },
      
      // South Region
      { region: 'South', state: 'TX', city: 'Houston', product: 'Laptop', sales: 980, revenue: 35280, date: '2024-01-15', units_sold: 39 },
      { region: 'South', state: 'FL', city: 'Miami', product: 'Monitor', sales: 620, revenue: 18600, date: '2024-01-17', units_sold: 31 },
      { region: 'South', state: 'TX', city: 'Dallas', product: 'Headphones', sales: 290, revenue: 2900, date: '2024-01-18', units_sold: 145 },
      
      // East Region
      { region: 'East', state: 'PA', city: 'Philadelphia', product: 'Laptop', sales: 1100, revenue: 39600, date: '2024-01-15', units_sold: 44 },
      { region: 'East', state: 'NJ', city: 'Newark', product: 'Tablet', sales: 550, revenue: 16500, date: '2024-01-19', units_sold: 55 },
      
      // West Region
      { region: 'West', state: 'CA', city: 'Los Angeles', product: 'Laptop', sales: 1400, revenue: 50400, date: '2024-01-15', units_sold: 56 },
      { region: 'West', state: 'CA', city: 'San Francisco', product: 'Workstation', sales: 2500, revenue: 125000, date: '2024-01-20', units_sold: 25 },
      { region: 'West', state: 'WA', city: 'Seattle', product: 'Laptop', sales: 920, revenue: 33120, date: '2024-01-21', units_sold: 46 }
    ];

    for (const data of sampleData) {
      await pool.query(
        `INSERT INTO sales_data (region, state, city, product, sales, revenue, date, units_sold, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [data.region, data.state, data.city, data.product, data.sales, data.revenue, data.date, data.units_sold, uploadId]
      );
    }

    console.log('✅ Database seeded successfully with sample data!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seed();
