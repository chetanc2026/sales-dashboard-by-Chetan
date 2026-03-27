# Sales Dashboard - Deployment Guide

## Local Development Checklist ✅

Before deploying to production, ensure:

- [ ] Backend runs without errors (`npm run dev`)
- [ ] Frontend loads without errors (`npm start`)
- [ ] Database migrations completed
- [ ] Sample data uploaded and visible in dashboard
- [ ] Login works with all roles
- [ ] File upload functionality works
- [ ] All charts render correctly
- [ ] Filters work as expected
- [ ] Dark mode toggle works
- [ ] No console errors or warnings

---

## Production Deployment

### Option 1: Render + Vercel (Recommended for Beginners)

#### Backend Deployment (Render)

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create PostgreSQL Database**
   - In Dashboard, click "New +"
   - Select "PostgreSQL"
   - Name: `sales_dashboard_db`
   - Note the connection string

3. **Deploy Backend Service**
   - Click "New +"
   - Select "Web Service"
   - Connect your GitHub repository
   - Configuration:
     ```
     Name: sales-dashboard-api
     Runtime: Node
     Build Command: npm install
     Start Command: npm start
     ```
   - Add environment variables:
     ```
     NODE_ENV=production
     PORT=5000
     DATABASE_URL=<your_postgres_url>
     JWT_SECRET=<generate_strong_secret>
     JWT_EXPIRE=7d
     CORS_ORIGIN=<your_frontend_url>
     ```
   - Click "Create Web Service"

#### Frontend Deployment (Vercel)

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New"
   - Select "Project"
   - Choose your repository
   - Root Directory: `frontend`

3. **Environment Variables**
   - Add: `REACT_APP_API_URL=<your_render_backend_url>`

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete

#### Database Updates

Once deployed, run migrations on production:

```bash
# From your local machine
DATABASE_URL=<production_url> node scripts/migrate.js
DATABASE_URL=<production_url> node scripts/seed.js
```

---

### Option 2: Railway (All-in-One Platform)

1. **Create Railway Account**
   - Go to https://railway.app
   - Connect GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"

3. **Add Services**
   - Add PostgreSQL plugin
   - Add Node.js web service for backend

4. **Configure Backend**
   - Point to `backend` directory
   - Set environment variables
   - Start command: `npm start`

5. **Deploy Frontend**
   - Add another Node.js service for frontend
   - Point to `frontend` directory
   - Start command: `npm start`

---

### Option 3: AWS Deployment (Enterprise)

#### Backend (EC2 + RDS)

1. **RDS PostgreSQL**
   - Create PostgreSQL instance
   - Configure security groups
   - Get endpoint

2. **EC2 Instance**
   - Launch Ubuntu 22.04 LTS instance
   - Install Node.js:
     ```bash
     curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
     sudo apt-get install -y nodejs
     ```
   - Clone repository
   - Install dependencies
   - Create `.env` file
   - Use PM2 for process management:
     ```bash
     npm install -g pm2
     pm2 start src/server.js --name "sales-api"
     pm2 startup
     pm2 save
     ```
   - Set up Nginx reverse proxy
   - Get SSL certificate with Let's Encrypt

3. **CloudFront CDN**
   - Create distribution
   - Point to ALB/ELB

#### Frontend (S3 + CloudFront)

1. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Upload to S3**
   - Create S3 bucket
   - Upload `build` folder contents
   - Enable static website hosting

3. **CloudFront Distribution**
   - Create distribution pointing to S3
   - Configure SSL certificate
   - Set cache policies

---

## Security Checklist 🔒

Before going live:

- [ ] Change `JWT_SECRET` to random 32+ character string
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS everywhere
- [ ] Configure CORS properly (specific domain, not *)
- [ ] Set database password strength requirements
- [ ] Enable database backups and replication
- [ ] Use environment variables for all secrets
- [ ] Install SSL certificate (Let's Encrypt free)
- [ ] Configure rate limiting on API
- [ ] Enable query logging for debugging
- [ ] Set up monitoring and alerting
- [ ] Regular security updates

---

## Monitoring & Maintenance

### Application Monitoring

Use services like:
- **Sentry** (Error tracking)
- **DataDog** (Performance monitoring)
- **New Relic** (APM)
- **Rollbar** (Error alerts)

### Database Monitoring

- Monitor disk space
- Set up automated backups
- Monitor query performance
- Set up connection pool monitoring
- Regular VACUUM and ANALYZE

### Log Aggregation

- CloudWatch (AWS)
- Papertrail
- LogRocket
- Splunk

---

## Performance Optimization

### Backend

```javascript
// Add caching
const redis = require('redis');
const client = redis.createClient();

// Cache dashboard queries
app.get('/api/dashboard/kpis', async (req, res) => {
  const cacheKey = `kpis:${JSON.stringify(req.query)}`;
  const cached = await client.get(cacheKey);
  
  if (cached) return res.json(JSON.parse(cached));
  
  const data = await dashboardService.getKPIs(req.query);
  await client.setex(cacheKey, 3600, JSON.stringify(data));
  
  res.json(data);
});
```

### Frontend

```javascript
// Code splitting
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const UploadPage = React.lazy(() => import('./pages/UploadPage'));

// Suspense boundary
<Suspense fallback={<LoadingSpinner />}>
  <DashboardPage />
</Suspense>
```

---

## Backup & Recovery

### Database Backup

```bash
# Full backup
pg_dump -U postgres -h localhost sales_dashboard > backup.sql

# With compression
pg_dump -U postgres sales_dashboard | gzip > backup.sql.gz

# Restore
psql -U postgres sales_dashboard < backup.sql

# Selective restore
pg_restore -U postgres -d sales_dashboard backup.dump
```

### AWS RDS Backups

- Automated daily backups (35 day retention)
- Manual snapshots
- Cross-region replication
- Point-in-time recovery

---

## Scaling Strategy

### Vertical Scaling
- Upgrade EC2 instance type
- Increase RDS instance class
- More CPU/Memory

### Horizontal Scaling
- Load balancer (ALB/NLB)
- Multiple backend instances
- Read replicas for database
- Redis cache layer
- CDN for static assets

### Example: Load-Balanced Setup

```
User → CloudFront (CDN)
      ↓
      Vercel (Frontend auto-scales)
      
User → API Gateway
      ↓
      Load Balancer (ALB)
      ↓
    ┌─────┬─────┬─────┐
    EC2   EC2   EC2  (3+ instances)
    ↓     ↓     ↓
  RDS (Read Replicas) ← Redis Cache
    ↓
  S3 (Data Lake)
```

---

## Disaster Recovery Plan

1. **Database Failure**
   - Restore from latest backup
   - Switch to read replica
   - Expected RTO: 5 minutes

2. **EC2 Instance Failure**
   - Auto-scaling group creates new instance
   - Load balancer routes traffic
   - Expected RTO: 2 minutes

3. **Regional Outage**
   - Multi-region deployment
   - DNS failover
   - Expected RTO: 30 seconds

---

## Post-Deployment

1. **Monitor Performance**
   - Response times
   - Error rates
   - Database performance
   - User experience metrics

2. **Gather Feedback**
   - User authentication
   - Dashboard loading
   - Chart interactions
   - Upload functionality

3. **Plan Updates**
   - Bug fixes
   - Feature additions
   - Performance improvements
   - Security patches

---

## Cost Estimation (Monthly)

| Service | Free Tier | Pro | Note |
|---------|-----------|-----|------|
| Render | 0.5 GB RAM | $7/GB RAM | Backend |
| Vercel | ✅ Included | Pay per overages | Frontend |
| Railway | $5 credit | $5+ | Excellent value |
| AWS EC2 | t2.micro | $10-50 | Varies with usage |
| AWS RDS | - | $30-200 | Managed DB |
| Supabase | - | $25+ | PostgreSQL hosted |

**Total Estimated Cost**: $50-150/month for small-medium deployment

---

## Useful Commands

```bash
# Check Node version
node --version

# Start with PM2
pm2 start src/server.js --name "sales-api"

# Monitor PM2
pm2 monit

# View logs
pm2 logs sales-api

# Restart application
pm2 restart sales-api

# Clear cache
redis-cli FLUSHDB

# Database size
psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('sales_dashboard'));"
```

---

## Support & Documentation

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- PostgreSQL Docs: https://www.postgresql.org/docs
- Express.js Docs: https://expressjs.com
- React Docs: https://react.dev

---

**Last Updated**: March 2024
**Version**: 1.0.0
