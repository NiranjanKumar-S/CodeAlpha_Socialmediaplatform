const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// GET /api/posts/:id/comments
router.get('/posts/:id/comments', optionalAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const currentUserId = req.currentUserId || 0;

    if (isNaN(postId)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID.' });
    }

    const comments = db.prepare(`
      SELECT c.id, c.comment_text, c.created_at, c.user_id, c.post_id,
             u.username, u.full_name, u.avatar_url,
             (c.user_id = ? OR p.user_id = ?) as can_delete
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN posts p ON c.post_id = p.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(currentUserId, currentUserId, postId);

    return res.json({
      success: true,
      comments: comments.map(c => ({ ...c, can_delete: Boolean(c.can_delete) }))
    });
  } catch (error) {
    console.error('Fetch comments error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch comments.' });
  }
});

// POST /api/posts/:id/comments - Add comment
router.post('/posts/:id/comments', requireAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const userId = req.currentUserId;
    const { comment_text } = req.body;

    if (isNaN(postId)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID.' });
    }

    if (!comment_text || typeof comment_text !== 'string' || comment_text.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Comment cannot be empty.' });
    }

    const trimmedText = comment_text.trim();
    if (trimmedText.length > 500) {
      return res.status(400).json({ success: false, message: 'Comment cannot exceed 500 characters.' });
    }

    // Verify post exists
    const post = db.prepare('SELECT id, user_id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const insertStmt = db.prepare(`
      INSERT INTO comments (user_id, post_id, comment_text)
      VALUES (?, ?, ?)
    `);

    const result = insertStmt.run(userId, postId, trimmedText);
    const commentId = result.lastInsertRowid;

    const newComment = db.prepare(`
      SELECT c.id, c.comment_text, c.created_at, c.user_id, c.post_id,
             u.username, u.full_name, u.avatar_url,
             1 as can_delete
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(commentId);

    const commentsCount = db.prepare(
      'SELECT COUNT(*) as count FROM comments WHERE post_id = ?'
    ).get(postId).count;

    return res.status(201).json({
      success: true,
      comment: { ...newComment, can_delete: true },
      commentsCount
    });
  } catch (error) {
    console.error('Add comment error:', error);
    return res.status(500).json({ success: false, message: 'Could not add comment.' });
  }
});

// DELETE /api/comments/:id - Delete comment
router.delete('/comments/:id', requireAuth, (req, res) => {
  try {
    const commentId = parseInt(req.params.id, 10);
    const userId = req.currentUserId;

    if (isNaN(commentId)) {
      return res.status(400).json({ success: false, message: 'Invalid comment ID.' });
    }

    const comment = db.prepare(`
      SELECT c.id, c.user_id, c.post_id, p.user_id as post_owner_id
      FROM comments c
      JOIN posts p ON c.post_id = p.id
      WHERE c.id = ?
    `).get(commentId);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    // Can only be deleted by the comment author OR the post owner
    if (comment.user_id !== userId && comment.post_owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to delete this comment.'
      });
    }

    db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);

    const commentsCount = db.prepare(
      'SELECT COUNT(*) as count FROM comments WHERE post_id = ?'
    ).get(comment.post_id).count;

    return res.json({
      success: true,
      message: 'Comment deleted successfully.',
      commentsCount,
      postId: comment.post_id
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    return res.status(500).json({ success: false, message: 'Could not delete comment.' });
  }
});

module.exports = router;
