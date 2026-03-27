# Sales Dashboard - Local Configuration Examples

## Backend Configuration (.env)

Place this in `/backend/.env` and update values:

```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/sales_dashboard
JWT_SECRET=your_super_secret_key_change_in_production_min_32_chars
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
```

## Frontend Configuration (.env)

Place this in `/frontend/.env`:

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=Sales Dashboard
REACT_APP_BRAND_COLOR=#3b82f6
```

## Production Overrides

### Backend Production (.env.production)
```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://[RDS_ENDPOINT]
JWT_SECRET=[GENERATE_RANDOM_SECRET_32_CHARS]
JWT_EXPIRE=24h
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=error
```

### Frontend Production (.env.production)
```
REACT_APP_API_URL=https://your-api.com/api
REACT_APP_APP_NAME=Sales Dashboard
```

---

## Database Connection Strings

### Local PostgreSQL
```
postgresql://postgres:password@localhost:5432/sales_dashboard
```

### Render PostgreSQL
```
postgresql://user:password@dpg-xxxxx.render.com:5432/sales_dashboard
```

### Railway PostgreSQL
```
postgresql://postgres:password@containers-us-west-12.railway.app:5432/railway
```

### AWS RDS
```
postgresql://postgres:password@sales-db.xxxxx.rds.amazonaws.com:5432/sales_dashboard
```

### Supabase
```
postgresql://postgres:password@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

---

## JWT Secret Generation

Generate a strong JWT secret:

**In Node.js:**
```javascript
require('crypto').randomBytes(32).toString('hex')
```

**In PowerShell:**
```powershell
-join (1..32 | ForEach-Object { [char][int](Get-Random -min 97 -max 122) })
```

**In bash:**
```bash
openssl rand -hex 32
```

---

## Password Requirements

- **Minimum 8 characters**
- **At least 1 uppercase letter**
- **At least 1 number**
- **At least 1 special character**

Example: `P@ssw0rd123!`

---

## API Keys & Secrets Checklist

- [ ] JWT_SECRET generated and stored securely
- [ ] Database password set to strong value
- [ ] CORS_ORIGIN set to production domain
- [ ] All hardcoded secrets removed
- [ ] Environment variables documented
- [ ] Secrets not committed to Git
- [ ] Backup of database credentials stored securely

---

## Environment Variable Validation

Add this to backend before starting server:

```javascript
// config/env.js
const required = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'CORS_ORIGIN',
];

const missing = required.filter(env => !process.env[env]);

if (missing.length > 0) {
  throw new Error(`Missing environment variables: ${missing.join(', ')}`);
}

console.log('✅ All required environment variables set');
```

---

Last Updated: March 2024
