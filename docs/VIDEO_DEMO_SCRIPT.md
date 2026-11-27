# Video Demonstration Script (target 8:10, limit 5–10 minutes)

The video must show your screen with **your own spoken narration**. Parts 1–6 are required by the instructor **in this exact order** (Final Project guidelines §3.6) and take about 6:35. The two extra parts (A and B) come after Part 6, so the required order is never broken. The whole video shows the backend only: Postman, the code, the terminal and phpMyAdmin. If a rehearsal runs over 9:45, shorten part B to one sentence first, then show only the Runner summary in part A. Never shorten Parts 1–6.

This file is a script and checklist only. The video has **not** been recorded.

| Time | Part | Required? |
|---|---|---|
| 0:00 | Introduction | — |
| 0:20 | 1. Start the backend | Required #1 |
| 1:00 | 2. Log in and receive a JWT | Required #2 |
| 1:40 | 3. Full CRUD on rooms in Postman | Required #3 |
| 3:20 | 4. How the data moves through the layers | Required #4 |
| 5:20 | 5. Protected route without a token | Required #5 |
| 5:55 | 6. Database check in phpMyAdmin | Required #6 |
| 6:35 | A. Integrated workflow in the Postman Runner | Extra |
| 7:25 | B. Automated test results | Extra |
| 7:55 | Conclusion | — |

## Preparation (before you press record)

1. **XAMPP Control Panel:** start **MySQL** and **Apache**.
2. **Stop anything on port 3000**, so you can start the backend on camera. The VS Code terminal should be empty.
3. **Prepare the isolated workflow database** (for part A) in a second terminal, *not* shown on camera:
   ```bash
   cd backend
   npm run postman:reset
   npm run postman:start      # leave running: http://localhost:3001/api/v1
   ```
4. **Postman:**
   * Two environments, each with `demoPassword` set and **saved** (Ctrl+S): *MariStay Local* (port 3000) and *MariStay Postman 3001* (create it with `npm run postman:env`, then import from `postman/tmp/`).
   * Select **MariStay Local**.
   * Open these tabs: *1. Authentication → Login - Manager*, and from *3. Rooms*: *Create Room (Manager)*, *Get Room*, *Update Room - PATCH*, *Delete Room*, *Get Deleted Room → 404*.
5. **VS Code tabs:** `backend/src/rooms/rooms.controller.ts`, `backend/src/rooms/rooms.service.ts`, `backend/src/rooms/entities/room.entity.ts`, `backend/src/database/database.config.ts`.
6. **Browser tab:** phpMyAdmin at `http://localhost/phpmyadmin` → `maristay_db` → `rooms`.
7. **Privacy:** never open `.env` on screen, and turn off notifications. In Postman, keep `demoPassword` hidden: it is a *secret*-type value.
8. **Ports and other projects:** MariStay needs ports 3000 (demo API) and 3001 (isolated API for part A). Stop any other local project that uses them before recording, and keep only one MariStay instance per port.
9. **Login limit:** the API allows 10 logins per minute per computer (Lab 06 brute-force protection). Do not repeat failed logins on camera. If you see "Too many attempts", wait one minute.
10. **Recorder:** OBS Studio or Xbox Game Bar (Win + G). Test the microphone level first.

---

## Introduction (0:00–0:20)

**Show:** the README in VS Code, or the title slide.

**Say:** "Hi, I'm Geero Andrei Reyes from BSIT 4C. This is MariStay, my ITEC 116 final project: a hotel management and digital guest services backend built with NestJS, TypeORM, MySQL and JWT. I'll show it running, test it in Postman, trace a request through my code, and check the database."

## Part 1 — Start the backend (0:20–1:00)

**Do:** In the VS Code terminal, in the `backend` folder, type `npm run start:dev` and press Enter. Wait for `Found 0 errors`, the `Mapped {…}` route lines, and `MariStay API running at http://localhost:3000/api/v1`. Scroll the route list briefly.

**Say:** "I start the backend with npm run start:dev. It compiles with zero errors, connects to MySQL, and maps all 44 routes under /api/v1. It is connected to the maristay_db database on XAMPP."

## Part 2 — Log in and receive a JWT (1:00–1:40)

**Do:** Postman → *Login - Manager* → **Send**. Point at `200 OK` and the `accessToken`, then open the **Test Results** tab (3 passed).

**Say:** "I log in as the manager. The server compares my password with the bcrypt hash in the database and checks that the account is active. Then it returns a signed JWT that carries my user id and role and expires in one hour. Postman saves the token, and the next requests send it as a Bearer token."

## Part 3 — Full CRUD on Room Management (1:40–3:20)

| Step | Click | Expected result to point at |
|---|---|---|
| Create | *Create Room (Manager)* → Send | **201 Created**, new `roomId`, `roomStatus: "AVAILABLE"` |
| Read | *Get Room* → Send | **200 OK**, the same room |
| Update | *Update Room - PATCH* → Send | **200 OK**, `pricePerNight` is now **2800** |
| Delete | *Delete Room* → Send | **204 No Content** |
| Confirm | *Get Deleted Room → 404* → Send | **404 Not Found** |

> Before **Delete**, switch to phpMyAdmin and refresh `rooms`. The new room is there with price 2800. Switch back to Postman.

**Say while doing it:** "Create returns 201 with the new room. Read returns it with 200. PATCH changes only the fields I send, here the price, and returns 200. Before I delete it, here it is in phpMyAdmin with the new price. DELETE returns 204, and reading it again gives 404. A room with booking history can't be deleted; the API returns 409 to protect that history."

## Part 4 — How the data moves through the layers (3:20–5:20)

Trace **PATCH /api/v1/rooms/:id**, the update you just ran:

1. **Controller** (`rooms.controller.ts`, method `update()`):
   "The request first passes the global guards. JwtAuthGuard checks my token, and RolesGuard checks `@Roles(Role.MANAGER)`. ParseIdPipe turns the id into a number, and the ValidationPipe checks the body against UpdateRoomDto. The controller contains no business logic. It just calls `roomsService.update(id, dto)`."
2. **Service** (`rooms.service.ts`, `update()` and `applyChanges()`):
   "The service holds the rules. It loads the room, or throws 404. It rejects a duplicate room number with 409 and refuses to change an occupied room's status. Then it applies only the changed fields and calls `this.rooms.save(room)`."
3. **Repository and entity** (scroll to `@InjectRepository(Room)`, then open `room.entity.ts`):
   "The repository is TypeORM's repository for the Room entity. The entity maps this class to the rooms table: roomId is the primary key, roomNo is unique, and pricePerNight is DECIMAL(10,2). `save()` becomes a parameterised UPDATE statement sent to MySQL through the mysql2 driver, configured in `database.config.ts` from environment variables."
4. **Back out:**
   "MySQL confirms the update. The repository returns the updated entity to the service, the service returns it to the controller, and NestJS turns it into JSON with status 200. That's the response I saw in Postman: Postman, controller, service, repository, database, and back."

## Part 5 — Protected route without a token (5:20–5:55)

**Do:** Open *Create Room (Manager)* → **Authorization** tab → choose **No Auth**, or untick the `Authorization` header → **Send** → **401 Unauthorized**, "Invalid or missing access token". Then restore the header.

**Say:** "Now the same protected route without a token. The global JwtAuthGuard rejects it with 401 before it reaches the controller, so nothing is changed."

*(Optional, 10 s: select the guest login and send a manager-only request for a 403: authenticated, but not allowed.)*

## Part 6 — Database check (5:55–6:35)

**Do:** phpMyAdmin → `maristay_db` → `rooms` → refresh. The test room from Part 3 is gone, and the seeded rooms 101–303 are unchanged. Then open `staff` and point at a `passwordHash` value starting with `$2b$10$`.

**Say:** "The rooms table matches what I did in Postman: the test room I created and updated has been deleted, and the other rooms are untouched. Passwords are stored only as bcrypt hashes, never as plain text."

---

## A. Integrated workflow in the Postman Runner (6:35–7:25) — extra

This part runs on the **separate test database** (port 3001), so the demo data stays clean.

**Do:**
1. Postman: switch the environment to **MariStay Postman 3001**.
2. Click the collection → **Run**. In the Runner, deselect all, then select only folders **1. Authentication** and **10. Integrated Workflow**. Click **Run**. All tests pass. (Checked with Newman: these 25 requests pass all 43 assertions on a freshly reset database.)
3. Point at three results only: *05 Check-in Without Payment → 409*, *08 Open Room Door* → `accessGranted: true`, and *15 Key No Longer Works → 403*.

**Say:** "This is the whole hotel workflow in one run. Check-in without payment is refused with 409. After the front desk records the payment, digital check-in issues a key and the simulated smart lock opens the door. The guest orders coffee, and check-out is blocked until that charge is paid. After check-out the key stops working, and the room goes to housekeeping until the cleaning is completed. Payment, check-in, check-out and cleaning each run as a single database transaction."

## B. Automated test results (7:25–7:55) — extra

**Do:** In the VS Code terminal (stop the server with Ctrl+C first, or open a new terminal), run `npm run test` (about 10 s). Point at "33 passed".

**Say:** "The automated tests pass: 33 unit tests, and 46 end-to-end tests that run the real API against a separate test database. The full Postman collection passes 177 of 177 assertions. I also verified the system on Oracle MySQL 8.4, not only on XAMPP's MariaDB."

## Conclusion (7:55–8:10)

**Say:** "That's MariStay: a working NestJS backend with a MySQL database, JWT security and an integrated hotel workflow. Thank you for watching."

---

## After recording

- [ ] Length is between 5 and 10 minutes, and your voice is audible throughout.
- [ ] Nothing secret was visible: no `.env` and no password values.
- [ ] Upload to Google Drive (Share → *Anyone with the link — Viewer*) or YouTube (*Unlisted*).
- [ ] Open the link in an **incognito window** to confirm it plays.
- [ ] Paste the link on the cover of `docs/MariStay_Final_Project_Documentation.docx`, then export the PDF from Word.
- [ ] Stop the port-3001 server (Ctrl+C). Run `npm run postman:reset` before using that database again.
- [ ] Check part A for a readable digital key code (the *Open Room Door* request body and the check-in response contain one). If one is readable for more than a moment, blur it. That key belongs to the isolated database and is revoked at check-out.
