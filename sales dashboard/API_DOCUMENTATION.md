# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Public Endpoints

### 1. Login
**POST** `/auth/login`

Request:
```json
{
  "email": "admin@dashboards.com",
  "password": "admin123"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@dashboards.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

---

## Protected Endpoints

### 2. Get Data Schema
**GET** `/data/schema`

Response:
```json
{
  "requiredColumns": ["Region", "State", "City", "Product", "Sales", "Revenue", "Date", "Units Sold"],
  "dataTypes": {
    "Region": "string",
    "State": "string",
    "City": "string",
    "Product": "string",
    "Sales": "number",
    "Revenue": "number",
    "Date": "date (YYYY-MM-DD)",
    "Units Sold": "number"
  },
  "example": [...]
}
```

### 3. Upload Data File
**POST** `/data/upload`

Request: multipart/form-data
- `file`: Excel or CSV file

Response:
```json
{
  "success": true,
  "message": "File uploaded and processed successfully",
  "rowsInserted": 12,
  "dataPreview": [...]
}
```

### 4. Get Upload History
**GET** `/data/uploads`

Response:
```json
{
  "success": true,
  "uploads": [
    {
      "id": 1,
      "filename": "sales_data.xlsx",
      "row_count": 150,
      "uploaded_at": "2024-01-15T10:30:00Z",
      "uploaded_by": 1
    }
  ]
}
```

---

## Dashboard Endpoints

### 5. Get KPIs
**GET** `/dashboard/kpis?startDate=2024-01-01&endDate=2024-01-31&region=North&product=Laptop`

Query Parameters:
- `startDate` (optional): YYYY-MM-DD
- `endDate` (optional): YYYY-MM-DD
- `region` (optional): Region name
- `product` (optional): Product name

Response:
```json
{
  "success": true,
  "kpis": {
    "totalRevenue": 850000,
    "totalSales": 14200,
    "totalUnits": 3500,
    "regionCount": 4,
    "productCount": 5,
    "avgRevenue": 18500
  }
}
```

### 6. Get Region-wise Sales
**GET** `/dashboard/region-sales?startDate=2024-01-01&endDate=2024-01-31`

Response:
```json
{
  "success": true,
  "data": [
    {
      "region": "North",
      "revenue": 250000,
      "sales": 4500,
      "units": 900,
      "transactions": 45
    },
    {
      "region": "South",
      "revenue": 320000,
      "sales": 5200,
      "units": 1100,
      "transactions": 52
    }
  ]
}
```

### 7. Get Product Performance
**GET** `/dashboard/product-performance?startDate=2024-01-01&endDate=2024-01-31&region=North`

Response:
```json
{
  "success": true,
  "data": [
    {
      "product": "Laptop",
      "revenue": 450000,
      "units": 1500,
      "transactions": 75,
      "avgRevenue": 6000
    },
    {
      "product": "Monitor",
      "revenue": 180000,
      "units": 600,
      "transactions": 30,
      "avgRevenue": 6000
    }
  ]
}
```

### 8. Get Revenue Trends
**GET** `/dashboard/trends?startDate=2024-01-01&endDate=2024-03-31&metric=revenue`

Query Parameters:
- `startDate` (optional): YYYY-MM-DD
- `endDate` (optional): YYYY-MM-DD
- `metric` (optional): 'revenue' or 'sales' (default: 'revenue')

Response:
```json
{
  "success": true,
  "data": [
    {
      "month": "2024-01-01T00:00:00Z",
      "value": 285000
    },
    {
      "month": "2024-02-01T00:00:00Z",
      "value": 320000
    }
  ]
}
```

### 9. Get Geographic Heatmap Data
**GET** `/dashboard/geo-heatmap?startDate=2024-01-01&endDate=2024-01-31`

Response:
```json
{
  "success": true,
  "data": [
    {
      "region": "North",
      "state": "NY",
      "revenue": 125000,
      "avg_revenue": 25000
    },
    {
      "region": "North",
      "state": "MA",
      "revenue": 85000,
      "avg_revenue": 17000
    }
  ]
}
```

### 10. Get Smart Insights
**GET** `/dashboard/insights?startDate=2024-01-01&endDate=2024-01-31`

Response:
```json
{
  "success": true,
  "insights": [
    {
      "type": "positive",
      "title": "Top Performing Region",
      "message": "North region leads with $250000 in revenue",
      "icon": "🏆"
    },
    {
      "type": "success",
      "title": "Strong Revenue Performance",
      "message": "Total revenue exceeds $500,000 threshold",
      "icon": "📈"
    }
  ]
}
```

### 11. Get Detailed Sales Data
**GET** `/dashboard/data?startDate=2024-01-01&endDate=2024-01-31&region=North&state=NY&city=NewYork&product=Laptop&page=1&limit=100`

Query Parameters:
- `startDate` (optional): YYYY-MM-DD
- `endDate` (optional): YYYY-MM-DD
- `region` (optional): Region name
- `state` (optional): State code
- `city` (optional): City name
- `product` (optional): Product name
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 100)

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "region": "North",
      "state": "NY",
      "city": "New York",
      "product": "Laptop",
      "sales": 1250,
      "revenue": 45000,
      "date": "2024-01-15",
      "units_sold": 50
    }
  ],
  "count": 25
}
```

---

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Error Codes

- **400 Bad Request**: Invalid parameters or missing required fields
- **401 Unauthorized**: Invalid or expired JWT token
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

---

## Rate Limiting

Currently not implemented. Can be added using `express-rate-limit` middleware.

## CORS

API accepts requests from `http://localhost:3000` by default. Configure in backend `.env`:
```
CORS_ORIGIN=http://localhost:3000
```

## Performance Tips

1. Use date range filters to reduce data size
2. Limit results per page for large datasets
3. Cache frequently used queries on the frontend
4. Use pagination for detailed data views

---

**Last Updated**: March 2024
**Version**: 1.0.0
