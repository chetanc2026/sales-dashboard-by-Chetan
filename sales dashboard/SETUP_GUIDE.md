# Sales Dashboard - Step-by-Step Setup Guide

## Windows Setup Instructions

### Prerequisites Installation

#### 1. Install Node.js
- Download from https://nodejs.org/ (LTS version)
- Run installer and complete installation
- Verify: Open PowerShell and run
  ```powershell
  node --version
  npm --version
  ```

#### 2. Install PostgreSQL
- Download from https://www.postgresql.org/download/windows/
- Run installer (default port: 5432)
- Remember your password for postgres user
- Verify: Open PowerShell
  ```powershell
  psql --version
  ```

### Project Setup

#### Step 1: Open Project in VS Code
```powershell
cd "c:\Users\LENOVO\Desktop\sales dashboard"
code .
```

#### Step 2: Backend Configuration

Open integrated terminal and run:

```powershell
cd backend
```

Create .env file:
```powershell
Copy-Item .env.example .env
```

Edit the `.env` file with your database credentials:
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/sales_dashboard
JWT_SECRET=your_super_secret_jwt_key_here_change_in_prod
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

Install dependencies:
```powershell
npm install
```

Create the database:
```powershell
# Open new PowerShell terminal
psql -U postgres

# In psql prompt, run:
CREATE DATABASE sales_dashboard;
\q
```

Run database migrations:
```powershell
node scripts/migrate.js
```

(Optional) Seed sample data:
```powershell
node scripts/seed.js
```

Start backend server:
```powershell
npm run dev
```

You should see: `🚀 Server running on port 5000`

#### Step 3: Frontend Configuration

Open new terminal in VS Code:

```powershell
cd frontend
```

Create .env file:
```powershell
Copy-Item .env.example .env
```

Install dependencies:
```powershell
npm install
```

Start frontend development server:
```powershell
npm start
```

The application will automatically open at `http://localhost:3000`

#### Step 4: Login

Use these credentials:
- **Email**: admin@dashboards.com
- **Password**: admin123

## Testing the Application

### 1. Login Test
- ✅ Navigate to login page
- ✅ Enter admin credentials
- ✅ Should redirect to dashboard

### 2. Dashboard Test
- ✅ View KPI cards
- ✅ Check region sales chart
- ✅ Verify product distribution
- ✅ Review trend line chart

### 3. Upload Test
- Click "Upload Data" in sidebar
- Create test Excel file with correct columns:
  - Region, State, City, Product, Sales, Revenue, Date, Units Sold
- Upload and verify data appears in dashboard

### 4. Filter Test
- Try date range filters (7 days, 30 days, etc.)
- Verify charts update dynamically

## Troubleshooting

### "Port 5000 already in use"
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (if PID is 1234)
taskkill /PID 1234 /F

# Or change PORT in backend .env
```

### "Cannot connect to database"
```powershell
# Verify PostgreSQL is running
# Windows: Check Services (services.msc) > postgresql-x64

# Or start it:
pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start

# Verify connection:
psql -U postgres
```

### "npm install fails"
```powershell
# Clear npm cache
npm cache clean --force

# Try installing again
npm install
```

### "React app won't start"
```powershell
# Kill any existing process on 3000
netstat -ano | findstr :3000
taskkill /PID [PID] /F

# Try starting again
npm start
```

## Development Commands

### Backend
```powershell
npm run dev      # Development with auto-reload
npm start        # Production start
node scripts/migrate.js  # Run migrations
node scripts/seed.js     # Seed sample data
```

### Frontend
```powershell
npm start     # Start dev server
npm build     # Build for production
npm test      # Run tests
```

## Next Steps

1. ✅ Login to application
2. 📤 Upload sample sales data
3. 📊 Explore dashboard visualizations
4. 🔍 Test filters and drill-downs
5. 🌙 Toggle dark mode
6. 📱 Check responsive design on different screen sizes

## Deployment Checklist

- [ ] Update JWT_SECRET in backend .env
- [ ] Set DATABASE_URL for production database
- [ ] Set REACT_APP_API_URL to production backend URL
- [ ] Enable HTTPS on backend
- [ ] Configure CORS for production domains
- [ ] Set NODE_ENV=production
- [ ] Test all authentication flows
- [ ] Verify all charts load correctly
- [ ] Test file uploads with production database
- [ ] Set up monitoring and logging

## Database Backup

```powershell
# Backup database
pg_dump -U postgres sales_dashboard > backup.sql

# Restore database
psql -U postgres sales_dashboard < backup.sql
```

## Useful PostgreSQL Commands

```powershell
# Connect to database
psql -U postgres -d sales_dashboard

# List tables
\dt

# View table structure
\d sales_data

# Count rows
SELECT COUNT(*) FROM sales_data;

# Exit
\q
```

---

For detailed API documentation, see README.md
