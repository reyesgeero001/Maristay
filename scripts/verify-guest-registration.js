/**
 * Guest self-registration verification (API + database), 49 checks.
 *
 * Exercises the public POST /api/v1/guests endpoint against a RUNNING API and
 * inspects the matching MySQL database directly: persistence, bcrypt hashing,
 * GUEST role on login, duplicate e-mail, input validation, rejection of role
 * escalation fields, RBAC for the new account, and the four demo logins.
 *
 *   npm run postman:reset && npm run postman:start      # isolated API on port 3001
 *   npm run verify:registration                         # in another terminal
 *
 * Environment (all optional; read from .env for DB_* and SEED_DEMO_PASSWORD):
 *   VERIFY_API_URL   default http://localhost:3001/api/v1
 *   VERIFY_DB_NAME   default maristay_postman_db
 *
 * Safety: it creates guest accounts, so it refuses to run against the demo
 * database (DB_DATABASE in .env, normally maristay_db). It never prints the
 * demo password, the generated test password, tokens or password hashes.
 */
'use strict';

const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

dotenv.config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const BASE = (process.env.VERIFY_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '');
const DB = process.env.VERIFY_DB_NAME ?? 'maristay_postman_db';
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD;

if (!DEMO_PASSWORD) fail('SEED_DEMO_PASSWORD is not set in .env (needed for the four demo logins).');
if (DB === process.env.DB_DATABASE) {
  fail(`refusing to run against ${DB}: it is DB_DATABASE (the demo database). Use maristay_postman_db.`);
}

function fail(message) {
  console.error(`verify-guest-registration: ${message}`);
  process.exit(1);
}

const results = [];
function check(name, ok, detail = '') {
  results.push(Boolean(ok));
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${detail}]` : ''}`);
}

async function call(method, urlPath, body, token) {
  const res = await fetch(BASE + urlPath, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body (e.g. 204) */
  }
  return { status: res.status, data };
}

const messages = (data) => [].concat(data?.message ?? []).join('; ');

async function main() {
  const stamp = Date.now();
  const email = `verify.signup.${stamp}@example.com`;
  // Random per run: satisfies the policy (letters + digits, 8–72 chars) and is never printed.
  const password = `Verify${crypto.randomBytes(6).toString('hex')}9`;
  const valid = { firstName: 'Maria', lastName: 'Dela Cruz', email, phoneNumber: '0917-123-4567', password };

  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD ?? '',
    database: DB,
  });
  try {
    const [[{ d }]] = await db.query('SELECT DATABASE() AS d');
    if (d !== DB) fail(`connected to ${d}, expected ${DB}`);
    console.log(`API ${BASE}  |  database ${DB}\n`);

    const count = async (table) => (await db.query(`SELECT COUNT(*) AS n FROM \`${table}\``))[0][0].n;
    const guestsBefore = await count('guests');
    const staffBefore = await count('staff');

    // 1. Successful registration; nothing sensitive in the response.
    const r = await call('POST', '/guests', valid);
    check('1. Registration returns 201', r.status === 201, `HTTP ${r.status}`);
    check('   Response has no password / passwordHash', r.data && !/password/i.test(JSON.stringify(r.data)), Object.keys(r.data ?? {}).join(','));
    check('   Response has no role field (guest table account)', r.data && !('role' in r.data));
    check('   Email lowercased, phone normalized', r.data?.email === email && r.data?.phoneNumber === '09171234567');

    // 2–3. Persistence and hashing.
    const [rows] = await db.query('SELECT guestId, accountStatus, passwordHash FROM guests WHERE email = ?', [email]);
    const guestId = rows[0]?.guestId;
    check('2. Row persisted in guests table', rows.length === 1 && rows[0].accountStatus === 'ACTIVE', `guestId ${guestId}`);
    const hash = rows[0]?.passwordHash ?? '';
    check('3. Password stored as bcrypt hash (not plaintext)', /^\$2[aby]\$10\$/.test(hash) && hash.length === 60 && hash !== password);
    check('   bcrypt.compare(plaintext, hash) is true', hash && (await bcrypt.compare(password, hash)));
    const [[{ n: staffRows }]] = await db.query('SELECT COUNT(*) AS n FROM staff WHERE email = ?', [email]);
    check('   No staff row created', staffRows === 0);

    // 4–5. Login and automatic GUEST role.
    const login = await call('POST', '/auth/login', { email, password });
    const token = login.data?.accessToken;
    check('4. Login with new account returns 200 + token', login.status === 200 && !!token, `HTTP ${login.status}`);
    check('5. Login response role = GUEST, accountType = GUEST', login.data?.user?.role === 'GUEST' && login.data?.user?.accountType === 'GUEST');
    const me = await call('GET', '/auth/me', null, token);
    check('   GET /auth/me role = GUEST', me.status === 200 && me.data?.role === 'GUEST');
    const claims = token ? JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()) : {};
    check('   JWT claim role = GUEST', claims.role === 'GUEST' && claims.accountType === 'GUEST');

    // 6. Duplicate e-mail (same case, other case, staff e-mail).
    const dup = await call('POST', '/guests', valid);
    check('6. Duplicate email → 409', dup.status === 409, `HTTP ${dup.status}: ${messages(dup.data)}`);
    const dupCase = await call('POST', '/guests', { ...valid, email: email.toUpperCase() });
    check('   Duplicate email in different case → 409', dupCase.status === 409, `HTTP ${dupCase.status}`);
    const dupStaff = await call('POST', '/guests', { ...valid, email: 'manager@maristay.test' });
    check('   Staff email reused for guest → 409', dupStaff.status === 409, `HTTP ${dupStaff.status}`);

    // 7. Invalid e-mail and missing required fields.
    const badEmail = await call('POST', '/guests', { ...valid, email: 'not-an-email' });
    check('7. Invalid email → 400', badEmail.status === 400, messages(badEmail.data));
    for (const field of ['firstName', 'lastName', 'email', 'phoneNumber', 'password']) {
      const body = { ...valid, email: `missing.${field.toLowerCase()}.${stamp}@example.com` };
      delete body[field];
      const x = await call('POST', '/guests', body);
      check(`   Missing ${field} → 400`, x.status === 400, `HTTP ${x.status}`);
    }
    check('   Empty body → 400', (await call('POST', '/guests', {})).status === 400);
    const badPhone = await call('POST', '/guests', { ...valid, email: `phone.${stamp}@example.com`, phoneNumber: 'abc' });
    check('   Invalid phone → 400', badPhone.status === 400);

    // 8. Weak passwords. (Confirm-password matching is a frontend check; the DTO has no such field.)
    for (const [label, weak] of [['too short', 'short1'], ['no digit', 'allletters'], ['no letter', '12345678'], ['73 chars', `${'a'.repeat(72)}1`]]) {
      const x = await call('POST', '/guests', { ...valid, email: `weak.${label.replace(/\W/g, '')}.${stamp}@example.com`, password: weak });
      check(`8. Weak password (${label}) → 400`, x.status === 400, `HTTP ${x.status}`);
    }
    const cp = await call('POST', '/guests', { ...valid, email: `cp.${stamp}@example.com`, confirmPassword: password });
    check('   Extra confirmPassword property → 400 (frontend must not send it)', cp.status === 400);

    // 9. Role escalation attempts are rejected and create nothing.
    for (const extra of [
      { role: 'MANAGER' },
      { role: 'FRONT_DESK' },
      { role: 'HOUSEKEEPING' },
      { role: 'GUEST' },
      { accountType: 'STAFF' },
      { accountStatus: 'ACTIVE' },
      { guestId: 1 },
    ]) {
      const [k, v] = Object.entries(extra)[0];
      const e = `esc.${k}.${String(v)}.${stamp}@example.com`.toLowerCase();
      const x = await call('POST', '/guests', { ...valid, email: e, ...extra });
      const [[{ n }]] = await db.query(
        'SELECT (SELECT COUNT(*) FROM guests WHERE email = ?) + (SELECT COUNT(*) FROM staff WHERE email = ?) AS n',
        [e, e],
      );
      check(`9. Registration with ${JSON.stringify(extra)} → 400, no account created`, x.status === 400 && Number(n) === 0, `HTTP ${x.status}: ${messages(x.data)}`);
    }
    const staffBody = { firstName: 'X', lastName: 'Y', email: `s.${stamp}@example.com`, role: 'MANAGER', password };
    check('   Unauthenticated POST /staff → 401', (await call('POST', '/staff', staffBody)).status === 401);
    check('   New guest POST /staff → 403', (await call('POST', '/staff', staffBody, token)).status === 403);

    // 10. The new guest cannot use staff or manager endpoints.
    const denied = [
      ['GET', '/staff'],
      ['GET', '/guests'],
      ['GET', '/housekeeping'],
      ['POST', '/rooms', { roomNo: 'Z999', roomType: 'Standard', pricePerNight: 1000 }],
      ['GET', '/guests/1'],
      ['PATCH', `/guests/${guestId}`, { accountStatus: 'ACTIVE' }],
    ];
    for (const [method, url, body] of denied) {
      const x = await call(method, url, body, token);
      check(`10. New guest ${method} ${url} → 403`, x.status === 403, `HTTP ${x.status}`);
    }
    check('   New guest can read own profile → 200', (await call('GET', `/guests/${guestId}`, null, token)).status === 200);

    // 11. Existing four roles still log in.
    for (const [who, role] of [
      ['manager@maristay.test', 'MANAGER'],
      ['frontdesk@maristay.test', 'FRONT_DESK'],
      ['housekeeping1@maristay.test', 'HOUSEKEEPING'],
      ['juan.delacruz@example.com', 'GUEST'],
    ]) {
      const x = await call('POST', '/auth/login', { email: who, password: DEMO_PASSWORD });
      check(`11. ${role} demo login`, x.status === 200 && x.data?.user?.role === role, `HTTP ${x.status}`);
    }

    const guestsAfter = await count('guests');
    const staffAfter = await count('staff');
    check('Guest count +1 exactly; staff count unchanged', guestsAfter === guestsBefore + 1 && staffAfter === staffBefore,
      `guests ${guestsBefore}→${guestsAfter}, staff ${staffBefore}→${staffAfter}`);
  } finally {
    await db.end();
  }

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} registration checks passed.`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => fail(err.message));
