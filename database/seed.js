const bcrypt = require('bcryptjs');
const db = require('./db');

function seed() {
  console.log('🌱 Starting ConnectHub database seeding...');

  // Clear existing data safely
  db.exec(`
    DELETE FROM comments;
    DELETE FROM likes;
    DELETE FROM follows;
    DELETE FROM posts;
    DELETE FROM users;
    DELETE FROM sqlite_sequence WHERE name IN ('users', 'posts', 'likes', 'comments', 'follows');
  `);

  const passwordHash = bcrypt.hashSync('password123', 10);

  // 1. Insert sample users
  const users = [
    {
      username: 'alex_travels',
      email: 'alex@connecthub.com',
      full_name: 'Alex Morgan',
      bio: 'Travel photographer & nomad 🌍✈️ Chasing golden hour across 42 countries. Leica & drone pilot.',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      website: 'https://alexadventures.photo'
    },
    {
      username: 'sophia_design',
      email: 'sophia@connecthub.com',
      full_name: 'Sophia Chen',
      bio: 'Lead UX/UI Designer 🎨 Building clean human-centered products. Minimalist architecture & espresso ☕',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      website: 'https://sophiachen.design'
    },
    {
      username: 'marcus_tech',
      email: 'marcus@connecthub.com',
      full_name: 'Marcus Johnson',
      bio: 'Software Architect & Tech Creator 💻 Building next-gen web & AI systems. Open source advocate.',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      website: 'https://github.com/marcusj'
    },
    {
      username: 'elena_foodie',
      email: 'elena@connecthub.com',
      full_name: 'Elena Rostova',
      bio: 'Artisan Baker & Culinary Explorer 🥑🥖 Sourdough obsessives & plant-based treats. Food brings us together.',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
      website: 'https://elenatables.com'
    },
    {
      username: 'liam_fitness',
      email: 'liam@connecthub.com',
      full_name: 'Liam Vance',
      bio: 'Hybrid Athlete & Conditioning Coach 🏃‍♂️⛰️ Trail running, functional strength & mindset training.',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      website: 'https://vancefitness.club'
    },
    {
      username: 'emma_nature',
      email: 'emma@connecthub.com',
      full_name: 'Emma Watson',
      bio: 'Botanist & wildlife conservationist 🌿 Living off the grid in the Pacific Northwest.',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
      website: 'https://wildlifeearth.org'
    }
  ];

  const insertUserStmt = db.prepare(`
    INSERT INTO users (username, email, password_hash, full_name, bio, avatar_url, website)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const userIds = {};
  for (const u of users) {
    const res = insertUserStmt.run(u.username, u.email, passwordHash, u.full_name, u.bio, u.avatar_url, u.website);
    userIds[u.username] = res.lastInsertRowid;
  }
  console.log(` Created ${users.length} sample users.`);

  // 2. Insert sample posts
  const posts = [
    {
      username: 'alex_travels',
      image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1080&q=80',
      caption: 'Sunrise over Yosemite Valley never gets old. Crisp 4 AM air and reflections that make you pause and breathe. 🌲🏔️',
      location: 'Yosemite National Park, California'
    },
    {
      username: 'alex_travels',
      image_url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1080&q=80',
      caption: 'Lost in the magic of Parisian streets after midnight. Every street corner tells a story from a hundred years ago. ✨🇫🇷',
      location: 'Paris, France'
    },
    {
      username: 'sophia_design',
      image_url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1080&q=80',
      caption: 'Clean lines, warm sunlight, and a freshly brewed pourover. Ready to tackle our brand new design system today! 📐✨',
      location: 'Studio Loft, San Francisco'
    },
    {
      username: 'sophia_design',
      image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1080&q=80',
      caption: 'Interior architecture appreciation post. Notice how natural light transforms this living space into a calm sanctuary. 🏡🤍',
      location: 'Stockholm, Sweden'
    },
    {
      username: 'marcus_tech',
      image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1080&q=80',
      caption: 'Shipped a major release ahead of schedule! Nothing beats clean architecture and a zero-warning test suite. Time to celebrate 🚀🎉',
      location: 'Silicon Valley, CA'
    },
    {
      username: 'marcus_tech',
      image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1080&q=80',
      caption: 'The beauty of high-density silicon and engineering precision. Technology is modern wizardry. ⚡🤖',
      location: 'Tech Lab HQ'
    },
    {
      username: 'elena_foodie',
      image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1080&q=80',
      caption: 'Warm sourdough boule fresh out of the Dutch oven. Hear that crackling crust singing? 🍞🔥 Recipe dropping in bio soon!',
      location: 'The Flour Barn'
    },
    {
      username: 'elena_foodie',
      image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1080&q=80',
      caption: 'Vibrant Mediterranean bowl packed with crispy chickpeas, roasted beets, kalamata olives and herb tahini dressing 🥗🥑',
      location: 'Santorini Kitchen'
    },
    {
      username: 'liam_fitness',
      image_url: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=1080&q=80',
      caption: 'Conquered Mount Baldy before the sun peaked over the ridge. 14 miles, 3800ft vertical gain, pure mental clarity. Keep grinding! 🏔️👟',
      location: 'San Gabriel Mountains'
    },
    {
      username: 'emma_nature',
      image_url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1080&q=80',
      caption: 'Morning mist filtering through the old-growth Douglas fir canopy. Nature is where the soul recalibrates. 🌲🍃',
      location: 'Olympic National Forest'
    }
  ];

  const insertPostStmt = db.prepare(`
    INSERT INTO posts (user_id, image_url, caption, location)
    VALUES (?, ?, ?, ?)
  `);

  const createdPostIds = [];
  for (const p of posts) {
    const res = insertPostStmt.run(userIds[p.username], p.image_url, p.caption, p.location);
    createdPostIds.push(res.lastInsertRowid);
  }
  console.log(` Created ${posts.length} sample posts.`);

  // 3. Insert Follows (Interconnecting all users)
  const follows = [
    ['alex_travels', 'sophia_design'],
    ['alex_travels', 'marcus_tech'],
    ['alex_travels', 'elena_foodie'],
    ['sophia_design', 'alex_travels'],
    ['sophia_design', 'emma_nature'],
    ['marcus_tech', 'sophia_design'],
    ['marcus_tech', 'alex_travels'],
    ['elena_foodie', 'sophia_design'],
    ['elena_foodie', 'alex_travels'],
    ['elena_foodie', 'liam_fitness'],
    ['liam_fitness', 'alex_travels'],
    ['liam_fitness', 'emma_nature'],
    ['emma_nature', 'alex_travels'],
    ['emma_nature', 'sophia_design'],
    ['emma_nature', 'elena_foodie']
  ];

  const insertFollowStmt = db.prepare(`
    INSERT OR IGNORE INTO follows (follower_id, following_id)
    VALUES (?, ?)
  `);

  for (const [follower, following] of follows) {
    insertFollowStmt.run(userIds[follower], userIds[following]);
  }
  console.log(` Created ${follows.length} follower relationships.`);

  // 4. Insert Likes
  const insertLikeStmt = db.prepare(`
    INSERT OR IGNORE INTO likes (user_id, post_id)
    VALUES (?, ?)
  `);

  const allUserIds = Object.values(userIds);
  for (const postId of createdPostIds) {
    // Give each post 2-5 likes from different users
    const likers = allUserIds.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 4) + 2);
    for (const uId of likers) {
      insertLikeStmt.run(uId, postId);
    }
  }
  console.log(' Distributed realistic likes across posts.');

  // 5. Insert Comments
  const comments = [
    { postIdIndex: 0, username: 'sophia_design', text: 'This lighting is unbelievable Alex! What focal length did you use?' },
    { postIdIndex: 0, username: 'marcus_tech', text: 'Incredible shot. The clarity in the reflections is breathtaking.' },
    { postIdIndex: 0, username: 'emma_nature', text: 'Yosemite holds a special place in my heart. Gorgeous framing! 🌲' },
    { postIdIndex: 1, username: 'elena_foodie', text: 'Paris at night is pure poetry. Hope you grabbed some late night crêpes!' },
    { postIdIndex: 1, username: 'sophia_design', text: 'The cobblestone textures look so cinematic here.' },
    { postIdIndex: 2, username: 'marcus_tech', text: 'Minimalist perfection! That lighting setup is top tier.' },
    { postIdIndex: 2, username: 'alex_travels', text: 'Love this space Sophia! Inspiring workspace.' },
    { postIdIndex: 4, username: 'sophia_design', text: 'Congrats on shipping! Can’t wait to see the new features in action.' },
    { postIdIndex: 4, username: 'liam_fitness', text: 'Hard work pays off brother! Congrats! 🔥' },
    { postIdIndex: 6, username: 'alex_travels', text: 'Now I am starving! That crust looks immaculate 🤤' },
    { postIdIndex: 6, username: 'sophia_design', text: 'Please send a loaf through the mail immediately haha!' },
    { postIdIndex: 7, username: 'liam_fitness', text: 'Macros looking on point! Perfect post-workout fuel.' },
    { postIdIndex: 8, username: 'alex_travels', text: 'Major respect Liam! Baldy is no joke of a climb.' },
    { postIdIndex: 9, username: 'sophia_design', text: 'The atmospheric fog is sublime. Total serenity.' }
  ];

  const insertCommentStmt = db.prepare(`
    INSERT INTO comments (user_id, post_id, comment_text)
    VALUES (?, ?, ?)
  `);

  for (const c of comments) {
    const pId = createdPostIds[c.postIdIndex];
    if (pId) {
      insertCommentStmt.run(userIds[c.username], pId, c.text);
    }
  }
  console.log(` Created ${comments.length} sample comments.`);
  console.log(' Seeding completed successfully!');
}

seed();
