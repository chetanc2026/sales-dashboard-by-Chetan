# 📊 Sales Dashboard - Enterprise Analytics Platform

A production-ready, modern sales analytics dashboard application built with React, Node.js, and PostgreSQL. Mimics Power BI/Tableau functionality with executive-level visualizations and insights.

## ✨ Features

### Authentication & Security
- Role-based access control (Admin, Manager, User)
- JWT-based authentication
- Secure session management

### Data Management
- Drag & drop file upload (Excel/CSV)
- Automatic data validation
- Schema format preview and guidance
- Batch data processing

### Dashboard Visualizations
- 📊 Region-wise sales comparison (Bar Charts)
- 🎯 Product revenue distribution (Pie Charts)
- 📈 Monthly revenue trends (Line Charts)
- 🔥 Regional performance heatmap
- 🏆 Top products and regions
- 💡 Smart insights generation

### Advanced Features
- Date range filtering (7 days, 30 days, 90 days, YTD)
- Multi-level drill-down (Region → State → City)
- Dark/Light mode toggle
- Real-time KPI metrics
- Responsive design
- Export-ready data structure

### KPI Metrics
- Total Revenue
- Total Sales Volume
- Units Sold
- Region Performance
- Product Performance
- Average metrics

## 🛠️ Tech Stack

**Frontend:**
- React.js 18+
- Tailwind CSS
- Recharts (interactive charts)
- Axios (API client)
- React Hot Toast (notifications)

**Backend:**
- Node.js + Express.js
- PostgreSQL database
- JWT authentication
- Multer (file uploads)
- XLSX/CSV parsing

**Deployment:**
- Frontend: Vercel, Netlify, or AWS S3 + CloudFront
- Backend: Render, Railway, or AWS EC2
- Database: PostgreSQL (RDS, Railway, or local)

## 📁 Project Structure

```
sales-dashboard/
├── backend/                      # Express.js server
│   ├── src/
│   │   ├── server.js            # Main server file
│   │   ├── config/
│   │   │   └── database.js      # PostgreSQL connection
│   │   ├── routes/
│   │   │   ├── auth.js          # Authentication endpoints
│   │   │   ├── data.js          # Data upload/schema endpoints
│   │   │   └── dashboard.js     # Analytics endpoints
│   │   ├── services/
│   │   │   ├── dataService.js   # Data validation & processing
│   │   │   └── dashboardService.js  # Analytics queries
│   │   ├── middleware/
│   │   │   └── auth.js          # JWT verification
│   │   └── utils/
│   ├── package.json
│   └── .env.example

├── frontend/                     # React application
│   ├── src/
│   │   ├── App.js               # Main app component
│   │   ├── pages/
│   │   │   ├── LoginPage.js     # Authentication UI
│   │   │   ├── DashboardPage.js # Main dashboard
│   │   │   └── UploadPage.js    # File upload interface
│   │   ├── components/
│   │   │   ├── Sidebar.js       # Navigation
│   │   │   ├── TopBar.js        # Filters & controls
│   │   │   ├── DashboardGrid.js # Layout Grid
│   │   │   ├── KPICard.js       # KPI display
│   │   │   ├── InsightsPanel.js # Smart insights
│   │   │   └── charts/
│   │   │       ├── RegionChart.js
│   │   │       ├── ProductChart.js
│   │   │       ├── TrendChart.js
│   │   │       └── HeatmapChart.js
│   │   ├── context/
│   │   │   └── AuthContext.js   # Auth state management
│   │   ├── services/
│   │   │   └── api.js           # API client
│   │   ├── index.js
│   │   └── index.css
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env.example

├── database/                     # DB scripts
│   └── schema.sql

├── scripts/
│   ├── migrate.js               # Database migration
│   └── seed.js                  # Sample data

├── README.md
└── .gitignore
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL 12+
- Git

### Step 1: Clone & Setup

```bash
cd sales-dashboard
```

### Step 2: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL=postgresql://user:password@localhost:5432/sales_dashboard
```

### Step 3: Database Setup

```bash
# Make sure PostgreSQL is running
# Then run migrations
node scripts/migrate.js

# Optional: Seed with sample data
node scripts/seed.js
```

### Step 4: Start Backend

```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

Backend will run on `http://localhost:5000`

### Step 5: Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# REACT_APP_API_URL=http://localhost:5000/api
```

### Step 6: Start Frontend

```bash
npm start
```

Frontend will open on `http://localhost:3000`

## 🔐 Demo Credentials

Use these credentials to login:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@dashboards.com` | `admin123` |
| Manager | `manager@dashboards.com` | `manager123` |
| User | `user@dashboards.com` | `user123` |

## 📤 Data Upload Guide

### Required Format

Your Excel/CSV must have these columns:
- **Region** (text): Geographic region
- **State** (text): State code
- **City** (text): City name
- **Product** (text): Product name
- **Sales** (number): Sales amount
- **Revenue** (number): Revenue amount
- **Date** (date): YYYY-MM-DD format
- **Units Sold** (number): Quantity sold

### Example Data

```
Region,State,City,Product,Sales,Revenue,Date,Units Sold
North,NY,New York,Laptop,1250,45000,2024-01-15,50
South,TX,Houston,Monitor,620,18600,2024-01-17,31
East,PA,Philadelphia,Laptop,1100,39600,2024-01-15,44
West,CA,Los Angeles,Workstation,2500,125000,2024-01-20,25
```

## 📊 Dashboard Components

### KPI Cards
Display key metrics with trend indicators:
- Total Revenue
- Total Sales
- Units Sold

### Region Chart
Bar chart comparing sales performance across regions

### Product Chart
Pie chart showing product revenue distribution

### Trend Chart
Line chart showing revenue trends over time

### Heatmap
Regional performance heat grid for quick insights

## 🎯 Filter Options

- **Date Range**: 7 days, 30 days, 90 days, Year-to-Date
- **Region**: Filter by sales region
- **State**: Filter by state
- **City**: Filter by city
- **Product**: Filter by product category

## 💾 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Data Management
- `GET /api/data/schema` - Get required data schema
- `POST /api/data/upload` - Upload Excel/CSV file
- `GET /api/data/uploads` - Get upload history

### Dashboard Analytics
- `GET /api/dashboard/kpis` - Get KPI metrics
- `GET /api/dashboard/region-sales` - Region-wise sales
- `GET /api/dashboard/product-performance` - Product metrics
- `GET /api/dashboard/trends` - Revenue trends
- `GET /api/dashboard/geo-heatmap` - Geographic data
- `GET /api/dashboard/insights` - Generated insights
- `GET /api/dashboard/data` - Detailed data with filters

## 🌐 Deployment Guide

### Deploy Backend (Render)

1. Push code to GitHub
2. Create account on [Render.com](https://render.com)
3. Create new Web Service
4. Connect GitHub repository
5. Set environment variables (DATABASE_URL, JWT_SECRET, etc.)
6. Deploy

### Deploy Frontend (Vercel)

1. Push code to GitHub
2. Create account on [Vercel.com](https://vercel.com)
3. Import project
4. Set REACT_APP_API_URL environment variable
5. Deploy

### Database (PostgreSQL)

Option 1: Railway
- Create account on [Railway.app](https://railway.app)
- Add PostgreSQL plugin
- Get connection string

Option 2: AWS RDS
- Create PostgreSQL instance
- Configure security groups
- Update DATABASE_URL

Option 3: Supabase
- Create account on [Supabase.com](https://supabase.com)
- Create new project
- Get PostgreSQL connection string

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit .env files
2. **JWT Secret**: Change in production environment
3. **CORS**: Update CORS_ORIGIN for production domain
4. **Database**: Use strong passwords, restrict IP access
5. **SSL**: Enable SSL in production
6. **Rate Limiting**: Implement rate limiting on API
7. **Input Validation**: All data is validated server-side

## 🐛 Troubleshooting

### Connection Refused on Backend

```bash
# Check if PostgreSQL is running
# Windows: Services > PostgreSQL
# Mac: brew services list
# Linux: systemctl status postgresql

# Verify DATABASE_URL in .env
```

### CORS Errors

```bash
# Frontend and Backend must use same origin
# Update CORS_ORIGIN in backend .env
# Update REACT_APP_API_URL in frontend .env
```

### Port Already in Use

```bash
# Change PORT in .env or use different port
# Windows: netstat -ano | findstr :5000
```

### Database Migrations Fail

```bash
# Drop and recreate database
# psql -U postgres
# DROP DATABASE sales_dashboard;
# CREATE DATABASE sales_dashboard;
# Exit psql and run migrate again
```

## 📈 Performance Tips

1. **Database Indexes**: Already configured on date, region, product, state
2. **Query Optimization**: Caching layer can be added with Redis
3. **Frontend**: Code splitting with React.lazy()
4. **Images**: Optimize images and use CDN for assets
5. **API**: Implement pagination for large datasets

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For issues, questions, or feedback:
- Create an issue on GitHub
- Check existing documentation
- Review API endpoint logs

## 🎉 Next Steps

1. ✅ Complete basic setup
2. 📊 Upload sample data
3. 🔍 Explore dashboard
4. 🎨 Customize branding
5. 🚀 Deploy to production
6. 📈 Monitor analytics
7. 🔄 Add more features

---

**Last Updated**: March 2024
**Version**: 1.0.0
**Maintained by**: Your Team
