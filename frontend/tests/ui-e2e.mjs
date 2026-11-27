/**
 * MariStay frontend — browser end-to-end test (all four roles).
 *
 * Drives the real UI in Microsoft Edge (playwright-core, no browser download)
 * against a running frontend + backend. Run it ONLY against the isolated
 * test database (maristay_postman_db) — it creates and changes records.
 *
 *   FRONTEND_URL      default http://localhost:5173
 *   SEED_DEMO_PASSWORD demo account password (loaded from backend/.env)
 *   SCREENSHOT_DIR    optional folder for screenshots (may show key codes — keep out of git)
 *
 *   node --env-file=../backend/.env tests/ui-e2e.mjs
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.FRONTEND_URL ?? 'http://localhost:5173';
const PASSWORD = process.env.SEED_DEMO_PASSWORD;
const SHOTS = process.env.SCREENSHOT_DIR;
if (!PASSWORD) {
  console.error('SEED_DEMO_PASSWORD is not set (run with --env-file=../backend/.env).');
  process.exit(1);
}
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const results = [];
async function step(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`PASS  ${name}`);
  } catch (err) {
    results.push({ name, ok: false });
    console.log(`FAIL  ${name}\n      ${String(err.message).split('\n')[0]}`);
  }
}
const shot = async (page, name) => SHOTS && page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true });
const expectText = (page, text, timeout = 10000) => page.getByText(text).first().waitFor({ timeout });
const dialog = (page) => page.getByRole('dialog');

async function login(browser, email, password = PASSWORD) {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  return page;
}
const nav = (page, name) => page.getByRole('navigation').getByRole('link', { name, exact: true }).click();
async function logout(page) {
  await page.getByRole('button', { name: 'Log out' }).click();
  await page.waitForURL(/\/login$/);
}
async function openReservation(page, id, guest) {
  await nav(page, guest ? 'My Reservations' : 'Reservations');
  await page.getByRole('link', { name: `#${id}`, exact: true }).first().click();
  await expectText(page, `Reservation #${id}`);
}

const browser = await chromium.launch({ channel: 'msedge', headless: true });
let manager, guest, desk, housekeeper;
let reservationId, roomNo, hkId;

try {
  // ------------------------------------------------------------ auth basics
  await step('Unauthenticated visit to /dashboard redirects to /login', async () => {
    const page = await (await browser.newContext()).newPage();
    await page.goto(`${BASE}/dashboard`);
    await page.waitForURL(/\/login$/);
    await page.context().close();
  });

  await step('Wrong password shows an authentication error (401)', async () => {
    const page = await login(browser, 'manager@maristay.test', 'WrongPassword123');
    await expectText(page, 'Invalid email or password');
    await page.context().close();
  });

  // -------------------------------------------------- guest self-registration
  const signupEmail = `ui.signup.${Date.now()}@example.com`;
  const signupPassword = 'SignUpGuest2026';
  let reg;
  const regField = (label) => reg.getByLabel(label, { exact: true });

  await step('Login page links to Sign up; registration page has no role selector', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
    reg = await ctx.newPage();
    await reg.goto(`${BASE}/login`);
    await reg.getByRole('link', { name: 'Sign up' }).click();
    await reg.waitForURL(/\/register$/);
    await expectText(reg, 'Create a guest account');
    if (await reg.locator('select').count()) throw new Error('registration page has a <select>');
    if (await reg.getByLabel(/role/i).count()) throw new Error('a role field is shown');
    if ((await reg.locator('input').count()) !== 6) throw new Error('expected exactly 6 inputs');
    await shot(reg, '00-guest-registration');
  });

  await step('Registration: empty submit shows required-field errors', async () => {
    await reg.getByRole('button', { name: 'Sign up' }).click();
    for (const t of ['Enter your first name.', 'Enter your last name.', 'Enter your email address.',
      'Enter your phone number.', 'Enter a password.', 'Confirm your password.']) await expectText(reg, t);
    if (!reg.url().endsWith('/register')) throw new Error('left the page');
  });

  await step('Registration: invalid email, weak password and mismatch are rejected in the form', async () => {
    await regField('First name').fill('Lea');
    await regField('Last name').fill('Santos-Reyes');
    await reg.getByLabel('Email address').fill('lea@invalid');
    await reg.getByLabel('Phone number').fill('0917 555 0101');
    await regField('Password').fill('weakpass');
    await regField('Confirm password').fill('different1');
    await reg.getByRole('button', { name: 'Sign up' }).click();
    await expectText(reg, 'Enter a valid email address.');
    await expectText(reg, 'Use 8–72 characters with at least one letter and one number.');
    await expectText(reg, 'Passwords do not match.');
  });

  await step('Registration: show/hide password buttons toggle the input type', async () => {
    await reg.getByRole('button', { name: 'Show password', exact: true }).click();
    if ((await regField('Password').getAttribute('type')) !== 'text') throw new Error('password not shown');
    await reg.getByRole('button', { name: 'Hide password', exact: true }).click();
    if ((await regField('Password').getAttribute('type')) !== 'password') throw new Error('password not hidden');
    await reg.getByRole('button', { name: 'Show confirm password' }).click();
    if ((await regField('Confirm password').getAttribute('type')) !== 'text') throw new Error('confirm not shown');
    await reg.getByRole('button', { name: 'Hide confirm password' }).click();
  });

  await step('Registration succeeds → redirected to login with a success message', async () => {
    await reg.getByLabel('Email address').fill(signupEmail);
    await regField('Password').fill(signupPassword);
    await regField('Confirm password').fill(signupPassword);
    const [res] = await Promise.all([
      reg.waitForResponse((r) => r.url().endsWith('/guests') && r.request().method() === 'POST'),
      reg.getByRole('button', { name: 'Sign up' }).click(),
    ]);
    const sent = JSON.parse(res.request().postData());
    if ('role' in sent || 'confirmPassword' in sent) throw new Error(`unexpected fields sent: ${Object.keys(sent)}`);
    if (res.status() !== 201) throw new Error(`POST /guests returned ${res.status()}`);
    await reg.waitForURL(/\/login$/);
    await expectText(reg, 'Your guest account has been created. Sign in to continue.');
    if ((await reg.getByLabel('Email').inputValue()) !== signupEmail) throw new Error('email not prefilled');
    await shot(reg, '00-registration-success');
  });

  await step('Registration with an existing email shows a 409 conflict', async () => {
    await reg.goto(`${BASE}/register`);
    await regField('First name').fill('Lea');
    await regField('Last name').fill('Santos');
    await reg.getByLabel('Email address').fill(signupEmail.toUpperCase());
    await reg.getByLabel('Phone number').fill('09175550101');
    await regField('Password').fill(signupPassword);
    await regField('Confirm password').fill(signupPassword);
    await reg.getByRole('button', { name: 'Sign up' }).click();
    await expectText(reg, 'Conflict: Email already exists');
    if (!reg.url().endsWith('/register')) throw new Error('left the page');
    await reg.context().close();
  });

  await step('Newly registered account logs in as a Guest and is blocked from staff routes', async () => {
    const page = await login(browser, signupEmail, signupPassword);
    await page.waitForURL(/\/dashboard$/);
    const navText = await page.getByRole('navigation').innerText();
    for (const shown of ['Book a Room', 'My Reservations']) {
      if (!navText.includes(shown)) throw new Error(`guest nav missing "${shown}"`);
    }
    for (const hidden of ['Staff', 'Guests', 'Housekeeping', 'Rooms']) {
      if (navText.split('\n').includes(hidden)) throw new Error(`new guest sees "${hidden}"`);
    }
    for (const path of ['/staff', '/guests', '/rooms', '/housekeeping']) {
      await page.goto(`${BASE}${path}`);
      await expectText(page, 'Access denied');
    }
    await page.goto(`${BASE}/register`);
    await page.waitForURL(/\/dashboard$/); // signed-in users are sent away from the sign-up page
    await page.context().close();
  });

  // ---------------------------------------------------------------- manager
  await step('Manager login → manager dashboard with live statistics', async () => {
    manager = await login(browser, 'manager@maristay.test');
    await manager.waitForURL(/\/dashboard$/);
    await expectText(manager, /Rooms \(\d+ total\)/);
    await expectText(manager, 'Open housekeeping tasks');
    for (const link of ['Rooms', 'Staff', 'Housekeeping', 'Guests']) {
      await manager.getByRole('navigation').getByRole('link', { name: link, exact: true }).waitFor();
    }
    await shot(manager, '01-manager-dashboard');
  });

  await step('Manager room CRUD — create room T901', async () => {
    await nav(manager, 'Rooms');
    await manager.getByRole('button', { name: 'Add room' }).click();
    const d = dialog(manager);
    await d.getByLabel('Room number').fill('T901');
    await d.getByLabel('Room type').selectOption('Deluxe');
    await d.getByLabel('Price per night (PHP)').fill('3200');
    await d.getByRole('button', { name: 'Create room' }).click();
    await expectText(manager, 'Room T901 created.');
  });

  await step('Manager room CRUD — search finds T901 (read)', async () => {
    await manager.getByLabel('Search room number').fill('t901');
    await manager.locator('tbody tr', { hasText: 'T901' }).waitFor();
    if ((await manager.locator('tbody tr').count()) !== 1) throw new Error('search did not narrow to one row');
  });

  await step('Manager room CRUD — update price to 3,300', async () => {
    await manager.getByRole('button', { name: 'Edit room T901' }).click();
    await dialog(manager).getByLabel('Price per night (PHP)').fill('3300');
    await dialog(manager).getByRole('button', { name: 'Save changes' }).click();
    await expectText(manager, 'Room T901 updated.');
    await manager.locator('tbody tr', { hasText: '3,300.00' }).waitFor();
    await shot(manager, '02-manager-rooms');
  });

  await step('Duplicate room number shows a 409 conflict message', async () => {
    await manager.getByRole('button', { name: 'Add room' }).click();
    const d = dialog(manager);
    await d.getByLabel('Room number').fill('101');
    await d.getByLabel('Price per night (PHP)').fill('1000');
    await d.getByRole('button', { name: 'Create room' }).click();
    await d.getByText(/Conflict: Room number 101 already exists/).waitFor();
    await d.getByRole('button', { name: 'Cancel' }).click();
  });

  await step('Manager room CRUD — delete T901 after confirmation', async () => {
    await manager.getByRole('button', { name: 'Delete room T901' }).click();
    await dialog(manager).getByRole('button', { name: 'Delete', exact: true }).click();
    await expectText(manager, 'Room T901 deleted.');
    await expectText(manager, 'No rooms match the filters.');
  });

  await step('Manager staff management page lists staff', async () => {
    await nav(manager, 'Staff');
    await expectText(manager, 'frontdesk@maristay.test');
  });

  // ------------------------------------------------------------------ guest
  await step('Guest login → guest navigation only', async () => {
    guest = await login(browser, 'juan.delacruz@example.com');
    await guest.waitForURL(/\/dashboard$/);
    await expectText(guest, 'Awaiting payment');
    const navText = await guest.getByRole('navigation').innerText();
    for (const hidden of ['Staff', 'Guests', 'Housekeeping']) {
      if (navText.split('\n').includes(hidden)) throw new Error(`guest sees "${hidden}"`);
    }
  });

  await step('Guest is blocked from the manager-only /staff route', async () => {
    await guest.goto(`${BASE}/staff`);
    await expectText(guest, 'Access denied');
  });

  await step('Guest checks room availability and books an available room', async () => {
    await nav(guest, 'Book a Room');
    await guest.getByRole('button', { name: 'Check availability' }).click();
    const row = guest.locator('tbody tr', { hasText: 'Available' }).first();
    await row.waitFor();
    roomNo = (await row.locator('td').first().innerText()).trim();
    await row.getByRole('button', { name: `Book room ${roomNo}` }).click();
    await dialog(guest).getByRole('button', { name: 'Confirm booking' }).click();
    await guest.waitForURL(/\/reservations\/\d+$/);
    reservationId = Number(guest.url().split('/').pop());
    await expectText(guest, 'Pending');
    await shot(guest, '03-guest-booking');
    console.log(`      reservation #${reservationId}, room ${roomNo}`);
  });

  await step('Guest cannot check in before payment (button hidden while PENDING)', async () => {
    if (await guest.getByRole('button', { name: 'Check in' }).count()) throw new Error('Check in shown for PENDING');
  });

  // ------------------------------------------------------------- front desk
  await step('Front desk login → front desk navigation', async () => {
    desk = await login(browser, 'frontdesk@maristay.test');
    await desk.waitForURL(/\/dashboard$/);
    await expectText(desk, 'Pending service orders');
    await desk.getByRole('navigation').getByRole('link', { name: 'Room Availability' }).waitFor();
    if (await desk.getByRole('navigation').getByRole('link', { name: 'Staff', exact: true }).count()) throw new Error('front desk sees Staff');
  });

  await step('Front desk records full payment → reservation auto-CONFIRMED', async () => {
    await openReservation(desk, reservationId, false);
    await desk.getByRole('button', { name: 'Record payment' }).click();
    await dialog(desk).getByRole('button', { name: 'Record payment' }).click();
    await expectText(desk, /Reservation is CONFIRMED/);
    await shot(desk, '04-frontdesk-payment');
  });

  // ------------------------------------------------- guest digital services
  await step('Guest digital check-in issues a one-time digital key', async () => {
    await openReservation(guest, reservationId, true);
    await guest.getByRole('button', { name: 'Check in' }).click();
    await dialog(guest).getByRole('button', { name: 'Check in' }).click();
    await expectText(guest, 'Digital room key issued');
    const code = await guest.getByTestId('key-code').innerText();
    if (!code.startsWith('MSK-')) throw new Error('no key code displayed');
  });

  await step('Simulated door lock grants access for the booked room', async () => {
    await nav(guest, 'My Digital Keys');
    await guest.getByLabel('Room door').selectOption({ label: `Room ${roomNo}` });
    await guest.getByRole('button', { name: 'Open door' }).click();
    await expectText(guest, /Access granted/);
    await shot(guest, '05-guest-digital-key');
  });

  await step('Simulated door lock denies a different room (403)', async () => {
    const other = await guest.getByLabel('Room door').locator('option').evaluateAll(
      (opts, mine) => opts.map((o) => o.textContent).find((t) => t.startsWith('Room ') && t !== mine),
      `Room ${roomNo}`,
    );
    await guest.getByLabel('Room door').selectOption({ label: other });
    await guest.getByRole('button', { name: 'Open door' }).click();
    await expectText(guest, /Not allowed: Access denied: digital key is not valid for this room/);
  });

  const placeOrder = async (item) => {
    await guest.getByRole('button', { name: 'New request' }).click();
    const d = dialog(guest);
    await d.getByLabel('Your stay').selectOption({ index: 1 });
    await d.getByLabel('Item').selectOption({ label: item });
    await d.getByRole('button', { name: 'Place order' }).click();
    await expectText(guest, /Order #\d+ placed/);
  };

  await step('Guest creates two service requests', async () => {
    await nav(guest, 'Service Requests');
    await placeOrder('Filipino breakfast set (Food) — ₱450.00');
    await placeOrder('Brewed coffee (Beverage) — ₱120.00');
  });

  await step('Guest cancels own PENDING service request', async () => {
    const row = guest.locator('tbody tr', { hasText: 'Brewed coffee' }).filter({ has: guest.getByRole('link', { name: `#${reservationId}`, exact: true }) }).first();
    await row.getByRole('button', { name: 'Cancel' }).click();
    await dialog(guest).getByRole('button', { name: 'Cancel order' }).click();
    await expectText(guest, /is now cancelled/);
    await shot(guest, '06-guest-service-requests');
  });

  await step('Front desk prepares and delivers the breakfast order', async () => {
    await nav(desk, 'Service Orders');
    const row = () =>
      desk.locator('tbody tr', { hasText: 'Filipino breakfast set' }).filter({ has: desk.getByRole('link', { name: `#${reservationId}`, exact: true }) }).first();
    await row().getByRole('button', { name: 'Mark preparing' }).click();
    await expectText(desk, /is now preparing/);
    await row().getByRole('button', { name: 'Mark delivered' }).click();
    await expectText(desk, /is now delivered/);
  });

  await step('Check-out with unpaid service charge is rejected (409)', async () => {
    await openReservation(guest, reservationId, true);
    await guest.getByRole('button', { name: 'Check out' }).click();
    await dialog(guest).getByRole('button', { name: 'Check out' }).click();
    await expectText(guest, /Conflict: Outstanding balance of 450\.00/);
  });

  await step('Front desk records the service-charge payment', async () => {
    await desk.reload();
    await openReservation(desk, reservationId, false);
    await desk.getByRole('button', { name: 'Record payment' }).click();
    await dialog(desk).getByRole('button', { name: 'Record payment' }).click();
    await expectText(desk, /Balance due: ₱0\.00/);
  });

  await step('Guest digital check-out → keys revoked, cleaning task created', async () => {
    await nav(guest, 'Dashboard');
    await openReservation(guest, reservationId, true);
    await guest.getByRole('button', { name: 'Check out' }).click();
    await dialog(guest).getByRole('button', { name: 'Check out' }).click();
    await expectText(guest, 'Check-out summary');
    const text = await guest.getByText(/housekeeping task #\d+ created/).innerText();
    hkId = Number(text.match(/#(\d+)/)[1]);
    await shot(guest, '07-guest-checkout');
  });

  await step('Revoked digital key no longer opens the door', async () => {
    await nav(guest, 'My Digital Keys');
    await guest.getByLabel('Room door').selectOption({ label: `Room ${roomNo}` });
    await guest.getByRole('button', { name: 'Open door' }).click();
    await expectText(guest, /Access denied: digital key has been revoked/);
  });

  // ----------------------------------------------------------- housekeeping
  await step('Housekeeper sees the assigned task and completes it → room available', async () => {
    for (const email of ['housekeeping2@maristay.test', 'housekeeping1@maristay.test']) {
      housekeeper = await login(browser, email);
      await housekeeper.waitForURL(/\/dashboard$/);
      await nav(housekeeper, 'My Tasks');
      await housekeeper.locator('tbody tr, :text("No housekeeping tasks.")').first().waitFor();
      if (await housekeeper.locator('tbody tr', { hasText: `#${hkId}` }).count()) break;
      await housekeeper.context().close();
      housekeeper = null;
    }
    if (!housekeeper) throw new Error(`task #${hkId} not visible to either housekeeper`);
    const row = housekeeper.locator('tbody tr', { hasText: `#${hkId}` });
    await row.getByRole('button', { name: 'Start cleaning' }).click();
    await expectText(housekeeper, `Task #${hkId} started.`);
    await row.getByRole('button', { name: 'Mark completed' }).click();
    await dialog(housekeeper).getByRole('button', { name: 'Mark completed' }).click();
    await expectText(housekeeper, new RegExp(`Task #${hkId} completed\\. Room ${roomNo} is now available\\.`));
    await shot(housekeeper, '08-housekeeping-tasks');
  });

  await step('Housekeeper is blocked from /reservations', async () => {
    await housekeeper.goto(`${BASE}/reservations`);
    await expectText(housekeeper, 'Access denied');
  });

  // -------------------------------------------------------- error handling
  await step('Unknown reservation shows a 404 message', async () => {
    await desk.goto(`${BASE}/reservations/999999`);
    await expectText(desk, 'Not found: Reservation not found');
  });

  await step('Invalid/expired token ends the session and returns to login', async () => {
    await manager.evaluate(() => sessionStorage.setItem('maristay.token', 'invalid.token.value'));
    await manager.goto(`${BASE}/rooms`);
    await manager.waitForURL(/\/login$/);
  });

  await step('Logout clears the session; protected pages require login again', async () => {
    await logout(desk);
    await desk.goto(`${BASE}/dashboard`);
    await desk.waitForURL(/\/login$/);
  });
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} UI checks passed.`);
process.exit(failed ? 1 : 0);
