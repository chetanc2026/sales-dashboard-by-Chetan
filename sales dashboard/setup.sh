#!/bin/bash
# Sales Dashboard - Quick Setup Script for Mac/Linux

echo ""
echo "========================================"
echo "  Sales Dashboard Setup Script"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "WARNING: PostgreSQL might not be installed"
    echo "Make sure PostgreSQL server is running"
fi

echo "Checking Node.js and npm versions..."
node -v
npm -v
echo ""

# Setup Backend
echo "Setting up Backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo ""
    echo "IMPORTANT: Edit backend/.env and set your DATABASE_URL"
    echo "Example: postgresql://postgres:password@localhost:5432/sales_dashboard"
    echo ""
fi

echo "Installing backend dependencies..."
npm install

# Run migrations
echo ""
echo "Setting up database..."
node scripts/migrate.js

# Optional: Seed data
echo ""
read -p "Would you like to seed sample data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    node scripts/seed.js
fi

cd ..

# Setup Frontend
echo ""
echo "Setting up Frontend..."
cd frontend

if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo ""
    echo "Make sure REACT_APP_API_URL matches your backend URL"
    echo "Default: http://localhost:5000/api"
    echo ""
fi

echo "Installing frontend dependencies..."
npm install

cd ..

echo ""
echo "========================================"
echo "   Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with correct DATABASE_URL"
echo "2. Edit frontend/.env with correct REACT_APP_API_URL"
echo "3. Start backend: cd backend && npm run dev"
echo "4. Start frontend: cd frontend && npm start"
echo ""
echo "Demo Credentials:"
echo "   Email: admin@dashboards.com"
echo "   Password: admin123"
echo ""
