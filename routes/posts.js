const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

// Helper to attach like status and preview comments to posts
function enrichPosts(posts, currentUserId) {
  const enrichStmt = db.prepare(`
    SELECT c.id, c.comment_text, c.created_at, u.id as user_id, u.username, u.avatar_url
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `);

  const likeCheckStmt = db.prepare(`
    SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?
  `);

  return posts.map(post => {
    const isLiked = currentUserId ? Boolean(likeCheckStmt.get(post.id, currentUserId)) : false;
    const comments = enrichStmt.all(post.id);

    return {
      ...post,
      is_liked: isLiked,
      comments: comments
    };
  });
}

// GET /api/posts/feed - Feed of posts
router.get('/feed', optionalAuth, (req, res) => {
  try {
    const currentUserId = req.currentUserId;
    let posts = [];

    if (currentUserId) {
      // Posts from followed users and self
      posts = db.prepare(`
        SELECT p.id, p.user_id, p.image_url, p.caption, p.location, p.created_at,
               u.username, u.full_name, u.avatar_url,
               (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
               (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ? OR p.user_id IN (
          SELECT following_id FROM follows WHERE follower_id = ?
        )
        ORDER BY p.created_at DESC
        LIMIT 30
      `).all(currentUserId, currentUserId);

      // If feed is empty or short, show discover/explore posts
      if (posts.length < 5) {
        const extraPosts = db.prepare(`
          SELECT p.id, p.user_id, p.image_url, p.caption, p.location, p.created_at,
                 u.username, u.full_name, u.avatar_url,
                 (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
                 (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
          FROM posts p
          JOIN users u ON p.user_id = u.id
          WHERE p.id NOT IN (${posts.length > 0 ? posts.map(p => p.id).join(',') : '0'})
          ORDER BY p.created_at DESC
          LIMIT 20
        `).all();
        posts = posts.concat(extraPosts);
      }
    } else {
      // Public / guest feed
      posts = db.prepare(`
        SELECT p.id, p.user_id, p.image_url, p.caption, p.location, p.created_at,
               u.username, u.full_name, u.avatar_url,
               (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
               (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
        LIMIT 30
      `).all();
    }

    const enriched = enrichPosts(posts, currentUserId);
    return res.json({
      success: true,
      posts: enriched
    });
  } catch (error) {
    console.error('Feed error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch feed.' });
  }
});

// GET /api/posts/explore - Explore grid
router.get('/explore', optionalAuth, (req, res) => {
  try {
    const currentUserId = req.currentUserId;

    const posts = db.prepare(`
      SELECT p.id, p.user_id, p.image_url, p.caption, p.location, p.created_at,
             u.username, u.full_name, u.avatar_url,
             (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY (likes_count * 2 + comments_count * 3) DESC, p.created_at DESC
      LIMIT 60
    `).all();

    const enriched = enrichPosts(posts, currentUserId);
    return res.json({
      success: true,
      posts: enriched
    });
  } catch (error) {
    console.error('Explore error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch explore posts.' });
  }
});

// GET /api/posts/:id - Single post details
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const currentUserId = req.currentUserId;

    if (isNaN(postId)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID.' });
    }

    const post = db.prepare(`
      SELECT p.id, p.user_id, p.image_url, p.caption, p.location, p.created_at,
             u.username, u.full_name, u.avatar_url,
             (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const comments = db.prepare(`
      SELECT c.id, c.comment_text, c.created_at, c.user_id,
             u.username, u.avatar_url,
             (c.user_id = ? OR p.user_id = ?) as can_delete
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN posts p ON c.post_id = p.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(currentUserId || 0, currentUserId || 0, postId);

    const isLiked = currentUserId ? Boolean(
      db.prepare('SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?').get(postId, currentUserId)
    ) : false;

    return res.json({
      success: true,
      post: {
        ...post,
        is_liked: isLiked,
        is_owner: currentUserId === post.user_id,
        comments: comments.map(c => ({ ...c, can_delete: Boolean(c.can_delete) }))
      }
    });
  } catch (error) {
    console.error('Single post error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch post.' });
  }
});

// POST /api/posts - Create post
router.post('/', requireAuth, upload.single('image'), (req, res) => {
  try {
    const userId = req.currentUserId;
    const { caption, location, image_url: providedImageUrl } = req.body;

    let image_url = '';

    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    } else if (providedImageUrl && typeof providedImageUrl === 'string' && providedImageUrl.trim().length > 0) {
      image_url = providedImageUrl.trim();
    } else {
      return res.status(400).json({
        success: false,
        message: 'An image is required. Please upload an image or provide an image URL.'
      });
    }

    const trimmedCaption = (caption || '').trim();
    const trimmedLocation = (location || '').trim();

    const insertStmt = db.prepare(`
      INSERT INTO posts (user_id, image_url, caption, location)
      VALUES (?, ?, ?, ?)
    `);

    const result = insertStmt.run(userId, image_url, trimmedCaption, trimmedLocation);
    const postId = result.lastInsertRowid;

    const newPost = db.prepare(`
      SELECT p.id, p.user_id, p.image_url, p.caption, p.location, p.created_at,
             u.username, u.full_name, u.avatar_url,
             0 as likes_count,
             0 as comments_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(postId);

    return res.status(201).json({
      success: true,
      message: 'Post created successfully!',
      post: {
        ...newPost,
        is_liked: false,
        comments: []
      }
    });
  } catch (error) {
    console.error('Create post error:', error);
    return res.status(500).json({ success: false, message: 'Could not create post.' });
  }
});

// DELETE /api/posts/:id - Delete own post
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const userId = req.currentUserId;

    if (isNaN(postId)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID.' });
    }

    const post = db.prepare('SELECT id, user_id, image_url FROM posts WHERE id = ?').get(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    if (post.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only delete your own posts.'
      });
    }

    // Delete post record
    db.prepare('DELETE FROM posts WHERE id = ?').run(postId);

    // Optionally delete uploaded image file if local
    if (post.image_url && post.image_url.startsWith('/uploads/')) {
      const localFilePath = path.join(__dirname, '..', 'public', post.image_url);
      if (fs.existsSync(localFilePath) && !localFilePath.includes('default-avatar')) {
        try {
          fs.unlinkSync(localFilePath);
        } catch (e) {
          // ignore file deletion errors
        }
      }
    }

    return res.json({
      success: true,
      message: 'Post deleted successfully.'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    return res.status(500).json({ success: false, message: 'Could not delete post.' });
  }
});

module.exports = router;
