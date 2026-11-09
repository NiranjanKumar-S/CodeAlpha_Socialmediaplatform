// ConnectHub Main Application Controller

const App = {
  async init() {
    console.log('ConnectHub initializing...');

    // Subscribe to state updates
    State.subscribe(() => {
      this.updateNavigationUI();
    });

    // Check auth status
    try {
      const authData = await API.getMe();
      if (authData.authenticated && authData.user) {
        State.setUser(authData.user);
      } else {
        State.setUser(null);
      }
    } catch (err) {
      console.warn('Could not verify session:', err);
      State.setUser(null);
    }

    // Set up global modal listeners
    this.setupModalListeners();

    // Set up hash router
    window.addEventListener('hashchange', () => this.handleRoute());

    // Initial navigation
    this.handleRoute();

    // Load aside suggestions
    this.loadAsideData();
  },

  handleRoute() {
    const hash = window.location.hash.slice(1) || 'feed';
    const [route, param] = hash.split('/');

    if (route === 'explore') {
      this.navigateTo('explore');
    } else if (route === 'profile') {
      const username = param || (State.currentUser ? State.currentUser.username : 'alex_travels');
      this.navigateTo('profile', { username });
    } else if (route === 'login' || route === 'register') {
      this.navigateTo('auth', { tab: route });
    } else {
      this.navigateTo('feed');
    }
  },

  async navigateTo(view, params = {}) {
    State.setView(view, params);
    this.updateActiveNavLink(view);

    const mainContainer = document.getElementById('main-content');
    if (!mainContainer) return;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (view === 'feed') {
      await this.renderFeedView(mainContainer);
    } else if (view === 'explore') {
      await this.renderExploreView(mainContainer);
    } else if (view === 'profile') {
      await this.renderProfileView(mainContainer, params.username);
    } else if (view === 'auth') {
      this.renderAuthView(mainContainer, params.tab || 'login');
    }
  },

  updateNavigationUI() {
    const user = State.currentUser;
    const sidebarAvatar = document.getElementById('nav-user-avatar');
    const bottomNavAvatar = document.getElementById('bottom-nav-avatar');
    const authNavItem = document.getElementById('nav-auth-item');
    const profileNavItem = document.getElementById('nav-profile-item');

    if (user) {
      if (sidebarAvatar) sidebarAvatar.src = user.avatar_url || '/uploads/default-avatar.svg';
      if (bottomNavAvatar) bottomNavAvatar.src = user.avatar_url || '/uploads/default-avatar.svg';
      if (profileNavItem) profileNavItem.style.display = 'flex';
      if (authNavItem) {
        authNavItem.innerHTML = `
          <div class="nav-icon">${Icons.logout}</div>
          <span class="nav-label">Logout</span>
        `;
        authNavItem.onclick = () => this.handleLogout();
      }
    } else {
      if (sidebarAvatar) sidebarAvatar.src = '/uploads/default-avatar.svg';
      if (bottomNavAvatar) bottomNavAvatar.src = '/uploads/default-avatar.svg';
      if (profileNavItem) profileNavItem.style.display = 'none';
      if (authNavItem) {
        authNavItem.innerHTML = `
          <div class="nav-icon">${Icons.login}</div>
          <span class="nav-label">Log In</span>
        `;
        authNavItem.onclick = () => this.navigateTo('auth', { tab: 'login' });
      }
    }
  },

  updateActiveNavLink(view) {
    document.querySelectorAll('.nav-item').forEach(el => {
      const target = el.getAttribute('data-view');
      if (target === view) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  },

  // FEED VIEW
  async renderFeedView(container) {
    container.innerHTML = `
      <div class="content-container">
        <div class="feed-column" id="feed-column">
          <div id="stories-wrapper"></div>
          <div id="posts-stream">
            <div style="text-align:center; padding: 40px; color: var(--text-muted)">Loading feed...</div>
          </div>
        </div>
        <aside class="feed-aside" id="feed-aside">
          <!-- Filled by loadAsideData -->
        </aside>
      </div>
    `;

    // Fetch demo users for stories
    try {
      const demoData = await API.getDemoUsers();
      if (demoData.success && demoData.users) {
        const storiesWrapper = document.getElementById('stories-wrapper');
        if (storiesWrapper) {
          storiesWrapper.innerHTML = renderStories(demoData.users);
        }
      }
    } catch (e) {
      console.warn('Stories load error:', e);
    }

    // Fetch Feed Posts
    try {
      const feedData = await API.getFeed();
      const stream = document.getElementById('posts-stream');
      if (!stream) return;

      if (!feedData.posts || feedData.posts.length === 0) {
        stream.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">${Icons.camera || Icons.create}</div>
            <h3 class="empty-title">Welcome to ConnectHub!</h3>
            <p class="empty-desc">No posts in your feed yet. Start following inspiring creators or share your first memory!</p>
            <button class="profile-action-btn btn-primary" onclick="App.openCreatePostModal()">Create Post</button>
          </div>
        `;
      } else {
        stream.innerHTML = feedData.posts
          .map(post => renderPostCard(post, State.currentUser))
          .join('');
      }
    } catch (err) {
      const stream = document.getElementById('posts-stream');
      if (stream) {
        stream.innerHTML = `<div style="text-align:center; padding: 40px; color: #ef4444">Failed to load feed. Please refresh.</div>`;
      }
    }

    this.renderAsideContent();
  },

  // EXPLORE VIEW
  async renderExploreView(container) {
    container.innerHTML = `
      <div class="explore-container">
        <div class="explore-grid" id="explore-grid">
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted)">
            Discovering trending posts...
          </div>
        </div>
      </div>
    `;

    try {
      const res = await API.getExplore();
      const grid = document.getElementById('explore-grid');
      if (!grid) return;

      if (!res.posts || res.posts.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1;" class="empty-state">
            <h3 class="empty-title">Nothing to explore yet</h3>
            <p class="empty-desc">Be the first to share a photo with the world!</p>
            <button class="profile-action-btn btn-primary" onclick="App.openCreatePostModal()">Share Photo</button>
          </div>
        `;
      } else {
        grid.innerHTML = res.posts.map(post => renderGridItem(post)).join('');
      }
    } catch (err) {
      const grid = document.getElementById('explore-grid');
      if (grid) {
        grid.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; color: #ef4444; padding: 40px;">Failed to load explore feed.</div>`;
      }
    }
  },

  // PROFILE VIEW
  async renderProfileView(container, username) {
    container.innerHTML = `
      <div class="profile-container" id="profile-container">
        <div style="text-align: center; padding: 60px; color: var(--text-muted)">Loading profile...</div>
      </div>
    `;

    try {
      const res = await API.getProfile(username);
      const user = res.user;
      const posts = res.posts || [];
      const isSelf = Boolean(res.user.is_self);
      const isFollowing = Boolean(res.user.is_following);

      const profileBox = document.getElementById('profile-container');
      if (!profileBox) return;

      profileBox.innerHTML = `
        ${renderProfileHeader(user, isSelf, isFollowing)}

        <div class="profile-tabs">
          <div class="profile-tab active">
            ${Icons.grid}
            <span>POSTS</span>
          </div>
        </div>

        ${posts.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">${Icons.create}</div>
            <h3 class="empty-title">No Posts Yet</h3>
            <p class="empty-desc">${isSelf ? 'When you share photos, they will appear on your profile.' : 'This user hasn’t shared any photos yet.'}</p>
            ${isSelf ? `<button class="profile-action-btn btn-primary" onclick="App.openCreatePostModal()">Share your first photo</button>` : ''}
          </div>
        ` : `
          <div class="explore-grid">
            ${posts.map(post => renderGridItem(post)).join('')}
          </div>
        `}
      `;
    } catch (err) {
      const profileBox = document.getElementById('profile-container');
      if (profileBox) {
        profileBox.innerHTML = `
          <div class="empty-state">
            <h3 class="empty-title">User Not Found</h3>
            <p class="empty-desc">The user "@${escapeHTML(username)}" does not exist or may have been removed.</p>
            <button class="profile-action-btn btn-secondary" onclick="App.navigateTo('feed')">Back to Home</button>
          </div>
        `;
      }
    }
  },

  // AUTH VIEW (Login & Register)
  renderAuthView(container, tab = 'login') {
    container.innerHTML = `
      <div class="auth-wrapper">
        <div class="auth-card">
          <div class="auth-brand">
            <div class="brand-logo-icon">CH</div>
            <h1 class="brand-title">ConnectHub</h1>
          </div>

          <div class="auth-tabs">
            <button class="auth-tab-btn ${tab === 'login' ? 'active' : ''}" onclick="App.renderAuthView(document.getElementById('main-content'), 'login')">Log In</button>
            <button class="auth-tab-btn ${tab === 'register' ? 'active' : ''}" onclick="App.renderAuthView(document.getElementById('main-content'), 'register')">Sign Up</button>
          </div>

          ${tab === 'login' ? `
            <form class="auth-form" onsubmit="App.handleLoginSubmit(event)">
              <div class="form-group">
                <input type="text" id="auth-identifier" class="form-control" placeholder="Username or email" required autocomplete="username">
              </div>
              <div class="form-group">
                <input type="password" id="auth-password" class="form-control" placeholder="Password" required autocomplete="current-password">
              </div>
              <button type="submit" class="auth-btn">Log In</button>
            </form>
          ` : `
            <form class="auth-form" onsubmit="App.handleRegisterSubmit(event)">
              <div class="form-group">
                <input type="text" id="reg-fullname" class="form-control" placeholder="Full Name" required>
              </div>
              <div class="form-group">
                <input type="text" id="reg-username" class="form-control" placeholder="Username (letters, numbers, _ .)" required autocomplete="username">
              </div>
              <div class="form-group">
                <input type="email" id="reg-email" class="form-control" placeholder="Email address" required autocomplete="email">
              </div>
              <div class="form-group">
                <input type="password" id="reg-password" class="form-control" placeholder="Password (min 6 chars)" minlength="6" required autocomplete="new-password">
              </div>
              <button type="submit" class="auth-btn">Sign Up</button>
            </form>
          `}

          <!-- Quick 1-Click Demo Accounts -->
          <div class="demo-section">
            <span class="demo-title">⚡ 1-Click Instant Demo Login:</span>
            <div class="demo-pills-grid" id="demo-pills-list">
              <button class="demo-pill" onclick="App.handleDemoLogin('alex_travels')">
                <img class="demo-pill-avatar" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80">
                <span>alex_travels</span>
              </button>
              <button class="demo-pill" onclick="App.handleDemoLogin('sophia_design')">
                <img class="demo-pill-avatar" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80">
                <span>sophia_design</span>
              </button>
              <button class="demo-pill" onclick="App.handleDemoLogin('marcus_tech')">
                <img class="demo-pill-avatar" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80">
                <span>marcus_tech</span>
              </button>
              <button class="demo-pill" onclick="App.handleDemoLogin('elena_foodie')">
                <img class="demo-pill-avatar" src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80">
                <span>elena_foodie</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ASIDE DATA
  async loadAsideData() {
    try {
      const res = await API.getSuggestedUsers();
      if (res.success && res.users) {
        State.suggestedUsers = res.users;
        this.renderAsideContent();
      }
    } catch (e) {
      console.warn('Could not load suggestions:', e);
    }
  },

  renderAsideContent() {
    const aside = document.getElementById('feed-aside');
    if (!aside) return;

    const user = State.currentUser;
    const suggestions = State.suggestedUsers || [];

    aside.innerHTML = `
      ${user ? `
        <div class="aside-user-card">
          <div class="aside-user-info" onclick="App.navigateTo('profile', { username: '${user.username}' })" style="cursor:pointer">
            <img class="aside-avatar" src="${user.avatar_url || '/uploads/default-avatar.svg'}" alt="${user.username}" onerror="this.src='/uploads/default-avatar.svg'">
            <div class="aside-meta">
              <span class="aside-username">${user.username}</span>
              <span class="aside-fullname">${escapeHTML(user.full_name || '')}</span>
            </div>
          </div>
          <button class="switch-account-btn" onclick="App.navigateTo('auth', { tab: 'login' })">Switch</button>
        </div>
      ` : `
        <div class="aside-user-card">
          <div class="aside-user-info">
            <img class="aside-avatar" src="/uploads/default-avatar.svg">
            <div class="aside-meta">
              <span class="aside-username">Guest</span>
              <span class="aside-fullname">Sign in to share & follow</span>
            </div>
          </div>
          <button class="switch-account-btn" onclick="App.navigateTo('auth', { tab: 'login' })">Log in</button>
        </div>
      `}

      ${suggestions.length > 0 ? `
        <div class="suggestions-box">
          <div class="suggestions-header">
            <span class="suggestions-title">Suggested for you</span>
            <button class="view-comments-btn" style="margin:0; font-weight:600" onclick="App.openSearchModal()">See All</button>
          </div>
          <div class="suggestions-list">
            ${suggestions.slice(0, 5).map(u => `
              <div class="suggestion-item">
                <div class="suggestion-user-info" onclick="App.navigateTo('profile', { username: '${u.username}' })">
                  <img class="suggestion-avatar" src="${u.avatar_url || '/uploads/default-avatar.svg'}" alt="${u.username}" onerror="this.src='/uploads/default-avatar.svg'">
                  <div class="suggestion-meta">
                    <span class="suggestion-username">${u.username}</span>
                    <span class="suggestion-subtitle">${escapeHTML(u.full_name || '')}</span>
                  </div>
                </div>
                ${user ? `
                  <button class="follow-toggle-btn" onclick="App.handleUserRowFollow(${u.id}, this)">Follow</button>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <footer style="font-size: 11px; color: var(--text-muted); line-height: 1.8;">
        <div>ConnectHub • Express & SQLite Social Platform</div>
        <div>© 2026 ConnectHub from Google Deepmind Pair</div>
      </footer>
    `;
  },

  // LIKE ACTIONS
  async handleLikeToggle(postId) {
    if (!State.currentUser) {
      this.showToast('Please log in to like posts', 'error');
      this.navigateTo('auth', { tab: 'login' });
      return;
    }

    const likeBtn = document.getElementById(`like-btn-${postId}`);
    const likesCountEl = document.getElementById(`likes-count-${postId}`);

    try {
      const res = await API.toggleLike(postId);
      if (res.success) {
        if (likeBtn) {
          if (res.liked) {
            likeBtn.classList.add('liked');
            likeBtn.innerHTML = Icons.heartFilled;
          } else {
            likeBtn.classList.remove('liked');
            likeBtn.innerHTML = Icons.heart;
          }
        }
        if (likesCountEl) {
          likesCountEl.textContent = res.likesCount;
        }

        // Also update lightbox if open
        const modalLikeBtn = document.getElementById(`modal-like-btn-${postId}`);
        const modalLikesCountEl = document.getElementById(`modal-likes-count-${postId}`);
        if (modalLikeBtn) {
          if (res.liked) {
            modalLikeBtn.classList.add('liked');
            modalLikeBtn.innerHTML = Icons.heartFilled;
          } else {
            modalLikeBtn.classList.remove('liked');
            modalLikeBtn.innerHTML = Icons.heart;
          }
        }
        if (modalLikesCountEl) {
          modalLikesCountEl.textContent = res.likesCount;
        }
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  handleDoubleTapLike(postId, containerEl) {
    const heart = containerEl.querySelector('.heart-burst');
    if (heart) {
      heart.classList.add('animate');
      setTimeout(() => heart.classList.remove('animate'), 700);
    }
    this.handleLikeToggle(postId);
  },

  // COMMENT ACTIONS
  handleCommentInput(input) {
    const form = input.closest('form');
    const submitBtn = form ? form.querySelector('.comment-submit-btn') : null;
    if (submitBtn) {
      if (input.value.trim().length > 0) {
        submitBtn.classList.add('active');
      } else {
        submitBtn.classList.remove('active');
      }
    }
  },

  async handleAddComment(event, postId) {
    event.preventDefault();
    if (!State.currentUser) {
      this.showToast('Please log in to comment', 'error');
      this.navigateTo('auth', { tab: 'login' });
      return;
    }

    const form = event.target;
    const input = form.querySelector('.comment-input');
    const text = input.value.trim();
    if (!text) return;

    try {
      const res = await API.addComment(postId, text);
      if (res.success) {
        input.value = '';
        const submitBtn = form.querySelector('.comment-submit-btn');
        if (submitBtn) submitBtn.classList.remove('active');

        // Append to feed preview
        const preview = document.getElementById(`comments-preview-${postId}`);
        if (preview) {
          const div = document.createElement('div');
          div.innerHTML = renderCommentPreview(res.comment, State.currentUser, postId);
          preview.appendChild(div.firstElementChild);
        }

        // Append to modal comments list if open
        const modalCommentsList = document.getElementById(`detail-comments-list-${postId}`);
        if (modalCommentsList) {
          const row = document.createElement('div');
          row.className = 'detail-comment-row';
          row.id = `detail-comment-${res.comment.id}`;
          row.innerHTML = `
            <img class="detail-comment-avatar" src="${res.comment.avatar_url || '/uploads/default-avatar.svg'}" alt="${res.comment.username}">
            <div class="detail-comment-body">
              <div>
                <span class="comment-user" onclick="App.navigateTo('profile', { username: '${res.comment.username}' }); App.closeAllModals();">${res.comment.username}</span>
                <span>${escapeHTML(res.comment.comment_text)}</span>
              </div>
              <div class="detail-comment-actions">
                <span>Just now</span>
                <button class="comment-del-btn" onclick="App.handleDeleteComment(${res.comment.id}, ${postId})">Delete</button>
              </div>
            </div>
          `;
          modalCommentsList.appendChild(row);
          modalCommentsList.scrollTop = modalCommentsList.scrollHeight;
        }

        this.showToast('Comment added!', 'success');
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  async handleDeleteComment(commentId, postId) {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const res = await API.deleteComment(commentId);
      if (res.success) {
        const line = document.getElementById(`comment-${commentId}`);
        if (line) line.remove();

        const detailRow = document.getElementById(`detail-comment-${commentId}`);
        if (detailRow) detailRow.remove();

        this.showToast('Comment deleted', 'success');
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  // POST DELETION
  async confirmDeletePost(postId) {
    if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) return;

    try {
      const res = await API.deletePost(postId);
      if (res.success) {
        this.showToast('Post deleted', 'success');
        this.closeAllModals();

        const postEl = document.getElementById(`post-${postId}`);
        if (postEl) postEl.remove();

        // If on profile, refresh profile
        if (State.activeView === 'profile') {
          this.navigateTo('profile', State.viewParams);
        }
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  // FOLLOW ACTIONS
  async handleProfileFollowToggle(userId) {
    if (!State.currentUser) {
      this.showToast('Please log in to follow users', 'error');
      this.navigateTo('auth', { tab: 'login' });
      return;
    }

    const btn = document.getElementById('profile-follow-btn');
    const followersCountEl = document.getElementById('profile-followers-count');

    try {
      const res = await API.toggleFollow(userId);
      if (res.success) {
        if (btn) {
          if (res.following) {
            btn.className = 'profile-action-btn btn-secondary';
            btn.textContent = 'Following';
          } else {
            btn.className = 'profile-action-btn btn-primary';
            btn.textContent = 'Follow';
          }
        }
        if (followersCountEl) {
          followersCountEl.textContent = res.followersCount;
        }
        this.showToast(res.following ? 'Followed user' : 'Unfollowed user', 'success');
        this.loadAsideData();
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  async handleUserRowFollow(userId, btnEl) {
    if (!State.currentUser) {
      this.showToast('Please log in to follow users', 'error');
      this.navigateTo('auth', { tab: 'login' });
      return;
    }

    try {
      const res = await API.toggleFollow(userId);
      if (res.success) {
        if (btnEl) {
          if (res.following) {
            btnEl.classList.add('following');
            btnEl.textContent = 'Following';
          } else {
            btnEl.classList.remove('following');
            btnEl.textContent = 'Follow';
          }
        }
        this.showToast(res.following ? 'Following user' : 'Unfollowed user', 'success');
        this.loadAsideData();
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  // MODAL MANAGERS
  setupModalListeners() {
    // Backdrop click closes modal
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          this.closeAllModals();
        }
      });
    });

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  },

  closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
  },

  // CREATE POST MODAL
  openCreatePostModal() {
    if (!State.currentUser) {
      this.showToast('Please log in to create a post', 'error');
      this.navigateTo('auth', { tab: 'login' });
      return;
    }

    const modal = document.getElementById('create-post-modal');
    if (!modal) return;

    // Reset fields
    const form = document.getElementById('create-post-form');
    if (form) form.reset();

    const previewArea = document.getElementById('create-preview-area');
    if (previewArea) previewArea.innerHTML = '';
    const dropZone = document.getElementById('create-drop-zone');
    if (dropZone) dropZone.style.display = 'flex';

    modal.classList.add('open');
  },

  handleImageFileSelected(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewArea = document.getElementById('create-preview-area');
      const dropZone = document.getElementById('create-drop-zone');
      if (previewArea && dropZone) {
        dropZone.style.display = 'none';
        previewArea.innerHTML = `
          <div class="preview-container">
            <img class="preview-img" src="${e.target.result}" alt="Preview">
            <button type="button" class="remove-preview-btn" onclick="App.removeImagePreview()">✕</button>
          </div>
        `;
      }
    };
    reader.readAsDataURL(file);
  },

  removeImagePreview() {
    const fileInput = document.getElementById('post-image-file');
    if (fileInput) fileInput.value = '';
    const urlInput = document.getElementById('post-image-url');
    if (urlInput) urlInput.value = '';

    const previewArea = document.getElementById('create-preview-area');
    const dropZone = document.getElementById('create-drop-zone');
    if (previewArea) previewArea.innerHTML = '';
    if (dropZone) dropZone.style.display = 'flex';
  },

  async handleCreatePostSubmit(event) {
    event.preventDefault();
    const fileInput = document.getElementById('post-image-file');
    const urlInput = document.getElementById('post-image-url');
    const captionInput = document.getElementById('post-caption');
    const locationInput = document.getElementById('post-location');

    const file = fileInput ? fileInput.files[0] : null;
    const imageUrl = urlInput ? urlInput.value.trim() : '';

    if (!file && !imageUrl) {
      this.showToast('Please select an image file or provide an image URL', 'error');
      return;
    }

    const formData = new FormData();
    if (file) {
      formData.append('image', file);
    } else if (imageUrl) {
      formData.append('image_url', imageUrl);
    }

    if (captionInput) formData.append('caption', captionInput.value.trim());
    if (locationInput) formData.append('location', locationInput.value.trim());

    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sharing...';
    }

    try {
      const res = await API.createPost(formData);
      if (res.success) {
        this.showToast('Post created successfully!', 'success');
        this.closeAllModals();
        // Refresh feed or user profile
        this.navigateTo('feed');
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Share';
      }
    }
  },

  // EDIT PROFILE MODAL
  openEditProfileModal() {
    if (!State.currentUser) return;
    const modal = document.getElementById('edit-profile-modal');
    if (!modal) return;

    const user = State.currentUser;
    document.getElementById('edit-fullname').value = user.full_name || '';
    document.getElementById('edit-bio').value = user.bio || '';
    document.getElementById('edit-website').value = user.website || '';
    document.getElementById('edit-avatar-preview').src = user.avatar_url || '/uploads/default-avatar.svg';

    modal.classList.add('open');
  },

  handleAvatarFileSelected(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('edit-avatar-preview').src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  async handleEditProfileSubmit(event) {
    event.preventDefault();
    const fullName = document.getElementById('edit-fullname').value.trim();
    const bio = document.getElementById('edit-bio').value.trim();
    const website = document.getElementById('edit-website').value.trim();
    const avatarFile = document.getElementById('edit-avatar-file').files[0];

    if (!fullName) {
      this.showToast('Full name is required', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('full_name', fullName);
    formData.append('bio', bio);
    formData.append('website', website);
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';
    }

    try {
      const res = await API.updateProfile(formData);
      if (res.success) {
        State.setUser({ ...State.currentUser, ...res.user });
        this.showToast('Profile updated!', 'success');
        this.closeAllModals();
        this.navigateTo('profile', { username: State.currentUser.username });
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Changes';
      }
    }
  },

  // POST DETAIL LIGHTBOX MODAL
  async openPostDetailModal(postId) {
    const modal = document.getElementById('post-detail-modal-backdrop');
    const container = document.getElementById('post-detail-content');
    if (!modal || !container) return;

    container.innerHTML = `<div style="text-align:center; padding: 60px; width: 100%; color: var(--text-muted)">Loading post details...</div>`;
    modal.classList.add('open');

    try {
      const res = await API.getPost(postId);
      const post = res.post;
      const currentUser = State.currentUser;
      const isOwner = post.is_owner;
      const isLiked = Boolean(post.is_liked);

      container.innerHTML = `
        <div class="post-detail-modal">
          <!-- Left: Image -->
          <div class="post-detail-left">
            <img class="post-detail-media" src="${post.image_url}" alt="${post.username}">
          </div>

          <!-- Right: Comments & Actions -->
          <div class="post-detail-right">
            <!-- Header -->
            <div class="post-detail-header">
              <div class="post-user-info">
                <div class="post-avatar-wrapper" onclick="App.navigateTo('profile', { username: '${post.username}' }); App.closeAllModals();">
                  <img class="post-avatar" src="${post.avatar_url || '/uploads/default-avatar.svg'}" alt="${post.username}" onerror="this.src='/uploads/default-avatar.svg'">
                </div>
                <div class="post-user-meta">
                  <span class="post-username" onclick="App.navigateTo('profile', { username: '${post.username}' }); App.closeAllModals();">${post.username}</span>
                  ${post.location ? `<span class="post-location">${post.location}</span>` : ''}
                </div>
              </div>
              <div style="display:flex; align-items:center; gap: 8px;">
                ${isOwner ? `
                  <button class="post-menu-btn" title="Delete post" onclick="App.confirmDeletePost(${post.id})">
                    ${Icons.trash}
                  </button>
                ` : ''}
                <button class="modal-close-btn" onclick="App.closeAllModals()">${Icons.close}</button>
              </div>
            </div>

            <!-- Scrollable Comments -->
            <div class="post-detail-comments-list" id="detail-comments-list-${post.id}">
              ${post.caption ? `
                <div class="detail-comment-row">
                  <img class="detail-comment-avatar" src="${post.avatar_url || '/uploads/default-avatar.svg'}" alt="${post.username}">
                  <div class="detail-comment-body">
                    <div>
                      <span class="comment-user" onclick="App.navigateTo('profile', { username: '${post.username}' }); App.closeAllModals();">${post.username}</span>
                      <span>${escapeHTML(post.caption)}</span>
                    </div>
                    <div class="detail-comment-actions">
                      <span>${timeAgo(post.created_at)}</span>
                    </div>
                  </div>
                </div>
              ` : ''}

              ${post.comments.map(c => `
                <div class="detail-comment-row" id="detail-comment-${c.id}">
                  <img class="detail-comment-avatar" src="${c.avatar_url || '/uploads/default-avatar.svg'}" alt="${c.username}" onerror="this.src='/uploads/default-avatar.svg'">
                  <div class="detail-comment-body">
                    <div>
                      <span class="comment-user" onclick="App.navigateTo('profile', { username: '${c.username}' }); App.closeAllModals();">${c.username}</span>
                      <span>${escapeHTML(c.comment_text)}</span>
                    </div>
                    <div class="detail-comment-actions">
                      <span>${timeAgo(c.created_at)}</span>
                      ${c.can_delete ? `
                        <button class="comment-del-btn" onclick="App.handleDeleteComment(${c.id}, ${post.id})">Delete</button>
                      ` : ''}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Actions Bar -->
            <div class="post-actions" style="border-top: 1px solid var(--border-light)">
              <div class="action-buttons-left">
                <button class="action-btn ${isLiked ? 'liked' : ''}" id="modal-like-btn-${post.id}" title="${isLiked ? 'Unlike' : 'Like'}" onclick="App.handleLikeToggle(${post.id})">
                  ${isLiked ? Icons.heartFilled : Icons.heart}
                </button>
                <button class="action-btn" title="Share" onclick="App.copyShareLink(${post.id})">
                  ${Icons.share}
                </button>
              </div>
            </div>

            <div style="padding: 0 16px 10px 16px;">
              <div class="likes-counter" onclick="App.openLikesModal(${post.id})">
                <span id="modal-likes-count-${post.id}">${post.likes_count || 0}</span> likes
              </div>
              <time class="post-timestamp">${timeAgo(post.created_at)}</time>
            </div>

            <!-- Add Comment Form -->
            <form class="add-comment-form" onsubmit="App.handleAddComment(event, ${post.id})">
              <input type="text" class="comment-input" placeholder="Add a comment..." maxlength="500" oninput="App.handleCommentInput(this)">
              <button type="submit" class="comment-submit-btn">Post</button>
            </form>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="text-align:center; padding: 40px; color:#ef4444">Could not load post.</div>`;
    }
  },

  // LIKES LIST MODAL
  async openLikesModal(postId) {
    const modal = document.getElementById('user-list-modal');
    const title = document.getElementById('user-list-title');
    const body = document.getElementById('user-list-body');
    if (!modal) return;

    title.textContent = 'Likes';
    body.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-muted)">Loading...</div>`;
    modal.classList.add('open');

    try {
      const res = await API.getLikes(postId);
      if (res.users.length === 0) {
        body.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-muted)">No likes yet.</div>`;
      } else {
        body.innerHTML = res.users.map(u => renderUserRow(u, State.currentUser)).join('');
      }
    } catch (err) {
      body.innerHTML = `<div style="text-align:center; padding: 20px; color: #ef4444">Failed to load likes.</div>`;
    }
  },

  // FOLLOWERS LIST MODAL
  async openFollowersModal(username) {
    const modal = document.getElementById('user-list-modal');
    const title = document.getElementById('user-list-title');
    const body = document.getElementById('user-list-body');
    if (!modal) return;

    title.textContent = 'Followers';
    body.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-muted)">Loading...</div>`;
    modal.classList.add('open');

    try {
      const res = await API.getFollowers(username);
      if (res.followers.length === 0) {
        body.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-muted)">No followers yet.</div>`;
      } else {
        body.innerHTML = res.followers.map(u => renderUserRow(u, State.currentUser)).join('');
      }
    } catch (err) {
      body.innerHTML = `<div style="text-align:center; padding: 20px; color: #ef4444">Failed to load followers.</div>`;
    }
  },

  // FOLLOWING LIST MODAL
  async openFollowingModal(username) {
    const modal = document.getElementById('user-list-modal');
    const title = document.getElementById('user-list-title');
    const body = document.getElementById('user-list-body');
    if (!modal) return;

    title.textContent = 'Following';
    body.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-muted)">Loading...</div>`;
    modal.classList.add('open');

    try {
      const res = await API.getFollowing(username);
      if (res.following.length === 0) {
        body.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-muted)">Not following anyone yet.</div>`;
      } else {
        body.innerHTML = res.following.map(u => renderUserRow(u, State.currentUser)).join('');
      }
    } catch (err) {
      body.innerHTML = `<div style="text-align:center; padding: 20px; color: #ef4444">Failed to load following.</div>`;
    }
  },

  // SEARCH MODAL
  openSearchModal() {
    const modal = document.getElementById('search-modal');
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    if (!modal) return;

    if (input) input.value = '';
    if (results) results.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-muted)">Type a username or name to search</div>';
    modal.classList.add('open');
    if (input) input.focus();
  },

  searchDebounceTimer: null,
  handleSearchInput(query) {
    clearTimeout(this.searchDebounceTimer);
    const results = document.getElementById('search-results');

    if (!query.trim()) {
      if (results) results.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-muted)">Type a username or name to search</div>';
      return;
    }

    this.searchDebounceTimer = setTimeout(async () => {
      try {
        const res = await API.searchUsers(query.trim());
        if (!results) return;

        if (res.users.length === 0) {
          results.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-muted)">No users found for "${escapeHTML(query)}"</div>`;
        } else {
          results.innerHTML = res.users.map(u => renderUserRow(u, State.currentUser)).join('');
        }
      } catch (e) {
        if (results) results.innerHTML = '<div style="text-align:center; color: #ef4444; padding: 20px;">Search failed</div>';
      }
    }, 250);
  },

  // AUTH SUBMISSIONS
  async handleLoginSubmit(event) {
    event.preventDefault();
    const identifier = document.getElementById('auth-identifier').value.trim();
    const password = document.getElementById('auth-password').value;

    const btn = event.target.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Logging in...';
    }

    try {
      const res = await API.login(identifier, password);
      if (res.success) {
        State.setUser(res.user);
        this.showToast(`Welcome back, @${res.user.username}!`, 'success');
        this.navigateTo('feed');
        this.loadAsideData();
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Log In';
      }
    }
  },

  async handleRegisterSubmit(event) {
    event.preventDefault();
    const full_name = document.getElementById('reg-fullname').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    const btn = event.target.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Creating account...';
    }

    try {
      const res = await API.register({ full_name, username, email, password });
      if (res.success) {
        State.setUser(res.user);
        this.showToast(`Account created! Welcome @${res.user.username}!`, 'success');
        this.navigateTo('feed');
        this.loadAsideData();
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Sign Up';
      }
    }
  },

  async handleDemoLogin(username) {
    try {
      const res = await API.demoLogin(username);
      if (res.success) {
        State.setUser(res.user);
        this.showToast(`Logged in as @${res.user.username}`, 'success');
        this.navigateTo('feed');
        this.loadAsideData();
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  async handleLogout() {
    try {
      await API.logout();
      State.setUser(null);
      this.showToast('Logged out successfully', 'success');
      this.navigateTo('feed');
      this.loadAsideData();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  copyShareLink(postId) {
    const url = `${window.location.origin}/#post/${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.showToast('Post link copied to clipboard!', 'success');
    }).catch(() => {
      this.showToast('Link: ' + url, 'success');
    });
  },

  // TOAST NOTIFICATIONS
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
