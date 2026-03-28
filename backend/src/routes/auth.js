const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

const demoUsers = [
  { id: 1, email: 'admin@dashboards.com', password: 'admin123', role: 'admin', name: 'Admin User' },
  { id: 2, email: 'manager@dashboards.com', password: 'manager123', role: 'manager', name: 'Manager User' },
  { id: 3, email: 'user@dashboards.com', password: 'user123', role: 'user', name: 'Standard User' },
];

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  const user = demoUsers.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  return res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
  });
});

router.post('/register', (req, res) => {
  return res.status(501).json({ success: false, message: 'Register is disabled in demo mode' });
});

module.exports = router;
