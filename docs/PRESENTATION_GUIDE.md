# Presentation Guide — 10–15 Minute Defense

Twelve slides, about one minute each, plus a live demo. This is a slide-ready outline: copy each "On slide" block into one slide of PowerPoint or Google Slides. Take the diagrams from `docs/MariStay_Final_Documentation.pdf` (or screenshot them from `docs/build/final-documentation.html` after `npm run docs:build`). Speaker notes are written to be *said*, not read from the slide. Talk about your system in your own words.

Suggested look: navy (`1F3A5F`) titles, white background, a single gold (`C9A227`) accent, and one diagram or screenshot per slide.

**Before you present:** XAMPP MySQL running · `npm run start:dev` already started with no errors · Postman open with the collection and environment loaded and folder 1 already run · phpMyAdmin open on `maristay_db` · this repository open in VS Code at `src/rooms/rooms.controller.ts`.

---

### Slide 1 — Title (0:30)
**On slide:** MariStay: Hotel Management and Digital Guest Services System · Geero Andrei E. Reyes · BSIT 4C · ITEC 116 · Instructor John Vincent A. Dallego, MIT

**Say:** "Good day. I'm Geero Andrei Reyes. My project is MariStay, a backend that lets a hotel run reservations, payments, digital check-in, digital room keys, housekeeping and room service from one system."

### Slide 2 — Project overview (1:00)
**On slide:** Purpose (from Lab 03): one platform for reservations, digital check-in/out, keyless access, and room service. Users: guests, front desk, housekeeping, managers. Built with NestJS, TypeORM, MySQL, and JWT.

**Say:** "MariStay comes from my Lab 03 proposal. The labs were the design; this project makes them real: a MySQL database that stores data, REST endpoints that respond, and login that protects the routes."

### Slide 3 — Problems and objectives (1:00)
**On slide:** Problems: long check-in lines, slow room-cleaning updates, manual room-service tracking, scattered information. Objectives: 8-table database, 20+ endpoints (44 built), JWT security, an integrated workflow, and testing.

**Say:** "The front desk is a bottleneck, housekeeping updates are slow, and orders are tracked on paper. My goal was a backend where these departments share one database and update each other automatically."

### Slide 4 — Features and intended users (1:00)
**On slide:** Role table: GUEST, FRONT_DESK, HOUSEKEEPING, MANAGER, each with 3–4 key abilities.

**Say:** "Each role sees only what it needs. Guests see only their own data. Housekeepers see only their own tasks; they can't open payments at all. Only the manager can change rooms or staff."

### Slide 5 — System architecture (1:15)
**On slide:** The architecture diagram (Client → NestJS pipeline → modules → MySQL; simulated SMS, payment gateway, and smart lock).

**Say:** "It's a modular monolith: one NestJS application with nine modules and one MySQL database. Every request passes three global guards (rate limit, JWT, roles), then validation, then controller, service, repository, and MySQL. SMS, the payment gateway, and smart locks are simulated behind their own classes, so a real provider can be plugged in later."

### Slide 6 — Database design and ERD (1:15)
**On slide:** The ERD with 8 tables and 7 foreign keys.

**Say:** "These are exactly the eight tables from Lab 04. Reservation is the center: a guest has many reservations, a room has many reservations, and each reservation has many payments, keys, and service orders. Rooms and staff meet in housekeeping. Every foreign key is ON DELETE RESTRICT, so history can't be deleted by accident. I added a few documented columns, like password hashes for staff and a price snapshot on reservations."

### Slide 7 — REST API design (1:00)
**On slide:** Conventions (plural nouns, `/api/v1`, path and query parameters, nested resources). Endpoint counts per module (44 total). Example: `GET /api/v1/rooms?roomStatus=Available`. Status codes 200/201/204/400/401/403/404/409/429.

**Say:** "I followed my Lab 05 rules. All seven Lab 05 endpoints are there with the same access levels. In total there are 44 endpoints using GET, POST, PUT, PATCH, and DELETE. Errors always have the same JSON shape, and a failure never returns 200."

### Slide 8 — Authentication and security (1:15)
**On slide:** The login-flow diagram, plus bcrypt, JWT HS256 with a 1-hour expiry, the global JwtAuthGuard, RolesGuard and ownership checks, ValidationPipe with whitelisting, a login limit of 10/min, Helmet, CORS, and secrets kept in .env.

**Say:** "This is my Lab 06 flow. Passwords are hashed with bcrypt. Login returns a JWT with the user's id and role. Without a token you get 401; with the wrong role you get 403. Ownership is checked too, so a guest can't open another guest's reservation even with a valid token. Unknown fields are rejected, so nobody can send `role: MANAGER` when registering."

### Slide 9 — Backend implementation (1:00)
**On slide:** Controller → Service → Repository code snippets. The booking transaction with `SELECT … FOR UPDATE`.

**Say:** "Controllers only handle HTTP. Services hold the rules. To stop double bookings, I lock the room row inside a transaction, so two people booking the same room at the same moment can't both succeed. I tested this with six parallel requests: one succeeded and five were rejected."

### Slide 10 — Postman demonstration (live, 3:00)
**On slide:** "Live demo" with the checklist below.

**Do:**
1. Login as manager → show the `accessToken`.
2. Rooms: Create (201), Get (200), Update with PATCH (200), Delete (204).
3. Remove the token, then send a protected request → 401.
4. Guest token on POST /rooms → 403.
5. phpMyAdmin → `rooms` table: show the created and deleted room, and that the data matches.

### Slide 11 — System integration workflow (1:15)
**On slide:** The reservation state diagram (PENDING → CONFIRMED → CHECKED_IN → CHECKED_OUT) and the room cycle (AVAILABLE → OCCUPIED → CLEANING → AVAILABLE).

**Say:** "This is where the modules work together. A payment confirms the reservation. Check-in needs full payment and a clean room; it sets the room to OCCUPIED and issues a digital key. Only the key's hash is stored. Check-out needs a zero balance; it revokes the key, sends the room to cleaning, and assigns the least-busy housekeeper. When the housekeeper finishes, the room is AVAILABLE again. Each step is one transaction."
*(Optional live: run Postman folder "10. Integrated Workflow".)*

### Slide 12 — Testing, conclusion, and future work (1:00)
**On slide:** 33 unit and 46 e2e tests passing, plus a Postman collection of 122 requests. Lessons and limitations. Future work: React front-end, real payment/SMS/lock providers, HTTPS deployment, refresh tokens.

**Say:** "Automated tests run against a real MySQL test database, and they found two real bugs that I fixed: a MariaDB lock-syntax difference and a time-zone mismatch. My biggest lesson is that transactions are what make integration safe. Next steps would be a React front-end and real external providers. Thank you; I'm ready for your questions."

---

## Timing plan

| Part | Minutes |
|---|---|
| Slides 1–9 | 8–9 |
| Live demo (slide 10) | 3 |
| Slides 11–12 | 2–3 |
| **Total** | **13–15** |

If time is short, skip the optional integrated-workflow run on slide 11. If the demo fails, show the Postman Runner results and the passing `npm run test:e2e` output instead.
