const pool = require('../backend/src/config/database');

async function migrate() {
  try {
    console.log('🗄️  Starting database migration...');

    // Create tables
    const createTablesQuery = `
      -- Create uploads table
      CREATE TABLE IF NOT EXISTS uploads (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        row_count INTEGER,
        uploaded_by INTEGER,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create sales_data table
      CREATE TABLE IF NOT EXISTS sales_data (
        id SERIAL PRIMARY KEY,
        region VARCHAR(100),
        state VARCHAR(100),
        city VARCHAR(100),
        product VARCHAR(255),
        sales NUMERIC(15, 2),
        revenue NUMERIC(15, 2),
        date DATE,
        units_sold INTEGER,
        uploaded_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_uploads FOREIGN KEY(uploaded_by) REFERENCES uploads(id)
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_sales_date ON sales_data(date);
      CREATE INDEX IF NOT EXISTS idx_sales_region ON sales_data(region);
      CREATE INDEX IF NOT EXISTS idx_sales_product ON sales_data(product);
      CREATE INDEX IF NOT EXISTS idx_sales_state ON sales_data(state);
    `;

    const statements = createTablesQuery.split(';').filter(stmt => stmt.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement);
      }
    }

    console.log('✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrate();
