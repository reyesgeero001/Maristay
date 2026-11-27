# MariStay — Finalized Project Requirements

**MariStay: Hotel Management and Digital Guest Services System**
ITEC 116 — IT Elective 4 (Systems Integration and Architecture 2) · Individual Final Project
Developer: Geero Andrei E. Reyes · BSIT 4C · Instructor: John Vincent A. Dallego, MIT

This file is the persistent source of truth for *what* MariStay must do. It merges the
mandatory Final Project requirements with Laboratory Activities 03–06. Where the labs and
the final requirements differ, the final requirements win and the change is listed in
[§8 Deviations](#8-deviations-from-the-laboratory-designs).

---

## 1. Sources analysed

| Source | What it defines | Key content carried forward |
|---|---|---|
| Final Project Student Copy | Mandatory deliverables & grading | NestJS + TypeORM + MySQL + JWT + Postman + Git; ≥2 CRUD modules; ≥20 endpoints using GET/POST/PUT or PATCH/DELETE; password hashing; input validation; ≥5 commits; README; .gitignore; SQL export; Postman JSON; 5–10 min narrated video; PDF documentation |
| Lab 03 | System description & architecture | Purpose: unify reservations, digital check-in/check-out, keyless room access and real-time room-service ordering. Users: guests, front desk, housekeeping, hotel management. Architecture: Guest & Staff → Client app → API calls → Application server → Database server / Auth service / SMS notification. Information flow: check-in request → credential check → verify payment and room readiness → status "Checked-In" → SMS digital room key → confirmation. External services: payment gateways, SMS/e-mail, smart locks |
| Lab 04 | Database design | 8 entities (Guest, Room, Reservation, Payment, DigitalKey, Housekeeping, Staff, ServiceOrder) with data dictionary, PKs, FKs, NOT NULL / UNIQUE / CHECK constraints and ERD |
| Lab 05 | REST API design | `/api/v1` versioning; plural nouns; path & query parameters; nested resource `/guests/{id}/reservations`; 7 documented endpoints with request/response examples and status codes |
| Lab 06 | Authentication & security | Login flow (credentials → verify hash + account status → JWT with user id and role → protected resource checks role/ownership → 200 / 401 / 403); security measures: password hashing, HTTPS, JWT, RBAC, input validation, rate limiting |

## 2. Technology stack (mandatory)

NestJS 11 · TypeScript · TypeORM 0.3 · MySQL (local server: XAMPP MariaDB 10.4, MySQL-compatible) ·
mysql2 · JWT (@nestjs/jwt + passport-jwt) · bcrypt · class-validator / class-transformer ·
@nestjs/throttler · Helmet · Jest + Supertest · Postman · Git/GitHub · npm.

Architecture: **modular monolith** — one NestJS application, one MySQL database, one module per business area.

## 3. Users and permissions

| Capability | GUEST | FRONT_DESK | HOUSEKEEPING | MANAGER |
|---|:-:|:-:|:-:|:-:|
| Register (public) / log in | ✔ | log in | log in | log in |
| Browse rooms (public) | ✔ | ✔ | ✔ | ✔ |
| Own profile view/update/deactivate | own | view/update any | ✖ | ✔ any |
| List guests | ✖ | ✔ | ✖ | ✔ |
| Create reservation | own | on behalf of guest | ✖ | on behalf of guest |
| View / update / cancel reservations | own | ✔ | ✖ | ✔ |
| Confirm reservation | ✖ | ✔ | ✖ | ✔ |
| Check-in / check-out | own | ✔ | ✖ | ✔ |
| Record / update payments | ✖ | ✔ | ✖ | ✔ |
| View payments | own | ✔ | ✖ | ✔ |
| Digital keys (view / reissue / validate) | own | ✔ | ✖ | ✔ |
| Revoke digital key | ✖ | ✔ | ✖ | ✔ |
| Place service order | own, checked-in | on behalf | ✖ | on behalf |
| Update service-order status | cancel own PENDING | ✔ | ✖ | ✔ |
| Housekeeping tasks | ✖ | ✖ | own tasks only | ✔ all, assign/reassign |
| Rooms create/update/replace/delete | ✖ | ✖ | ✖ | ✔ |
| Staff accounts | ✖ | ✖ | ✖ | ✔ |

All of this is enforced in the backend (JwtAuthGuard → RolesGuard → service-level ownership checks).

## 4. Database (`maristay_db`)

Eight original Lab 04 tables are preserved with their original column names. Extensions are marked **(ext)**.

| Table | Columns |
|---|---|
| guests | guestId PK · firstName · lastName · email UNIQUE · passwordHash · phoneNumber · accountStatus (ext) · createdAt (ext) · updatedAt (ext) |
| rooms | roomId PK · roomNo UNIQUE · roomType · pricePerNight CHECK ≥ 0 · roomStatus CHECK · createdAt (ext) · updatedAt (ext) |
| reservations | reservationId PK · guestId FK · roomId FK · checkInDate · checkOutDate CHECK > checkInDate · reservationStatus CHECK · ratePerNight (ext) · totalAmount (ext) · createdAt (ext) · updatedAt (ext) |
| payments | paymentId PK · reservationId FK · amount CHECK > 0 · paymentMethod CHECK · status CHECK · date NULL · createdAt (ext) |
| digital_keys | keyId PK · reservationId FK · keyCodeHash UNIQUE · issuedAt · expiresAt · status CHECK |
| housekeeping | hkId PK · roomId FK · staffId FK · status CHECK · lastUpdate · createdAt (ext) |
| staff | staffId PK · firstName · lastName · role CHECK · email UNIQUE · passwordHash (ext, required for login) · accountStatus (ext) · createdAt (ext) · updatedAt (ext) |
| service_orders | orderId PK · reservationId FK · serviceType · totalAmount CHECK ≥ 0 · status CHECK · date · itemCode (ext) · quantity (ext) · unitPrice (ext) · notes (ext) |

Relationships: Guest 1─* Reservation; Room 1─* Reservation; Reservation 1─* Payment / DigitalKey / ServiceOrder;
Room 1─* Housekeeping; Staff 1─* Housekeeping. All FKs use `ON DELETE RESTRICT` so historical
reservations and payments can never be cascade-deleted.

## 5. API scope

Base URL `/api/v1`. 44 endpoints across 9 resources (see `docs/API_DOCUMENTATION.md` for the full contract).
The 7 Lab 05 endpoints are preserved with their original access levels:

1. `GET /rooms` — Public · 2. `POST /guests` — Public · 3. `POST /reservations` — Guest ·
4. `POST /payments` — Front Desk · 5. `POST /service-orders` — Guest · 6. `PATCH /rooms/:id` — Manager ·
7. `PUT /rooms/:id` — Manager.

Full CRUD modules: **Rooms** (create, read, update via PATCH and PUT, delete) and **Staff**
(create, read, update, delete = deactivate); Guests and Reservations also cover all four operations.

## 6. Business rules

1. **Registration** — email must be unique across *both* guests and staff; password ≥ 8 chars with letters and digits; stored as a bcrypt hash (cost 10). Public registration can only create GUEST accounts.
2. **Login** — same 401 message for unknown email and wrong password; INACTIVE accounts get 401; rate-limited to 10 attempts/minute per IP (429).
3. **Tokens** — JWT (HS256) carries `sub`, `accountType`, `role`, `email`; expires per `JWT_EXPIRES_IN`. Every request re-loads the account so deactivated users lose access immediately.
4. **Availability** — a room is free for `[checkIn, checkOut)` when no PENDING/CONFIRMED/CHECKED_IN reservation overlaps (`existing.checkIn < new.checkOut AND existing.checkOut > new.checkIn`). Same-day turnover is allowed. `roomStatus` describes the room *now*; it is never used to block future dates (except MAINTENANCE rooms, which cannot be booked).
5. **Booking** — check-in date ≥ today; check-out > check-in; max 30 nights. The room row is locked (`SELECT … FOR UPDATE`) inside a transaction while checking overlaps, preventing concurrent double bookings. `totalAmount = pricePerNight × nights` is stored at booking time (rate snapshot).
6. **Payments** — prototype recording only (no card data). Only `PAID` payments count toward the balance; `FAILED`/`REFUNDED` never do. `date` is set when a payment is processed (PAID/FAILED/REFUNDED). A PAID amount may not exceed the outstanding balance. When PAID total ≥ room total, a PENDING reservation becomes CONFIRMED (same transaction); a CONFIRMED reservation is never automatically downgraded (check-in independently requires full payment). Allowed status transitions: PENDING→PAID/FAILED, PAID→REFUNDED. A refund is allowed only for a CANCELLED reservation or to return an overpayment. Payments cannot be recorded for CANCELLED or CHECKED_OUT reservations. Only FRONT_DESK and MANAGER can record or update payments.
7. **Check-in** — reservation CONFIRMED; today within `[checkInDate, checkOutDate)`; room total fully paid; room AVAILABLE. Then (one transaction): reservation CHECKED_IN, room OCCUPIED, digital key issued; then simulated SMS/e-mail notification.
8. **Digital keys** — 32-byte random credential (`MSK-…`), only its SHA-256 hash is stored; plaintext is returned once at issue/reissue. Expires at 12:00 on the check-out date. Validation (simulated smart lock) requires: known hash, status ACTIVE, not expired (auto-marked EXPIRED), reservation CHECKED_IN, matching room, and the caller owns the reservation or is operations staff. Reissue revokes previous active keys.
9. **Service orders** — guest's reservation must be CHECKED_IN. Prices come from the server-side catalog (`backend/src/service-orders/service-catalog.ts`); the client sends only `itemCode` + `quantity`. Transitions: PENDING→PREPARING→DELIVERED, PENDING/PREPARING→CANCELLED. Guests may only cancel their own PENDING orders.
10. **Check-out** — reservation CHECKED_IN. Open (PENDING/PREPARING) orders are auto-cancelled. Balance = room total + DELIVERED service charges − PAID payments; must be ≤ 0 (else 409 with the amount due). Then (one transaction): reservation CHECKED_OUT, all active keys REVOKED, room CLEANING, housekeeping task created for the ACTIVE housekeeper with the fewest open tasks (if none exists, the manager assigns one manually).
11. **Housekeeping** — transitions PENDING→IN_PROGRESS→COMPLETED only; housekeepers can update only their own tasks; manager can reassign and update. On COMPLETED, if the room is CLEANING and has no other open task, it becomes AVAILABLE. One open task per room.
12. **Cancellation** — `DELETE /reservations/:id` sets CANCELLED (PENDING/CONFIRMED only); records are never destroyed. Any PAID amount is reported as `refundDue` for the front desk to refund.
13. **Deletion policy** — rooms can be hard-deleted only if they have no reservation or housekeeping history (else 409; use MAINTENANCE). Guests and staff are *deactivated* (accountStatus INACTIVE), not deleted. Guests with active reservations and staff with open tasks cannot be deactivated. Managers cannot deactivate themselves.
14. **Room status** — managers may set AVAILABLE/CLEANING/MAINTENANCE manually; OCCUPIED is set only by check-in, and an OCCUPIED room's status cannot be changed manually.

## 7. Academic requirements checklist

See `docs/DEVELOPMENT_PROGRESS.md` → *Remaining mandatory requirements* for live status.

## 8. Deviations from the laboratory designs

| # | Lab design | Implementation | Reason |
|---|---|---|---|
| D1 | Lab 05 examples use `roomNumber` | API and DB use `roomNo` everywhere | Lab 04 data dictionary names the column `roomNo`; one consistent contract |
| D2 | Lab 05 status values like `"Available"`, `"Pending"`, `"cash"`, `"paid"` | Stored/returned UPPERCASE (`AVAILABLE`, `PENDING`, `CASH`, `PAID`); inputs are case-normalized, so `?roomStatus=Available` still works | Consistent enum values + CHECK constraints |
| D3 | Lab 05 register body has no password | `password` is required | Login requires a credential; Lab 06 password hashing |
| D4 | Lab 05 booking body includes `guestId` and `reservationStatus` | `guestId` comes from the JWT for guests (optional for staff booking on behalf); status is server-controlled (always starts PENDING) | Prevents a guest from booking as someone else / self-confirming (mass assignment) |
| D5 | Lab 05 payment body uses `paymentStatus`, `paymentDate` | Uses Lab 04 column names `status`, `date`; `date` is set by the server when processed | Matches the data dictionary; prevents back-dating |
| D6 | Lab 05 service order body sends `totalAmount`, `orderStatus`, `orderDate` | Client sends `itemCode`, `quantity`, optional `notes`; server computes `serviceType`, `totalAmount`, `status`, `date` | Never trust client prices |
| D7 | Lab 04 staff table has no password | Added `passwordHash`, `accountStatus` | Staff must log in (Lab 06) |
| D8 | Lab 04 guests table has no status | Added `accountStatus` | Lab 06 flow verifies account status |
| D9 | Lab 04 reservations store no price | Added `ratePerNight`, `totalAmount` | Later room price changes must not alter historical bookings |
| D10 | Lab 04 service_orders has no item detail | Added `itemCode`, `quantity`, `unitPrice`, `notes` | Server-side pricing needs to record what was ordered |
| D11 | Lab 05 lists `/reservation` (singular) in Part A | `/reservations` (plural) | Lab 05 Part B rule "use plural names" |
| D12 | Lab 03/06 specify HTTPS | Local demo runs on HTTP; HTTPS is a deployment requirement (reverse proxy / TLS) | Not configured locally — documented, not claimed |
| D13 | Lab 03 SMS delivers the key code | Notifications are simulated (logged) and never contain the key code; the code is returned only in the API response | Credentials must not be logged |
| D14 | Lab 06 diagram shows a "Users table" | Guests and staff authenticate from their own tables through one AuthService; email unique across both | Preserves Lab 04's 8 entities without a redundant table |
| D15 | Lab 05 PATCH/PUT room error documented as 409/404 | 404 not found, 409 duplicate roomNo or blocked status change, 400 validation | Standard status codes |
