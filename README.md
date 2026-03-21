
# Graphical Password System

This app is a child-friendly graphical login built with Next.js App Router.
Users select 3 emojis on a 3x3 grid. After each click, that tile disappears.
After 3 selections, the system checks whether the selected emoji IDs match the password in any order.

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

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Password API

- `GET /api/password` returns `{ emojiIds: string[3], source }`
- `POST /api/password` accepts `{ emojiIds: string[3] }`

Example update request:

```bash
curl -X POST http://localhost:3000/api/password \
  -H "Content-Type: application/json" \
  -d '{"emojiIds":["cat","rocket","sun"]}'
```

## Smoke Test

With the dev server running:

```bash
npm run smoke:test
```

The smoke test checks API availability and confirms any-order matching logic.
