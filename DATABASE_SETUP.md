# Database Integration Setup Guide

## ✅ What's Already Done

1. **MongoDB Connection Layer** (`lib/db.ts`)
   - Mongoose configured with connection caching
   - Graceful fallback if `MONGODB_URI` is not set

2. **Database Schema** (`lib/models/GraphicalPassword.ts`)
   - Stores emoji password with `key: "default"`
   - Includes timestamps

3. **API Endpoints** (`app/api/password/route.ts`)
   - `GET /api/password` - fetches password from DB or fallback
   - `POST /api/password` - updates password in DB
   - Auto-seeds default password if missing

4. **Frontend Integration** (`app/page.tsx`)
   - Loads password from API on mount
   - Displays database source status ("database" vs "fallback")
   - Enhanced error logging

5. **Testing** (`scripts/smoke-test.mjs`)
   - Validates API responses and any-order matching
   - Warns if using fallback password

## 📝 Environment Setup

### 1. Copy the example file
```powershell
Copy-Item .env.example .env.local
```

### 2. Add your MongoDB URI
Edit `.env.local` and set `MONGODB_URI`:

**Option A: MongoDB Atlas (Cloud)**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/graphical-password?retryWrites=true&w=majority
```

**Option B: Local MongoDB**
```
MONGODB_URI=mongodb://localhost:27017/graphical-password
```

### 3. Test the integration
```powershell
npm run dev
npm run smoke:test
```

## 🔍 How to Verify It's Working

1. **Check the UI**
   - Look at the bottom-left corner: "Source: database" indicates DB is connected
   - "Source: fallback" means using default password

2. **Check the browser console**
   - `npm run dev` and open http://localhost:3000
   - Check DevTools Console for any API warnings

3. **Run the smoke test**
   ```powershell
   npm run dev
   npm run smoke:test
   ```
   - Should show: `✅ Smoke test passed` with source information

## 📚 API Reference

### GET `/api/password`
Returns the stored emoji password:
```json
{
  "emojiIds": ["dog", "star", "car"],
  "source": "database"
}
```

### POST `/api/password`
Updates the emoji password:
```bash
curl -X POST http://localhost:3000/api/password \
  -H "Content-Type: application/json" \
  -d '{"emojiIds":["cat","rocket","apple"]}'
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Source: fallback" in UI | Check `MONGODB_URI` in `.env.local` |
| Connection timeout | MongoDB service not running (local) or IP whitelist not configured (Atlas) |
| "Invalid password data" error | Database record is corrupted; API will auto-seed on next request |
| Smoke test fails | Run `npm run dev` first to start the app, then `npm run smoke:test` |

## 🚀 Next Steps (Optional)

- **Multi-user support**: Add a `User` model to store per-user passwords
- **Change password endpoint**: Create UI to allow users to update their password
- **Audit logging**: Track login attempts and password changes
- **Data backup**: Configure MongoDB backups


