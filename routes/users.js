const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/users/suggested - Suggested users to follow
router.get('/suggested', optionalAuth, (req, res) => {
  try {
    const currentUserId = req.currentUserId || 0;

    const suggested = db.prepare(`
      SELECT u.id, u.username, u.full_name, u.avatar_url, u.bio,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followersCount
      FROM users u
      WHERE u.id != ?
        AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id = ?)
      ORDER BY followersCount DESC, u.created_at DESC
      LIMIT 8
    `).all(currentUserId, currentUserId);

    return res.json({
      success: true,
      users: suggested
    });
  } catch (error) {
    console.error('Error fetching suggested users:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch suggestions.' });
  }
});

// GET /api/users/search - Search users
router.get('/search', optionalAuth, (req, res) => {
  try {
    const query = (req.query.q || '').trim();
    if (!query) {
      return res.json({ success: true, users: [] });
    }

    const searchTerm = `%${query}%`;
    const currentUserId = req.currentUserId || 0;

    const users = db.prepare(`
      SELECT u.id, u.username, u.full_name, u.avatar_url, u.bio,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followersCount,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) as is_following
      FROM users u
      WHERE u.username LIKE ? OR u.full_name LIKE ?
      LIMIT 15
    `).all(currentUserId, searchTerm, searchTerm);

    return res.json({
      success: true,
      users: users.map(u => ({ ...u, is_following: Boolean(u.is_following) }))
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ success: false, message: 'Search failed.' });
  }
});

// GET /api/users/profile/:username - Get user profile
router.get('/profile/:username', optionalAuth, (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.currentUserId;

    const user = db.prepare(`
      SELECT id, username, email, full_name, bio, avatar_url, website, created_at
      FROM users
      WHERE username = ?
    `).get(username.trim());

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const postsCount = db.prepare('SELECT COUNT(*) as count FROM posts WHERE user_id = ?').get(user.id).count;
    const followersCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(user.id).count;
    const followingCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(user.id).count;

    let is_following = false;
    let is_self = false;

    if (currentUserId) {
      if (currentUserId === user.id) {
        is_self = true;
      } else {
        const followCheck = db.prepare(
          'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?'
        ).get(currentUserId, user.id);
        is_following = Boolean(followCheck);
      }
    }

    // Get user posts with likes and comment count
    const posts = db.prepare(`
      SELECT p.id, p.image_url, p.caption, p.location, p.created_at,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
      FROM posts p
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `).all(user.id);

    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        bio: user.bio,
        avatar_url: user.avatar_url,
        website: user.website,
        created_at: user.created_at,
        postsCount,
        followersCount,
        followingCount,
        is_following,
        is_self
      },
      posts
    });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch user profile.' });
  }
});

// PUT /api/users/profile - Update profile
router.put('/profile', requireAuth, upload.single('avatar'), (req, res) => {
  try {
    const userId = req.currentUserId;
    const { full_name, bio, website } = req.body;

    const trimmedFullName = (full_name !== undefined ? full_name : '').trim();
    const trimmedBio = (bio !== undefined ? bio : '').trim();
    const trimmedWebsite = (website !== undefined ? website : '').trim();

    if (full_name !== undefined && trimmedFullName.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Full name cannot be empty.'
      });
    }

    // Get existing user
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let avatar_url = existing.avatar_url;
    if (req.file) {
      avatar_url = `/uploads/${req.file.filename}`;
    }

    const updatedFullName = full_name !== undefined ? trimmedFullName : existing.full_name;
    const updatedBio = bio !== undefined ? trimmedBio : existing.bio;
    const updatedWebsite = website !== undefined ? trimmedWebsite : existing.website;

    db.prepare(`
      UPDATE users
      SET full_name = ?, bio = ?, website = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(updatedFullName, updatedBio, updatedWebsite, avatar_url, userId);

    const updatedUser = db.prepare(`
      SELECT id, username, email, full_name, bio, avatar_url, website, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(userId);

    return res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// GET /api/users/:username/followers - List followers
router.get('/:username/followers', optionalAuth, (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.currentUserId || 0;

    const targetUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const followers = db.prepare(`
      SELECT u.id, u.username, u.full_name, u.avatar_url, u.bio,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) as is_following,
        (u.id = ?) as is_self
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
      ORDER BY f.created_at DESC
    `).all(currentUserId, currentUserId, targetUser.id);

    return res.json({
      success: true,
      followers: followers.map(f => ({
        ...f,
        is_following: Boolean(f.is_following),
        is_self: Boolean(f.is_self)
      }))
    });
  } catch (error) {
    console.error('Error fetching followers:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch followers.' });
  }
});

// GET /api/users/:username/following - List following
router.get('/:username/following', optionalAuth, (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.currentUserId || 0;

    const targetUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const following = db.prepare(`
      SELECT u.id, u.username, u.full_name, u.avatar_url, u.bio,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) as is_following,
        (u.id = ?) as is_self
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
    `).all(currentUserId, currentUserId, targetUser.id);

    return res.json({
      success: true,
      following: following.map(f => ({
        ...f,
        is_following: Boolean(f.is_following),
        is_self: Boolean(f.is_self)
      }))
    });
  } catch (error) {
    console.error('Error fetching following:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch following list.' });
  }
});

module.exports = router;
