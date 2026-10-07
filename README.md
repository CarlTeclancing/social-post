# OnePost MVP

A runnable cross-platform social publishing MVP with `/frontend` and `/backend`.

## Features
- Email/password auth
- Connect Facebook, Instagram, LinkedIn and TikTok account credentials/tokens
- One composer for multiple accounts
- Public image/video URL support
- Post now or schedule
- Per-destination status and error capture
- Retry failed destinations
- PostgreSQL + Prisma
- Minute scheduler
- Provider adapters for Meta, LinkedIn and TikTok

## Run
1. Create PostgreSQL database.
2. `cd backend && cp .env.example .env && npm install && npx prisma generate && npx prisma migrate dev --name init && npm run dev`
3. `cd frontend && cp .env.example .env && npm install && npm run dev`
4. Open `http://localhost:5173`.

## Important production notes
This MVP deliberately keeps provider credentials in `.env` and lets you manually insert authorized account tokens so the core product can be tested before app reviews. Production should complete each provider's OAuth callback, encrypt stored access/refresh tokens at rest, use object storage for uploads, and add a durable job queue. TikTok unaudited Direct Post clients are restricted to private visibility; public posting requires TikTok audit. Instagram publishing requires an eligible professional account and Meta permissions/review. LinkedIn permissions depend on whether publishing as a member or organization.

Do not commit `.env`.
