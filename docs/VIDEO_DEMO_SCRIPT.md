# Video Demonstration Script (5–10 minutes)

The instructor requires the parts in this exact order, with **your own spoken narration**. This file is a script and a checklist only; the video has **not** been recorded or uploaded yet.

Target length: about 7–8 minutes.

## Preparation checklist (before recording)

- [ ] XAMPP Control Panel: **MySQL running** (Apache too, if you use phpMyAdmin).
- [ ] `.env` configured; `npm run db:setup` already run (database `maristay_db` exists with demo data).
- [ ] No other app is using port 3000; stop any running `npm run start:dev` so you can start it on camera.
- [ ] Postman: collection and **MariStay Local** environment imported; `demoPassword` set; environment selected.
- [ ] Postman requests ready to show: *1. Authentication → Login - Manager*, and in *3. Rooms*: *Create Room*, *Get Room*, *Update Room - PATCH*, *Delete Room*. Use the dedicated test room created by *Create Room*, not a seeded room.
- [ ] VS Code open with these tabs: `src/rooms/rooms.controller.ts`, `src/rooms/rooms.service.ts`, `src/rooms/entities/room.entity.ts`, `src/database/database.config.ts`.
- [ ] phpMyAdmin open at `http://localhost/phpmyadmin` → `maristay_db` → `rooms`.
- [ ] Close notifications. Do not show `.env` on screen (it contains your secrets).
- [ ] Screen recorder ready (e.g. OBS Studio or the Xbox Game Bar), with the microphone tested.

---

## Part 1 — Start the backend (≈0:45)

**Do:** In the VS Code terminal run:
```bash
npm run start:dev
```
Wait for `Found 0 errors`, the list of `Mapped {…}` routes, and `MariStay API running at http://localhost:3000/api/v1`.

**Say:** "This is MariStay, my hotel management backend built with NestJS, TypeORM and MySQL. I'm starting it with npm run start:dev. It compiled with zero errors, connected to MySQL, and mapped all 44 routes under /api/v1."

## Part 2 — Log in and receive a JWT (≈0:45)

**Do:** Postman → *1. Authentication → Login - Manager* → Send. Point at `accessToken`, then at the Tests tab showing the passing tests.

**Say:** "I log in as the manager with email and password. The server checks the bcrypt password hash and the account status, then returns a signed JWT. It contains my user id and role and expires in one hour. Postman saves it into the environment, so the next requests send it as a Bearer token."

## Part 3 — Full CRUD on Room Management (≈2:00)

| Step | Request | Expected |
|---|---|---|
| Create | *Create Room* — `POST /rooms` `{ "roomNo": "T…", "roomType": "Deluxe", "pricePerNight": 2500 }` | **201 Created**, new `roomId` |
| Read | *Get Room* — `GET /rooms/{{roomId}}` | **200 OK**, same room |
| Update | *Update Room - PATCH* — `{ "pricePerNight": 2800, "roomStatus": "Available" }` | **200 OK**, price 2800 |
| *(optional)* | *Replace Room - PUT* | 200 OK |
| Delete | *Delete Room* — `DELETE /rooms/{{roomId}}` | **204 No Content** |
| Confirm | *Get Deleted Room → 404* | **404 Not Found** |

**Say while doing it:** "Create returns 201 with the new room. Read returns it with 200. PATCH changes only the fields I send, here the price, and returns 200. DELETE returns 204 No Content, and reading it again gives 404. Rooms that already have reservations can't be deleted; the API returns 409 to protect booking history."

> Tip: before deleting, switch to phpMyAdmin and refresh `rooms` to show the new row with price 2800. You can reuse this in Part 6.

## Part 4 — How the data moves through the layers (≈2:15)

Trace **PATCH /api/v1/rooms/:id** through the real files.

1. **Controller** — open `src/rooms/rooms.controller.ts`, the `update()` method.
   "The request first passes the global guards: JwtAuthGuard checks my token, and RolesGuard checks `@Roles(Role.MANAGER)`. ParseIdPipe turns the id into a number, and the ValidationPipe checks the body against `UpdateRoomDto`. The controller then just calls `roomsService.update(id, dto)`. It contains no business logic."
2. **Service** — open `src/rooms/rooms.service.ts`, `update()` and `applyChanges()`.
   "The service holds the rules. It loads the room (404 if missing), rejects a duplicate room number with 409, refuses to change an occupied room's status, then applies only the changed fields and calls `this.rooms.save(room)`."
3. **Repository and entity** — scroll to the constructor (`@InjectRepository(Room) … Repository<Room>`), then open `src/rooms/entities/room.entity.ts`.
   "The repository is TypeORM's. It uses the Room entity, which maps this class to the `rooms` table: roomId is the primary key, roomNo is unique, pricePerNight is DECIMAL(10,2). save() becomes a parameterised `UPDATE rooms SET … WHERE roomId = ?` sent to MySQL through the mysql2 driver configured in `database.config.ts`."
4. **Back out** — "MySQL confirms the update. The repository returns the Room entity to the service, the service returns it to the controller, and NestJS serialises it to JSON with status 200. That's the response I saw in Postman."

Say the flow once more: **Postman → Controller → Service → Repository → MySQL → Repository → Service → Controller → Postman**.

## Part 5 — Protected route without a token (≈0:45)

**Do:** Open *Create Room* (or any protected request) → **Authorization** tab → set *No Auth*, or delete the Authorization header → Send → **401 Unauthorized** `"Invalid or missing access token"`.
*(Optional)* Send *11 → Guest Calls Manager-only Route* → **403 Forbidden**.

**Say:** "Without a token, the global JwtAuthGuard rejects the request with 401 before it reaches the controller. With a valid guest token on a manager-only route, I get 403: the user is authenticated but not authorised."

Put the token back afterwards.

## Part 6 — Database verification (≈0:45)

**Do:** phpMyAdmin → `maristay_db` → `rooms` → Browse/refresh. Show that the test room created in Part 3 (with the updated price) is gone after the DELETE, while the seeded rooms remain. Optionally open `reservations` and `staff` to show `passwordHash` values starting with `$2b$10$`.

**Say:** "In phpMyAdmin, the rooms table matches what I did in Postman: the test room I created and updated has been deleted, and the other rooms are unchanged. You can also see that passwords are stored only as bcrypt hashes."

**Closing (≈0:15):** "That's MariStay: a working NestJS backend with MySQL, JWT security and an integrated hotel workflow. Thank you."

---

## After recording

- [ ] Length is between 5 and 10 minutes; your voice is audible throughout.
- [ ] Upload to Google Drive (share: *Anyone with the link — Viewer*) or YouTube (*Unlisted*).
- [ ] Open the link in an **incognito window** to confirm it plays.
- [ ] Paste the link on the documentation cover page (`docs/final/00-cover.md`), then run `npm run docs:build` to regenerate the PDF.
