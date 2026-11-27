/**
 * Captures the documentation screenshots of the MariStay frontend (37 images,
 * all four roles). Run it ONLY against the isolated stack on a freshly reset
 * database, because it registers a guest and creates records:
 *
 *   npm run postman:reset                                   (repository root)
 *   DB_DATABASE=maristay_postman_db PORT=3001 LOGIN_RATE_LIMIT=100 node dist-postman/main.js
 *   cd frontend && VITE_API_BASE_URL=http://localhost:3001/api/v1 npm run dev
 *   node --env-file=../.env tests/capture-screenshots.cjs ../docs/screenshots/frontend
 *
 * Digital key codes are masked in every image. Nothing secret is printed.
 */
const { chromium } = require('playwright-core');
const { mkdirSync } = require('fs');
const { join } = require('path');

const BASE = process.env.FRONTEND_URL ?? 'http://localhost:5173';
const PW = process.env.SEED_DEMO_PASSWORD;
const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });
const list = [];

const KEY_MASKS = (page) => [page.getByTestId('key-code'), page.locator('input[placeholder="MSK-…"]')];
async function shot(page, name, caption, opts = {}) {
  await page.waitForTimeout(350); // let spinners / transitions settle
  // Grow the viewport to the content height so the full-height sidebar is drawn correctly.
  const height = (opts.full ?? true) ? Math.max(900, await page.evaluate(() => document.documentElement.scrollHeight)) : 900;
  await page.setViewportSize({ width: 1360, height });
  await page.screenshot({ path: join(OUT, `${name}.png`), mask: KEY_MASKS(page), maskColor: '#475569' });
  await page.setViewportSize({ width: 1360, height: 900 });
  list.push(`${name}.png — ${caption}`);
  console.log(`saved ${name}.png`);
}
const text = (page, t, timeout = 10000) => page.getByText(t).first().waitFor({ timeout });
const dialog = (page) => page.getByRole('dialog');
const nav = (page, name) => page.getByRole('navigation').getByRole('link', { name, exact: true }).click();

async function login(browser, email, password = PW) {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/dashboard$/);
  return page;
}
async function openReservation(page, id, guest) {
  await nav(page, guest ? 'My Reservations' : 'Reservations');
  await page.getByRole('link', { name: `#${id}`, exact: true }).first().click();
  await text(page, `Reservation #${id}`);
}

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    // ---------------------------------------------------------- registration
    const anon = await (await browser.newContext({ viewport: { width: 1360, height: 900 } })).newPage();
    await anon.goto(`${BASE}/login`);
    await text(anon, 'Guests and hotel staff use the same login.');
    await shot(anon, '01-login', 'Login page for all four roles, with the Sign up link', { full: false });
    await anon.getByRole('link', { name: 'Sign up' }).click();
    await text(anon, 'Create a guest account');
    await shot(anon, '02a-register-form', 'Guest registration form (no role selection)', { full: false });
    const f = (l) => anon.getByLabel(l, { exact: true });
    await f('First name').fill('Lea');
    await f('Last name').fill('Santos');
    await anon.getByLabel('Email address').fill('lea.santos@invalid');
    await anon.getByLabel('Phone number').fill('0917 555 0101');
    await f('Password').fill('weakpass');
    await f('Confirm password').fill('different1');
    await anon.getByRole('button', { name: 'Sign up' }).click();
    await text(anon, 'Passwords do not match.');
    await shot(anon, '02b-register-validation', 'Registration validation: invalid email, weak password, password mismatch', { full: false });
    await anon.getByLabel('Email address').fill('lea.santos@example.com');
    await f('Password').fill('LeaSantos2026');
    await f('Confirm password').fill('LeaSantos2026');
    await anon.getByRole('button', { name: 'Sign up' }).click();
    await anon.waitForURL(/\/login$/);
    await text(anon, 'Your guest account has been created.');
    await shot(anon, '02c-register-success', 'After sign-up: success message on the login page', { full: false });
    await anon.context().close();

    const lea = await login(browser, 'lea.santos@example.com', 'LeaSantos2026');
    await shot(lea, '03-new-guest-dashboard', 'Newly registered account signs in with the Guest role and guest navigation only');
    await lea.goto(`${BASE}/staff`);
    await text(lea, 'Access denied');
    await shot(lea, '04-access-denied-guest', 'Access control: a guest opening the manager-only Staff page');
    await lea.context().close();

    // ---------------------------------------------------------------- manager
    const m = await login(browser, 'manager@maristay.test');
    await text(m, 'Open housekeeping tasks');
    await shot(m, '05-manager-dashboard', 'Manager dashboard with live statistics');
    await nav(m, 'Rooms');
    await m.locator('tbody tr').first().waitFor();
    await shot(m, '06a-manager-rooms', 'Manager: room list with search and filters');
    await m.getByRole('button', { name: 'Add room' }).click();
    await dialog(m).getByLabel('Room number').fill('T901');
    await dialog(m).getByLabel('Room type').selectOption('Deluxe');
    await dialog(m).getByLabel('Price per night (PHP)').fill('3200');
    await shot(m, '06b-room-create', 'Room CRUD — Create (Add room dialog)', { full: false });
    await dialog(m).getByRole('button', { name: 'Create room' }).click();
    await text(m, 'Room T901 created.');
    await m.getByLabel('Search room number').fill('T901');
    await m.locator('tbody tr', { hasText: 'T901' }).waitFor();
    await shot(m, '06c-room-read', 'Room CRUD — Read (search finds the new room)', { full: false });
    await m.getByRole('button', { name: 'Edit room T901' }).click();
    await dialog(m).getByLabel('Price per night (PHP)').fill('3300');
    await shot(m, '06d-room-update', 'Room CRUD — Update (Edit room dialog)', { full: false });
    await dialog(m).getByRole('button', { name: 'Save changes' }).click();
    await text(m, 'Room T901 updated.');
    await m.getByRole('button', { name: 'Delete room T901' }).click();
    await shot(m, '06e-room-delete', 'Room CRUD — Delete (confirmation dialog)', { full: false });
    await dialog(m).getByRole('button', { name: 'Delete', exact: true }).click();
    await text(m, 'Room T901 deleted.');
    await nav(m, 'Staff');
    await text(m, 'frontdesk@maristay.test');
    await shot(m, '07-manager-staff', 'Manager: staff management');
    await nav(m, 'Guests');
    await text(m, 'lea.santos@example.com');
    await shot(m, '08-manager-guests', 'Guest management (shows the newly registered guest)');

    // ------------------------------------------------------- guest booking
    const g = await login(browser, 'juan.delacruz@example.com');
    await text(g, 'Awaiting payment');
    await shot(g, '09-guest-dashboard', 'Guest dashboard');
    await nav(g, 'Book a Room');
    await g.getByRole('button', { name: 'Check availability' }).click();
    const row = g.locator('tbody tr', { hasText: 'Available' }).first();
    await row.waitFor();
    const roomNo = (await row.locator('td').first().innerText()).trim();
    await shot(g, '10a-guest-availability', 'Guest: room availability search for chosen dates');
    await row.getByRole('button', { name: `Book room ${roomNo}` }).click();
    await shot(g, '10b-guest-booking-dialog', 'Guest: booking confirmation', { full: false });
    await dialog(g).getByRole('button', { name: 'Confirm booking' }).click();
    await g.waitForURL(/\/reservations\/\d+$/);
    const rid = Number(g.url().split('/').pop());
    await text(g, 'Pending');
    await shot(g, '10c-reservation-pending', 'Reservation detail: PENDING until paid');

    // ----------------------------------------------------- front desk payment
    const d = await login(browser, 'frontdesk@maristay.test');
    await text(d, 'Pending service orders');
    await shot(d, '11-frontdesk-dashboard', 'Front desk dashboard');
    await openReservation(d, rid, false);
    await d.getByRole('button', { name: 'Record payment' }).click();
    await shot(d, '12a-record-payment', 'Front desk: Record payment (simulated, no card data)', { full: false });
    await dialog(d).getByRole('button', { name: 'Record payment' }).click();
    await text(d, /Reservation is CONFIRMED/);
    await shot(d, '12b-reservation-confirmed', 'Full payment automatically confirms the reservation');
    await nav(d, 'Payments');
    await d.locator('tbody tr').first().waitFor();
    await shot(d, '12c-payments', 'Payments list');

    // -------------------------------------------- guest check-in, keys, lock
    await openReservation(g, rid, true);
    await g.getByRole('button', { name: 'Check in' }).click();
    await shot(g, '13a-checkin-dialog', 'Guest: digital check-in', { full: false });
    await dialog(g).getByRole('button', { name: 'Check in' }).click();
    await text(g, 'Digital room key issued');
    await shot(g, '13b-digital-key-issued', 'Digital check-in result: one-time digital room key (key code masked)');
    await nav(g, 'My Digital Keys');
    await g.getByLabel('Room door').selectOption({ label: `Room ${roomNo}` });
    await g.getByRole('button', { name: 'Open door' }).click();
    await text(g, /Access granted/);
    await shot(g, '14a-smart-lock-granted', 'Simulated smart lock: access granted for the booked room (key code masked)');
    const other = await g.getByLabel('Room door').locator('option').evaluateAll(
      (opts, mine) => opts.map((o) => o.textContent).find((t) => t.startsWith('Room ') && t !== mine), `Room ${roomNo}`);
    await g.getByLabel('Room door').selectOption({ label: other });
    await g.getByRole('button', { name: 'Open door' }).click();
    await text(g, /Access denied: digital key is not valid for this room/);
    await shot(g, '14b-smart-lock-denied', 'Simulated smart lock: access denied for a different room (403)');

    // --------------------------------------------------------- service requests
    await nav(g, 'Service Requests');
    await g.getByRole('button', { name: 'New request' }).click();
    await dialog(g).getByLabel('Your stay').selectOption({ index: 1 });
    await dialog(g).getByLabel('Item').selectOption({ label: 'Filipino breakfast set (Food) — ₱450.00' });
    await shot(g, '15a-service-request-new', 'Guest: new service request', { full: false });
    await dialog(g).getByRole('button', { name: 'Place order' }).click();
    await text(g, /Order #\d+ placed/);
    await shot(g, '15b-service-requests', 'Guest: service requests list');
    await nav(d, 'Service Orders');
    const ord = () => d.locator('tbody tr', { hasText: 'Filipino breakfast set' }).filter({ has: d.getByRole('link', { name: `#${rid}`, exact: true }) }).first();
    await ord().getByRole('button', { name: 'Mark preparing' }).click();
    await text(d, /is now preparing/);
    await ord().getByRole('button', { name: 'Mark delivered' }).click();
    await text(d, /is now delivered/);
    await shot(d, '16-frontdesk-service-orders', 'Front desk: service order marked delivered');

    // ---------------------------------------------------------------- check-out
    await openReservation(g, rid, true);
    await g.getByRole('button', { name: 'Check out' }).click();
    await dialog(g).getByRole('button', { name: 'Check out' }).click();
    await text(g, /Conflict: Outstanding balance of 450\.00/);
    await shot(g, '17a-checkout-blocked', 'Check-out blocked while a service charge is unpaid (409)');
    await d.reload();
    await openReservation(d, rid, false);
    await d.getByRole('button', { name: 'Record payment' }).click();
    await dialog(d).getByRole('button', { name: 'Record payment' }).click();
    await text(d, /Balance due: ₱0\.00/);
    await nav(g, 'Dashboard');
    await openReservation(g, rid, true);
    await g.getByRole('button', { name: 'Check out' }).click();
    await dialog(g).getByRole('button', { name: 'Check out' }).click();
    await text(g, 'Check-out summary');
    const hkText = await g.getByText(/housekeeping task #\d+ created/).innerText();
    const hkId = Number(hkText.match(/#(\d+)/)[1]);
    await shot(g, '17b-checkout-summary', 'Digital check-out: keys revoked, room sent to housekeeping');
    await nav(g, 'My Digital Keys');
    await g.getByLabel('Room door').selectOption({ label: `Room ${roomNo}` });
    await g.getByRole('button', { name: 'Open door' }).click();
    await text(g, /Access denied: digital key has been revoked/);
    await shot(g, '17c-revoked-key-denied', 'After check-out the revoked key no longer opens the door');
    await nav(d, 'Digital Keys');
    await d.locator('tbody tr').first().waitFor();
    await shot(d, '18-frontdesk-digital-keys', 'Front desk: digital key history (no key codes are ever listed)');

    // ------------------------------------------------------------- housekeeping
    let h = null;
    for (const email of ['housekeeping2@maristay.test', 'housekeeping1@maristay.test']) {
      h = await login(browser, email);
      await nav(h, 'My Tasks');
      await h.locator('tbody tr, :text("No housekeeping tasks.")').first().waitFor();
      if (await h.locator('tbody tr', { hasText: `#${hkId}` }).count()) break;
      await h.context().close(); h = null;
    }
    if (!h) throw new Error('housekeeping task not found');
    await nav(h, 'Dashboard');
    await h.waitForTimeout(500);
    await shot(h, '19a-housekeeping-dashboard', 'Housekeeping dashboard');
    await nav(h, 'My Tasks');
    const hr = h.locator('tbody tr', { hasText: `#${hkId}` });
    await hr.getByRole('button', { name: 'Start cleaning' }).click();
    await text(h, `Task #${hkId} started.`);
    await hr.getByRole('button', { name: 'Mark completed' }).click();
    await dialog(h).getByRole('button', { name: 'Mark completed' }).click();
    await text(h, new RegExp(`Task #${hkId} completed\\. Room ${roomNo} is now available\\.`));
    await shot(h, '19b-housekeeping-completed', 'Housekeeping: task completed, room available again');
    await h.goto(`${BASE}/reservations`);
    await text(h, 'Access denied');
    await shot(h, '20-access-denied-housekeeping', 'Access control: housekeeping cannot open Reservations');
    await nav(m, 'Housekeeping');
    await m.locator('tbody tr').first().waitFor();
    await shot(m, '21-manager-housekeeping', 'Manager: housekeeping assignments');
  } finally {
    await browser.close();
  }
  require('fs').writeFileSync(join(OUT, 'INDEX.txt'), list.join('\n') + '\n');
  console.log(`\n${list.length} screenshots in ${OUT}`);
})().catch((e) => { console.error('FAILED:', e.message.split('\n')[0]); process.exit(1); });
