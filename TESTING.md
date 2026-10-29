# Testing the app

This project has automated backend tests, automated frontend interaction tests,
and a manual browser checklist. Start with the automated checks: they do not
need PostgreSQL, Cloudflare R2, or social-platform credentials.

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

The backend uses Node's built-in test runner. The frontend uses Vitest with a
simulated browser DOM and React Testing Library. A successful test run exits
with code `0`.

The backend tests cover media validation and URL/key helpers, as well as post
creation with an in-memory Prisma stub. The frontend tests render and interact
with the actual React app: switching to registration, signing in, loading a
connected account, enabling and submitting a post, showing the publishing
view, and displaying an authentication error. Frontend API calls are mocked,
so these tests do not contact a running backend or publish real content.

## 2. Check the frontend production build

From the frontend directory:

```powershell
Set-Location frontend
npm run build
```

Vite writes the production build to `frontend\dist`. A successful build
completes without errors.

## 3. Manual frontend browser checklist

Use this to test the app through its visible interface. For database-backed
checks, start the backend and frontend as described in section 4. Use a test
account and do not connect accounts you do not intend to use for testing.

1. **Authentication:** Open the app signed out. Confirm the sign-in form
   appears. Select **Create an account** and confirm the registration form
   appears; select **Already have an account?** to return to sign-in.
2. **Sign in:** Sign in with a test user. Confirm the **Create post** screen
   appears and the app loads without an error.
3. **Accounts:** Open **Accounts**. If testing against a database, connect a
   platform test account and confirm it appears. Without connected accounts,
   the composer should explain that an account must be connected first.
4. **Compose validation:** Return to **Create post**. Enter post text. Confirm
   **Post now** remains disabled until a connected account is selected, then
   select a test account and confirm it becomes enabled.
5. **Post submission:** Submit only harmless test content to a test account.
   Confirm the app opens **Publishing** and the post appears in its history.
   Publishing can create a real post on the selected platform.
6. **Sign out:** Select **Logout** and confirm the sign-in form returns.

The automated frontend interaction test uses a mock API, so it is safe to run
without a real account or external post.

## 4. Run a local integration check

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
   [http://localhost:5173](http://localhost:5173)) and follow the manual
   frontend checklist above.

## 5. Check uploads and publishing (optional)

Uploads require the Cloudflare R2 settings and a public media base URL in
`backend\.env`. Without them, the automated media validation/helper tests still
run, but an upload against R2 cannot be verified.

Publishing requires valid platform credentials, connected account tokens, and
the permissions required by each provider. Use provider test accounts and
non-sensitive test content: publishing may create real external posts. Do not
run this check against accounts or data you do not intend to use for testing.

## Troubleshooting

- If `npm test` cannot find packages, run `npm install` in that project's
  directory and retry. The frontend tests use Vitest and a simulated browser
  DOM; they do not open a browser window.
- If Prisma cannot connect or migrate, confirm PostgreSQL is running and that
  `DATABASE_URL` points to the intended test database.
- If the app cannot reach the API, confirm the backend is running and that
  `frontend\.env` has the correct `VITE_API_URL` (the default is
  `http://localhost:4000/api`).
- If an integration check fails, check the relevant terminal output and
  environment configuration. Never paste secrets into issue reports or commit
  them to the repository.
