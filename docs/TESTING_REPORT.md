# API Testing and Validation Report

**Test date:** 2026-11-25 · **Environment:** Windows 11, Node.js 24.21.0, NestJS 11.2, TypeORM 0.3.31, XAMPP MariaDB 10.4.32 (MySQL-compatible) on localhost:3306.

All results in this report were produced by actually running the tests on the development machine. Nothing is estimated. Items that still need manual action are marked **⚠ TO DO**.

## 8.1 Testing approach

| Level | Tool | Database | What it proves |
|---|---|---|---|
| Unit tests | Jest + ts-jest (`npm run test`) | none (mocks) | Pure logic: dates, money, id validation, ownership, RolesGuard, login rules, env validation |
| End-to-end (integration) tests | Jest + Supertest (`npm run test:e2e`) | real MySQL, isolated `maristay_test_db` — dropped, migrated and seeded at the start of every run | The whole stack (guards → pipes → controllers → services → TypeORM → MySQL) and the integrated workflow |
| Manual API testing | Postman collection (`exports/MariStay.postman_collection.json`) | local `maristay_db` | Live demonstration; request/response inspection |
| Manual smoke scripts | Node `fetch` scripts during development | `maristay_test_db` | Every endpoint, positive and negative cases, while building each module |
| Database checks | `mysql` CLI | both | CHECK / FK constraints reject bad data; SQL export re-imports cleanly |

The e2e database name must end with `_test` (or `_test_db`); the test refuses to reset any other database, so demo data in `maristay_db` is never touched.

## 8.2 Automated test results

### Unit tests — `npm run test` → **33 passed, 0 failed** (4 suites)

| Suite | Tests |
|---|---|
| `config/env.validation.spec.ts` | accepts a complete configuration · refuses to start without a JWT secret (no insecure fallback) · refuses the placeholder or a short secret · rejects an unsafe database name |
| `common/utilities/utilities.spec.ts` | nights in a half-open range · only real YYYY-MM-DD dates · key expiry 12:00 local on check-out date · centavo arithmetic avoids float errors · ParseIdPipe accepts positive integers and rejects `0`, `-1`, `abc`, `1.5`, `1 OR 1=1`, empty (400) · guest can access own record · guest blocked from another guest's record (403) · operations staff allowed · disallowed staff roles blocked · custom role list honoured · unique high-entropy key codes · deterministic SHA-256 key hashing · password policy |
| `common/guards/roles.guard.spec.ts` | routes without @Roles allowed · public routes allowed · listed role allowed · wrong role → 403 (not 401) |
| `auth/auth.service.spec.ts` | valid guest gets JWT with id/accountType/role and no hash · staff login carries staff role · wrong password → 401 · unknown email → same 401 message · INACTIVE account → 401 · deactivated account's token resolves to no user |

### End-to-end tests — `npm run test:e2e` → **46 passed, 0 failed** (≈8 s)

| # | Scenario (test name) | Expected | Actual |
|---|---|---|---|
| 1 | registers a guest without exposing the password hash | 201 | ✔ 201 |
| 2 | rejects a duplicate email, also across staff accounts | 409 | ✔ 409 |
| 3 | rejects invalid registration data and unknown properties | 400 | ✔ 400 |
| 4 | logs in with valid credentials and returns a JWT | 200 | ✔ 200 |
| 5 | rejects invalid credentials | 401 | ✔ 401 |
| 6 | protected route without a token | 401 | ✔ 401 |
| 7 | protected route with invalid / tampered token | 401 | ✔ 401 |
| 8 | current profile with a valid token | 200 | ✔ 200 |
| 9 | guest calls a manager-only route | 403 | ✔ 403 |
| 10 | guest reads another guest's profile | 403 | ✔ 403 |
| 11 | non-numeric id | 400 | ✔ 400 |
| 12 | deactivated account blocked immediately, even with an unexpired token | 204 then 401 | ✔ |
| 13 | public room list with `?roomStatus=Available` | 200, all AVAILABLE | ✔ |
| 14 | invalid status filter | 400 | ✔ 400 |
| 15 | create room | 201 | ✔ 201 |
| 16 | invalid room data / duplicate room number | 400 / 409 | ✔ |
| 17 | retrieve room | 200 | ✔ 200 |
| 18 | update room with PATCH | 200 | ✔ 200 |
| 19 | replace room with PUT (missing field → 400) | 400 / 200 | ✔ |
| 20 | delete test room, then GET | 204 / 404 | ✔ |
| 21 | delete room with reservation history | 409 | ✔ 409 |
| 22 | invalid reservation dates (reversed, past, 2026-02-30) | 400 | ✔ 400 |
| 23 | book a room → PENDING, total = 3 × 1800 | 201 | ✔ 201 |
| 24 | overlapping reservation rejected; same-day turnover allowed | 409 / 201 | ✔ |
| 25 | **6 concurrent conflicting bookings** | exactly one 201, five 409 | ✔ `[201, 409, 409, 409, 409, 409]` |
| 26 | guest views another guest's reservation; guest lists only own | 403 | ✔ |
| 27 | housekeeping lists reservations | 403 | ✔ 403 |
| 28 | client-controlled status / booking for someone else | 400 / 403 | ✔ |
| 29 | workflow step 4: guest books a room for today | 201 | ✔ |
| 30 | check-in without sufficient payment (pending, then confirmed-but-unpaid) | 409 | ✔ 409 "Payment required…" |
| 31 | invalid payment information; guest tries to record payment | 400 / 403 | ✔ |
| 32 | step 5: FAILED payment not counted; PAID payment auto-confirms | 201, CONFIRMED | ✔ |
| 33 | check-in when room is not ready (CLEANING) | 409 | ✔ 409 "not ready" |
| 34 | step 6: digital check-in → CHECKED_IN, room OCCUPIED, key issued, notifications simulated | 200 | ✔ |
| 35 | only a SHA-256 hash of the key is stored in MySQL | hash ≠ code | ✔ |
| 36 | step 7: valid key → access granted; invalid key → denied | 200 / 403 | ✔ |
| 37 | expired key and revoked key rejected | 403 / 403 | ✔ |
| 38 | step 8: service order priced by server (2 × 450 = 900); client price rejected | 201 / 400 | ✔ |
| 39 | unauthorized service order (other guest / not checked in) | 403 / 409 | ✔ |
| 40 | step 9: check-out blocked by unpaid 900.00, then succeeds; key no longer works | 409 / 200 / 403 | ✔ |
| 41 | step 10: housekeeper cannot touch another housekeeper's task or payments | 403 | ✔ |
| 42 | step 10: invalid transition 409; IN_PROGRESS → COMPLETED; room becomes AVAILABLE | 409 / 200 | ✔ |
| 43 | manager assigns housekeeping task; duplicate open task | 201 / 409 | ✔ |
| 44 | staff create / read / update / deactivate; deactivated staff cannot log in | 201/200/200/204/401 | ✔ |
| 45 | staff endpoints are manager-only | 403 | ✔ 403 |
| 46 | login rate limit | 429 | ✔ 429 |

Raw output (last run):
```
Test Suites: 1 passed, 1 total
Tests:       46 passed, 46 total
```

### Coverage of the required test scenarios (MASTER_PROMPT §21)

| Required scenario | Covered by |
|---|---|
| Successful guest registration / duplicate email | e2e 1, 2 · Postman 2, 11 |
| Valid login / invalid credentials | e2e 4, 5 · Postman 1, 11 |
| Protected route without token / invalid token | e2e 6, 7 · Postman 11 |
| Guest attempting manager-only operations | e2e 9 · Postman 11 |
| Guest accessing another guest's reservation | e2e 26 · Postman 11 |
| Valid / invalid room creation, retrieval, update, deletion | e2e 15–21 · Postman 3, 11 |
| Invalid reservation dates / successful reservation / overlap | e2e 22–24 · Postman 4, 11 |
| Concurrent conflicting reservation attempts | e2e 25 · Postman 11 (4 parallel `pm.sendRequest`) |
| Successful payment / invalid payment information | e2e 31–32 · Postman 5 |
| Check-in without sufficient payment / room not ready | e2e 30, 33 · Postman 10, 11 |
| Successful digital check-in / digital key generation | e2e 34–35 · Postman 6 |
| Invalid / expired / revoked digital key | e2e 36–37 · Postman 6 |
| Successful / unauthorized service order | e2e 38–39 · Postman 9 |
| Successful check-out | e2e 40 · Postman 9, 10 |
| Housekeeping assignment / status update / room availability restoration | e2e 41–43 · Postman 7, 9, 10 |

## 8.3 Manual verification performed during development

| Check | Result |
|---|---|
| `npm run build` | ✔ 0 TypeScript errors |
| `npm run start:dev` against `maristay_db` | ✔ "Found 0 errors", 44 routes mapped, API + Swagger URLs logged |
| Video flow on `maristay_db`: manager login → create room → GET → PATCH → DELETE → POST without token | ✔ 200 → 201 → 200 → 200 → 204 → 401 |
| Swagger `/api/docs-json` | ✔ 200, 44 operations, 18 schemas; UI assets load under CSP |
| Security headers / CORS | ✔ CSP, HSTS, nosniff, SAMEORIGIN present; `X-Powered-By` absent; only the configured origin receives `Access-Control-Allow-Origin` |
| CHECK constraints (MariaDB) | ✔ negative price → `CONSTRAINT CHK_rooms_pricePerNight failed`; checkOut = checkIn → `CHK_reservations_dates failed` |
| FK RESTRICT | ✔ deleting a room with history → error 1451 |
| Seed idempotency | ✔ second run creates 0 records |
| SQL export | ✔ `exports/maristay.sql` re-imported into a scratch database: 8 tables + migrations, 7 FKs, all rows |
| Secret scan of every file to be committed | ✔ JWT secret and demo password found in 0 files; `.env` and `references/` ignored |

## 8.4 Error handling verification

Every error returns the same JSON shape with a correct status code (never 200 on failure):
```json
{ "statusCode": 409, "error": "CONFLICT", "message": "Room already booked for the selected dates", "path": "/api/v1/reservations", "timestamp": "…" }
```
Database exceptions are mapped (duplicate → 409, FK → 400/409, CHECK → 400, other → 500 generic) without exposing SQL text.

## 8.5 Bugs found by testing and fixed

| # | Found by | Problem | Fix |
|---|---|---|---|
| B1 | Smoke test (500 on every booking) | TypeORM's `pessimistic_read` lock emits MySQL 8 `FOR SHARE`, a syntax error on MariaDB 10.4 | Booking transactions use `READ COMMITTED` + `SELECT … FOR UPDATE` on the room row (portable); concurrency re-verified |
| B2 | Captured API samples | `createdAt` (DB default, local time) and app-written datetimes (UTC) differed by 8 h | Use the `local` time zone for both; corrected seeded rows; re-exported SQL |
| B3 | Postman design review | Login limit of 5/min was below the 6 role logins in folder 1 | Default raised to 10/min (still blocks brute force; 429 test updated) |
| B4 | e2e test | Test tried to set `expiresAt` before `issuedAt`; the CHECK constraint correctly refused | Test fixed (constraint confirmed working) |
| B5 | Header review | Helmet CSP `upgrade-insecure-requests` could break Swagger UI over plain HTTP | Directive sent only in production |

## 8.6 Postman collection

* File: `exports/MariStay.postman_collection.json` (Postman v2.1) + `exports/MariStay.postman_environment.json`.
* 11 folders, **122 requests**, each with test assertions (status codes, business rules) and scripts that capture tokens and ids into environment variables.
* Static check performed: all 52 `{{variables}}` are defined in the environment or set by an earlier request; the environment contains no passwords or tokens.
* **⚠ TO DO (student):** the collection has **not yet been executed in Postman** in this session — the automated Postman runner (Newman) could not be run here. Run it once in Postman (Collection → Run, or `npx newman run exports/MariStay.postman_collection.json -e exports/MariStay.postman_environment.json --env-var demoPassword=<your demo password>`), then record the pass count here and take the screenshots below. The same scenarios already pass in the automated Supertest suite.

## 8.7 Representative screenshots — ⚠ TO DO (student)

Screenshots must come from your own run; none are fabricated here. Suggested captures:
1. `npm run start:dev` terminal showing "Found 0 errors" and the mapped routes.
2. Postman: Login – Manager (200 + accessToken).
3. Postman: Create Room (201), Get Room (200), Update Room PATCH (200), Delete Room (204).
4. Postman: Protected route without token (401) and guest on manager route (403).
5. Postman: Digital check-in response showing the issued key.
6. Postman: Overlapping reservation (409).
7. Postman Collection Runner summary.
8. phpMyAdmin: `rooms` and `reservations` tables matching the Postman actions.
9. Terminal: `npm run test` and `npm run test:e2e` summaries.
10. Swagger UI at `http://localhost:3000/api/docs`.

## 8.8 How to reproduce

```bash
npm run test          # unit tests (no database needed)
npm run test:e2e      # needs MySQL running and .env configured; uses TEST_DB_DATABASE (default maristay_test_db)
```
