
# Graphical Password System

This app is a child-friendly graphical login built with Next.js App Router.
Users first select a profile from a carousel (5 cards per page).
After a profile is selected, they select 3 emojis on a 3x3 grid.
After 3 selections, the system checks whether the selected emoji IDs match that profile's password in any order.

## Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- Mongoose (MongoDB-backed password storage)

## Setup

Create a `.env.local` file:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/graphical-password-system
```

If `MONGODB_URI` is missing or unavailable, `GET /api/password` falls back to a default password for demo use.

## Seed Users

Seed 25 user profiles (username, avatar URL, emoji password):

```bash
npm run seed:users
```

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Password API

- `GET /api/users` returns `{ users: Array<{ id, username, avatarUrl }>, source }`
- `GET /api/password?userId=<id>` returns `{ userId, emojiIds: string[3], source }`
- `POST /api/password` accepts `{ userId, emojiIds: string[3] }`

Example update request:

```bash
curl -X POST http://localhost:3000/api/password \
  -H "Content-Type: application/json" \
  -d '{"userId":"<mongo-user-id>","emojiIds":["cat","rocket","sun"]}'
```

## Smoke Test

With the dev server running:

```bash
npm run smoke:test
```

The smoke test checks API availability and confirms any-order matching logic.
