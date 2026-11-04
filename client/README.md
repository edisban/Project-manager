# Project Manager – Web client

React 19 · TypeScript · Vite · MUI 7 · TanStack Query · React Router 7 · React Hook Form

## Structure

```
src/
├── api/            Axios client (CSRF, error normalisation), endpoint functions, types
├── auth/           AuthProvider (session via /auth/me), useAuth, route guards
├── components/     Shared UI: layout (AppShell, UserMenu), dialogs, empty/error states, search
├── features/       Feature components + React Query hooks (projects, students, dashboard, tour, account)
├── pages/          Route pages: LandingPage, AuthPage, DashboardPage, ProjectsPage, ProjectPage, status pages
├── theme/          Design tokens; light & dark colour schemes (CSS variables)
├── utils/          Date/format helpers, form helpers
├── test/           MSW fake backend, test setup, render helper
├── router.tsx      Route table (pages are code-split)
└── main.tsx
e2e/                Playwright tests against the running Docker stack
```

## Conventions

- **Server state lives in TanStack Query** (`features/*/queries.ts`); mutations invalidate the
  affected queries. Local UI state stays in components.
- **URL is the source of truth** for search, sort and page (`?q=…&page=2`), so views are shareable
  and survive reloads.
- **Auth**: the JWT is in an HttpOnly cookie the app can't read. The current user comes from
  `GET /api/auth/me`; any 401 ends the session and shows a "session ended" notice on sign-in.
- **Errors**: every API failure becomes an `ApiError` (`status`, `message`, `fieldErrors`);
  server validation errors are shown on the matching form fields.
- Client-side validation mirrors the backend rules, but the backend is always authoritative.

## Scripts

| Command                                               |                                                                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `npm run dev`                                         | Dev server on <http://localhost:5176>; proxies `/api` to `API_TARGET` (default `http://localhost:8080`) |
| `npm run build` / `npm run preview`                   | Production build / preview                                                                              |
| `npm run lint`, `npm run typecheck`, `npm run format` | ESLint, TypeScript, Prettier                                                                            |
| `npm test`                                            | Vitest + Testing Library; the API is faked with MSW                                                     |
| `npm run test:e2e`                                    | Playwright (desktop + mobile) against `E2E_BASE_URL` (default `http://localhost:4173`)                  |

## Production image

The [Dockerfile](Dockerfile) builds the app and serves it with unprivileged nginx on port 8080.
[nginx.conf](nginx.conf) proxies `/api/` to the backend, caches fingerprinted assets for a year,
never caches `index.html`, and applies the headers in [security-headers.conf](security-headers.conf)
(Content-Security-Policy, X-Frame-Options, etc.).
