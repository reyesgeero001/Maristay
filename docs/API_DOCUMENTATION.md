# REST API Design and Documentation

Base URL (local): `http://localhost:3000/api/v1` · Postman: [`postman/MariStay.postman_collection.json`](../postman/MariStay.postman_collection.json)

## 5.1 API conventions (Lab 05 Part B)

| Rule | Applied as | Example |
|---|---|---|
| Use nouns, not verbs | Resources are hotel objects | `/api/v1/rooms` |
| Plural resource names | Every collection is plural | `/api/v1/guests`, `/api/v1/service-orders` |
| Path parameters identify one resource | `:id` is a positive integer (validated → 400) | `/api/v1/rooms/5` |
| Versioning | Global prefix `/api/v1` | `/api/v1/reservations` |
| Nested resources | Child collection of a parent | `/api/v1/guests/1/reservations` |
| Query parameters filter and paginate | Case-insensitive enum filters, `page`, `limit` | `/api/v1/rooms?roomStatus=Available` |
| State-changing actions on a resource | Sub-resource with `PATCH` | `/api/v1/reservations/4/check-in` |
| JSON in, JSON out | `Content-Type: application/json` | — |
| Authentication | `Authorization: Bearer <accessToken>` | — |

**Naming notes.** The API uses the Lab 04 column names everywhere (`roomNo`, `status`, `date`) — Lab 05 examples that used `roomNumber`, `paymentStatus` or `paymentDate` were aligned to these names (deviations D1, D5). Status values are returned UPPERCASE; filters and bodies accept any case (`Available` → `AVAILABLE`).

**List responses** are paginated:
```json
{ "data": [ … ], "meta": { "page": 1, "limit": 20, "total": 2, "totalPages": 1 } }
```

**Error responses** always have the same shape (from `AllExceptionsFilter`):
```json
{ "statusCode": 409, "error": "CONFLICT", "message": "Room already booked for the selected dates",
  "path": "/api/v1/reservations", "timestamp": "2026-11-25T15:30:40.072Z" }
```
Validation errors return `message` as an array of all problems. Internal database errors are never exposed.

## 5.2 Resource identification (Lab 05 Part A, extended)

| Resource URI | Source table | Description | Operations |
|---|---|---|---|
| `/auth` | guests, staff | Login and current identity | Login (C), Read |
| `/guests` | guests | Guest accounts | C, R, U, D(deactivate) |
| `/rooms` | rooms | Hotel rooms | C, R, U (PATCH+PUT), D |
| `/reservations` | reservations | Room bookings, check-in/out | C, R, U, D(cancel) |
| `/payments` | payments | Payment recording and review | C, R, U(status) |
| `/digital-keys` | digital_keys | Digital room keys | C(issue), R, U(revoke), validate |
| `/housekeeping` | housekeeping | Cleaning tasks | C, R, U |
| `/staff` | staff | Employee accounts | C, R, U, D(deactivate) |
| `/service-orders` | service_orders | Guest service requests | C, R, U(status) |

## 5.3 Complete endpoint table (44 endpoints)

Access: **Public** = no token · **G** = Guest (own records only) · **FD** = Front Desk · **HK** = Housekeeping (own tasks only) · **M** = Manager. ★ = the 7 endpoints defined in Lab 05 (original access preserved).

| # | Method | Endpoint | Description | Access | Success | Main errors |
|---|---|---|---|---|---|---|
| 1 | POST | `/auth/login` | Log in (guest or staff), returns JWT | Public (10/min) | 200 | 400, 401, 429 |
| 2 | GET | `/auth/me` | Current user profile | Any logged-in | 200 | 401 |
| 3 ★ | POST | `/guests` | Register guest | Public | 201 | 400, 409 |
| 4 | GET | `/guests` | List/search guests | FD, M | 200 | 401, 403 |
| 5 | GET | `/guests/:id` | Guest profile | G(own), FD, M | 200 | 403, 404 |
| 6 | PATCH | `/guests/:id` | Update profile / change own password | G(own), FD, M | 200 | 400, 401, 403, 404, 409 |
| 7 | DELETE | `/guests/:id` | Deactivate account (history kept) | G(own), M | 204 | 403, 404, 409 |
| 8 | GET | `/guests/:id/reservations` | Reservation history (nested) | G(own), FD, M | 200 | 403, 404 |
| 9 ★ | GET | `/rooms` | List/filter rooms, date availability | Public | 200 | 400 |
| 10 | GET | `/rooms/:id` | Room details | Public | 200 | 404 |
| 11 | POST | `/rooms` | Create room | M | 201 | 400, 401, 403, 409 |
| 12 ★ | PATCH | `/rooms/:id` | Partially update room | M | 200 | 400, 403, 404, 409 |
| 13 ★ | PUT | `/rooms/:id` | Replace all room details | M | 200 | 400, 403, 404, 409 |
| 14 | DELETE | `/rooms/:id` | Delete room without history | M | 204 | 403, 404, 409 |
| 15 ★ | POST | `/reservations` | Book room | G (FD, M on behalf) | 201 | 400, 403, 404, 409 |
| 16 | GET | `/reservations` | List reservations (filters) | G(own), FD, M | 200 | 401, 403 |
| 17 | GET | `/reservations/:id` | One reservation | G(own), FD, M | 200 | 403, 404 |
| 18 | PATCH | `/reservations/:id` | Change room/dates | G(own), FD, M | 200 | 400, 403, 404, 409 |
| 19 | PATCH | `/reservations/:id/confirm` | Confirm PENDING reservation | FD, M | 200 | 403, 404, 409 |
| 20 | PATCH | `/reservations/:id/check-in` | Digital check-in + key | G(own), FD, M | 200 | 403, 404, 409 |
| 21 | PATCH | `/reservations/:id/check-out` | Digital check-out | G(own), FD, M | 200 | 403, 404, 409 |
| 22 | DELETE | `/reservations/:id` | Cancel (record kept as CANCELLED) | G(own), FD, M | 200 | 403, 404, 409 |
| 23 ★ | POST | `/payments` | Record payment | FD, M | 201 | 400, 403, 404, 409 |
| 24 | GET | `/payments` | List payments | G(own), FD, M | 200 | 401, 403 |
| 25 | GET | `/payments/:id` | One payment | G(own), FD, M | 200 | 403, 404 |
| 26 | PATCH | `/payments/:id` | Verify / change payment status | FD, M | 200 | 400, 403, 404, 409 |
| 27 | POST | `/digital-keys` | Issue / reissue key | G(own), FD, M | 201 | 400, 403, 404, 409 |
| 28 | POST | `/digital-keys/validate` | Validate key at door (simulated lock) | G(own), FD, M | 200 | 400, 403 |
| 29 | GET | `/digital-keys` | List key metadata | G(own), FD, M | 200 | 401, 403 |
| 30 | GET | `/digital-keys/:id` | Key metadata | G(own), FD, M | 200 | 403, 404 |
| 31 | PATCH | `/digital-keys/:id/revoke` | Revoke key | FD, M | 200 | 403, 404, 409 |
| 32 | POST | `/housekeeping` | Assign cleaning task | M | 201 | 400, 403, 404, 409 |
| 33 | GET | `/housekeeping` | List tasks | HK(own), M | 200 | 401, 403 |
| 34 | GET | `/housekeeping/:id` | One task | HK(own), M | 200 | 403, 404 |
| 35 | PATCH | `/housekeeping/:id` | Update status / reassign (M) | HK(own), M | 200 | 400, 403, 404, 409 |
| 36 | POST | `/staff` | Create staff account | M | 201 | 400, 403, 409 |
| 37 | GET | `/staff` | List staff | M | 200 | 401, 403 |
| 38 | GET | `/staff/:id` | Staff details | M | 200 | 403, 404 |
| 39 | PATCH | `/staff/:id` | Update staff / reset password | M | 200 | 400, 403, 404, 409 |
| 40 | DELETE | `/staff/:id` | Deactivate staff | M | 204 | 403, 404, 409 |
| 41 ★ | POST | `/service-orders` | Place service order | G (FD, M on behalf) | 201 | 400, 403, 404, 409 |
| 42 | GET | `/service-orders` | List orders | G(own), FD, M | 200 | 401, 403 |
| 43 | GET | `/service-orders/:id` | One order | G(own), FD, M | 200 | 403, 404 |
| 44 | PATCH | `/service-orders/:id` | Update order status | G(cancel own PENDING), FD, M | 200 | 403, 404, 409 |

Every protected endpoint can also return **401** (missing/invalid/expired token or deactivated account) and **429** (rate limit). Unexpected failures return **500** with a generic message.

HTTP methods used: **GET** (read), **POST** (create / actions that create something), **PUT** (full replacement of a room), **PATCH** (partial update and state transitions), **DELETE** (delete room; deactivate guest/staff; cancel reservation).

### Query parameters

| Endpoint | Parameters |
|---|---|
| `GET /rooms` | `roomStatus` (AVAILABLE, OCCUPIED, CLEANING, MAINTENANCE — any case), `roomType` (Standard, Deluxe, Suite, Family), `minPrice`, `maxPrice`, `checkInDate` + `checkOutDate` (YYYY-MM-DD, both or neither), `page`, `limit` (≤100) |
| `GET /guests` | `search`, `accountStatus`, `page`, `limit` |
| `GET /reservations` | `reservationStatus`, `guestId` (staff), `roomId`, `fromDate`, `toDate`, `page`, `limit` |
| `GET /payments` | `reservationId`, `status`, `paymentMethod`, `page`, `limit` |
| `GET /digital-keys` | `reservationId`, `status`, `page`, `limit` |
| `GET /housekeeping` | `status`, `roomId`, `staffId` (manager), `page`, `limit` |
| `GET /staff` | `role`, `accountStatus`, `search`, `page`, `limit` |
| `GET /service-orders` | `status`, `serviceType`, `reservationId`, `page`, `limit` |


## 5.4 Request and response examples

All examples below were captured from the running API (tokens and key codes shortened).

### POST /auth/login — 200 OK
```json
// Request
{ "email": "manager@maristay.test", "password": "<demo password>" }
// Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.<payload>.<signature>",
  "tokenType": "Bearer",
  "expiresIn": "1h",
  "user": { "id": 1, "accountType": "STAFF", "role": "MANAGER", "firstName": "Marco", "lastName": "Villanueva", "email": "manager@maristay.test" }
}
```
401: `{"statusCode":401,"error":"UNAUTHORIZED","message":"Invalid email or password",…}` · 429 after 10 attempts/minute.

### POST /guests — 201 Created (Lab 05 #2)
```json
// Request
{ "firstName": "Geero Andrei", "lastName": "Reyes", "email": "geero.reyes@example.com",
  "password": "SecurePass123", "phoneNumber": "09123456789" }
// Response (no passwordHash)
{ "guestId": 3, "firstName": "Geero Andrei", "lastName": "Reyes", "email": "geero.reyes@example.com",
  "phoneNumber": "09123456789", "accountStatus": "ACTIVE",
  "createdAt": "2026-11-25T15:31:46.597Z", "updatedAt": "2026-11-25T15:31:46.597Z" }
```
409: `"message": "Email already exists"` · 400: e.g. `["password must be 8–72 characters long and contain at least one letter and one number"]`.

### GET /rooms?roomStatus=Available&roomType=Deluxe — 200 OK (Lab 05 #1)
```json
{
  "data": [ { "roomId": 5, "roomNo": "201", "roomType": "Deluxe", "pricePerNight": 2500, "roomStatus": "AVAILABLE",
              "createdAt": "…", "updatedAt": "…" } ],
  "meta": { "page": 1, "limit": 20, "total": 2, "totalPages": 1 }
}
```
400: `["Invalid room status filter"]` (e.g. `?roomStatus=Vacant`).

### POST /rooms — 201 · PATCH /rooms/:id — 200 · PUT /rooms/:id — 200 (Lab 05 #6, #7)
```json
// POST body
{ "roomNo": "401", "roomType": "Deluxe", "pricePerNight": 2500 }
// PATCH body (partial)
{ "roomStatus": "Available", "pricePerNight": 2600 }
// PUT body (all fields required)
{ "roomNo": "401", "roomType": "Standard", "pricePerNight": 1800, "roomStatus": "Available" }
// Response (PUT)
{ "roomId": 10, "roomNo": "401", "roomType": "Standard", "pricePerNight": 1800, "roomStatus": "AVAILABLE", "createdAt": "…", "updatedAt": "…" }
```
404 `Room not found` · 409 `Room number 401 already exists` · 409 when changing the status of an OCCUPIED room · DELETE returns **204** with no body, or 409 if the room has history.

### POST /reservations — 201 Created (Lab 05 #3)
```json
// Request (guestId comes from the JWT; status is set by the server)
{ "roomId": 10, "checkInDate": "2026-11-25", "checkOutDate": "2026-11-27" }
// Response
{ "reservationId": 4, "guestId": 3, "roomId": 10, "checkInDate": "2026-11-25", "checkOutDate": "2026-11-27",
  "reservationStatus": "PENDING", "ratePerNight": 1800, "totalAmount": 3600,
  "createdAt": "…", "updatedAt": "…", "guest": { "guestId": 3, … }, "room": { "roomId": 10, "roomNo": "401", … } }
```
409 `Room already booked for the selected dates` · 400 `checkOutDate must be later than checkInDate` / `checkInDate cannot be in the past` / `A reservation cannot exceed 30 nights` · 403 when a guest books for another guestId.

### POST /payments — 201 Created (Lab 05 #4)
```json
// Request (status defaults to PAID; also PENDING or FAILED)
{ "reservationId": 4, "amount": 3600, "paymentMethod": "cash" }
// Response
{ "paymentId": 3, "reservationId": 4, "amount": 3600, "paymentMethod": "CASH", "status": "PAID",
  "date": "2026-11-25T15:31:46.000Z", "createdAt": "…",
  "reservationStatus": "CONFIRMED",
  "billing": { "roomTotal": 3600, "serviceCharges": 0, "totalBillable": 3600, "paidTotal": 3600, "balanceDue": 0, "overpaid": 0 } }
```
400 `Invalid payment information: amount exceeds the outstanding balance of 3600.00` / invalid method or amount · 409 for cancelled or checked-out reservations · PATCH transitions: PENDING→PAID|FAILED, PAID→REFUNDED (409 otherwise).

### PATCH /reservations/:id/check-in — 200 OK
```json
{
  "message": "Check-in successful",
  "reservation": { "reservationId": 4, "reservationStatus": "CHECKED_IN", "room": { "roomNo": "401", "roomStatus": "OCCUPIED", … }, … },
  "digitalKey": { "keyId": 1, "reservationId": 4, "keyCode": "MSK-<43 random characters>",
                  "issuedAt": "2026-11-25T15:31:46.000Z", "expiresAt": "2026-11-27T04:00:00.000Z", "status": "ACTIVE" },
  "notifications": [
    { "channel": "SMS", "recipient": "0912****789", "status": "SIMULATED_SENT", "sentAt": "…" },
    { "channel": "EMAIL", "recipient": "g***@example.com", "status": "SIMULATED_SENT", "sentAt": "…" } ]
}
```
`keyCode` appears **only** in this response (and on reissue). `expiresAt` = 12:00 local time on the check-out date (UTC+8 → 04:00Z).
409 messages: `Reservation must be confirmed (fully paid) before check-in` · `Payment required before check-in: balance of 2600.00 is still due` · `Check-in opens on 2026-12-09` · `Room 104 is not ready (status: CLEANING)` · `Reservation is already checked in`.

### POST /digital-keys/validate — 200 OK (simulated smart lock)
```json
// Request
{ "keyCode": "MSK-<43 random characters>", "roomId": 10 }
// Response
{ "accessGranted": true, "keyId": 1, "reservationId": 4, "roomId": 10, "roomNo": "401",
  "expiresAt": "2026-11-27T04:00:00.000Z",
  "message": "Access granted (simulated smart lock — no physical door is opened)" }
```
403: `Access denied: invalid digital key` · `… has been revoked` · `… has expired` · `… is not valid for this room` · `… reservation is not checked in`.

### POST /service-orders — 201 Created (Lab 05 #5)
```json
// Request (no price fields: the server uses its catalog)
{ "reservationId": 4, "itemCode": "BREAKFAST_SET", "quantity": 2, "notes": "No onions, please" }
// Response
{ "orderId": 2, "reservationId": 4, "serviceType": "Food", "itemCode": "BREAKFAST_SET", "quantity": 2,
  "unitPrice": 450, "totalAmount": 900, "status": "PENDING", "date": "…", "notes": "No onions, please",
  "reservation": { … } }
```
400 unknown `itemCode` or any client-supplied price field · 403 another guest's reservation · 409 reservation not checked in.

Service catalog (server-side prices, PHP): BREAKFAST_SET 450 · CLUB_SANDWICH 380 · PANCIT_CANTON 520 · BREWED_COFFEE 120 · FRESH_JUICE 150 · BOTTLED_WATER 60 · EXTRA_TOWELS 0 · TOILETRY_KIT 180 · EXTRA_BED 900 · LAUNDRY_BAG 350 · PRESSING 80 · AIRPORT_TRANSFER 1200 · ROOM_REFRESH 0.

### PATCH /reservations/:id/check-out — 200 OK
```json
{
  "message": "Check-out successful; room sent for cleaning",
  "reservation": { "reservationStatus": "CHECKED_OUT", "room": { "roomStatus": "CLEANING", … }, … },
  "billing": { "roomTotal": 3600, "serviceCharges": 900, "totalBillable": 4500, "paidTotal": 4500, "balanceDue": 0, "overpaid": 0 },
  "digitalKeysRevoked": 1,
  "openServiceOrdersCancelled": 0,
  "housekeepingTask": { "hkId": 3, "roomId": 10, "staffId": 4, "status": "PENDING", "lastUpdate": "…", "createdAt": "…" },
  "notifications": [ … ]
}
```
409 `Outstanding balance of 900.00 must be settled at the front desk before check-out`.

### PATCH /housekeeping/:id — 200 OK
```json
// Request (assigned housekeeper)
{ "status": "COMPLETED" }
// Response
{ "hkId": 3, "roomId": 10, "staffId": 4, "status": "COMPLETED", "lastUpdate": "…",
  "room": { "roomNo": "401", "roomStatus": "AVAILABLE", … },
  "staff": { "staffId": 4, "firstName": "Helen", "lastName": "Castro", "role": "HOUSEKEEPING", … } }
```
403 another housekeeper's task · 409 `Invalid status transition: PENDING → COMPLETED`.

### DELETE /reservations/:id — 200 OK
```json
{ "reservationId": 7, "reservationStatus": "CANCELLED", …, "refundDue": 3800 }
```
The reservation is **not destroyed** — it stays in MySQL as CANCELLED; `refundDue` tells the front desk how much PAID money to refund (`PATCH /payments/:id {"status":"REFUNDED"}`).

### Authorization failures
```json
// GET /reservations without a token → 401
{ "statusCode": 401, "error": "UNAUTHORIZED", "message": "Invalid or missing access token", "path": "/api/v1/reservations", "timestamp": "…" }
// POST /rooms with a guest token → 403
{ "statusCode": 403, "error": "FORBIDDEN", "message": "You do not have permission to perform this action", "path": "/api/v1/rooms", "timestamp": "…" }
```

## 5.5 HTTP status codes used

| Code | Meaning in MariStay |
|---|---|
| 200 OK | Successful read, update, state change, validation, cancellation |
| 201 Created | Guest, room, reservation, payment, key, task, staff or order created |
| 204 No Content | Room deleted; guest or staff deactivated |
| 400 Bad Request | Validation failed, unknown property, bad id, invalid dates/amounts, amount above balance |
| 401 Unauthorized | Missing/invalid/expired token, wrong credentials, deactivated account, wrong current password |
| 403 Forbidden | Valid token but wrong role or not the owner; digital key access denied |
| 404 Not Found | Resource id does not exist |
| 409 Conflict | Duplicate email/room number, overlapping booking, invalid state transition, unpaid balance, room not ready |
| 429 Too Many Requests | More than 10 logins/min or 300 requests/min from one IP |
| 500 Internal Server Error | Unexpected failure (generic message, details only in server log) |

Failed requests never return 200.

## 5.6 Authorization requirements summary

| Role | Can do |
|---|---|
| Public | Register, log in, browse rooms |
| GUEST | Own profile; book/update/cancel own reservations; check in/out own stays; own payments (read); own keys (issue/validate); own service orders (create, cancel PENDING) |
| FRONT_DESK | Guests (read/update), all reservations (incl. confirm, check-in/out on behalf), payments (record/verify), keys (issue/revoke/validate), service orders (status) |
| HOUSEKEEPING | Own housekeeping tasks only (read, status update) |
| MANAGER | Everything FRONT_DESK can, plus rooms CRUD, staff CRUD, housekeeping assignment/reassignment, guest deactivation |
