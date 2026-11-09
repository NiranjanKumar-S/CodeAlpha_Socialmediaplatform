# ConnectHub 📸

A complete, modern Mini Social Media Platform inspired by Instagram, built with Node.js, Express.js, SQLite, and vanilla HTML/CSS/JavaScript.

![ConnectHub Banner](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80)

---

## ✨ Features

### 1. User Authentication & Security
- **Registration**: Custom username validation (`[a-zA-Z0-9._]`), email format validation, and minimum password strength checks.
- **Login & Logout**: Secure express sessions stored in SQLite (`better-sqlite3-session-store`).
- **Password Hashing**: Industry-standard `bcryptjs` hashing with salt rounds.
- **1-Click Instant Demo Accounts**: Quick switcher on the login screen to immediately test accounts (`alex_travels`, `sophia_design`, `marcus_tech`, `elena_foodie`).
- **Route Protection**: Protected endpoints return `401 Unauthorized` for non-authenticated actions.

### 2. User Profiles
- **Profile Header**: Avatar with Instagram-style gradient story rings, username, full name, bio, and website link.
- **Stats Counter**: Live post count, follower count, and following count.
- **Edit Profile**: Modal dialog to update display name, bio, personal website, and upload a new profile picture.
- **User Discovery**: View any creator's profile, browse their post grid, and toggle follow/unfollow.

### 3. Posts & Feed
- **Create Posts**: Upload images directly from disk (JPG, PNG, WEBP, GIF up to 10MB) or provide an image URL, with caption and location tagging.
- **Interactive Feed**: Shows posts from creators you follow and your own, with high-res photos, formatted timestamps, and caption details.
- **Explore Grid**: 3-column photo grid highlighting popular community posts with hover overlay showing like and comment counts.
- **Double-Tap to Like**: Double-clicking an image triggers an animated bursting heart and toggles like state.
- **Delete Posts**: Post creators can delete their own posts, with automatic cascading removal of associated likes and comments.

### 4. Likes & Comments
- **Like / Unlike**: Real-time optimistic UI update with like count and heart icon state.
- **Likes List Modal**: Click on "X likes" to view every user who liked the post.
- **Comments**:
  - Add comments with length validation (up to 500 characters).
  - Delete comments (allowed for the comment author OR the post owner).
  - Post Lightbox Modal: Instagram-style split-pane view with large media on the left and full scrollable comment stream on the right.

### 5. Follow System
- **Follow / Unfollow**: One-click toggle from profile headers, suggested user widgets, search results, or follower lists.
- **Followers & Following Modals**: Click on follower/following counts on any profile to browse the user list.

### 6. UI & Design
- **Instagram-Inspired Aesthetic**: Clean white background (`#ffffff`), subtle borders (`#dbdbdb`), and iconic Instagram gradient accents (`#f09433` -> `#bc1888`).
- **Responsive Layout**:
  - **Desktop**: Left vertical navigation sidebar with brand logo, nav icons, and sticky right sidebar for suggested users.
  - **Tablet**: Compact icon sidebar.
  - **Mobile**: Bottom navigation bar with touch-friendly navigation.
- **Interactive Modals**: Create post, edit profile, lightbox detail view, user lists, and live search.
- **Toast Notifications**: Slide-in status messages for user feedback.

---

## 🏗️ Architecture & Folder Structure

```
connecthub/
├── .env                  # Local environment configuration
├── .env.example          # Example environment configuration
├── README.md             # Documentation and setup instructions
├── package.json          # Node dependencies and npm scripts
├── server.js             # Express.js application entry point
├── database/
│   ├── db.js             # SQLite connection, schema initialization & WAL mode
│   ├── seed.js           # Database seeder with sample creators, posts, comments & follows
│   └── connecthub.sqlite # SQLite database file (created automatically)
├── middleware/
│   ├── auth.js           # requireAuth & optionalAuth session middleware
│   └── upload.js         # Multer configuration for file uploads
├── routes/
│   ├── auth.js           # Registration, login, logout, me, and demo login routes
│   ├── users.js          # Profile view, edit profile, suggested users, followers/following
│   ├── posts.js          # Feed, explore, create, get single post, delete post
│   ├── likes.js          # Toggle post like, list post likes
│   ├── comments.js       # Add comment, delete comment
│   └── follows.js        # Toggle follow/unfollow
├── public/
│   ├── index.html        # Single-page interface shell & modal templates
│   ├── css/
│   │   └── style.css     # Complete Instagram-inspired stylesheet with responsive rules
│   ├── js/
│   │   ├── api.js        # Asynchronous fetch wrappers for backend API endpoints
│   │   ├── state.js      # Central application state & subscriber pattern
│   │   ├── components.js # HTML component generators & SVG icons
│   │   └── app.js        # UI controller, routing, form submissions, and modals
│   └── uploads/          # Directory for uploaded post images and avatars
└── test/
    └── test_app.js       # 12-step end-to-end automated test suite
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ or later
- npm v9+ or later

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   git clone https://github.com/NiranjanKumar-S/CodeAlpha_Socialmediaplatform.git
   cd CodeAlpha_Socialmediaplatform
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Or adjust your `.env` configuration:
   ```env
   PORT=3000
   SESSION_SECRET=connecthub_super_secret_session_key_2026
   NODE_ENV=development
   DB_PATH=database/connecthub.sqlite
   ```

4. **Seed Sample Data (Recommended):**
   Populate the SQLite database with 6 realistic creator profiles, 10 high-resolution photography posts, comments, likes, and follower relationships:
   ```bash
   npm run seed
   ```

5. **Start the Application:**
   ```bash
   npm start
   ```
   Or run in development watch mode:
   ```bash
   npm run dev
   ```

6. **Open in Browser:**
   Visit [http://localhost:3000](http://localhost:3000)

---

## 👥 Demo Accounts

The database comes pre-populated with several creator accounts. You can sign in using the **1-Click Demo Login** pills on the login screen, or enter credentials manually:

| Username | Full Name | Default Password | Role |
| :--- | :--- | :--- | :--- |
| `alex_travels` | Alex Morgan | `password123` | Travel Photographer |
| `sophia_design` | Sophia Chen | `password123` | Product Designer |
| `marcus_tech` | Marcus Johnson | `password123` | Software Architect |
| `elena_foodie` | Elena Rostova | `password123` | Artisan Baker |
| `liam_fitness` | Liam Vance | `password123` | Conditioning Coach |
| `emma_nature` | Emma Watson | `password123` | Botanist & Nature Lover |

---

## 🧪 Running Automated Tests

Run the end-to-end automated test suite to verify all 12 core flows (registration, session persistence, profile editing, post creation, multipart file upload, likes, comments, follows, search, post deletion, and logout):

```bash
npm test
```

---

## 🛡️ Security & Performance

- **Prepared SQL Statements**: All database operations use `better-sqlite3` prepared statements (`.prepare()`), preventing SQL injection.
- **Password Security**: Passwords are never stored in plaintext and are hashed using `bcryptjs`.
- **Session Protection**: Session IDs are stored in HTTP-only cookies with SQLite session persistence.
- **Resource Cleanup**: When a post is deleted, its database record, associated comments, likes, and local uploaded files are safely unlinked.
- **SQLite Performance**: Configured with Write-Ahead Logging (`WAL`) mode and foreign key constraint enforcement (`PRAGMA foreign_keys = ON`).

---

## 📄 License
ISC License. Built for pair-programming demonstration.
