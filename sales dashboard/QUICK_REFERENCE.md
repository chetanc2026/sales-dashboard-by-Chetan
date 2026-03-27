# Quick Reference Guide

## Quick Start (5 minutes)

```powershell
# 1. Install dependencies
cd backend
npm install
cd ../frontend
npm install

# 2. Setup database
cd ../backend
node scripts/migrate.js
node scripts/seed.js

# 3. Start backend
npm run dev

# 4. Start frontend (new terminal)
cd ../frontend
npm start

# 5. Login
# Email: admin@dashboards.com
# Password: admin123
```

---

## File Structure Quick Reference

```
📁 backend/
  📁 src/
    ├── server.js              → Main app
    ├── config/database.js     → DB connection
    └── routes/
        ├── auth.js            → Login/auth
        ├── data.js            → Upload/schema
        └── dashboard.js       → Analytics

📁 frontend/
  📁 src/
    ├── pages/
    │   ├── LoginPage.js       → Login UI
    │   ├── DashboardPage.js   → Main dashboard
    │   └── UploadPage.js      → File upload
    ├── components/
    │   ├── charts/            → Chart components
    │   └── ...
    └── services/
        └── api.js             → API client

📁 database/                    → DB scripts
📁 scripts/                     → Setup scripts
```

---

## Common Commands

```powershell
# Backend
cd backend
npm run dev              # Start with auto-reload
npm start               # Production start
node scripts/migrate.js # Setup DB
node scripts/seed.js    # Add sample data

# Frontend
cd frontend
npm start               # Start dev server
npm build              # Build for prod

# Database
psql -U postgres       # Connect to DB
\dt                    # List tables
SELECT COUNT(*) FROM sales_data;  # Count rows

# Generate Sample Data
node scripts/generate-sample-data.js
```

---

## API Endpoints (Cheat Sheet)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/login` | Login user |
| GET | `/data/schema` | Get format |
| POST | `/data/upload` | Upload file |
| GET | `/dashboard/kpis` | Get metrics |
| GET | `/dashboard/region-sales` | Region data |
| GET | `/dashboard/product-performance` | Product data |
| GET | `/dashboard/trends` | Trend data |
| GET | `/dashboard/insights` | AI insights |

---

## Demo Credentials

```
Admin:
  Email: admin@dashboards.com
  Password: admin123

Manager:
  Email: manager@dashboards.com
  Password: manager123

User:
  Email: user@dashboards.com
  Password: user123
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 5000 in use | Kill process: `netstat -ano \| findstr :5000` |
| DB connection error | Check PostgreSQL running, verify `.env` |
| Frontend won't load | Check backend is running, REACT_APP_API_URL correct |
| Upload fails | Verify Excel has all required columns |
| Charts blank | Ensure data is uploaded and date range is correct |

---

## Feature Checklist

- ✅ Login with roles
- ✅ File upload (Excel/CSV)
- ✅ Data validation
- ✅ KPI cards
- ✅ Region chart
- ✅ Product chart
- ✅ Trend chart
- ✅ Date filters
- ✅ Dark mode
- ✅ Insights
- ✅ Responsive design

---

## Next Steps After Setup

1. ✅ Create `.env` files
2. ✅ Run migrations
3. ✅ Start backend
4. ✅ Start frontend
5. ✅ Login
6. ✅ Upload sample data
7. ✅ Explore dashboard
8. ✅ Test filters
9. ✅ Customize branding
10. ✅ Deploy to production

---

**Latest Update**: March 2024
**Version**: 1.0.0
