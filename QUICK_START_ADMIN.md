# Quick Start Guide - Admin Authentication

## What Was Implemented

Your Emoji Login system now has a complete admin authentication layer with:

✅ **Landing Page** (`/`) - Marketing homepage with feature highlights  
✅ **Admin Login** (`/admin/login`) - Username/password authentication  
✅ **Admin Dashboard** (`/admin/dashboard`) - Password management interface  
✅ **Student Login** (`/login`) - Original emoji authentication (updated with greeting)  
✅ **Secure Sessions** - JWT tokens with 24-hour expiry + httpOnly cookies  
✅ **Password Hashing** - PBKDF2 with 100,000 iterations (MongoDB storage)

---

## How to Create an Admin User

### Option 1: Using a Script

Create `scripts/create-admin.mjs`:

```javascript
import { connectToDatabase } from "../lib/db.ts";
import { hashPassword } from "../lib/auth.ts";
import User from "../lib/models/User.ts";

async function createAdmin() {
  await connectToDatabase();
  
  const username = "teacher1";
  const password = "securePassword123";
  const avatarUrl = "https://via.placeholder.com/48";
  
  const passwordHash = hashPassword(password);
  
  const admin = await User.findOneAndUpdate(
    { username },
    {
      username,
      avatarUrl,
      emojiIds: ["cat", "dog", "lion"], // dummy password IDs
      isAdmin: true,
      passwordHash,
    },
    { upsert: true, new: true }
  );
  
  console.log(`✓ Admin user created: ${username}`);
  console.log(`  Password: ${password}`);
}

createAdmin().catch(console.error);
```

Then run:
```bash
node scripts/create-admin.mjs
```

### Option 2: Direct MongoDB Insert

```javascript
// In MongoDB shell or GUI (Atlas):
const { hashPassword } = require('./lib/auth');

db.users.insertOne({
  username: "teacher1",
  avatarUrl: "https://via.placeholder.com/48",
  emojiIds: ["cat", "dog", "lion"],
  isAdmin: true,
  passwordHash: hashPassword("securePassword123"),
  createdAt: new Date(),
  updatedAt: new Date()
})
```

---

## Navigation Paths

```
User Opens App
  ↓
/  (Landing Page)
  ├── Student Login → /login
  │                    ↓
  │              [Select Profile]
  │                    ↓
  │              [Tap 3 Emojis]
  │                    ↓
  │              [Success/Failure]
  │
  └── Admin Login → /admin/login
                      ↓
                [Enter Username/Password]
                      ↓
                /admin/dashboard
                      ↓
                [Manage Student Passwords]
                [Reset to Default / Rotate Randomly]
```

---

## Environment Setup

Ensure your `.env.local` has:

```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/emoji_login
JWT_SECRET=your-super-secret-key-change-me-in-production
NODE_ENV=development
```

For production, use strong JWT_SECRET and secure MongoDB credentials.

---

## Testing the Flows

### Test 1: Landing Page
```bash
npm run dev
# Open http://localhost:3000
# Should see hero section with features and CTA buttons
```

### Test 2: Student Login
1. Click "Go to Login" button on home page
2. Use "Prev/Next" to browse profiles (one at a time)
3. Click "Use this profile"
4. See personalized greeting: "Welcome, {username}!"
5. Tap 3 emojis to login

### Test 3: Admin Login (after creating admin user)
1. Click "Go to Admin" button on home page
2. Enter username and password
3. Should redirect to `/admin/dashboard`
4. See "Dashboard" in nav (instead of "Admin")
5. Can manage student passwords
6. Click "Logout" to return to home

### Test 4: Session Persistence
1. Login as admin
2. Refresh page
3. Should remain logged in
4. Can access dashboard

### Test 5: Session Expiry
1. Clear cookies manually
2. Try to access `/admin/dashboard`
3. Should redirect to `/admin/login`

---

## File Structure

```
app/
├── page.tsx                    # Landing page (HOME)
├── login/
│   └── page.tsx               # Student emoji login
├── admin/
│   ├── page.tsx               # Dashboard (protected)
│   └── login/
│       └── page.tsx           # Admin login form
└── api/
    ├── auth/
    │   ├── login/route.ts     # POST login credentials
    │   ├── logout/route.ts    # POST logout
    │   └── session/route.ts   # GET check auth
    └── [existing routes]

lib/
├── auth.ts                    # NEW: Password hashing, JWT, sessions
├── models/
│   └── User.ts               # UPDATED: Added isAdmin, passwordHash

components/
└── ui/
    └── top-app-bar.tsx       # UPDATED: Auth-aware navigation
```

---

## API Reference

### POST `/api/auth/login`
**Request:**
```json
{
  "username": "teacher1",
  "password": "securePassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "username": "teacher1"
  }
}
```

**Response (Error):**
```json
{
  "error": "Invalid credentials"
}
```

### POST `/api/auth/logout`
Clears the auth cookie and session.

### GET `/api/auth/session`
**Response (Authenticated):**
```json
{
  "authenticated": true,
  "user": {
    "userId": "...",
    "username": "teacher1",
    "isAdmin": true
  }
}
```

**Response (Not Authenticated):**
```json
{
  "authenticated": false
}
```

---

## Security Notes

1. **Password Hashing**: Uses PBKDF2 with 100,000 iterations + random 32-byte salt
2. **Sessions**: JWT tokens signed with HS256
3. **Cookies**: httpOnly flag prevents JavaScript access (XSS protection)
4. **Session Duration**: 24 hours
5. **Database**: Passwords never stored in plain text

---

## Troubleshooting

### Admin login not working
- Verify admin user exists with `isAdmin: true`
- Check password hash is stored correctly
- Try password directly: `verifyPassword(inputPassword, storedHash)`

### Session not persisting
- Check browser accepts cookies
- Verify `MONGODB_URI` is configured
- Clear cookies and try again

### Dashboard redirects to login
- Check session cookie is set
- Verify JWT_SECRET matches between auth creation and verification

### Build failing
- Run `npm install` to ensure all dependencies
- Check all TypeScript files have no syntax errors
- Verify `.env.local` is set

---

## Next Features (Ideas)

- [ ] Multi-teacher support per school
- [ ] Password reset email flow
- [ ] Admin invitation tokens
- [ ] Activity audit log
- [ ] Backup codes for students
- [ ] Parent portal integration

---

## Support

For issues:
1. Check build output: `npm run build`
2. Check server logs: `npm run dev`
3. Verify database connection: Check MONGODB_URI
4. Check browser console for client-side errors

Happy teaching! 🎓

