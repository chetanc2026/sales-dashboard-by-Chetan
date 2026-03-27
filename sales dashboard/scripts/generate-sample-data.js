const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Generate sample sales data
function generateSampleData(rows = 150) {
  const regions = ['North', 'South', 'East', 'West', 'Central'];
  const stateMap = {
    North: ['NY', 'MA', 'PA', 'CT', 'VT'],
    South: ['TX', 'FL', 'GA', 'NC', 'SC'],
    East: ['PA', 'NJ', 'NY', 'DE', 'MD'],
    West: ['CA', 'WA', 'OR', 'AZ', 'CO'],
    Central: ['IL', 'MI', 'OH', 'IN', 'WI']
  };
  const cityMap = {
    NY: ['New York', 'Buffalo', 'Rochester'],
    TX: ['Houston', 'Dallas', 'Austin'],
    CA: ['Los Angeles', 'San Francisco', 'San Diego'],
    FL: ['Miami', 'Orlando', 'Tampa'],
    IL: ['Chicago', 'Springfield'],
  };
  const products = ['Laptop', 'Monitor', 'Keyboard', 'Mouse', 'Headphones', 'Tablet', 'Workstation', 'Printer'];

  const data = [];

  for (let i = 0; i < rows; i++) {
    const region = regions[Math.floor(Math.random() * regions.length)];
    const states = stateMap[region];
    const state = states[Math.floor(Math.random() * states.length)];
    const cities = cityMap[state] || [state + ' City'];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    
    // Random date in last 90 days
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const dateStr = date.toISOString().split('T')[0];

    const units = Math.floor(Math.random() * 500) + 10;
    const pricePerUnit = Math.floor(Math.random() * 2000) + 500;
    const revenue = units * pricePerUnit;
    const sales = units;

    data.push({
      Region: region,
      State: state,
      City: city,
      Product: product,
      Sales: sales,
      Revenue: revenue,
      Date: dateStr,
      'Units Sold': units
    });
  }

  return data;
}

// Create and save Excel file
function createSampleExcel() {
  console.log('📊 Generating sample sales data...');
  const data = generateSampleData(150);

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sales Data');

  const filePath = path.join(__dirname, '..', 'sample_sales_data.xlsx');
  XLSX.writeFile(wb, filePath);

  console.log('✅ Sample Excel file created at:', filePath);
  console.log(`   📈 Generated ${data.length} rows of sample data`);
  console.log('   💡 Use this file to test the upload functionality');
}

// Create CSV version too
function createSampleCSV() {
  console.log('📊 Generating sample CSV data...');
  const data = generateSampleData(100);

  const csv = [
    Object.keys(data[0]).join(','),
    ...data.map(row => Object.values(row).join(','))
  ].join('\n');

  const filePath = path.join(__dirname, '..', 'sample_sales_data.csv');
  fs.writeFileSync(filePath, csv);

  console.log('✅ Sample CSV file created at:', filePath);
}

// Run
createSampleExcel();
createSampleCSV();

console.log('\n🎉 Sample data files ready!');
console.log('   Upload these files in the dashboard to populate the database');
