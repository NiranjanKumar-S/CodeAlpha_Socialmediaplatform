const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// POST /api/posts/:id/like - Toggle like on post
router.post('/:id/like', requireAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const userId = req.currentUserId;

    if (isNaN(postId)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID.' });
    }

    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const existingLike = db.prepare(
      'SELECT id FROM likes WHERE post_id = ? AND user_id = ?'
    ).get(postId, userId);

    let liked = false;

    if (existingLike) {
      // Unlike
      db.prepare('DELETE FROM likes WHERE id = ?').run(existingLike.id);
      liked = false;
    } else {
      // Like
      db.prepare('INSERT INTO likes (post_id, user_id) VALUES (?, ?)').run(postId, userId);
      liked = true;
    }

    const likesCount = db.prepare(
      'SELECT COUNT(*) as count FROM likes WHERE post_id = ?'
    ).get(postId).count;

    return res.json({
      success: true,
      liked,
      likesCount
    });
  } catch (error) {
    console.error('Like toggle error:', error);
    return res.status(500).json({ success: false, message: 'Could not toggle like.' });
  }
});

// GET /api/posts/:id/likes - List users who liked this post
router.get('/:id/likes', optionalAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const currentUserId = req.currentUserId || 0;

    if (isNaN(postId)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID.' });
    }

    const users = db.prepare(`
      SELECT u.id, u.username, u.full_name, u.avatar_url, u.bio,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) as is_following,
        (u.id = ?) as is_self
      FROM likes l
      JOIN users u ON l.user_id = u.id
      WHERE l.post_id = ?
      ORDER BY l.created_at DESC
    `).all(currentUserId, currentUserId, postId);

    return res.json({
      success: true,
      users: users.map(u => ({
        ...u,
        is_following: Boolean(u.is_following),
        is_self: Boolean(u.is_self)
      }))
    });
  } catch (error) {
    console.error('Get likes error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch likes list.' });
  }
});

module.exports = router;
