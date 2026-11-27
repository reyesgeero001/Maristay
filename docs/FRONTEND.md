# MariStay Frontend (Optional Bonus)

A basic React frontend that uses the existing MariStay REST API. It is optional bonus work: the backend and the Postman collection are unchanged and remain the required deliverables.

## 1. Technology

| Concern | Choice |
|---|---|
| UI library | React 19 + TypeScript 5.9 |
| Build tool / dev server | Vite 8 (port 5173) |
| Styling | Tailwind CSS 4 with one central design-token theme: Modern Luxury Minimalist, with midnight navy, champagne gold accents and warm white (§1a) |
| Routing | React Router 8 |
| HTTP client | Axios (one shared instance) |
| Icons | Lucide React |
| UI test | `playwright-core` driving the installed Microsoft Edge (dev dependency only) |

The frontend lives in `frontend/` with its own `package.json` and `node_modules`, so it adds no dependency to the backend.

## 1a. Visual design (Modern Luxury Minimalist, 2026-11-27)

The UI was restyled after the functional scope was frozen. Only the presentation changed: no route, API call, permission or business rule was added or removed.

* **Design tokens** live in one place: the `@theme` block of `frontend/src/index.css` (Tailwind CSS 4). The palette is midnight navy `#14253E` for the primary colour and text, champagne gold `#C6A15B` as an accent only, warm white `#F8F7F4` for the background, white cards, `#64748B` for secondary text and `#E2E8F0` for borders. The status colours are Tailwind's green-600, amber-600, red-600 and blue-600. The same file defines the card radius and shadows, plus one visible gold keyboard-focus outline for every control.
* **Typography:** Inter if installed, otherwise the system UI sans-serif, for content. A local serif (Palatino Linotype / Georgia) is used for the MariStay wordmark and the sign-in, sign-up and guest-portal headings. No web fonts are downloaded.
* **Brand:** a gold hotel icon with a serif "MariStay" wordmark and the subtitle "Hotel Management and Digital Guest Services System", the same on the login, sign-up and app layouts. The favicon uses the same colours.
* **Screens:**
  * Login and sign-up use a navy brand panel on desktop and a single card on mobile. There is no photograph: no licensed local image was available. Sign-up states that public registration always creates a Guest account.
  * The sidebar marks the active page with a gold edge and icon, and shows the user's initials and role.
  * The guest dashboard has a navy welcome banner.
  * Staff dashboards add a room-status bar built from the same live counts.
  * Digital keys appear as navy and gold keycards, and the lock card is labelled "Simulated Smart Lock".
* **Accessibility:**
  * Gold is not used for small text on white; `gold-700` is used there, at about 5.9:1.
  * Status badges add a thin ring, so they are not colour-only.
  * Required fields show a red asterisk that is hidden from screen readers. The inputs keep their `required` attribute and their exact labels, which the browser test also relies on.
* **Backup of the previous UI** (git-ignored): `exports/tmp/frontend-ui-backup-2026-11-27/`.

## 2. Structure

```text
frontend/
  .env.example          VITE_API_BASE_URL (the only setting; no secrets)
  index.html  vite.config.ts  tsconfig.json  package.json
  src/
    main.tsx  App.tsx   router: every page is wrapped in a role guard
    api/
      client.ts         Axios instance, Bearer token, 401 handling, error messages
      endpoints.ts      one function per REST endpoint used
      types.ts          response types that mirror the backend entities and DTOs
    auth/
      AuthContext.tsx   login, logout, session check (GET /auth/me), auto-logout at token expiry
      ProtectedRoute.tsx
    components/
      Layout.tsx        sidebar, Logo and NAV_ITEMS (which role sees which page)
      AuthLayout.tsx    shared shell of the login and sign-up pages
      ui.tsx            Button, Card, StatCard, StatusBadge, DataTable, Pagination, Modal,
                        ConfirmDialog, Alert, Spinner, EmptyState, Field, Select, SimulationNote
    lib/
      useApi.ts         data loading (loading / error / reload) and actions (busy / success / error)
      format.ts         currency (PHP), dates, labels
      keyWallet.ts      in-memory store for one-time digital key codes
      serviceCatalog.ts display copy of the service item list
    pages/              Login, Register, Dashboard, Rooms, Availability, Reservations, ReservationDetail,
                        Payments, ServiceOrders, DigitalKeys, Guests, Staff, Housekeeping, ErrorPages
  tests/ui-e2e.mjs      browser end-to-end test (37 checks: guest sign-up and all four roles)
```

## 3. Authentication and authorization

1. A single login page posts to `POST /auth/login`. A **Sign up** link opens the guest registration page (§3a). The role in the response decides which navigation the user sees.
2. The JWT is kept in `sessionStorage`, so it is cleared when the tab closes. It is sent as `Authorization: Bearer <token>` by an Axios request interceptor.
3. After a page reload, the stored token is checked again with `GET /auth/me`. The role always comes from the server, never from browser storage.
4. The session ends, and the user returns to the login page with a message, when:
   - any API call returns **401** (invalid, expired or deactivated account),
   - the token's `exp` time is reached, or
   - the user clicks **Log out**.
5. `ProtectedRoute` hides pages a role cannot use and shows an "Access denied" page. This is only for usability: **the backend still enforces every permission** with `JwtAuthGuard`, `RolesGuard` and ownership checks. No backend permission was changed for the frontend.

15 screens in total: Login, Sign up, Dashboard, Rooms, Room availability, Reservations, Reservation detail, Payments, Service orders, Digital keys, Guests, Staff, Housekeeping, Access denied and Not found.

| Page | Guest | Front desk | Housekeeping | Manager |
|---|:-:|:-:|:-:|:-:|
| Dashboard (role-specific) | ✓ | ✓ | ✓ | ✓ |
| Rooms (CRUD) | | | | ✓ |
| Room availability / booking | ✓ | ✓ | | ✓ |
| Reservations and reservation detail | own | ✓ | | ✓ |
| Payments | own (read) | ✓ | | ✓ |
| Service orders | own | ✓ | | ✓ |
| Digital keys | own | ✓ | | ✓ |
| Guests | | ✓ | | ✓ |
| Staff | | | | ✓ |
| Housekeeping tasks | | | own | ✓ |

## 3a. Guest self-registration (Sign up)

`/register` (`frontend/src/pages/RegisterPage.tsx`) lets a visitor create a **guest** account. It reuses the existing public endpoint `POST /guests`; no backend code, endpoint or table was added.

- **Fields:** first name and last name (the "full name", split to match `CreateGuestDto`), email address, phone number, password and confirm password. The password fields have show/hide buttons.
- **Validation in the browser** uses the same rules as `CreateGuestDto`: names up to 50 characters (letters, spaces, `.`, `'`, `-`), a valid email, 7–15 digits with an optional `+` (spaces and dashes are removed), and a password of 8–72 characters with at least one letter and one number. Confirm password must match. It is checked only in the browser and is **not sent**, because the API rejects unknown properties.
- **Loading and messages:** while the request runs, the button shows a spinner and "Creating account…" and the inputs are disabled. Server errors appear above the form (for example "Conflict: Email already exists"). On success the user is sent to the login page, which shows "Your guest account has been created. Sign in to continue." with the email filled in.
- **No role selection.** The request body has no role field, and the backend enforces the role:
  - `POST /guests` always writes to the `guests` table. At login, accounts from that table always get the `GUEST` role (`AuthService`). Staff roles exist only in the `staff` table, which only a manager can write to (`POST /staff`, `@Roles(MANAGER)`).
  - The global `ValidationPipe` (`whitelist` + `forbidNonWhitelisted`) rejects extra properties such as `role`, `accountType`, `accountStatus` or `guestId` with 400, so a hand-crafted request cannot ask for a staff role.
  - The email must be unused across **both** guests and staff (`IdentityService`); duplicates get 409.
  - The password is hashed with bcrypt (10 rounds). The response never contains the password or its hash.
- Signed-in users who open `/register` are sent to their dashboard.

## 4. API integration

All data comes from the live API. The dashboards count records with `meta.total` from filtered list calls, for example `GET /rooms?roomStatus=AVAILABLE&limit=1`. No statistics are hardcoded.

| Feature | Endpoints used |
|---|---|
| Login / session | `POST /auth/login`, `GET /auth/me` |
| Guest sign-up | `POST /guests` (public) |
| Rooms | `GET /rooms` (filters `roomStatus`, `roomType`, `checkInDate`, `checkOutDate`), `POST /rooms`, `PATCH /rooms/:id`, `DELETE /rooms/:id` |
| Reservations | `GET /reservations`, `GET /reservations/:id`, `POST /reservations`, `PATCH /reservations/:id`, `PATCH /reservations/:id/confirm`, `PATCH /reservations/:id/check-in`, `PATCH /reservations/:id/check-out`, `DELETE /reservations/:id` (cancel) |
| Payments | `GET /payments`, `POST /payments`, `PATCH /payments/:id` |
| Guests | `GET /guests`, `GET /guests/:id/reservations`, `PATCH /guests/:id` (reactivate), `DELETE /guests/:id` (deactivate) |
| Staff | `GET /staff`, `POST /staff`, `PATCH /staff/:id`, `DELETE /staff/:id` (deactivate) |
| Digital keys | `GET /digital-keys`, `POST /digital-keys` (re-issue), `POST /digital-keys/validate`, `PATCH /digital-keys/:id/revoke` |
| Housekeeping | `GET /housekeeping`, `POST /housekeeping`, `PATCH /housekeeping/:id` |
| Service orders | `GET /service-orders`, `POST /service-orders`, `PATCH /service-orders/:id` |

That is 36 of the 44 endpoints. The other 8 stay available in Postman: `PUT /rooms/:id`, and the single-record `GET /:id` for rooms, guests, staff, payments, digital keys, housekeeping and service orders.

**Errors.** The backend returns `{ statusCode, message, … }`. `errorMessage()` in `api/client.ts` turns this into a readable message: 400 "Invalid input: …", 401 session expired or invalid login, 403 "Not allowed: …", 404 "Not found: …", 409 "Conflict: …", 429 "Too many attempts". The message appears next to the form or table that caused it. Forms also check input in the browser first, using the same rules as the backend DTOs (room number pattern, price decimals, dates, quantity 1–20, names and password strength).

**Business rules stay on the server.** The UI only calls the workflow endpoints:
- A reservation becomes CONFIRMED when the payment API confirms it.
- Check-in sets the room to OCCUPIED and issues a key.
- Check-out revokes keys and creates the cleaning task.
- Completing the cleaning task makes the room AVAILABLE again.

The frontend never sets these states directly. For example, OCCUPIED is not offered in the room form.

## 5. Simulations shown in the UI

- **Payments:** recorded by the front desk. No card or e-wallet data is collected and no money moves. A "Simulation" note is shown on the payment pages.
- **Smart lock:** "Open door" calls `POST /digital-keys/validate`. No physical lock exists.
- **Digital key codes:** the API returns a key code only once (at check-in or re-issue). The frontend keeps it **in memory for the current tab only**, never in `localStorage` or `sessionStorage`. After a reload, the guest re-issues the key.
- **SMS / e-mail:** these are simulated by the backend. The check-in screen says so.

## 6. Known limitations

- **No catalog endpoint for service items.** The item list in `frontend/src/lib/serviceCatalog.ts` mirrors `backend/src/service-orders/service-catalog.ts`. Only `itemCode` and `quantity` are sent, and the server sets the price. If the backend catalog changes, update the mirror.
- **Room-number search is done in the browser.** `GET /rooms` has no search parameter, so the Rooms page loads up to 100 rooms and filters them locally.
- **Sign-up has no email verification or CAPTCHA.** The backend has neither. `POST /guests` is covered only by the general API rate limit (300 requests per minute per IP), not the stricter login limit.
- **No profile or password-change page.**
- **The housekeeping "Assigned to" list shows only active housekeepers.** Reassignment is offered for unfinished tasks only, because that is what the API allows.

## 7. Running

```bash
# backend
cd backend
npm run start:dev                     # API on http://localhost:3000/api/v1

# frontend
cd frontend
npm install
cp .env.example .env.local            # optional; the default is http://localhost:3000/api/v1
npm run dev                           # http://localhost:5173
npm run build                         # type-check + production build into frontend/dist
```

The backend's `CORS_ORIGIN` already allows `http://localhost:5173`. No backend change is needed.

## 8. Testing

`frontend/tests/ui-e2e.mjs` drives the real UI in Microsoft Edge through every role:

- authentication and wrong password
- guest sign-up: Sign up link, no role field, required-field, email, weak-password and mismatch errors, show/hide password, successful registration with redirect and success message, duplicate email 409, and the new account logging in as a guest and seeing "Access denied" on staff pages
- manager room CRUD, plus a duplicate-room 409
- staff list
- role restrictions
- guest availability search and booking
- front desk payment and automatic confirmation
- digital check-in and key code
- simulated lock (granted, wrong room, revoked)
- service requests: create, guest cancel, staff prepare and deliver
- check-out blocked by an unpaid balance (409), then payment and check-out
- housekeeping start and complete, with the room becoming available
- 404 message, invalid token, and logout

Run it **only against the isolated database** (`maristay_postman_db`), because it creates records:

```bash
cd backend
npm run postman:reset                 # fresh maristay_postman_db
npm run postman:start                 # API on port 3001 (CORS must allow the frontend origin)
cd frontend
VITE_API_BASE_URL=http://localhost:3001/api/v1 npm run dev
FRONTEND_URL=http://localhost:5173 npm run test:ui
```

**Latest results: after the UI redesign (2026-11-27).** These ran on a freshly reset `maristay_postman_db` with the final, approved UI:
* browser UI e2e **37/37** (unchanged assertions);
* `npm run verify:registration` **49/49**;
* production build passed;
* responsive and accessibility audit: **331** checks at 1440, 1280, 768 and 390 px over every screen of every role, with 0 findings (no page-level horizontal scrolling, no broken images, no unnamed controls, dialogs fit on mobile) and 0 console errors.

No backend file changed, so the backend results below still apply.

**Final regression on 2026-11-27 (finalization, before the UI redesign).** On a freshly reset `maristay_postman_db`, the API ran on port 3001 and Vite on port 5173 (with `--bypass-lock`, because another Vite instance of this project was running on port 5180). Results: browser UI e2e **37/37**, `npm run verify:registration` **49/49**, `npm run build` passed, backend unit **33/33**, backend e2e **46/46**, Newman **177/177**. Details are in Testing §8.9.

**Guest sign-up results on 2026-11-27 (third session).** `maristay_postman_db` was reset, the API ran on port 3101 and Vite on port 5181. Vite used `--bypass-lock`, because another Vite instance of this project was already running on port 5180. Only environment variables were overridden.

| Check | Result |
|---|---|
| Frontend UI e2e (including 7 new sign-up checks) | **37/37** passed on a freshly reset `maristay_postman_db` |
| API and database checks for `POST /guests` (`backend/scripts/verify-guest-registration.js`, `npm run verify:registration`) | **49/49** passed (details below); re-run 49/49 with the saved script |
| Production build | `npm run build` (tsc + vite) passed |
| Backend regression | Not re-run: no backend file was changed for sign-up |

The 49 API and database checks covered:
- 201 response without `password` or `passwordHash`; a row in `guests` and none in `staff`.
- A `$2b$10$` bcrypt hash that matches the password.
- Login returns role `GUEST` in the response, in `GET /auth/me` and in the JWT claim.
- Duplicate email returns 409: same case, different case, and a staff email.
- 400 for an invalid email, an invalid phone, an empty body, each missing field and weak passwords.
- 400 for `role` MANAGER / FRONT_DESK / HOUSEKEEPING / GUEST, `accountType`, `accountStatus` and `guestId`, with no account created.
- The new guest gets 403 on `GET /staff`, `GET /guests`, `GET /housekeeping`, `POST /rooms`, another guest's profile and changing its own `accountStatus`.
- The four demo roles still log in. Guest count +1, staff count unchanged.

**Earlier results (2026-11-27, before guest sign-up and before the UI redesign):**

| Check | Result |
|---|---|
| Frontend UI e2e | **30/30** checks passed, run twice; the second run was on a freshly reset `maristay_postman_db` with the final code |
| Production build | `npm run build` (tsc + vite) passed |
| Backend unit tests | 33/33 passed (regression) |
| Backend e2e tests | 46/46 passed (regression) |
| Postman collection via Newman | 177/177 assertions, 0 failures (regression, fresh `maristay_postman_db`) |

**Re-verification on 2026-11-27 (second session):** `maristay_postman_db` was reset again and the API was started on port 3101 (`DB_DATABASE=maristay_postman_db PORT=3101 CORS_ORIGIN=http://localhost:5181 node dist/main`) with Vite on port 5181. Results: UI e2e **30/30**, `npm run build` passed, backend unit **33/33**, backend e2e **46/46**. Newman was not re-run in this session because its script is fixed to port 3001, which another local project was using. The backend code is unchanged since the 177/177 run above.

On the development machine, ports 3000, 3001 and 5173 were used by another local project. These runs therefore used the same isolated database with the API on port 3101 and Vite on port 5180. Only environment variables were overridden (`PORT`, `CORS_ORIGIN`, `VITE_API_BASE_URL`); the code and `.env` were not changed.

## 9. Screenshots

**Captured on 2026-11-27** (37 images, 1360 px wide) in [`docs/screenshots/frontend/`](screenshots/frontend/); captions are in `INDEX.txt`. They were taken automatically with `frontend/tests/capture-screenshots.cjs` on a freshly reset isolated database (`maristay_postman_db`), so they contain only fictional seed accounts and one fictional registered guest. Every digital key code is masked with a grey box. Password fields show only dots, and no token appears anywhere in the UI. Headless capture has no address bar.

| Area | Files |
|---|---|
| Login and guest sign-up | `01-login`, `02a-register-form`, `02b-register-validation`, `02c-register-success`, `03-new-guest-dashboard` |
| Manager | `05-manager-dashboard`, `06a`–`06e` room CRUD (list, create, read, update, delete), `07-manager-staff`, `08-manager-guests`, `21-manager-housekeeping` |
| Guest booking | `09-guest-dashboard`, `10a-guest-availability`, `10b-guest-booking-dialog`, `10c-reservation-pending` |
| Front desk and payments | `11-frontdesk-dashboard`, `12a-record-payment`, `12b-reservation-confirmed`, `12c-payments` |
| Digital check-in, keys, smart lock | `13a-checkin-dialog`, `13b-digital-key-issued`, `14a-smart-lock-granted`, `14b-smart-lock-denied`, `18-frontdesk-digital-keys` |
| Service requests | `15a-service-request-new`, `15b-service-requests`, `16-frontdesk-service-orders` |
| Check-out | `17a-checkout-blocked`, `17b-checkout-summary`, `17c-revoked-key-denied` |
| Housekeeping | `19a-housekeeping-dashboard`, `19b-housekeeping-completed` |
| Access control | `04-access-denied-guest`, `20-access-denied-housekeeping` |

They were recaptured with the approved Modern Luxury Minimalist UI on 2026-11-27. Eight of them are Figures G.1–G.8 in Appendix G of the final documentation.

To capture them again (isolated stack only; the script registers a guest and creates records):

```bash
cd backend
npm run postman:reset
DB_DATABASE=maristay_postman_db PORT=3001 LOGIN_RATE_LIMIT=100 node dist-postman/main.js
cd ../frontend && VITE_API_BASE_URL=http://localhost:3001/api/v1 npm run dev
node --env-file=../backend/.env tests/capture-screenshots.cjs ../docs/screenshots/frontend
```
