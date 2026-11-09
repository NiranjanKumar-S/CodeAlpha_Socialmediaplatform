// ConnectHub API Client
const API = {
  async request(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: options.isFormData ? {} : { 'Content-Type': 'application/json', ...options.headers },
        ...options
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }
      return data;
    } catch (err) {
      console.error(`API Error on [${options.method || 'GET'} ${url}]:`, err);
      throw err;
    }
  },

  // Auth
  async getMe() {
    return this.request('/api/auth/me');
  },

  async login(identifier, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });
  },

  async register(userData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async logout() {
    return this.request('/api/auth/logout', { method: 'POST' });
  },

  async getDemoUsers() {
    return this.request('/api/auth/demo-users');
  },

  async demoLogin(username) {
    return this.request('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ username })
    });
  },

  // Feed & Posts
  async getFeed() {
    return this.request('/api/posts/feed');
  },

  async getExplore() {
    return this.request('/api/posts/explore');
  },

  async getPost(id) {
    return this.request(`/api/posts/${id}`);
  },

  async createPost(formData) {
    return this.request('/api/posts', {
      method: 'POST',
      isFormData: true,
      body: formData
    });
  },

  async deletePost(id) {
    return this.request(`/api/posts/${id}`, {
      method: 'DELETE'
    });
  },

  // Likes
  async toggleLike(postId) {
    return this.request(`/api/posts/${postId}/like`, {
      method: 'POST'
    });
  },

  async getLikes(postId) {
    return this.request(`/api/posts/${postId}/likes`);
  },

  // Comments
  async getComments(postId) {
    return this.request(`/api/posts/${postId}/comments`);
  },

  async addComment(postId, commentText) {
    return this.request(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment_text: commentText })
    });
  },

  async deleteComment(commentId) {
    return this.request(`/api/comments/${commentId}`, {
      method: 'DELETE'
    });
  },

  // Users & Profiles
  async getProfile(username) {
    return this.request(`/api/users/profile/${encodeURIComponent(username)}`);
  },

  async updateProfile(formData) {
    return this.request('/api/users/profile', {
      method: 'PUT',
      isFormData: true,
      body: formData
    });
  },

  async searchUsers(query) {
    return this.request(`/api/users/search?q=${encodeURIComponent(query)}`);
  },

  async getSuggestedUsers() {
    return this.request('/api/users/suggested');
  },

  async getFollowers(username) {
    return this.request(`/api/users/${encodeURIComponent(username)}/followers`);
  },

  async getFollowing(username) {
    return this.request(`/api/users/${encodeURIComponent(username)}/following`);
  },

  async toggleFollow(userId) {
    return this.request(`/api/users/${userId}/follow`, {
      method: 'POST'
    });
  }
};
