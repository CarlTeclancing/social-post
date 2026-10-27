# Testing the app

This project has automated tests for the backend and frontend, plus a manual
integration path for checking the app against PostgreSQL and external services.
Start with the automated checks: they do not need PostgreSQL, Cloudflare R2, or
social-platform credentials.

## 1. Run automated tests

From the repository root, run the backend and frontend tests in separate
terminals:

```powershell
Set-Location backend
npm test
```

```powershell
Set-Location frontend
npm test
```

Both projects use Node's built-in test runner (`node --test`). A successful
test run exits with code `0`.

The current backend tests cover media validation and URL/key helpers, as well
as post creation with an in-memory Prisma stub: authenticated creation,
rejection of another user's account, and rejection of unauthenticated
requests. The frontend tests cover API request headers, bearer-token handling,
response parsing, and surfacing API errors.

## 2. Check the frontend production build

From the frontend directory:

```powershell
Set-Location frontend
npm run build
```

Vite writes the production build to `frontend\dist`. A successful build
completes without errors.

## 3. Run a local integration check

This step exercises the app with a real PostgreSQL database. Use a separate
local test database, not production data. Follow the setup instructions in
[README.md](./README.md) to configure `backend\.env` and
`frontend\.env`; never commit either environment file.

1. Make sure PostgreSQL is running and `backend\.env` points
   `DATABASE_URL` at the test database.
2. In a terminal at the repository root, prepare the backend:

   ```powershell
   Set-Location backend
   npm install
   npm run prisma:generate
   npm run prisma:migrate
   npm run dev
   ```

3. Check that the backend is responding at
   [http://localhost:4000/health](http://localhost:4000/health). It should
   return JSON containing `"ok": true`.
4. In a second terminal at the repository root, start the frontend:

   ```powershell
   Set-Location frontend
   npm install
   npm run dev
   ```

5. Open the Vite URL (normally
   [http://localhost:5173](http://localhost:5173)) and try registering,
   signing in, and using the app's account and post flows.

## 4. Check uploads and publishing (optional)

Uploads require the Cloudflare R2 settings and a public media base URL in
`backend\.env`. Without them, the automated media validation/helper tests still
run, but an upload against R2 cannot be verified.

Publishing requires valid platform credentials, connected account tokens, and
the permissions required by each provider. Use provider test accounts and
non-sensitive test content: publishing may create real external posts. Do not
run this check against accounts or data you do not intend to use for testing.

## Troubleshooting

- If `npm test` cannot find packages, run `npm install` in that project's
  directory and retry.
- If Prisma cannot connect or migrate, confirm PostgreSQL is running and that
  `DATABASE_URL` points to the intended test database.
- If the app cannot reach the API, confirm the backend is running and that
  `frontend\.env` has the correct `VITE_API_URL` (the default is
  `http://localhost:4000/api`).
- If an integration check fails, check the relevant terminal output and
  environment configuration. Never paste secrets into issue reports or commit
  them to the repository.
