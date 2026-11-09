const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// POST /api/users/:id/follow - Toggle follow
router.post('/:id/follow', requireAuth, (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const currentUserId = req.currentUserId;

    if (isNaN(targetUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }

    if (targetUserId === currentUserId) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself.' });
    }

    const targetUser = db.prepare('SELECT id, username FROM users WHERE id = ?').get(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const existingFollow = db.prepare(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?'
    ).get(currentUserId, targetUserId);

    let following = false;

    if (existingFollow) {
      // Unfollow
      db.prepare('DELETE FROM follows WHERE id = ?').run(existingFollow.id);
      following = false;
    } else {
      // Follow
      db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(
        currentUserId,
        targetUserId
      );
      following = true;
    }

    const targetFollowersCount = db.prepare(
      'SELECT COUNT(*) as count FROM follows WHERE following_id = ?'
    ).get(targetUserId).count;

    const currentFollowingCount = db.prepare(
      'SELECT COUNT(*) as count FROM follows WHERE follower_id = ?'
    ).get(currentUserId).count;

    return res.json({
      success: true,
      following,
      followersCount: targetFollowersCount,
      currentFollowingCount
    });
  } catch (error) {
    console.error('Follow error:', error);
    return res.status(500).json({ success: false, message: 'Could not toggle follow.' });
  }
});

module.exports = router;
