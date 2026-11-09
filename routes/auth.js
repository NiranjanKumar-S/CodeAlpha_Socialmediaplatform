const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// Input validation helpers
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

function isValidUsername(username) {
  const re = /^[a-zA-Z0-9._]{3,30}$/;
  return re.test(username);
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    if (!username || !email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'All fields (Username, Email, Full Name, Password) are required.'
      });
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedFullName = full_name.trim();

    if (!isValidUsername(trimmedUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be 3-30 characters long and contain only letters, numbers, periods, and underscores.'
      });
    }

    if (!isValidEmail(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Check if username or email already exists
    const existingUser = db.prepare(
      'SELECT id, username, email FROM users WHERE username = ? OR email = ?'
    ).get(trimmedUsername, trimmedEmail);

    if (existingUser) {
      if (existingUser.username.toLowerCase() === trimmedUsername.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken. Please choose another.'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Email is already registered. Please log in.'
      });
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = bcrypt.hashSync(password, saltRounds);

    // Insert user
    const insertStmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, full_name, avatar_url)
      VALUES (?, ?, ?, ?, '/uploads/default-avatar.svg')
    `);

    const result = insertStmt.run(trimmedUsername, trimmedEmail, password_hash, trimmedFullName);
    const userId = result.lastInsertRowid;

    // Create session
    req.session.userId = userId;

    const newUser = db.prepare(
      'SELECT id, username, email, full_name, bio, avatar_url, website, created_at FROM users WHERE id = ?'
    ).get(userId);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      user: newUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration.'
    });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/email and password are required.'
      });
    }

    const trimmedIdentifier = identifier.trim();

    // Find user by username or email
    const user = db.prepare(`
      SELECT id, username, email, password_hash, full_name, bio, avatar_url, website, created_at
      FROM users
      WHERE username = ? OR email = ?
    `).get(trimmedIdentifier, trimmedIdentifier.toLowerCase());

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password.'
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password.'
      });
    }

    // Set session
    req.session.userId = user.id;

    // Return user without password_hash
    const { password_hash, ...safeUser } = user;

    return res.json({
      success: true,
      message: 'Logged in successfully!',
      user: safeUser
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login.'
    });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({
        success: false,
        message: 'Could not log out. Please try again.'
      });
    }
    res.clearCookie('connecthub.sid');
    return res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.json({
      success: true,
      authenticated: false,
      user: null
    });
  }

  const user = db.prepare(`
    SELECT id, username, email, full_name, bio, avatar_url, website, created_at
    FROM users
    WHERE id = ?
  `).get(req.session.userId);

  if (!user) {
    req.session.destroy();
    return res.json({
      success: true,
      authenticated: false,
      user: null
    });
  }

  // Get counts
  const postCount = db.prepare('SELECT COUNT(*) as count FROM posts WHERE user_id = ?').get(user.id).count;
  const followersCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(user.id).count;
  const followingCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(user.id).count;

  return res.json({
    success: true,
    authenticated: true,
    user: {
      ...user,
      postCount,
      followersCount,
      followingCount
    }
  });
});

// GET /api/auth/demo-users
router.get('/demo-users', (req, res) => {
  try {
    const demoUsers = db.prepare(`
      SELECT id, username, full_name, avatar_url, bio
      FROM users
      LIMIT 5
    `).all();

    return res.json({
      success: true,
      users: demoUsers
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Could not fetch demo users.' });
  }
});

// POST /api/auth/demo-login
router.post('/demo-login', (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required.' });
    }

    const user = db.prepare(`
      SELECT id, username, email, full_name, bio, avatar_url, website, created_at
      FROM users
      WHERE username = ?
    `).get(username.trim());

    if (!user) {
      return res.status(404).json({ success: false, message: 'Demo user not found.' });
    }

    req.session.userId = user.id;

    return res.json({
      success: true,
      message: `Signed in as @${user.username}`,
      user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Demo login error.' });
  }
});

module.exports = router;
