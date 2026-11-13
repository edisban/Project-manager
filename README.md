# Project Manager

A full-stack app for organising projects and the students working on them.

- **Landing page** – a public introduction for visitors; signed-in users go straight to their overview.
- **Overview dashboard** – totals, students added per day (last 14 days), largest projects and newest students.
- **Welcome tour** – a short guided tour on first sign-in; replay it any time from the account menu.
- **Accounts** – self-service sign-up and sign-in; delete your own account (and its data).
- **Projects** – create, rename, delete; search, sort and paginate; student counts per project.
- **Students** – add, edit, remove and move between projects; partial search by name or student ID
  (any alphabet, e.g. Greek); paginated table on desktop, cards on mobile.
- **Privacy** – every project belongs to its creator. Users only ever see their own projects;
  the administrator account sees and manages all of them.
- Light and dark theme (follows the system by default).

## Architecture

```
Browser ──► nginx (frontend container, :4173)
              ├── /          React SPA (static files)
              └── /api/*  ─► Spring Boot API ──► PostgreSQL  (data, Flyway migrations)
                                             └─► Redis       (token revocation, login rate limiting)
```

The SPA and the API are served from **one origin**, which is what allows the auth cookie to be
`SameSite=Strict`. Only the frontend port is published on the host.

| Part | Stack |
|------|-------|
| [client/](client/README.md) | React 19, TypeScript, Vite, MUI 7, TanStack Query, React Router 7, React Hook Form |
| [server/](server/README.md) | Java 17, Spring Boot 3.5, Spring Security, Spring Data JPA, Flyway, Redis |
| Tests | JUnit 5 + Mockito, Testcontainers, Vitest + Testing Library + MSW, Playwright |
| Delivery | Docker multi-stage images (non-root), Docker Compose, GitHub Actions |

## Security model

- Passwords hashed with BCrypt; the API never returns the JWT in a response body.
- The JWT travels in an **HttpOnly, SameSite=Strict** cookie (`Secure` when `AUTH_COOKIE_SECURE=true`),
  so JavaScript cannot read it.
- **CSRF** protection with the double-submit cookie pattern (`XSRF-TOKEN` cookie → `X-XSRF-TOKEN` header).
- **Logout and account deletion revoke the token** server-side (hash stored in Redis until expiry).
- **Brute-force protection**: 5 failed logins per username + IP → HTTP 429 for 15 minutes.
- Authorization on every request: other users' projects/students respond with 404, so their existence is not revealed.
- nginx sends a strict Content-Security-Policy and other security headers; containers run as non-root.

## Quick start (Docker)

Requirements: Docker with Compose v2.

```bash
cp .env.docker.example .env      # PowerShell: Copy-Item .env.docker.example .env
# Edit .env and replace every "change-me" value (e.g. `openssl rand -base64 48`).
docker compose up -d --build --wait
```

Open <http://localhost:4173> and create an account, or sign in with `APP_ADMIN_USERNAME` /
`APP_ADMIN_PASSWORD` to see everything.

Need direct access to the API, database or Redis from local tools? Add the debug overlay, which
publishes them on `127.0.0.1` (ports from `.env`):

```bash
docker compose -f docker-compose.yml -f docker-compose.debug.yml up -d
```

## Development

| Task | Command |
|------|---------|
| Backend tests (unit + integration, needs Docker) | `cd server && ./mvnw verify` |
| Frontend dev server (proxies `/api` to `localhost:8080`) | `cd client && npm run dev` |
| Frontend checks | `cd client && npm run lint && npm run typecheck && npm test` |
| End-to-end tests (stack must be running) | `cd client && npm run test:e2e` |

## CI/CD

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and pull request:

1. **Backend** – `mvn verify` (unit tests + Testcontainers integration tests).
2. **Frontend** – Prettier, ESLint, TypeScript, Vitest, production build.
3. **E2E** – starts the full Compose stack with random secrets and runs Playwright (desktop + mobile).
4. **Publish** – only on `main`: pushes both images to GHCR tagged with the commit SHA and `latest`.
