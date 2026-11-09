const express = require('express');
const session = require('express-session');
const SqliteStore = require('better-sqlite3-session-store')(session);
const path = require('path');
require('dotenv').config();

const db = require('./database/db');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const postsRoutes = require('./routes/posts');
const likesRoutes = require('./routes/likes');
const commentsRoutes = require('./routes/comments');
const followsRoutes = require('./routes/follows');

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration using SQLite store
app.use(
  session({
    store: new SqliteStore({
      client: db,
      expired: {
        clear: true,
        intervalMs: 15 * 60 * 1000 // Clear expired sessions every 15 minutes
      }
    }),
    name: 'connecthub.sid',
    secret: process.env.SESSION_SECRET || 'connecthub-super-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true if running with HTTPS in production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax'
    }
  })
);

// Serve static assets from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/posts', likesRoutes); // e.g. POST /api/posts/:id/like, GET /api/posts/:id/likes
app.use('/api', commentsRoutes);    // e.g. POST /api/posts/:id/comments, DELETE /api/comments/:id
app.use('/api/users', followsRoutes); // e.g. POST /api/users/:id/follow

// Fallback to index.html for client-side routing
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  next();
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected error occurred.'
  });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 ConnectHub server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
