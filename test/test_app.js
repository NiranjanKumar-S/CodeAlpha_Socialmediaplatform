process.env.NODE_ENV = 'test';
const assert = require('assert');
const app = require('../server');

let server;
const PORT = 3055;
const BASE_URL = `http://localhost:${PORT}`;

// Simple cookie tracker for session simulation
let cookie = '';

async function fetchWithCookie(url, options = {}) {
  const headers = options.headers || {};
  if (cookie) {
    headers['Cookie'] = cookie;
  }
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers
  });

  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    cookie = setCookie.split(';')[0];
  }

  const json = await res.json().catch(() => null);
  return { status: res.status, data: json };
}

async function runTests() {
  console.log('🧪 Starting ConnectHub End-to-End Automated Tests...\n');

  server = app.listen(PORT, async () => {
    try {
      // 1. Test Demo Users Endpoint
      console.log('▶ Test 1: GET /api/auth/demo-users');
      const demoRes = await fetchWithCookie('/api/auth/demo-users');
      assert.strictEqual(demoRes.status, 200);
      assert.strictEqual(demoRes.data.success, true);
      assert(demoRes.data.users.length > 0);
      console.log('  Demo users loaded successfully.');

      // 2. Test Registration with validation
      console.log('▶ Test 2: POST /api/auth/register (Validation & Registration)');
      const badReg = await fetchWithCookie('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'ab', password: '123' })
      });
      assert.strictEqual(badReg.status, 400); // Invalid fields
      console.log('  Validation rejected invalid input correctly.');

      const testUser = {
        username: `tester_${Date.now().toString().slice(-5)}`,
        email: `tester_${Date.now()}@example.com`,
        password: 'password123',
        full_name: 'Test Automation User'
      };

      const regRes = await fetchWithCookie('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
      });
      assert.strictEqual(regRes.status, 201);
      assert.strictEqual(regRes.data.success, true);
      assert.strictEqual(regRes.data.user.username, testUser.username);
      console.log(`  User @${testUser.username} registered and logged in with session cookie.`);

      // 3. Test Session Check (GET /api/auth/me)
      console.log('▶ Test 3: GET /api/auth/me');
      const meRes = await fetchWithCookie('/api/auth/me');
      assert.strictEqual(meRes.status, 200);
      assert.strictEqual(meRes.data.authenticated, true);
      assert.strictEqual(meRes.data.user.username, testUser.username);
      console.log('  Session persistence verified.');

      // 4. Test Update Profile
      console.log('▶ Test 4: PUT /api/users/profile (Edit Profile)');
      const editRes = await fetchWithCookie('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: 'Updated Tester Name',
          bio: 'Exploring code and testing automated flows.',
          website: 'https://tester.dev'
        })
      });
      assert.strictEqual(editRes.status, 200);
      assert.strictEqual(editRes.data.user.full_name, 'Updated Tester Name');
      console.log('  Profile updated successfully.');

      // 5. Test Create Post
      console.log('▶ Test 5: POST /api/posts (Create Post with JSON)');
      const postRes = await fetchWithCookie('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1080&q=80',
          caption: 'Automated test post from ConnectHub test suite! 🚀',
          location: 'Cyber Laboratory'
        })
      });
      assert.strictEqual(postRes.status, 201);
      assert.strictEqual(postRes.data.success, true);
      const createdPostId = postRes.data.post.id;
      assert(createdPostId > 0);
      console.log(`  Post #${createdPostId} created successfully.`);

      // 5b. Test Multipart File Upload for Post
      console.log('▶ Test 5b: POST /api/posts (Create Post with Multipart File Upload)');
      const form = new FormData();
      const fakeImage = new Blob(['fake image data content for test'], { type: 'image/png' });
      form.append('image', fakeImage, 'test_upload.png');
      form.append('caption', 'Post created via multipart file upload!');
      form.append('location', 'Studio Lab');

      const uploadRes = await fetchWithCookie('/api/posts', {
        method: 'POST',
        body: form
      });
      assert.strictEqual(uploadRes.status, 201);
      assert.strictEqual(uploadRes.data.success, true);
      assert(uploadRes.data.post.image_url.startsWith('/uploads/'));
      console.log(`  Post #${uploadRes.data.post.id} with uploaded file created successfully.`);

      // 6. Test Feed & Explore
      console.log('▶ Test 6: GET /api/posts/feed and /api/posts/explore');
      const feedRes = await fetchWithCookie('/api/posts/feed');
      assert.strictEqual(feedRes.status, 200);
      assert(feedRes.data.posts.some(p => p.id === createdPostId));

      const exploreRes = await fetchWithCookie('/api/posts/explore');
      assert.strictEqual(exploreRes.status, 200);
      assert(exploreRes.data.posts.length > 0);
      console.log('  Feed and Explore contain new post and sample posts.');

      // 7. Test Like & Unlike
      console.log('▶ Test 7: POST /api/posts/:id/like (Toggle Like)');
      const likeRes1 = await fetchWithCookie(`/api/posts/${createdPostId}/like`, { method: 'POST' });
      assert.strictEqual(likeRes1.status, 200);
      assert.strictEqual(likeRes1.data.liked, true);
      assert.strictEqual(likeRes1.data.likesCount, 1);

      const likeRes2 = await fetchWithCookie(`/api/posts/${createdPostId}/like`, { method: 'POST' });
      assert.strictEqual(likeRes2.status, 200);
      assert.strictEqual(likeRes2.data.liked, false);
      assert.strictEqual(likeRes2.data.likesCount, 0);
      console.log('  Like toggle (Like -> Unlike) verified.');

      // 8. Test Comments (Add & Delete)
      console.log('▶ Test 8: Comments Flow (Add & Delete)');
      const commentRes = await fetchWithCookie(`/api/posts/${createdPostId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_text: 'Awesome automated test comment!' })
      });
      assert.strictEqual(commentRes.status, 201);
      const commentId = commentRes.data.comment.id;
      assert(commentId > 0);

      const delCommentRes = await fetchWithCookie(`/api/comments/${commentId}`, { method: 'DELETE' });
      assert.strictEqual(delCommentRes.status, 200);
      assert.strictEqual(delCommentRes.data.success, true);
      console.log('  Comment added and deleted successfully.');

      // 9. Test Follow & Unfollow
      console.log('▶ Test 9: Follow System (Toggle Follow)');
      // Follow alex_travels (ID 1)
      const followRes1 = await fetchWithCookie('/api/users/1/follow', { method: 'POST' });
      assert.strictEqual(followRes1.status, 200);
      assert.strictEqual(followRes1.data.following, true);

      const followRes2 = await fetchWithCookie('/api/users/1/follow', { method: 'POST' });
      assert.strictEqual(followRes2.status, 200);
      assert.strictEqual(followRes2.data.following, false);
      console.log('  Follow/Unfollow user verified.');

      // 10. Test User Search
      console.log('▶ Test 10: GET /api/users/search');
      const searchRes = await fetchWithCookie('/api/users/search?q=alex');
      assert.strictEqual(searchRes.status, 200);
      assert(searchRes.data.users.length > 0);
      console.log('  User search functional.');

      // 11. Test Delete Post
      console.log('▶ Test 11: DELETE /api/posts/:id (Delete Own Post)');
      const delPostRes = await fetchWithCookie(`/api/posts/${createdPostId}`, { method: 'DELETE' });
      assert.strictEqual(delPostRes.status, 200);
      assert.strictEqual(delPostRes.data.success, true);
      console.log('  Post deleted successfully.');

      // 12. Test Logout
      console.log('▶ Test 12: POST /api/auth/logout');
      const logoutRes = await fetchWithCookie('/api/auth/logout', { method: 'POST' });
      assert.strictEqual(logoutRes.status, 200);

      const checkMe = await fetchWithCookie('/api/auth/me');
      assert.strictEqual(checkMe.data.authenticated, false);
      console.log('  Logout cleared session cookie.');

      console.log('\n🎉 ALL 12 TESTS PASSED PERFECTLY!\n');
      process.exit(0);
    } catch (err) {
      console.error('\n❌ Test failed with error:', err);
      process.exit(1);
    }
  });
}

runTests();
