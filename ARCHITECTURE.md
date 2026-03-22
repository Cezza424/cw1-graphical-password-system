# System Architecture Diagram

## Complete User Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     EMOJI LOGIN SYSTEM v2.0                         │
│                   (With Admin Authentication)                       │
└─────────────────────────────────────────────────────────────────────┘

                              START HERE: /
                              ┌──────────────┐
                              │ Landing Page │
                              │   (Home)     │
                              └──────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
            ┌───────▼────────┐            ┌────────▼──────┐
            │  Student Path  │            │  Admin Path    │
            │  "Go to Login" │            │"Go to Admin"   │
            └───────┬────────┘            └────────┬───────┘
                    │                              │
                    │                              │
            ┌───────▼──────────┐         ┌────────▼─────────┐
            │ /login           │         │ /admin/login     │
            │ (Emoji Password) │         │(Form-based Auth) │
            │                  │         │                  │
            │ 1. Select Profile│         │ Username: ___    │
            │    (one at a     │         │ Password: ___    │
            │     time!)       │         │ [Sign In]        │
            │                  │         │                  │
            │ 2. See greeting: │         └────────┬─────────┘
            │ "Welcome, Leo!"  │                  │
            │                  │         Credentials Valid?
            │ 3. Tap 3 Emojis  │                  │
            │    [🐶][🍕][🦁] │         ┌────────▼──────────┐
            │                  │         │ JWT Token Created │
            │ 4. Password      │         │ Session Cookie    │
            │    Validated?    │         │ Set (httpOnly)    │
            │         │        │         └────────┬──────────┘
            │    ┌────┴─────┐  │                  │
            │    │          │  │          ┌───────▼──────────┐
            │    │ YES   NO │  │          │ /admin/dashboard │
            │    │    │     │  │          │                  │
            │    │    ▼     │  │          │ [PROTECTED]      │
            │    │ Success! │  │          │                  │
            │    │    │     │  │          │ Select Student:  │
            │    │    ▼     │  │          │  ▼ [Dropdown]    │
            │    │ [Logged  │  │          │                  │
            │    │  In]     │  │          │ Current Password:│
            │    │    │     │  │          │  [🐶][🍕][🦁]  │
            │    │    ▼     │  │          │                  │
            │    │ Profile  │  │          │ Actions:         │
            │    │ Access   │  │          │ [Reset Default]  │
            │    │    │     │  │          │ [Rotate Random]  │
            │    │    ▼     │  │          │                  │
            │    │ Retry    │  │          │ [Logout]         │
            │    └────┬─────┘  │          └────────┬─────────┘
            │         │        │                   │
            └─────────┼────────┘          ┌────────┴──────────┐
                      │                    │                   │
                      └─────────┬──────────┴──────────┬────────┘
                                │                     │
                        ┌───────▼────────┐   ┌───────▼────────┐
                        │   Back to /    │   │   Back to /    │
                        │(After Success) │   │(After Logout)  │
                        └────────────────┘   └────────────────┘
```

---

## Data Flow: Admin Login

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ADMIN AUTHENTICATION FLOW                        │
└─────────────────────────────────────────────────────────────────────┘

User fills form:
┌──────────────┐
│ username     │
│ password     │
└──────────────┘
       │
       ▼
POST /api/auth/login
       │
       ├─ Lookup User by username
       │  (isAdmin: true)
       │
       ├─ Verify password hash
       │  user.passwordHash = PBKDF2(
       │    password,
       │    salt,
       │    100000 iterations,
       │    sha512
       │  )
       │
       ├─ Compare computed hash
       │  with stored hash
       │
       ├─ ✅ Match? YES
       │       ▼
       │  Create JWT token:
       │  {
       │    userId: "...",
       │    username: "teacher1",
       │    isAdmin: true,
       │    exp: now + 24h
       │  }
       │       │
       │       ▼
       │  Set httpOnly Cookie:
       │  Set-Cookie: auth_token=<JWT>
       │    HttpOnly
       │    Secure (HTTPS only)
       │    SameSite=Lax
       │    MaxAge=86400
       │       │
       │       ▼
       │  Return success + redirect
       │
       └─ ❌ No Match? NO
               ▼
           Return error:
           "Invalid credentials"
           (No user enumeration)
```

---

## Session Verification Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│              SESSION VERIFICATION (On Page Load)                    │
└─────────────────────────────────────────────────────────────────────┘

User visits /admin/dashboard
       │
       ▼
useEffect(() => {
  fetch('/api/auth/session')
})
       │
       ▼
GET /api/auth/session
       │
       ├─ Read auth_token cookie
       │
       ├─ Decode JWT
       │  verify(token, JWT_SECRET)
       │
       ├─ Valid signature? ✅ YES
       │       ▼
       │  Extract payload:
       │  {
       │    userId: "123",
       │    username: "teacher1",
       │    isAdmin: true
       │  }
       │       │
       │       ▼
       │  Return:
       │  {
       │    authenticated: true,
       │    user: { ... }
       │  }
       │       │
       │       ▼
       │  Show dashboard content
       │
       └─ ❌ Invalid/Expired? NO
               ▼
           Return:
           {
             authenticated: false
           }
               │
               ▼
           Redirect to /admin/login
```

---

## Database Schema

```
┌─────────────────────────────────────────────────────────────────────┐
│                      MONGODB USER SCHEMA                            │
└─────────────────────────────────────────────────────────────────────┘

User Document:
{
  _id: ObjectId("..."),
  
  // Student fields (all users)
  username: "leo-williams",           // String, Unique, Indexed
  avatarUrl: "https://...",          // String (HTTP URL to avatar)
  emojiIds: ["cat", "dog", "lion"],  // Array of emoji IDs
  
  // Admin fields (only if isAdmin=true)
  isAdmin: false,                    // Boolean, Default: false, Indexed
  passwordHash: null,                // String or null, PBKDF2 hash
  
  // Metadata
  createdAt: ISODate("2024-03-22..."),
  updatedAt: ISODate("2024-03-22...")
}

Indexes:
- username (Unique, Ascending)
- isAdmin (Ascending, for admin queries)
```

---

## API Endpoint Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                    API ENDPOINTS (NEW)                             │
└─────────────────────────────────────────────────────────────────────┘

POST /api/auth/login
├─ Request:
│  {
│    username: "teacher1",
│    password: "securePassword123"
│  }
├─ Response Success (200):
│  {
│    success: true,
│    user: {
│      id: "...",
│      username: "teacher1"
│    }
│  }
└─ Response Error (401):
   {
     error: "Invalid credentials"
   }

─────────────────────────────────────────────────────────────────────

POST /api/auth/logout
├─ Request: (no body)
├─ Response Success (200):
│  {
│    success: true
│  }
└─ Response Error (500):
   {
     error: "Internal server error"
   }

─────────────────────────────────────────────────────────────────────

GET /api/auth/session
├─ Response (Authenticated):
│  {
│    authenticated: true,
│    user: {
│      userId: "...",
│      username: "teacher1",
│      isAdmin: true
│    }
│  }
└─ Response (Not Authenticated):
   {
     authenticated: false
   }

─────────────────────────────────────────────────────────────────────

(Existing endpoints unchanged)
POST /api/users
POST /api/password
POST /api/password/verify
```

---

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPONENT STRUCTURE                              │
└─────────────────────────────────────────────────────────────────────┘

TopAppBar (Auth-aware)
├─ Logo + Brand
├─ Navigation (dynamic based on auth)
│  ├─ Unauthenticated:
│  │  ├─ Link: Login (/login)
│  │  └─ Link: Admin (/admin/login)
│  └─ Authenticated (Admin):
│     ├─ Link: Dashboard (/admin/dashboard)
│     └─ Button: Logout
└─ Responsive design

Home Page (/)
├─ TopAppBar
├─ Hero Section
├─ Features Grid (3 columns)
│  ├─ Card component
│  ├─ Card component
│  └─ Card component
├─ CTA Section
│  ├─ Student Path Card
│  │  └─ PrimaryButton → /login
│  └─ Admin Path Card
│     └─ Button → /admin/login
└─ How It Works Section

Login Page (/login)
├─ TopAppBar
├─ Profile Carousel (1 at a time)
│  ├─ Prev Button
│  ├─ Profile Counter
│  ├─ Next Button
│  └─ Single Profile Card with Avatar
├─ After Selection:
│  ├─ Emoji Grid (3x3 or 4x4)
│  ├─ Selection Counter Pill
│  ├─ Status Message
│  └─ Action Buttons

Admin Login Page (/admin/login)
├─ TopAppBar
├─ Login Form Card
│  ├─ Username Input
│  ├─ Password Input
│  ├─ Error Message (if any)
│  └─ PrimaryButton: Sign In
└─ Link to Student Login

Admin Dashboard (/admin/dashboard)
├─ TopAppBar (with Logout)
├─ Header Card
│  └─ "Signed in as: teacher1"
├─ Two-Column Layout
│  ├─ Left: Student Selection Card
│  │  ├─ Dropdown: Select Student
│  │  └─ Source Indicator
│  └─ Right: Current Password Card
│     ├─ Emoji Pills Display
│     └─ Status Message
└─ Action Buttons
   ├─ PrimaryButton: Reset to Default
   └─ Button: Rotate Randomly
```

---

## Security Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE                            │
└─────────────────────────────────────────────────────────────────────┘

Password Hashing:
  Input: "myPassword123"
    │
    ├─ Generate random salt (32 bytes)
    │
    ├─ Apply PBKDF2:
    │  - Algorithm: SHA-512
    │  - Iterations: 100,000
    │  - Output: 64 bytes
    │
    └─ Store: "salt.hash"
       (stored in DB)

─────────────────────────────────────────────────────────────────────

Session Management:
  Login:
    Input Credentials
        │
        ├─ Verify with hashed password
        │
        └─ Generate JWT token
             │
             ├─ Claims:
             │  - userId
             │  - username
             │  - isAdmin
             │  - iat (issued at)
             │  - exp (expires in 24h)
             │
             └─ Sign with HS256
                  │
                  ├─ Secret: JWT_SECRET
                  │
                  └─ Set httpOnly Cookie
                     ├─ HttpOnly: true (no JS access)
                     ├─ Secure: true (HTTPS only)
                     ├─ SameSite: Lax (CSRF protection)
                     └─ MaxAge: 86400 (24 hours)

─────────────────────────────────────────────────────────────────────

Session Verification:
  Request to /admin/dashboard
        │
        ├─ Read auth_token cookie
        │
        ├─ Verify JWT signature
        │  - Decode with JWT_SECRET
        │  - Check exp timestamp
        │
        ├─ If valid:
        │  └─ Show dashboard
        │
        └─ If invalid/expired:
           └─ Redirect to /admin/login

─────────────────────────────────────────────────────────────────────

Logout:
  User clicks "Logout"
        │
        ├─ DELETE auth_token cookie
        │
        └─ Redirect to /
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PRODUCTION DEPLOYMENT                            │
└─────────────────────────────────────────────────────────────────────┘

Internet
   │
   ▼
HTTPS Load Balancer (Cloudflare/AWS)
   │
   ├─ SSL/TLS Termination
   ├─ Rate Limiting
   └─ DDoS Protection
   │
   ▼
Next.js Application Server(s)
   │
   ├─ API Routes (Node.js Runtime)
   │  ├─ /api/auth/*
   │  ├─ /api/users
   │  └─ /api/password/*
   │
   ├─ Server Components
   ├─ Client Components
   └─ Static Assets
   │
   ▼
MongoDB (Cloud or Self-hosted)
   │
   ├─ User Collection
   │  ├─ Student profiles
   │  └─ Admin users (with hashed passwords)
   │
   ├─ Graphical Password Collection
   └─ Audit Log Collection (future)
   │
   ▼
Environment Variables
   ├─ MONGODB_URI
   ├─ JWT_SECRET
   └─ NODE_ENV=production
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                   ERROR HANDLING STRATEGY                           │
└─────────────────────────────────────────────────────────────────────┘

Invalid Credentials:
  POST /api/auth/login
    ├─ User not found? 
    │  └─ Return: "Invalid credentials" (401)
    │
    ├─ Password mismatch?
    │  └─ Return: "Invalid credentials" (401)
    │
    └─ Do NOT reveal which field was wrong
       (prevents account enumeration attacks)

─────────────────────────────────────────────────────────────────────

Session Expired:
  GET /api/auth/session
    ├─ JWT signature invalid?
    │  └─ Return: authenticated: false
    │
    ├─ Token expired (exp < now)?
    │  └─ Return: authenticated: false
    │
    └─ Frontend automatically redirects to /admin/login

─────────────────────────────────────────────────────────────────────

Database Connection Error:
  Any request fails
    ├─ Log error server-side
    ├─ Return generic error to client
    │  └─ "Internal server error" (500)
    │
    └─ Alert ops team (in production)

─────────────────────────────────────────────────────────────────────

Protected Route Access Without Auth:
  User tries /admin/dashboard without session
    ├─ useEffect checks session
    ├─ Session invalid?
    │  └─ Redirect to /admin/login
    │
    └─ Smooth UX (no flash of content)
```

---

This architecture provides:
✅ Security (hashing, JWT, httpOnly cookies)
✅ Scalability (stateless JWT auth)
✅ Reliability (session validation on every request)
✅ Maintainability (clear flow, well-documented)
✅ User Experience (smooth redirects, clear errors)

---

