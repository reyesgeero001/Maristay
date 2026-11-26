# API Testing and Validation Report

**Test dates:** 2026-11-25 (development and full suite); 2026-11-26 (Newman runs, and unit + e2e regression after rotating the JWT secret: 33/33 and 46/46) · **Environment:** Windows 11, Node.js 24.21.0, NestJS 11.2, TypeORM 0.3.31, XAMPP MariaDB 10.4.32 (MySQL-compatible) on localhost:3306.

All results in this report were produced by actually running the tests on the development machine. Nothing is estimated. Items that still need manual action are marked **⚠ TO DO**.

## 8.1 Testing approach

| Level | Tool | Database | What it proves |
|---|---|---|---|
| Unit tests | Jest + ts-jest (`npm run test`) | none (mocks) | Pure logic: dates, money, id validation, ownership, RolesGuard, login rules, env validation |
| End-to-end (integration) tests | Jest + Supertest (`npm run test:e2e`) | real MySQL, isolated `maristay_test_db` — dropped, migrated and seeded at the start of every run | The whole stack (guards → pipes → controllers → services → TypeORM → MySQL) and the integrated workflow |
| Collection testing | Postman collection (`exports/MariStay.postman_collection.json`), run with Newman (`npm run postman:newman`) or the Postman Runner | isolated `maristay_postman_db` on port 3001, reset before every run | All 122 requests in order, with 177 assertions: the integrated workflow, security and negative cases |
| Manual API testing / live demo | Individual Postman requests | local `maristay_db` on port 3000 | Live demonstration (Login and room CRUD only, not the full collection); request/response inspection |
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

### Coverage of the required test scenarios

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
| B6 | First full Postman run | 32 request bodies sent numeric ids and amounts as quoted placeholders (`"roomId": "{{stayRoomId}}"`), so the API correctly answered 400 (`roomId must be an integer number`), and payments, same-day bookings, check-in and the workflow cascaded into failures | Placeholders unquoted (`"roomId": {{stayRoomId}}`) in the collection; API validation unchanged |
| B7 | Second Postman desktop run (port 3001): 38 passed, 138 failed, 10 script errors, every protected request 401 | Not a code bug: all six logins failed, so no tokens were saved. Newman reproduced the same signature only when `demoPassword` was empty (400 on every login) or wrong (401), each giving 36 passed / 140 failed. Spending the login rate limit beforehand produced different counts. | Login - Manager now has a pre-request guard that stops with a clear message when `demoPassword` is empty. No assertion, validation or authentication was changed. |

## 8.6 Postman collection

* **Files:** `exports/MariStay.postman_collection.json` (Postman v2.1, the submitted collection) and `exports/MariStay.postman_environment.json` (no passwords or tokens; `demoPassword` is left empty).
* **Content:** 11 folders and **122 requests**. Each request has test assertions (status codes and business rules). Scripts save tokens and ids into environment variables. Every `{{variable}}` used is defined in the environment or set by an earlier request.
* **Isolated run target:** the full collection creates guests, staff, rooms, reservations and payments, so it runs against a separate database, `maristay_postman_db`, served by a second instance on port 3001 (`baseUrl` = `http://localhost:3001/api/v1`). `maristay_db` is never touched.
  * `npm run postman:setup` creates and seeds the database.
  * `npm run postman:reset` rebuilds only that database.
  * `npm run postman:start` serves it.
  * `npm run postman:env` writes a matching Postman environment to the git-ignored `exports/tmp/`.
* **Preconditions:** a freshly seeded database (room ids 1, 2, 3 and 5 = rooms 101, 102, 103 and 201; room 302 is the only available Family room). A freshly started server, because the login limit of 10/min is kept in memory: the run makes 8 logins before the final rate-limit request sends 12.
* **Collection fixes found by running it** (see 8.5 B6 and B7):
  * 32 numeric placeholders were unquoted.
  * *Login - Manager* now stops with a clear message if `demoPassword` is empty.
  * The deliberately invalid token in *Protected Route With Invalid Token → 401* is built at run time, so Postman's secret scanner no longer rewrites it. It still sends `Bearer invalid.token.value` and expects 401.

  No assertion, validation rule or security control was weakened.
* **Newman command:** `npm install --no-save newman` once, then `npm run postman:newman` while the port-3001 server runs. It runs `exports/MariStay.postman_collection.json` and passes the demo password from `.env` in memory, so it never appears on a command line, in a file or in the report. It writes a token-free summary to `exports/tmp/newman-summary.json`.

**Newman results.** Actual runs on 2026-11-26 with Newman 6.2.3 on port 3001. Before each run, `maristay_postman_db` was reset and the server restarted:

| Run | Collection source | Requests (collection / HTTP) | Assertions passed | Failed | Script errors | Duration |
|---|---|---|---|---|---|---|
| 1 | Collection (converted from the Postman YAML copy) | 122 / 137 | 177 / 177 | 0 | 0 | 16.9 s |
| 2 | Same, repeated | 122 / 137 | 177 / 177 | 0 | 0 | 16.2 s |
| 3 | `exports/MariStay.postman_collection.json`, after rotating the JWT secret | 122 / 137 | 177 / 177 | 0 | 0 | 14.8 s |

The 137 HTTP requests include 15 sent by `pm.sendRequest`: 4 concurrent bookings and 11 rate-limit logins. HTTP status mix in each run: 200 ×64, 201 ×24, 204 ×3, 400 ×7, 401 ×5, 403 ×10, 404 ×1, 409 ×13, 429 ×10. Every 4xx response is the expected result of a negative test. The Newman output contained no tokens or passwords.

* **Postman desktop app:** ⚠ **not yet passed.** Two earlier desktop runs failed for reasons outside the API (B6 and B7). The student must run it once more and record the Runner totals in §8.7. Steps:
  1. Stop the port-3001 server, then run `npm run postman:reset` and `npm run postman:start`.
  2. Select the *MariStay Postman 3001* environment. Set `demoPassword` and **save** the environment.
  3. Run all 122 requests in their default order, sequentially.

  Newman counts 177 assertions when every request succeeds. Failing runs count fewer, because a failed test stops before its later assertions.

## 8.7 Evidence and representative screenshots

The text evidence in this report comes from real runs. Screenshots must come from the student's own screen, and none are fabricated here.

| # | Evidence | Where it comes from | Status |
|---|---|---|---|
| 1 | `npm run start:dev` with "Found 0 errors" and the mapped routes | Terminal | ⚠ Screenshot needed |
| 2 | Login – Manager: 200 and `accessToken` | Postman | ⚠ Screenshot needed |
| 3 | Create Room 201 → Get Room 200 → Update Room (PATCH) 200 → Delete Room 204 | Postman | ⚠ Screenshot needed |
| 4 | Protected route without a token → 401; guest on a manager-only route → 403 | Postman | ⚠ Screenshot needed |
| 5 | Digital check-in response with the issued key | Postman | ⚠ Screenshot needed |
| 6 | Overlapping reservation → 409 | Postman | ⚠ Screenshot needed |
| 7 | Collection Runner summary (all 122 requests) | Postman desktop | ⚠ Screenshot needed after a successful desktop run |
| 8 | `rooms` and `reservations` tables matching the Postman actions | phpMyAdmin | ⚠ Screenshot needed |
| 9 | `npm run test` (33 passed) and `npm run test:e2e` (46 passed) summaries | Terminal | Text results in 8.2; ⚠ screenshot recommended |
| 10 | Newman summary table | Terminal | Text results above; ⚠ screenshot optional |
| 11 | Swagger UI at `http://localhost:3000/api/docs` | Browser | ⚠ Screenshot needed |

To add a screenshot:
1. Save it as `docs/screenshots/NN-name.png`.
2. Reference it here, e.g. `![Login – Manager](screenshots/02-login.png)`.
3. Rebuild the PDF with `npm run docs:build`.

## 8.8 How to reproduce

```bash
npm run test            # unit tests (no database needed)
npm run test:e2e        # real MySQL-compatible test database (TEST_DB_DATABASE, default maristay_test_db)

# Full Postman collection with Newman, isolated database on port 3001
npm run postman:reset   # rebuild maristay_postman_db only
npm run postman:start   # terminal 1: API on http://localhost:3001/api/v1
npm install --no-save newman
npm run postman:newman  # terminal 2
```
