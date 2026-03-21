<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

Repo-specific conventions for this codebase:

- `CLAUDE.md` points to `@AGENTS.md`, so keep this file as the single source of AI guidance.
- This project currently uses the App Router only (`app/layout.tsx`, `app/page.tsx`). Add new pages as `app/<segment>/page.tsx`; update shared shell concerns in `app/layout.tsx`.
- Global styling lives in `app/globals.css` and uses Tailwind v4 style imports (`@import "tailwindcss";`) plus `@theme inline` tokens.
- Use the existing TypeScript alias from `tsconfig.json`: import workspace modules via `@/*`.
- Use npm scripts from `package.json` for workflow: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`.
- Linting is flat-config based in `eslint.config.mjs`, extending `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.
- `mongoose` is installed in dependencies, but there is no database integration code in the current tree yet; do not assume an existing DB layer.

