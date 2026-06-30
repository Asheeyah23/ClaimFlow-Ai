const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { db } = require('../db');
const { signToken, authRequired } = require('../auth');

const router = express.Router();

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  res.json({ token: signToken(user), user: publicUser(user) });
});

router.post('/register', (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }
  const normalized = String(email).toLowerCase().trim();
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(normalized);
  if (exists) return res.status(409).json({ error: 'An account with that email already exists.' });

  const user = {
    id: crypto.randomUUID(),
    name,
    email: normalized,
    password_hash: bcrypt.hashSync(password, 10),
    role: ['admin', 'adjuster', 'supervisor'].includes(role) ? role : 'adjuster',
  };
  db.prepare(
    'INSERT INTO users (id, name, email, password_hash, role) VALUES (@id, @name, @email, @password_hash, @role)'
  ).run(user);

  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: publicUser(user) });
});

module.exports = router;
