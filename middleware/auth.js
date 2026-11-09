function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    req.currentUserId = req.session.userId;
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Authentication required. Please log in.'
  });
}

function optionalAuth(req, res, next) {
  if (req.session && req.session.userId) {
    req.currentUserId = req.session.userId;
  } else {
    req.currentUserId = null;
  }
  return next();
}

module.exports = {
  requireAuth,
  optionalAuth
};
