const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const router = express.Router();

// Mock user data (replace with real database in production)
const users = [
  { id: 1, email: 'admin@dashboards.com', password: '$2a$10$YourHashedPasswordHere', role: 'admin', name: 'Admin User' },
  { id: 2, email: 'manager@dashboards.com', password: '$2a$10$YourHashedPasswordHere', role: 'manager', name: 'Manager User' },
  { id: 3, email: 'user@dashboards.com', password: '$2a$10$YourHashedPasswordHere', role: 'user', name: 'Standard User' }
];

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    // For demo: use hardcoded credentials
    let user = null;
    
    if (email === 'admin@dashboards.com' && password === 'admin123') {
      user = { id: 1, email: 'admin@dashboards.com', role: 'admin', name: 'Admin User' };
    } else if (email === 'manager@dashboards.com' && password === 'manager123') {
      user = { id: 2, email: 'manager@dashboards.com', role: 'manager', name: 'Manager User' };
    } else if (email === 'user@dashboards.com' && password === 'user123') {
      user = { id: 3, email: 'user@dashboards.com', role: 'user', name: 'Standard User' };
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Register endpoint (optional)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = jwt.sign(
      { email, name, role: role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      token,
      user: { email, name, role: role || 'user' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
