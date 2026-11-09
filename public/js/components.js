// ConnectHub UI Components and Helpers

// SVG Icons Dictionary
const Icons = {
  home: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  search: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  explore: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  create: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="8" y1="12" y2="12"/></svg>`,
  profile: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  heart: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  heartFilled: `<svg width="24" height="24" viewBox="0 0 24 24" fill="#ff3040" stroke="#ff3040" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  comment: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>`,
  share: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  more: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>`,
  trash: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
  logout: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>`,
  login: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>`,
  close: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>`,
  upload: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>`,
  verified: `<svg width="14" height="14" viewBox="0 0 24 24" fill="#0095f6"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  grid: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`
};

// Format timestamps nicely (e.g. "2h ago", "3d ago", "Just now")
function timeAgo(dateString) {
  if (!dateString) return 'Just now';
  // Parse SQLite UTC timestamp safely
  const date = new Date(dateString.replace(' ', 'T') + 'Z');
  const now = new Date();
  const diffInSec = Math.floor((now - date) / 1000);

  if (diffInSec < 60) return 'Just now';
  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) return `${diffInMin}m ago`;
  const diffInHours = Math.floor(diffInMin / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Render Story Carousel
function renderStories(users) {
  if (!users || users.length === 0) return '';
  return `
    <div class="stories-card">
      ${users.map(u => `
        <div class="story-item" onclick="App.navigateTo('profile', { username: '${u.username}' })" title="@${u.username}">
          <div class="story-ring">
            <img class="story-img" src="${u.avatar_url || '/uploads/default-avatar.svg'}" alt="${u.username}" onerror="this.src='/uploads/default-avatar.svg'">
          </div>
          <span class="story-username">${u.username}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// Render Post Card
function renderPostCard(post, currentUser) {
  const isOwner = currentUser && currentUser.id === post.user_id;
  const isLiked = Boolean(post.is_liked);
  const commentsCount = post.comments_count || (post.comments ? post.comments.length : 0);

  return `
    <article class="post-card" id="post-${post.id}" data-post-id="${post.id}">
      <!-- Header -->
      <header class="post-header">
        <div class="post-user-info">
          <div class="post-avatar-wrapper" onclick="App.navigateTo('profile', { username: '${post.username}' })">
            <img class="post-avatar" src="${post.avatar_url || '/uploads/default-avatar.svg'}" alt="${post.username}" onerror="this.src='/uploads/default-avatar.svg'">
          </div>
          <div class="post-user-meta">
            <span class="post-username" onclick="App.navigateTo('profile', { username: '${post.username}' })">${post.username}</span>
            ${post.location ? `<span class="post-location">${post.location}</span>` : ''}
          </div>
        </div>
        ${isOwner ? `
          <button class="post-menu-btn" title="Delete post" onclick="App.confirmDeletePost(${post.id})">
            ${Icons.trash}
          </button>
        ` : ''}
      </header>

      <!-- Media Image with double-click like -->
      <div class="post-media-container" ondblclick="App.handleDoubleTapLike(${post.id}, this)">
        <img class="post-image" src="${post.image_url}" alt="Post image by ${post.username}" loading="lazy">
        <svg class="heart-burst" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      </div>

      <!-- Action Buttons -->
      <div class="post-actions">
        <div class="action-buttons-left">
          <button class="action-btn ${isLiked ? 'liked' : ''}" id="like-btn-${post.id}" title="${isLiked ? 'Unlike' : 'Like'}" onclick="App.handleLikeToggle(${post.id})">
            ${isLiked ? Icons.heartFilled : Icons.heart}
          </button>
          <button class="action-btn" title="Comment" onclick="App.openPostDetailModal(${post.id})">
            ${Icons.comment}
          </button>
          <button class="action-btn" title="Share" onclick="App.copyShareLink(${post.id})">
            ${Icons.share}
          </button>
        </div>
      </div>

      <!-- Content, Likes & Comments -->
      <div class="post-content">
        <div class="likes-counter" onclick="App.openLikesModal(${post.id})">
          <span id="likes-count-${post.id}">${post.likes_count || 0}</span> likes
        </div>

        ${post.caption ? `
          <div class="post-caption-box">
            <span class="caption-username" onclick="App.navigateTo('profile', { username: '${post.username}' })">${post.username}</span>
            <span>${escapeHTML(post.caption)}</span>
          </div>
        ` : ''}

        ${commentsCount > 2 ? `
          <div class="view-comments-btn" onclick="App.openPostDetailModal(${post.id})">
            View all ${commentsCount} comments
          </div>
        ` : ''}

        <div class="comments-preview" id="comments-preview-${post.id}">
          ${(post.comments || []).slice(-2).map(c => renderCommentPreview(c, currentUser, post.id)).join('')}
        </div>

        <time class="post-timestamp">${timeAgo(post.created_at)}</time>
      </div>

      <!-- Add Comment Bar -->
      <form class="add-comment-form" onsubmit="App.handleAddComment(event, ${post.id})">
        <input type="text" class="comment-input" placeholder="Add a comment..." maxlength="500" oninput="App.handleCommentInput(this)">
        <button type="submit" class="comment-submit-btn">Post</button>
      </form>
    </article>
  `;
}

// Render Comment Preview line
function renderCommentPreview(comment, currentUser, postId) {
  const isCommentOwner = currentUser && (currentUser.id === comment.user_id || currentUser.username === comment.username);
  return `
    <div class="comment-line" id="comment-${comment.id}">
      <div class="comment-line-left">
        <span class="comment-user" onclick="App.navigateTo('profile', { username: '${comment.username}' })">${comment.username}</span>
        <span>${escapeHTML(comment.comment_text)}</span>
      </div>
      ${isCommentOwner ? `
        <button class="comment-del-btn" title="Delete comment" onclick="App.handleDeleteComment(${comment.id}, ${postId})">✕</button>
      ` : ''}
    </div>
  `;
}

// Render Explore Grid Item
function renderGridItem(post) {
  return `
    <div class="grid-post-item" onclick="App.openPostDetailModal(${post.id})">
      <img class="grid-post-img" src="${post.image_url}" alt="Post image" loading="lazy">
      <div class="grid-post-overlay">
        <div class="overlay-stat">
          ${Icons.heartFilled}
          <span>${post.likes_count || 0}</span>
        </div>
        <div class="overlay-stat">
          ${Icons.comment}
          <span>${post.comments_count || 0}</span>
        </div>
      </div>
    </div>
  `;
}

// Render Profile Header
function renderProfileHeader(user, isSelf, isFollowing) {
  return `
    <header class="profile-header">
      <div class="profile-avatar-large-wrap">
        <img class="profile-avatar-large" src="${user.avatar_url || '/uploads/default-avatar.svg'}" alt="${user.username}" onerror="this.src='/uploads/default-avatar.svg'">
      </div>

      <div class="profile-details">
        <div class="profile-top-bar">
          <h2 class="profile-heading-username">${user.username}</h2>
          ${isSelf ? `
            <button class="profile-action-btn btn-secondary" onclick="App.openEditProfileModal()">Edit profile</button>
            <button class="profile-action-btn btn-secondary" onclick="App.openCreatePostModal()">+ New Post</button>
          ` : `
            <button class="profile-action-btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}" id="profile-follow-btn" onclick="App.handleProfileFollowToggle(${user.id})">
              ${isFollowing ? 'Following' : 'Follow'}
            </button>
          `}
        </div>

        <div class="profile-stats-bar">
          <div class="stat-item">
            <span class="stat-number">${user.postsCount || 0}</span> <span class="stat-label">posts</span>
          </div>
          <div class="stat-item" onclick="App.openFollowersModal('${user.username}')">
            <span class="stat-number" id="profile-followers-count">${user.followersCount || 0}</span> <span class="stat-label">followers</span>
          </div>
          <div class="stat-item" onclick="App.openFollowingModal('${user.username}')">
            <span class="stat-number" id="profile-following-count">${user.followingCount || 0}</span> <span class="stat-label">following</span>
          </div>
        </div>

        <div class="profile-bio-box">
          <span class="profile-real-name">${escapeHTML(user.full_name || '')}</span>
          ${user.bio ? `<p class="profile-bio-text">${escapeHTML(user.bio)}</p>` : ''}
          ${user.website ? `
            <a href="${user.website.startsWith('http') ? user.website : 'https://' + user.website}" target="_blank" rel="noopener noreferrer" class="profile-website">
              🔗 ${escapeHTML(user.website.replace(/^https?:\/\//, ''))}
            </a>
          ` : ''}
        </div>
      </div>
    </header>
  `;
}

// Render User Row (For Search & Follower/Following Modal)
function renderUserRow(user, currentUser) {
  const isSelf = currentUser && currentUser.id === user.id;
  const isFollowing = Boolean(user.is_following);

  return `
    <div class="user-list-row" id="user-row-${user.id}">
      <div class="user-list-info" onclick="App.navigateTo('profile', { username: '${user.username}' }); App.closeAllModals();">
        <img class="user-list-avatar" src="${user.avatar_url || '/uploads/default-avatar.svg'}" alt="${user.username}" onerror="this.src='/uploads/default-avatar.svg'">
        <div class="suggestion-meta">
          <span class="suggestion-username">${user.username}</span>
          <span class="suggestion-subtitle">${escapeHTML(user.full_name || '')}</span>
        </div>
      </div>
      ${!isSelf && currentUser ? `
        <button class="follow-toggle-btn ${isFollowing ? 'following' : ''}" onclick="App.handleUserRowFollow(${user.id}, this)">
          ${isFollowing ? 'Following' : 'Follow'}
        </button>
      ` : ''}
    </div>
  `;
}

// Utility: HTML escape
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
