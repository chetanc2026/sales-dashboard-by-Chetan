# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       CLIENT LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐                    ┌──────────────────────┐   │
│  │  Login Page  │                    │  Dashboard UI        │   │
│  │              │  ← Auth Flow →     │  - Charts            │   │
│  │ - Email/Pwd  │                    │  - KPIs              │   │
│  │ - 3 Roles    │                    │  - Filters           │   │
│  └──────────────┘                    │  - Dark Mode         │   │
│                                      └──────────────────────┘   │
│  ┌──────────────┐                    ┌──────────────────────┐   │
│  │ Upload Page  │                    │  Data Grid           │   │
│  │              │  ← Upload Flow →   │  - Pagination        │   │
│  │ - Drag Drop  │                    │  - Sorting           │   │
│  │ - Validation │                    │  - Filtering         │   │
│  └──────────────┘                    └──────────────────────┘   │
│                                                                   │
│  Tech: React 18 + Tailwind CSS + Recharts + Axios               │
└─────────────────────────────────────────────────────────────────┘
                          ↓ HTTPS ↓
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY / CORS                             │
└─────────────────────────────────────────────────────────────────┘
                          ↓ HTTP ↓
┌─────────────────────────────────────────────────────────────────┐
│              APPLICATION LAYER (Backend)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 Express.js Server                       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │ Auth Routes  │  │ Data Routes  │  │Dashboard API │  │   │
│  │  │ - Login      │  │ - Schema     │  │ - KPIs       │  │   │
│  │  │ - Register   │  │ - Upload     │  │ - Region     │  │   │
│  │  │ - Validate   │  │ - History    │  │ - Products   │  │   │
│  │  └──────────────┘  └──────────────┘  │ - Trends     │  │   │
│  │        ↓                  ↓           │ - Insights   │  │   │
│  │  ┌──────────────┐  ┌──────────────┐  └──────────────┘  │   │
│  │  │Auth Service  │  │Data Service  │        ↓           │   │
│  │  │ - JWT        │  │ - Validation │  ┌──────────────┐  │   │
│  │  │ - Bcrypt     │  │ - Processing │  │Dashboard Svc │  │   │
│  │  └──────────────┘  │ - Storage    │  │ - Analytics │  │   │
│  │        ↓           └──────────────┘  │ - Reporting│  │   │
│  │   JWT Tokens             ↓           └──────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ↓ SQL ↓                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            Middleware Stack                             │   │
│  │  - CORS / Body Parser / Auth / Error Handling          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Tech: Express.js + Node.js + Multer + XLSX                     │
└─────────────────────────────────────────────────────────────────┘
                          ↓ TCP:5432 ↓
┌─────────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │          PostgreSQL Database                           │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │                                                         │    │
│  │  ┌──────────────┐        ┌──────────────────────┐     │    │
│  │  │ sales_data   │        │ uploads              │     │    │
│  │  │              │        │                      │     │    │
│  │  │ - id         │        │ - id                 │     │    │
│  │  │ - region     │        │ - filename           │     │    │
│  │  │ - state      │        │ - row_count          │     │    │
│  │  │ - city       │        │ - uploaded_at        │     │    │
│  │  │ - product    │◄───────│ - uploaded_by (FK)   │     │    │
│  │  │ - sales      │        └──────────────────────┘     │    │
│  │  │ - revenue    │                                     │    │
│  │  │ - date       │        Indexes:                     │    │
│  │  │ - units_sold │        - date, region, product,    │    │
│  │  │ - created_at │          state                      │    │
│  │  └──────────────┘                                     │    │
│  │                                                         │    │
│  │  Tech: PostgreSQL 12+ with connection pooling         │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
User Upload Flow:
─────────────────

User
  ↓ Select Excel File
Frontend (Upload Page)
  ↓ Validate File Type
  ↓ POST /api/data/upload (multipart/form-data)
Backend (Multer Middleware)
  ↓ Parse Excel to JSON
  ↓ Validate Schema
  ↓ Transform Data Types
Data Service
  ↓ Batch Insert to PostgreSQL
  ↓ Insert Upload Record
Database
  ↓ Store 150+ rows
Frontend
  ↓ Show Success Toast
  ↓ Redirect to Dashboard
```

```
Analytics Flow:
───────────────

User Views Dashboard
  ↓ Set Date Range Filter
Frontend (DashboardPage)
  ↓ Fetch KPIs, Charts, Insights
  ↓ GET /api/dashboard/kpis?startDate=...&endDate=...
Backend (Auth Middleware) ← Verify JWT Token
  ↓ Query Service
Dashboard Service
  ↓ SQL: SELECT SUM(revenue) ... WHERE date >= ? AND date <= ?
  ↓ SQL: SELECT region, SUM(revenue) ... GROUP BY region
  ↓ Format Response
Frontend (Chart Components)
  ↓ Render Recharts
  ↓ Display Results
User Gets Insights  ← Smart Analysis
```

---

## State Management

### Frontend State

```
App.js
  ├── AuthContext
  │   ├── user (object)
  │   ├── token (JWT string)
  │   ├── isAuthenticated (boolean)
  │   └── login/logout (functions)
  │
  └── DashboardPage
      ├── sidebarOpen (boolean)
      ├── filters (object)
      │   ├── startDate
      │   ├── endDate
      │   ├── region
      │   ├── state
      │   ├── city
      │   └── product
      ├── darkMode (boolean)
      └── DashboardGrid
          ├── kpis (object)
          ├── regionData (array)
          ├── productData (array)
          ├── trendData (array)
          ├── insights (array)
          └── loading (boolean)
```

### Backend State

```
Database Connection Pool
  └── Active Connections: max 20

Authenticated User (JWT)
  ├── id
  ├── email
  ├── role
  └── exp (expiration)

Upload Session
  ├── File in memory
  ├── Parsed data
  └── Validation results
```

---

## Authentication Flow

```
1. User enters credentials
   ↓
2. Frontend POST /auth/login
   {email, password}
   ↓
3. Backend verifies credentials
   ↓
4. Generate JWT Token
   Header: {alg: 'HS256', typ: 'JWT'}
   Payload: {id: 1, email: 'admin@dashboards.com', role: 'admin', iat: ..., exp: ...}
   Signature: HMACSHA256(header.payload, JWT_SECRET)
   ↓
5. Return {token, user}
   ↓
6. Frontend stores token in localStorage
   ↓
7. Subsequent requests include: Authorization: Bearer {token}
   ↓
8. Backend middleware verifies JWT signature
   ↓
9. Grant access to protected routes
```

---

## Database Schema

```sql
-- Users/Uploads Table
uploads
├── id: SERIAL PRIMARY KEY
├── filename: VARCHAR
├── row_count: INTEGER
├── uploaded_by: INTEGER (user ID)
├── uploaded_at: TIMESTAMP

-- Sales Data Table
sales_data
├── id: SERIAL PRIMARY KEY
├── region: VARCHAR
├── state: VARCHAR
├── city: VARCHAR
├── product: VARCHAR
├── sales: NUMERIC(15,2)
├── revenue: NUMERIC(15,2)
├── date: DATE
├── units_sold: INTEGER
├── uploaded_by: INTEGER (FK → uploads.id)
├── created_at: TIMESTAMP
└── Indexes on: date, region, product, state
```

---

## API Response Format

All API responses follow this structure:

```json
{
  "success": boolean,
  "message": "Optional message",
  "data": { /* Actual data */ },
  "error": { /* Only on error */ }
}
```

Example:
```json
{
  "success": true,
  "kpis": {
    "totalRevenue": 850000,
    "totalSales": 14200
  }
}
```

---

## Performance Considerations

### Frontend
- Lazy loading components
- Memoization of expensive calculations
- Code splitting by route
- Virtual scrolling for large datasets

### Backend
- Connection pooling (max 20 connections)
- Database indexes on frequently queried columns
- Query optimization with GROUP BY, JOIN
- Batch inserts for file uploads

### Database
- Indexes on: date, region, product, state
- Partitioning by date possible
- Archival strategy for old data
- Regular VACUUM and ANALYZE

---

## Security Layers

1. **Transport**: HTTPS/TLS encryption
2. **Authentication**: JWT with expiration
3. **Authorization**: Role-based access control
4. **Input Validation**: Schema validation on upload
5. **SQL Injection Prevention**: Parameterized queries
6. **CORS**: Restricted to frontend domain
7. **Rate Limiting**: Can be added with middleware
8. **Password Hashing**: Bcrypt with salt

---

## Scalability Architecture

```
Future Scale (1M+ records):

Cache Layer        ← Redis
    ↓
Load Balancer      ← 3+ Node instances
    ↓
Database Replicas  ← Read replicas + Primary
    ↓
S3 Storage         ← Archive old data
    ↓
CDN                ← CloudFront/CloudFlare
```

---

Last Updated: March 2024
Version: 1.0.0
