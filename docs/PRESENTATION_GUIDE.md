# Presentation Guide — 10–15 Minute Defense

**Slides:** [`docs/MariStay_Presentation.pptx`](MariStay_Presentation.pptx). There are 15 editable slides in 16:9, and every slide has speaker notes (in PowerPoint: View → Notes). To regenerate the deck after editing the generator: run `npm install --no-save pptxgenjs`, then `node scripts/build-presentation.js`.

The deck follows the instructor's presentation flow (guidelines §6): overview → architecture → database → REST API → security → backend demonstration → API testing → conclusion → Q&A. Every number on the slides comes from verified results in `docs/TESTING_REPORT.md`. Speak in your own words; the notes are a guide, not a script to read.

## Before you present

- [ ] XAMPP Control Panel: **MySQL** and **Apache** running.
- [ ] `npm run start:dev` already started on port 3000 with no errors (the guidelines ask for the backend to be "already confirmed running").
- [ ] Postman open on the **MariStay Local** environment, with `demoPassword` set and **saved**.
- [ ] phpMyAdmin open on `maristay_db` → `rooms`.
- [ ] VS Code open at `src/rooms/rooms.controller.ts`, `rooms.service.ts` and `entities/room.entity.ts`.
- [ ] The slides in Presenter View. Notifications are off, and `.env` is not visible.
- [ ] Fallback ready: the recorded video and a terminal with the `npm run test:e2e` output.

## Slide plan and timing

| # | Slide | Time | Key point to make |
|---|---|---|---|
| 1 | Title | 0:20 | Who you are; MariStay in one sentence |
| 2 | Project background | 0:45 | Labs 03–06 were the design; the final project makes them real (8 tables, 44 endpoints, 9 modules, 4 roles) |
| 3 | Problem statement | 0:45 | Five integration problems; the one question the system answers |
| 4 | Project objectives | 0:40 | General objective plus six specific, measurable ones |
| 5 | Proposed system | 0:45 | Four roles; roles **and** ownership are checked on every request |
| 6 | System architecture | 1:00 | Guards → validation → controller → service → repository → database; simulated external services |
| 7 | Database design and ERD | 1:00 | Reservations at the centre; 7 RESTRICT foreign keys; 17 CHECK constraints |
| 8 | Core features | 0:45 | Six business features and what each one guarantees |
| 9 | REST API endpoints | 0:45 | 44 endpoints, all methods, Lab 05 conventions, consistent errors |
| 10 | Authentication and security | 1:00 | Lab 06 login flow; 401 vs 403; ownership; rate limiting |
| 11 | Integrated hotel workflow | 1:00 | Steps 5, 6, 9 and 10 are single transactions |
| 12 | Testing results | 0:45 | 33/33, 46/46, 122/122 requests, 177/177 assertions; real bugs found |
| 13 | System demonstration | 3:00 | Live demo (below) |
| 14 | Conclusion | 0:45 | Accomplishments, lessons, next steps |
| 15 | Questions and answers | — | Prepared answers: [`docs/DEFENSE_QUESTIONS.md`](DEFENSE_QUESTIONS.md) |
| | **Total** | **≈ 13:15** | Within the 10–15 minute limit |

If time is short, shorten slides 2, 4 and 8 to about 20 seconds each.

## Live demonstration (slide 13, about 3 minutes)

These are the guidelines' "Backend Demonstration" and "API Testing" steps, against `maristay_db` on port 3000:

1. **Running application:** show the terminal: "Found 0 errors" and the mapped routes.
2. **Login:** Postman *1. Authentication → Login - Manager* → 200 with `accessToken`.
3. **CRUD:** folder *3. Rooms*:
   * *Create Room* → 201.
   * *Get Room* → 200.
   * *Update Room - PATCH* → 200.
   * *Delete Room* → 204.
   * *Get Deleted Room* → 404.
4. **Database interaction:** in phpMyAdmin, refresh `rooms` and show the data matches.
5. **Authentication flow:** remove the token from *Create Room* (Authorization → No Auth) → 401. Optionally send *11 → Guest Calls Manager-only Route* → 403.

Use only these single requests on `maristay_db`. **Do not run the whole collection there**: it creates test records. The full 122-request run uses the isolated port-3001 database (README → Postman).

**If the demo fails:** say so calmly, then show the recorded video and the passing `npm run test:e2e` output.
