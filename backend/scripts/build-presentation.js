/**
 * Builds the defense slides: docs/MariStay_Presentation.pptx
 *
 *   npm install --no-save pptxgenjs     (once; not a project dependency)
 *   node backend/scripts/build-presentation.js
 *
 * Every number on the slides comes from verified results (the testing report, kept locally and not published).
 * Diagrams are native, editable PowerPoint shapes.
 */
'use strict';

const path = require('path');
let PptxGenJS;
try {
  PptxGenJS = require('pptxgenjs');
} catch {
  console.error('pptxgenjs is not installed. Run: npm install --no-save pptxgenjs');
  process.exit(1);
}

// PPTX_OUT lets a preview be written elsewhere; the default is the submitted deck.
const OUT = process.env.PPTX_OUT ?? path.join(__dirname, '..', '..', 'docs', 'MariStay_Presentation.pptx');

// ---------- Palette and type ----------
const C = {
  navy: '12324A', // dominant: deep harbour navy
  teal: '1F6F78', // supporting
  gold: 'C9A227', // single accent
  ink: '1E2A33', // body text
  muted: '5B6B76', // captions
  tint: 'EEF3F6', // card background (cool, not beige)
  tealTint: 'E3F0F1',
  white: 'FFFFFF',
  red: 'A23B3B',
};
const HEAD = 'Cambria';
const BODY = 'Calibri';

const pres = new PptxGenJS();
pres.layout = 'LAYOUT_16x9'; // 10 x 5.625 in
pres.author = 'Geero Andrei E. Reyes';
pres.company = 'BSIT 4C - ITEC 116';
pres.title = 'MariStay: Hotel Management and Digital Guest Services System';
pres.theme = { headFontFace: HEAD, bodyFontFace: BODY };

// ---------- Layouts ----------
pres.defineSlideMaster({
  title: 'MS_DARK',
  background: { color: C.navy },
  objects: [
    {
      placeholder: {
        options: { name: 'title', type: 'title', x: 0.6, y: 1.35, w: 8.8, h: 1.5, fontFace: HEAD, fontSize: 40, bold: true, color: C.white, valign: 'bottom', align: 'left', margin: 0 },
        text: '',
      },
    },
  ],
});

pres.defineSlideMaster({
  title: 'MS_CONTENT',
  background: { color: C.white },
  margin: [0.5, 0.5, 0.5, 0.5],
  objects: [
    {
      placeholder: {
        options: { name: 'title', type: 'title', x: 0.5, y: 0.28, w: 9.0, h: 0.75, fontFace: HEAD, fontSize: 32, bold: true, color: C.navy, valign: 'middle', align: 'left', margin: 0 },
        text: '',
      },
    },
    { text: { text: 'MariStay  ·  ITEC 116 Final Project', options: { x: 0.5, y: 5.18, w: 5.0, h: 0.3, fontFace: BODY, fontSize: 10, color: C.muted, margin: 0 } } },
  ],
  slideNumber: { x: 8.9, y: 5.18, w: 0.6, h: 0.3, fontFace: BODY, fontSize: 10, color: C.muted, align: 'right' },
});

// ---------- Helpers ----------
const text = (slide, value, opts) => slide.addText(value, { fontFace: BODY, color: C.ink, margin: 0, isTextBox: true, ...opts });
const card = (slide, x, y, w, h, fill = C.tint, extra = {}) =>
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: fill, width: 0.5 }, ...extra });
const badge = (slide, x, y, label, d = 0.42, fill = C.gold, color = C.navy) => {
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill } });
  text(slide, String(label), { x, y, w: d, h: d, fontSize: 14, bold: true, color, align: 'center', valign: 'middle' });
};
const arrow = (slide, x1, y1, x2, y2, color = C.teal) => {
  const opts = { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1), line: { color, width: 1.5, endArrowType: 'triangle' } };
  if (x2 < x1) opts.flipH = true;
  if (y2 < y1) opts.flipV = true;
  slide.addShape(pres.shapes.LINE, opts);
};
const line = (slide, x1, y1, x2, y2, color = C.muted) => {
  const opts = { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1), line: { color, width: 1.25 } };
  if ((x2 < x1) !== (y2 < y1)) opts.flipV = true;
  slide.addShape(pres.shapes.LINE, opts);
};
const content = (section, title) => {
  const s = pres.addSlide({ masterName: 'MS_CONTENT', sectionTitle: section });
  s.addText(title, { placeholder: 'title' });
  return s;
};

// =====================================================================
// 1. Title
// =====================================================================
pres.addSection({ title: 'Introduction' });
{
  const s = pres.addSlide({ masterName: 'MS_DARK', sectionTitle: 'Introduction' });
  s.addText('MariStay', { placeholder: 'title' });
  text(s, 'Hotel Management and Digital Guest Services System', { x: 0.6, y: 2.95, w: 8.8, h: 0.5, fontFace: HEAD, fontSize: 22, color: C.gold });
  text(s, 'Systems Integration Backend Prototype  ·  NestJS · TypeORM · MySQL · JWT', { x: 0.6, y: 3.45, w: 8.8, h: 0.4, fontSize: 16, color: 'C9D6DF' });
  text(
    s,
    [
      { text: 'Geero Andrei E. Reyes  ·  BSIT 4C', options: { breakLine: true, bold: true } },
      { text: 'ITEC 116 — IT Elective 4 (Systems Integration and Architecture 2)', options: { breakLine: true } },
      { text: 'Instructor: John Vincent A. Dallego, MIT' },
    ],
    { x: 0.6, y: 4.15, w: 8.8, h: 0.95, fontSize: 14, color: C.white, valign: 'top' },
  );
  s.addNotes(
    "Good day. I'm Geero Andrei Reyes from BSIT 4C. My project is MariStay, a hotel management and digital guest services backend. It lets one system handle reservations, payments, digital check-in, digital room keys, housekeeping and room service. It is built with NestJS, TypeORM, MySQL and JWT.",
  );
}

// =====================================================================
// 2. Project background
// =====================================================================
{
  const s = content('Introduction', 'Project background');
  const steps = [
    ['Lab 03', 'System proposal and architecture'],
    ['Lab 04', 'Database design: 8 entities, ERD'],
    ['Lab 05', 'REST API design: 7 endpoints'],
    ['Lab 06', 'Authentication and security design'],
    ['Final project', 'Working backend prototype'],
  ];
  const x0 = 0.5, w = 1.66, gap = 0.175, y = 1.3;
  line(s, x0 + w / 2, y + 0.21, x0 + 4 * (w + gap) + w / 2, y + 0.21, C.gold);
  steps.forEach(([label, desc], i) => {
    const x = x0 + i * (w + gap);
    badge(s, x + w / 2 - 0.21, y, i + 1, 0.42, i === 4 ? C.gold : C.navy, i === 4 ? C.navy : C.white);
    text(s, label, { x, y: y + 0.55, w, h: 0.35, fontSize: 15, bold: true, color: C.navy, align: 'center' });
    text(s, desc, { x, y: y + 0.9, w, h: 0.6, fontSize: 13, color: C.muted, align: 'center', valign: 'top' });
  });
  const stats = [
    ['8', 'database tables'],
    ['44', 'REST endpoints'],
    ['9', 'feature modules'],
    ['4', 'user roles'],
  ];
  stats.forEach(([n, l], i) => {
    const x = 0.5 + i * 2.29;
    card(s, x, 3.3, 2.1, 1.55);
    text(s, n, { x, y: 3.42, w: 2.1, h: 0.8, fontFace: HEAD, fontSize: 40, bold: true, color: C.teal, align: 'center', valign: 'middle' });
    text(s, l, { x, y: 4.22, w: 2.1, h: 0.4, fontSize: 14, color: C.ink, align: 'center' });
  });
  s.addNotes(
    "MariStay is not a new idea for this project. I proposed it in Lab 03, designed the database in Lab 04, the REST API in Lab 05 and the security in Lab 06. The final project turns those designs into real software: a database that actually stores data, endpoints that actually respond, and login that actually protects the routes. The result has 8 tables, 44 endpoints, 9 modules and 4 user roles.",
  );
}

// =====================================================================
// 3. Problem statement
// =====================================================================
{
  const s = content('Introduction', 'Problem statement');
  const problems = [
    ['Front-desk bottlenecks', 'Every check-in and check-out is verified by hand'],
    ['Unsafe room assignment', 'Double bookings; rooms given before cleaning or payment'],
    ['Slow housekeeping updates', 'Cleaning status passed on by phone or paper'],
    ['Untracked guest services', 'Room-service charges missed at check-out'],
    ['Weak access control', 'Users can see or change more than their role allows'],
  ];
  problems.forEach(([t, d], i) => {
    const y = 1.22 + i * 0.75;
    badge(s, 0.5, y + 0.06, i + 1, 0.42, C.tealTint, C.teal);
    text(s, t, { x: 1.1, y, w: 4.6, h: 0.32, fontSize: 15, bold: true, color: C.navy });
    text(s, d, { x: 1.1, y: y + 0.31, w: 4.6, h: 0.3, fontSize: 13, color: C.muted });
  });
  card(s, 6.05, 1.22, 3.45, 3.62, C.navy);
  text(s, 'Problem', { x: 6.35, y: 1.45, w: 2.9, h: 0.35, fontSize: 14, bold: true, color: C.gold });
  text(s, 'How can one secure backend integrate reservations, payments, room access, housekeeping and guest services, so that each step updates the others automatically and consistently?', {
    x: 6.35, y: 1.85, w: 2.9, h: 2.8, fontFace: HEAD, fontSize: 18, color: C.white, valign: 'top',
  });
  s.addNotes(
    "Hotels have five problems that are really integration problems. The front desk is a bottleneck. Rooms can be double-booked or given out before they are clean or paid for. Housekeeping updates are slow. Room-service charges are tracked on paper and can be missed. And access is not controlled by role. So my question was: how can one secure backend connect all these departments so each step updates the others automatically?",
  );
}

// =====================================================================
// 4. Objectives
// =====================================================================
{
  const s = content('Introduction', 'Project objectives');
  card(s, 0.5, 1.22, 3.3, 3.62, C.teal);
  text(s, 'General objective', { x: 0.8, y: 1.45, w: 2.8, h: 0.35, fontSize: 14, bold: true, color: C.gold });
  text(s, 'Develop a working, secure and documented backend that integrates hotel reservations, payments, digital keys, housekeeping and guest services.', {
    x: 0.8, y: 1.85, w: 2.8, h: 2.8, fontFace: HEAD, fontSize: 18, color: C.white, valign: 'top',
  });
  const specific = [
    'Build the 8-table database with TypeORM keys and relations',
    'Expose 20+ REST endpoints (44 built) with correct status codes',
    'Secure the API: JWT, bcrypt, roles, ownership, validation',
    'Integrate booking, payment, check-in, keys and cleaning',
    'Prevent double bookings and unpaid check-ins',
    'Test with automated suites and Postman; document it',
  ];
  specific.forEach((t, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 4.1 + col * 2.75, y = 1.22 + row * 1.24;
    card(s, x, y, 2.6, 1.12);
    badge(s, x + 0.15, y + 0.15, i + 1, 0.36);
    text(s, t, { x: x + 0.6, y: y + 0.12, w: 1.88, h: 0.9, fontSize: 14, valign: 'top' });
  });
  s.addNotes(
    "My general objective was a backend that is working, secure and documented, and that really integrates the hotel departments. The six specific objectives are on the right: the database, at least twenty endpoints (I built forty-four), the Lab 06 security measures, the integrated workflow, conflict prevention with transactions, and testing with documentation.",
  );
}

// =====================================================================
// 5. Proposed system
// =====================================================================
pres.addSection({ title: 'Design' });
{
  const s = content('Design', 'Proposed system: one platform, four roles');
  const roles = [
    ['GUEST', ['Register and book rooms', 'Digital check-in and check-out', 'Use a digital key', 'Order room service']],
    ['FRONT DESK', ['Manage reservations', 'Record and verify payments', 'Assist check-in and check-out', 'Issue or revoke keys']],
    ['HOUSEKEEPING', ['Receive cleaning tasks', 'Update own tasks only', 'Finished task frees the room']],
    ['MANAGER', ['Full CRUD for rooms', 'Full CRUD for staff', 'Assign housekeeping', 'Oversee all operations']],
  ];
  roles.forEach(([r, items], i) => {
    const x = 0.5 + i * 2.29;
    card(s, x, 1.22, 2.12, 3.15);
    text(s, r, { x: x + 0.18, y: 1.38, w: 1.8, h: 0.4, fontSize: 15, bold: true, color: C.teal });
    text(s, items.map((t, k) => ({ text: t, options: { bullet: { indent: 12 }, breakLine: k < items.length - 1 } })), {
      x: x + 0.18, y: 1.85, w: 1.82, h: 2.4, fontSize: 14, valign: 'top', paraSpaceAfter: 6,
    });
  });
  text(s, 'Each role sees only what it needs: enforced by roles plus ownership checks on every request.', { x: 0.5, y: 4.55, w: 9.0, h: 0.4, fontSize: 14, italic: true, color: C.muted });
  s.addNotes(
    "MariStay is one API used by four kinds of users. Guests book, check in from their phone, open their door with a digital key and order room service. The front desk handles reservations and payments. Housekeepers see only their own cleaning tasks. The manager maintains rooms and staff. Every request is checked for the role, and also for ownership, so a guest can only ever see their own data.",
  );
}

// =====================================================================
// 6. System architecture
// =====================================================================
{
  const s = content('Design', 'System architecture');
  const box = (x, y, w, label, sub, fill = C.tint, color = C.navy) => {
    card(s, x, y, w, 0.82, fill);
    text(s, label, { x, y: y + 0.08, w, h: 0.36, fontSize: 14, bold: true, color, align: 'center' });
    if (sub) text(s, sub, { x, y: y + 0.43, w, h: 0.32, fontSize: 11, color: fill === C.tint ? C.muted : 'D9E4EA', align: 'center' });
  };
  // Row 1: request pipeline (left to right)
  box(0.5, 1.25, 1.55, 'Client', 'Postman · React');
  box(2.4, 1.25, 1.55, 'Rate limit', 'ThrottlerGuard', C.teal, C.white);
  box(4.3, 1.25, 1.55, 'JWT auth', 'JwtAuthGuard', C.teal, C.white);
  box(6.2, 1.25, 1.55, 'Roles', 'RolesGuard', C.teal, C.white);
  box(8.0, 1.25, 1.5, 'Validation', 'DTO pipe', C.teal, C.white);
  arrow(s, 2.05, 1.66, 2.4, 1.66); arrow(s, 3.95, 1.66, 4.3, 1.66); arrow(s, 5.85, 1.66, 6.2, 1.66); arrow(s, 7.75, 1.66, 8.0, 1.66);
  // Row 2: layers (right to left)
  box(8.0, 2.65, 1.5, 'Controller', 'HTTP only');
  box(6.2, 2.65, 1.55, 'Service', 'Business rules');
  box(4.3, 2.65, 1.55, 'Repository', 'TypeORM');
  box(2.4, 2.65, 1.55, 'MySQL', 'MariaDB · MySQL 8.4', C.navy, C.white);
  arrow(s, 8.75, 2.07, 8.75, 2.65); arrow(s, 8.0, 3.06, 7.75, 3.06); arrow(s, 6.2, 3.06, 5.85, 3.06); arrow(s, 4.3, 3.06, 3.95, 3.06);
  text(s, '429 · 401 · 403 · 400 stop a request before it reaches the controller', { x: 0.5, y: 2.2, w: 1.75, h: 1.25, fontSize: 12, italic: true, color: C.muted, valign: 'top' });
  // Row 3: simulated external services
  text(s, 'Simulated external services (one adapter class each)', { x: 4.3, y: 4.68, w: 5.2, h: 0.3, fontSize: 12, bold: true, color: C.teal });
  ['Payment gateway', 'SMS / e-mail', 'Smart lock'].forEach((t, i) => {
    const x = 4.3 + i * 1.77;
    card(s, x, 4.1, 1.65, 0.5, C.tealTint);
    text(s, t, { x, y: 4.1, w: 1.65, h: 0.5, fontSize: 13, color: C.teal, align: 'center', valign: 'middle' });
  });
  arrow(s, 6.97, 3.47, 6.97, 4.1, C.gold);
  text(s, 'Modular monolith: one NestJS app, 9 modules, one database', { x: 0.5, y: 4.1, w: 3.5, h: 0.5, fontSize: 13, bold: true, color: C.navy, valign: 'middle' });
  s.addNotes(
    "This is a modular monolith: one NestJS application with nine modules and one database. Every request passes three global guards: the rate limiter, the JWT check and the role check. Then the validation pipe checks the body. Only then does the controller run. The controller passes the work to a service, the service uses a TypeORM repository, and the repository talks to MySQL. Payments, SMS and smart locks are simulated, each behind its own class, so a real provider can be plugged in later.",
  );
}

// =====================================================================
// 7. Database design and ERD
// =====================================================================
{
  const s = content('Design', 'Database design and ERD');
  const ent = (x, y, w, h, name, pk, center = false) => {
    card(s, x, y, w, h, center ? C.navy : C.tint);
    text(s, name, { x, y: y + 0.06, w, h: h / 2, fontSize: 14, bold: true, color: center ? C.white : C.navy, align: 'center', valign: 'middle' });
    text(s, pk, { x, y: y + h / 2, w, h: h / 2 - 0.06, fontSize: 11, color: center ? C.gold : C.muted, align: 'center', valign: 'top' });
  };
  // relationship lines first (drawn under boxes)
  line(s, 2.1, 1.75, 2.75, 2.35);
  line(s, 2.1, 3.25, 2.75, 2.75);
  line(s, 4.45, 2.45, 5.2, 1.58);
  line(s, 4.45, 2.52, 5.2, 2.53);
  line(s, 4.45, 2.6, 5.2, 3.48);
  line(s, 1.3, 3.6, 2.75, 4.35);
  line(s, 4.45, 4.35, 5.2, 4.38);
  ent(0.5, 1.4, 1.6, 0.7, 'guests', 'PK guestId');
  ent(0.5, 2.9, 1.6, 0.7, 'rooms', 'PK roomId');
  ent(2.75, 2.1, 1.7, 0.85, 'reservations', 'FK guestId · FK roomId', true);
  ent(5.2, 1.3, 1.7, 0.56, 'payments', 'FK reservationId');
  ent(5.2, 2.25, 1.7, 0.56, 'digital_keys', 'FK reservationId');
  ent(5.2, 3.2, 1.7, 0.56, 'service_orders', 'FK reservationId');
  ent(2.75, 4.05, 1.7, 0.6, 'housekeeping', 'FK roomId · FK staffId');
  ent(5.2, 4.1, 1.7, 0.56, 'staff', 'PK staffId');
  text(s, 'All relationships are one-to-many (1 ─ *)', { x: 0.5, y: 4.72, w: 4.0, h: 0.3, fontSize: 11, italic: true, color: C.muted });
  // facts column
  card(s, 7.3, 1.3, 2.2, 3.36, C.tint);
  const facts = ['8 tables from Lab 04', '7 foreign keys, ON DELETE RESTRICT', '17 CHECK constraints', 'Normalized to 3NF', 'Price snapshot on each booking'];
  text(s, facts.map((t, k) => ({ text: t, options: { bullet: { indent: 12 }, breakLine: k < facts.length - 1 } })), {
    x: 7.45, y: 1.45, w: 1.95, h: 3.1, fontSize: 14, valign: 'top', paraSpaceAfter: 8,
  });
  s.addNotes(
    "These are exactly the eight tables from my Lab 04 design. Reservations are at the centre: a guest has many reservations, a room has many reservations, and each reservation has many payments, keys and service orders. Rooms and staff meet in housekeeping. Every foreign key is ON DELETE RESTRICT, so booking history can never be deleted by accident. The database itself also enforces seventeen CHECK constraints, such as check-out after check-in and no negative prices.",
  );
}

// =====================================================================
// 8. Core features
// =====================================================================
pres.addSection({ title: 'Implementation' });
{
  const s = content('Implementation', 'Core features');
  const feats = [
    ['Reservations', 'Date availability search; double bookings blocked with a row lock'],
    ['Payments', 'Front desk records payments; full payment confirms the booking'],
    ['Digital check-in / out', 'Requires full payment and a clean room. Bill settled before leaving'],
    ['Digital keys', 'Random key shown once; only a SHA-256 hash is stored'],
    ['Housekeeping', 'Cleaning task assigned automatically; finishing it frees the room'],
    ['Service orders', 'Server-side menu prices; charges added to the bill'],
  ];
  feats.forEach(([t, d], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.5 + col * 3.07, y = 1.22 + row * 1.85;
    card(s, x, y, 2.9, 1.68);
    badge(s, x + 0.2, y + 0.2, i + 1, 0.4);
    text(s, t, { x: x + 0.75, y: y + 0.2, w: 2.05, h: 0.4, fontSize: 15, bold: true, color: C.navy, valign: 'middle' });
    text(s, d, { x: x + 0.2, y: y + 0.72, w: 2.55, h: 0.85, fontSize: 14, valign: 'top' });
  });
  s.addNotes(
    "These are the six business features. Reservations check availability by date, and a row lock stops two people booking the same room at the same moment. Payments are recorded by the front desk, and full payment confirms the booking automatically. Check-in needs full payment and a clean room. Digital keys are random, and only a hash is stored. Check-out creates a cleaning task automatically, and finishing it makes the room available again. Room-service prices come from the server, never from the client.",
  );
}

// =====================================================================
// 9. REST API endpoints
// =====================================================================
{
  const s = content('Implementation', 'REST API endpoints');
  card(s, 0.5, 1.22, 2.4, 1.55, C.navy);
  text(s, '44', { x: 0.5, y: 1.3, w: 2.4, h: 0.9, fontFace: HEAD, fontSize: 48, bold: true, color: C.gold, align: 'center', valign: 'middle' });
  text(s, 'endpoints (20 required)', { x: 0.5, y: 2.2, w: 2.4, h: 0.4, fontSize: 14, color: C.white, align: 'center' });
  s.addChart(
    pres.charts.BAR,
    [{ name: 'Endpoints', labels: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'], values: [18, 10, 11, 1, 4] }],
    {
      x: 3.1, y: 1.15, w: 3.3, h: 2.2, barDir: 'bar', chartColors: [C.teal], showValue: true, dataLabelPosition: 'outEnd',
      dataLabelFontSize: 12, dataLabelColor: C.ink, dataLabelFontFace: BODY, showLegend: false,
      catAxisLabelFontSize: 12, catAxisLabelColor: C.ink, catAxisLabelFontFace: BODY, catAxisOrientation: 'maxMin',
      valAxisHidden: true, valGridLine: { style: 'none' }, catGridLine: { style: 'none' },
      showTitle: true, title: 'Endpoints by HTTP method', titleFontSize: 12, titleColor: C.muted, titleFontFace: BODY,
    },
  );
  const mods = [['Auth', 2], ['Guests', 6], ['Rooms', 6], ['Reservations', 8], ['Payments', 4], ['Digital keys', 5], ['Housekeeping', 4], ['Staff', 5], ['Service orders', 4]];
  card(s, 6.7, 1.22, 2.8, 3.63, C.tint);
  text(s, 'Endpoints per module', { x: 6.9, y: 1.32, w: 2.4, h: 0.32, fontSize: 12, bold: true, color: C.teal });
  mods.forEach(([m, n], i) => {
    const y = 1.7 + i * 0.34;
    text(s, m, { x: 6.9, y, w: 1.8, h: 0.3, fontSize: 13, valign: 'middle' });
    text(s, String(n), { x: 8.7, y, w: 0.6, h: 0.3, fontSize: 13, bold: true, color: C.navy, align: 'right', valign: 'middle' });
  });
  card(s, 0.5, 3.55, 5.9, 1.3, C.tint);
  text(s, 'Example (Lab 05 #1, public)', { x: 0.7, y: 3.65, w: 5.5, h: 0.3, fontSize: 12, bold: true, color: C.teal });
  text(s, 'GET /api/v1/rooms?roomStatus=Available → 200', { x: 0.7, y: 3.98, w: 5.5, h: 0.35, fontFace: 'Courier New', fontSize: 13, bold: true, color: C.navy });
  text(s, 'Plural nouns · /api/v1 versioning · one JSON error format · 200 201 204 400 401 403 404 409 429', { x: 0.7, y: 4.35, w: 5.5, h: 0.4, fontSize: 12, color: C.muted });
  s.addNotes(
    "I followed my Lab 05 rules: plural nouns, version 1 in the URL, and correct status codes. There are 44 endpoints, more than double the twenty required, using GET, POST, PUT, PATCH and DELETE. All seven Lab 05 endpoints are kept with their original access levels; for example, listing available rooms is public. Errors always have the same JSON shape, and a failure never returns 200.",
  );
}

// =====================================================================
// 10. Authentication and security
// =====================================================================
{
  const s = content('Implementation', 'Authentication and security');
  const flow = [
    ['Log in', 'email + password'],
    ['Verify', 'bcrypt hash and account status'],
    ['Issue JWT', 'HS256, id + role, expires in 1 hour'],
    ['Send token', 'Authorization: Bearer …'],
    ['Check', 'no token 401 · wrong role 403'],
  ];
  const w = 1.66, gap = 0.175;
  flow.forEach(([t, d], i) => {
    const x = 0.5 + i * (w + gap);
    card(s, x, 1.22, w, 1.25, i === 4 ? C.navy : C.tint);
    text(s, `${i + 1}. ${t}`, { x: x + 0.12, y: 1.32, w: w - 0.24, h: 0.35, fontSize: 14, bold: true, color: i === 4 ? C.gold : C.navy });
    text(s, d, { x: x + 0.12, y: 1.7, w: w - 0.24, h: 0.7, fontSize: 12, color: i === 4 ? C.white : C.muted, valign: 'top' });
    if (i < 4) arrow(s, x + w, 1.85, x + w + gap, 1.85);
  });
  const left = ['bcrypt password hashing (cost 10)', 'Global JWT guard; deactivated users rejected', 'Role checks plus ownership checks', 'DTO validation rejects unknown fields'];
  const right = ['Login limit: 10 attempts per minute (429)', 'Helmet security headers, restricted CORS', 'Secrets only in .env (git-ignored)', 'Digital keys stored as SHA-256 hashes'];
  [left, right].forEach((items, c) => {
    text(s, items.map((t, k) => ({ text: t, options: { bullet: { indent: 12 }, breakLine: k < items.length - 1 } })), {
      x: 0.5 + c * 4.6, y: 2.8, w: 4.4, h: 2.0, fontSize: 14, valign: 'top', paraSpaceAfter: 8,
    });
  });
  s.addNotes(
    "This is my Lab 06 login flow, implemented. The password is checked against a bcrypt hash, and the account must be active. Login returns a JWT with the user id and role that expires in one hour. Every protected request sends it as a Bearer token. No token gives 401; the wrong role gives 403. I also check ownership, so a guest cannot open another guest's reservation even with a valid token. Unknown fields are rejected, so nobody can register with role MANAGER, and login is rate-limited against brute force.",
  );
}

// =====================================================================
// 11. Integrated hotel workflow
// =====================================================================
{
  const s = content('Implementation', 'Integrated hotel workflow');
  const steps = ['Register', 'Log in (JWT)', 'Search rooms', 'Book: PENDING', 'Pay: CONFIRMED', 'Check in + key', 'Open door', 'Order service', 'Check out', 'Clean room', 'Room AVAILABLE'];
  const tx = new Set([4, 5, 8, 9]); // transactional steps (0-based)
  const w = 1.4, gap = 0.12;
  const pos = (i) => (i < 6 ? { col: i, y: 1.3 } : { col: 5 - (i - 6), y: 2.85 });
  steps.forEach((t, i) => {
    const { col, y } = pos(i);
    const x = 0.5 + col * (w + gap);
    const hot = tx.has(i);
    card(s, x, y, w, 1.1, hot ? C.teal : C.tint);
    text(s, String(i + 1), { x: x + 0.12, y: y + 0.08, w: 0.5, h: 0.35, fontFace: HEAD, fontSize: 16, bold: true, color: hot ? C.gold : C.teal });
    text(s, t, { x: x + 0.12, y: y + 0.45, w: w - 0.2, h: 0.55, fontSize: 14, bold: true, color: hot ? C.white : C.navy, valign: 'top' });
    if (i < 5) arrow(s, x + w, y + 0.55, x + w + gap, y + 0.55);
    if (i >= 6 && i < 10) arrow(s, x, y + 0.55, x - gap, y + 0.55);
  });
  const x6 = 0.5 + 5 * (w + gap) + w / 2;
  arrow(s, x6, 2.4, x6, 2.85, C.gold);
  card(s, 0.5, 2.85, w, 1.1, C.white, { line: { color: C.teal, width: 1 } });
  text(s, 'Highlighted = one database transaction', { x: 0.58, y: 2.9, w: w - 0.16, h: 1.0, fontSize: 12, italic: true, color: C.teal, valign: 'middle' });
  text(s, 'Check-in needs full payment and a clean room. Check-out needs a zero balance, revokes the key, and creates the cleaning task.', {
    x: 0.5, y: 4.2, w: 9.0, h: 0.6, fontSize: 14, color: C.ink, valign: 'top',
  });
  s.addNotes(
    "This is where the modules really integrate. A guest registers, logs in, searches and books; the booking starts as pending. When the front desk records full payment, the booking becomes confirmed. Check-in needs that payment and a clean room; it marks the room occupied and issues a digital key. The guest opens the door and orders room service. Check-out needs a zero balance; it revokes the key, sends the room to cleaning and assigns the least-busy housekeeper. When the housekeeper finishes, the room is available again. The highlighted steps each run as one database transaction, so nothing is ever half-done.",
  );
}

// =====================================================================
// 12. Testing results
// =====================================================================
pres.addSection({ title: 'Results' });
{
  const s = content('Results', 'Testing results');
  const stats = [
    ['33 / 33', 'unit tests', 'Jest · all passed'],
    ['46 / 46', 'end-to-end tests', 'MariaDB and MySQL 8.4'],
    ['122 / 122', 'Postman requests', 'Isolated database'],
    ['177 / 177', 'assertions passed', '6 runs · 0 failures'],
  ];
  stats.forEach(([n, l, sub], i) => {
    const x = 0.5 + i * 2.29;
    card(s, x, 1.22, 2.12, 1.85, i < 2 ? C.tint : C.tealTint);
    text(s, n, { x, y: 1.32, w: 2.12, h: 0.75, fontFace: HEAD, fontSize: 30, bold: true, color: C.teal, align: 'center', valign: 'middle' });
    text(s, l, { x: x + 0.1, y: 2.07, w: 1.92, h: 0.4, fontSize: 14, bold: true, color: C.navy, align: 'center' });
    text(s, sub, { x: x + 0.1, y: 2.47, w: 1.92, h: 0.4, fontSize: 12, color: C.muted, align: 'center' });
  });
  text(s, 'Real bugs found by testing, and fixed', { x: 0.5, y: 3.3, w: 9.0, h: 0.35, fontSize: 15, bold: true, color: C.navy });
  const bugs = [
    'MariaDB rejected a MySQL 8 lock statement: now a row lock (6 parallel bookings, 1 succeeds)',
    'App and database clocks differed by 8 hours: one time zone for both',
    'Postman sent ids as text: fixed in the collection, validation kept strict',
  ];
  text(s, bugs.map((t, k) => ({ text: t, options: { bullet: { indent: 12 }, breakLine: k < bugs.length - 1 } })), {
    x: 0.5, y: 3.7, w: 9.0, h: 1.2, fontSize: 14, valign: 'top', paraSpaceAfter: 4,
  });
  s.addNotes(
    "All 33 unit tests and all 46 end-to-end tests pass. The end-to-end tests run the real application against a real test database. The full Postman collection of 122 requests ran on a separate database six times, with Newman and in the Postman desktop Collection Runner, and all 177 assertions passed every time, with zero failures and zero errors. In the final check I also ran the end-to-end tests and the whole collection on Oracle MySQL 8.4, not only on XAMPP's MariaDB, and they passed there too. Testing found real bugs: a lock statement MariaDB does not support, an eight-hour time-zone mismatch, and Postman requests that sent numbers as text. I fixed each one without relaxing any validation.",
  );
}

// =====================================================================
// 13. System demonstration
// =====================================================================
{
  const s = content('Results', 'System demonstration');
  const steps = [
    ['Start the backend', 'npm run start:dev, 0 errors, 44 routes'],
    ['Log in', 'Login - Manager returns a JWT'],
    ['Room CRUD', 'Create, read, update, delete a room'],
    ['Trace the layers', 'Controller → Service → Repository → MySQL'],
    ['No token', 'Protected route returns 401'],
    ['Check the database', 'phpMyAdmin matches Postman'],
  ];
  steps.forEach(([t, d], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.5 + col * 4.6, y = 1.22 + row * 1.05;
    card(s, x, y, 4.4, 0.9);
    badge(s, x + 0.2, y + 0.24, i + 1, 0.42, C.navy, C.white);
    text(s, t, { x: x + 0.8, y: y + 0.1, w: 3.45, h: 0.35, fontSize: 15, bold: true, color: C.navy });
    text(s, d, { x: x + 0.8, y: y + 0.46, w: 3.45, h: 0.35, fontSize: 13, color: C.muted });
  });
  text(s, 'Backup if the live demo fails: the recorded video and the passing test output.', { x: 0.5, y: 4.45, w: 9.0, h: 0.4, fontSize: 14, italic: true, color: C.muted });
  s.addNotes(
    "Now I will show the system live, in the same order as my video. I start the backend, log in as the manager to get a token, then create, read, update and delete a room in Postman. I trace one request through the controller, service and repository in the code. Then I remove the token to show the 401, and finally I open phpMyAdmin to show that the database matches. Switch to the demo now.",
  );
}

// =====================================================================
// 13b. Optional React frontend (bonus)
// =====================================================================
{
  const s = content('Results', 'Optional React frontend (bonus)');
  const shot = (file) => path.join(__dirname, '..', '..', 'docs', 'screenshots', 'frontend', file);
  [
    ['02a-register-form.png', 'Guest sign-up: always a Guest account'],
    ['14a-smart-lock-granted.png', 'Digital key and simulated smart lock'],
  ].forEach(([file, caption], i) => {
    const x = 0.5 + i * 4.6;
    card(s, x, 1.15, 4.4, 2.75);
    s.addImage({ path: shot(file), x: x + 0.1, y: 1.22, w: 4.2, h: 2.6, sizing: { type: 'contain', w: 4.2, h: 2.6 } });
    text(s, caption, { x, y: 3.95, w: 4.4, h: 0.35, fontSize: 13, bold: true, color: C.navy, align: 'center' });
  });
  text(s, 'React 19 · Vite · TypeScript · 15 screens · all four roles · 36 of 44 endpoints · the API still enforces every permission', {
    x: 0.5, y: 4.4, w: 9.0, h: 0.45, fontSize: 13, italic: true, color: C.muted, align: 'center', valign: 'middle',
  });
  s.addNotes(
    "As an optional bonus I built a React frontend that uses the same REST API. Guests can sign up, but every public sign-up becomes a Guest account; the server rejects any attempt to choose a staff role. Each of the four roles gets its own screens, for example booking, payments, digital check-in with the simulated smart lock, service requests and housekeeping. Hiding pages is only for usability; the backend still checks every permission.",
  );
}

// =====================================================================
// 14. Conclusion
// =====================================================================
{
  const s = content('Results', 'Conclusion');
  const cols = [
    ['Accomplished', ['Lab 03–06 designs now run as real software', '44 endpoints, 8 tables, 4 roles', 'Tested on MariaDB and MySQL 8.4']],
    ['Lessons learned', ['Design first made building faster', 'Transactions make integration safe', 'Test on the real database and tools']],
    ['Next steps', ['Mobile app; e-mail verification', 'Real payment, SMS and lock providers', 'HTTPS deployment']],
  ];
  cols.forEach(([t, items], i) => {
    const x = 0.5 + i * 3.07;
    card(s, x, 1.22, 2.9, 2.75, i === 0 ? C.navy : C.tint);
    text(s, t, { x: x + 0.2, y: 1.38, w: 2.5, h: 0.4, fontSize: 16, bold: true, color: i === 0 ? C.gold : C.teal });
    text(s, items.map((v, k) => ({ text: v, options: { bullet: { indent: 12 }, breakLine: k < items.length - 1 } })), {
      x: x + 0.2, y: 1.88, w: 2.55, h: 2.0, fontSize: 14, color: i === 0 ? C.white : C.ink, valign: 'top', paraSpaceAfter: 8,
    });
  });
  text(s, 'MariStay shows how separate hotel departments can share one secure, consistent backend.', { x: 0.5, y: 4.25, w: 9.0, h: 0.5, fontFace: HEAD, fontSize: 18, italic: true, color: C.navy, valign: 'middle' });
  s.addNotes(
    "To conclude: my Lab 03 to 06 designs now run as real software, with 44 endpoints, eight tables and four roles, and it is secure, transactional and fully tested. My biggest lessons were that designing first makes building faster, that transactions are what make integration safe, and that you have to test against the real database and tools. As a bonus there is also a React web frontend for all four roles. Next steps would be a mobile app with e-mail verification for sign-up, real payment, SMS and smart-lock providers, and an HTTPS deployment.",
  );
}

// =====================================================================
// 15. Questions and answers
// =====================================================================
{
  const s = pres.addSlide({ masterName: 'MS_DARK', sectionTitle: 'Results' });
  s.addText('Questions and answers', { placeholder: 'title' });
  text(s, 'Thank you.', { x: 0.6, y: 2.95, w: 8.8, h: 0.5, fontFace: HEAD, fontSize: 22, color: C.gold });
  text(s, 'MariStay  ·  Geero Andrei E. Reyes  ·  BSIT 4C  ·  ITEC 116', { x: 0.6, y: 3.5, w: 8.8, h: 0.4, fontSize: 16, color: 'C9D6DF' });
  s.addNotes(
    "Thank you. I'm ready for your questions. (Prepared answers cover: NestJS structure, TypeORM, keys and relationships, PUT versus PATCH, JWT, hashing, double-booking prevention, transactions, and the simulated integrations.)",
  );
}

// Write, then re-pack without ZIP folder entries (they can stop cloud services such as
// OneDrive or Google Drive from opening the file). The archive order is kept, so
// [Content_Types].xml stays first.
(async () => {
  const JSZip = require('jszip'); // installed with pptxgenjs
  const src = await JSZip.loadAsync(await pres.write({ outputType: 'nodebuffer' }));
  const out = new JSZip();
  for (const [name, entry] of Object.entries(src.files)) {
    if (!entry.dir) out.file(name, await entry.async('nodebuffer'), { createFolders: false });
  }
  require('fs').writeFileSync(OUT, await out.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
  console.log('✔ ' + path.relative(path.join(__dirname, '..', '..'), OUT));
})();
