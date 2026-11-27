/**
 * Security and role-access matrix (126 checks) for the isolated MariStay API.
 *
 *   npm run postman:reset      fresh maristay_postman_db
 *   npm run postman:start      isolated API on http://localhost:3001/api/v1 (terminal 1)
 *   npm run security:check     this script (terminal 2)
 *
 * Run it in backend/. It reads SEED_DEMO_PASSWORD and JWT_SECRET from backend/.env
 * and prints no secret or token. It only sends HTTP requests: it never connects
 * to MySQL. Every write it attempts is rejected by design (an invalid body → 400,
 * a nonexistent id → 404, or a forbidden role → 403), so no record is changed.
 * It refuses to run against port 3000, the main maristay_db instance.
 * Logins count toward the limit of 10 per minute: wait a minute after other tests.
 */
'use strict';

const crypto = require('crypto');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const BASE = (process.env.SECURITY_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '');
const ORIGIN_OK = process.env.SECURITY_ALLOWED_ORIGIN ?? 'http://localhost:5173';
const PW = process.env.SEED_DEMO_PASSWORD;
const SECRET = process.env.JWT_SECRET;

function fail(message) {
  console.error(`security-check: ${message}`);
  process.exit(1);
}
if (new URL(BASE).port === (process.env.PORT ?? '3000')) {
  fail(`${BASE} is the main instance (maristay_db). Use the isolated API on port 3001 (npm run postman:start).`);
}
if (!PW || PW.startsWith('replace_with')) fail('SEED_DEMO_PASSWORD is not set in backend/.env.');
if (!SECRET) fail('JWT_SECRET is not set in backend/.env.');

/** HS256 JSON Web Token, used only to build expired and wrongly signed test tokens. */
function signJwt(payload, secret) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const body = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}`;
  return `${body}.${crypto.createHmac('sha256', secret).update(body).digest('base64url')}`;
}

let pass = 0;
let failed = 0;
const check = (name, ok, detail = '') => {
  ok ? pass++ : failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${detail}]` : ''}`);
};

async function call(method, route, body, token, headers = {}) {
  const res = await fetch(BASE + route, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // 204 and other empty bodies
  }
  return { status: res.status, data, headers: res.headers };
}
const login = async (email) => (await call('POST', '/auth/login', { email, password: PW })).data;

(async () => {
  const roles = {
    GUEST: await login('juan.delacruz@example.com'),
    FRONT_DESK: await login('frontdesk@maristay.test'),
    HOUSEKEEPING: await login('housekeeping1@maristay.test'),
    MANAGER: await login('manager@maristay.test'),
  };
  for (const [role, data] of Object.entries(roles)) check(`Login ${role} → JWT with role ${role}`, data?.accessToken && data.user.role === role);
  if (Object.values(roles).some((data) => !data?.accessToken)) fail('a demo login failed (wrong password, or the login limit was reached).');

  const G = 'GUEST', F = 'FRONT_DESK', H = 'HOUSEKEEPING', M = 'MANAGER';
  // [method, path, allowed roles, body, expected status when allowed]
  const matrix = [
    ['GET', '/auth/me', [G, F, H, M], null, 200],
    ['GET', '/guests', [F, M], null, 200],
    ['GET', '/staff', [M], null, 200],
    ['POST', '/staff', [M], {}, 400],
    ['DELETE', '/staff/999999', [M], null, 404],
    ['GET', '/housekeeping', [H, M], null, 200],
    ['POST', '/housekeeping', [M], {}, 400],
    ['POST', '/rooms', [M], {}, 400],
    ['PATCH', '/rooms/999999', [M], { pricePerNight: 1000 }, 404],
    ['PUT', '/rooms/999999', [M], {}, 400],
    ['DELETE', '/rooms/999999', [M], null, 404],
    ['GET', '/reservations', [G, F, M], null, 200],
    ['PATCH', '/reservations/999999/confirm', [F, M], null, 404],
    ['GET', '/payments', [G, F, M], null, 200],
    ['POST', '/payments', [F, M], {}, 400],
    ['PATCH', '/payments/999999', [F, M], { status: 'PAID' }, 404],
    ['GET', '/digital-keys', [G, F, M], null, 200],
    ['POST', '/digital-keys/validate', [G, F, M], {}, 400],
    ['PATCH', '/digital-keys/999999/revoke', [F, M], null, 404],
    ['GET', '/service-orders', [G, F, M], null, 200],
    ['POST', '/service-orders', [G, F, M], {}, 400],
  ];
  for (const [method, route, allowed, body, okStatus] of matrix) {
    const anonymous = await call(method, route, body);
    check(`No token ${method} ${route} → 401`, anonymous.status === 401, `HTTP ${anonymous.status}`);
    for (const role of [G, F, H, M]) {
      const res = await call(method, route, body, roles[role].accessToken);
      const want = allowed.includes(role) ? okStatus : 403;
      check(`${role.padEnd(12)} ${method} ${route} → ${want}`, res.status === want, `HTTP ${res.status}`);
    }
  }

  // Public endpoint
  check('Public GET /rooms without token → 200', (await call('GET', '/rooms')).status === 200);

  // Token tampering
  const guestToken = roles.GUEST.accessToken;
  const [header, payloadPart, signature] = guestToken.split('.');
  const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString());
  const forged = { ...payload, role: 'MANAGER' };
  const tampered = `${header}.${Buffer.from(JSON.stringify(forged)).toString('base64url')}.${signature}`;
  check('Guest token with role changed to MANAGER (bad signature) → 401', (await call('GET', '/staff', null, tampered)).status === 401);
  const unsigned = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify(forged)).toString('base64url')}.`;
  check('alg=none token → 401', (await call('GET', '/staff', null, unsigned)).status === 401);
  check('Garbage token → 401', (await call('GET', '/auth/me', null, 'not.a.token')).status === 401);
  const claims = { sub: payload.sub, accountType: payload.accountType, role: payload.role, email: payload.email };
  const expired = signJwt({ ...claims, iat: 1, exp: 2 }, SECRET);
  check('Correctly signed but expired token → 401', (await call('GET', '/auth/me', null, expired)).status === 401);
  const now = Math.floor(Date.now() / 1000);
  const wrongSecret = signJwt({ ...claims, role: 'MANAGER', iat: now, exp: now + 600 }, 'wrong-secret-for-test');
  check('Token signed with another secret → 401', (await call('GET', '/staff', null, wrongSecret)).status === 401);

  // Ownership
  const guestId = roles.GUEST.user.id;
  check('Guest reads another guest profile → 403', (await call('GET', `/guests/${guestId === 1 ? 2 : 1}`, null, guestToken)).status === 403);
  const own = await call('GET', '/reservations?limit=100', null, guestToken);
  check('Guest reservation list contains only own reservations', own.status === 200 && own.data.data.every((r) => r.guestId === guestId), `${own.data?.data?.length} rows`);

  // Sensitive data is never returned
  const managerToken = roles.MANAGER.accessToken;
  const dumps = [
    await call('GET', '/staff?limit=100', null, managerToken),
    await call('GET', '/guests?limit=100', null, managerToken),
    await call('GET', '/digital-keys?limit=100', null, managerToken),
    await call('GET', '/auth/me', null, guestToken),
  ];
  check('No passwordHash / keyCodeHash in staff, guests, keys, /auth/me', dumps.every((d) => d.status === 200 && !/passwordHash|keyCodeHash/.test(JSON.stringify(d.data))));

  // SQL injection attempt in search
  const injection = await call('GET', `/guests?search=${encodeURIComponent("' OR 1=1 -- ")}`, null, managerToken);
  check(`Search "' OR 1=1 -- " is treated as text (200, 0 rows)`, injection.status === 200 && injection.data.meta.total === 0, `total ${injection.data?.meta?.total}`);

  // Mass assignment (rejected by validation before anything is created)
  const massAssignment = await call('POST', '/reservations', { roomId: 1, checkInDate: '2030-01-01', checkOutDate: '2030-01-02', reservationStatus: 'CONFIRMED' }, guestToken);
  check('Reservation with extra reservationStatus field → 400', massAssignment.status === 400, `HTTP ${massAssignment.status}`);

  // Headers and CORS
  const headers = await call('GET', '/rooms', null, null, { Origin: ORIGIN_OK });
  check('X-Content-Type-Options: nosniff', headers.headers.get('x-content-type-options') === 'nosniff');
  check('Content-Security-Policy present', !!headers.headers.get('content-security-policy'));
  check('X-Powered-By removed', !headers.headers.get('x-powered-by'));
  check(`CORS allows ${ORIGIN_OK}`, headers.headers.get('access-control-allow-origin') === ORIGIN_OK);
  const evil = await call('GET', '/rooms', null, null, { Origin: 'http://evil.example' });
  check('CORS does not allow http://evil.example', !evil.headers.get('access-control-allow-origin'));

  // Error format
  const notFound = await call('GET', '/rooms/999999');
  check('404 error body has statusCode/message and no stack', notFound.status === 404 && notFound.data.statusCode === 404 && !('stack' in notFound.data));

  console.log(`\n${pass}/${pass + failed} security checks passed.`);
  process.exitCode = failed ? 1 : 0;
})().catch((error) => fail(error.message));
