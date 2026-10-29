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

## Run locally

### Prerequisites

- Node.js and npm (use a current LTS release).
- PostgreSQL running locally or reachable from your computer.
- Git, if you are cloning the repository.

### 1. Get the project

Clone the repository if needed, then open a terminal in the project root:

```powershell
git clone https://github.com/CarlTeclancing/social-post.git
cd social-post
```

If you already have the project, open a terminal in its root folder instead.

### 2. Create a PostgreSQL database

Create an empty database named `social_publisher`. For example, if PostgreSQL's command-line tools are installed and `psql` is on your PATH:

```powershell
psql -U postgres -c "CREATE DATABASE social_publisher;"
```

You can also create the database using a PostgreSQL GUI. Note the database username, password, host, and port; you will need them in the backend configuration.

### 3. Configure and start the backend

Open a PowerShell terminal in the project root and create the backend environment file:

```powershell
Copy-Item backend\.env.example backend\.env
```

Edit `backend\.env` and set at least:

- `DATABASE_URL` to your PostgreSQL connection string, for example `postgresql://postgres:your-password@localhost:5432/social_publisher?schema=public`. URL-encode special characters in the password.
- `JWT_SECRET` to a long, private, randomly generated value. Do not use the example value in a real deployment.

To enable image/video uploads, also configure the Cloudflare R2 settings in this file: `CLOUDFLARE_R2_ENDPOINT`, `CLOUDFLARE_R2_BUCKET`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, and `PUBLIC_MEDIA_BASE_URL`. Uploads will not work until these are set. To publish through social platforms, configure the relevant provider credentials and connect valid platform account tokens in the app.

Install dependencies, generate the Prisma client, apply database migrations, and start the API:

```powershell
Set-Location backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Keep this terminal running. The API listens on `http://localhost:4000`; you can check it at `http://localhost:4000/health`.

### 4. Configure and start the frontend

Open a second terminal in the project root. Create the frontend environment file:

```powershell
Copy-Item frontend\.env.example frontend\.env
```

The example points the frontend at `http://localhost:4000/api`. Change `VITE_API_URL` in `frontend\.env` only if your backend uses a different address.

Install dependencies and start Vite:

```powershell
Set-Location frontend
npm install
npm run dev
```

Keep this terminal running and open the URL printed by Vite (by default, `http://localhost:5173`).

### 5. Create an account and connect social accounts

Register or sign in through the app. To publish, add a social account from the **Accounts** page using valid platform account IDs and access tokens. Publishing requires the appropriate provider credentials and permissions; use test accounts and test content because posts may be published externally.

## Tests and production build

Run these from the relevant project folder:

```powershell
# Backend tests
Set-Location backend
npm test

# Frontend tests and production build
Set-Location ..\frontend
npm test
npm run build
```

## Test
- Backend: from `backend`, run `npm test`. These tests exercise media validation and the authenticated post-creation API with an isolated in-memory Prisma stub; they do not require PostgreSQL or publish to a real provider.
- Frontend UI and API interactions: from `frontend`, run `npm test`.
- Frontend production build: from `frontend`, run `npm run build`.
- To verify against PostgreSQL, use a separate local test database, set `DATABASE_URL` for that database, then run `npm run prisma:migrate` from `backend` before starting the app. Connect a test social account and create a post from the UI. Provider publishing requires valid provider credentials and may publish externally, so use a provider test account and test content.

## Important production notes
This MVP deliberately keeps provider credentials in `.env` and lets you manually insert authorized account tokens so the core product can be tested before app reviews. Production should complete each provider's OAuth callback, encrypt stored access/refresh tokens at rest, use object storage for uploads, and add a durable job queue. TikTok unaudited Direct Post clients are restricted to private visibility; public posting requires TikTok audit. Instagram publishing requires an eligible professional account and Meta permissions/review. LinkedIn permissions depend on whether publishing as a member or organization.

Do not commit `.env`.
