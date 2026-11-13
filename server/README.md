# Project Manager – API (Spring Boot)

Java 17 · Spring Boot 3.5 · Spring Security · Spring Data JPA · PostgreSQL · Flyway · Redis

## Structure

```
src/main/java/com/edis/backendproject/
├── controller/   REST endpoints (thin: validation, HTTP status codes, cookies)
├── service/      Business rules, authorization (ownership) and transactions
├── repository/   Spring Data JPA repositories and JPQL search queries
├── model/        JPA entities: User, Role, Project, Student
├── dto/          Request/response records, ApiResponse envelope, PageResponse
├── security/     JWT, auth cookie, CSRF, security filter chain
├── exception/    Domain exceptions and the global exception handler
└── config/       Admin bootstrap
src/main/resources/db/migration/   Flyway migrations
src/test/java/…/service/           Unit tests (Mockito)
src/test/java/…/api/               Integration tests (*IT, Testcontainers PostgreSQL + Redis)
```

Entities never leave the service layer; controllers return DTOs.

## API

Every response uses the envelope `{ success, message, data, validationErrors?, timestamp }`.
Lists are paginated: `?page=0&size=12&sort=name,asc&q=search` →
`{ content, page, size, totalElements, totalPages }`. Timestamps are UTC instants (ISO-8601, `Z`).

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/auth/csrf` | Issues the `XSRF-TOKEN` cookie (204) |
| POST | `/api/auth/register` | 201; 409 if the username is taken |
| POST | `/api/auth/login` | Sets the HttpOnly `access_token` cookie; 401 / 429 |
| POST | `/api/auth/logout` | Revokes the token and clears the cookie |
| GET | `/api/auth/me` | Current user, role and session expiry |
| GET | `/api/projects` | `q`, `page`, `size`, `sort` ∈ `createdAt`, `name`, `studentCount` |
| POST | `/api/projects` | 201 + `Location`; 409 on duplicate name (per owner) |
| GET / PUT / DELETE | `/api/projects/{id}` | DELETE → 204 (students are deleted too) |
| GET | `/api/projects/{id}/students` | `q` matches first/last/full name or student ID |
| POST | `/api/students` | 201; 409 on duplicate student ID within the project |
| GET / PUT / DELETE | `/api/students/{id}` | PUT may change `projectId` to move the student |
| DELETE | `/api/users/me` | Deletes the account and its projects (not allowed for the admin) |
| GET | `/api/dashboard` | Totals, 14-day activity (UTC days), top projects, newest students |
| GET | `/actuator/health` | Public |

State-changing requests need the `X-XSRF-TOKEN` header. Projects and students of other users
return 404.

## Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | – | PostgreSQL connection |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_SSL` | `localhost`, `6379`, –, `false` | Redis |
| `JWT_SECRET` | – | ≥ 32 characters, start-up fails otherwise |
| `JWT_EXPIRATION` | `86400000` | Token lifetime in ms |
| `AUTH_COOKIE_SECURE` | `false` | Must be `true` behind HTTPS |
| `MAX_LOGIN_ATTEMPTS`, `LOGIN_LOCKOUT` | `5`, `15m` | Brute-force protection |
| `APP_ADMIN_USERNAME`, `APP_ADMIN_PASSWORD` | – | Admin created on first start (password ≥ 8 chars) |
| `CORS_ALLOWED_ORIGINS` | empty | Only for frontends on another origin; CORS is off when empty |
| `SPRING_PROFILES_ACTIVE=prod` | – | JSON (Logstash) console logging |

## Running locally without Docker

Start PostgreSQL and Redis, export the variables above, then:

```bash
./mvnw spring-boot:run
```

## Tests

```bash
./mvnw test      # unit tests only
./mvnw verify    # unit + integration tests (requires Docker for Testcontainers)
```
