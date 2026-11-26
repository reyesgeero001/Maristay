/**
 * Separate MariStay instance for running the full Postman collection.
 *
 *   npm run postman:setup   create + migrate + seed maristay_postman_db (non-destructive, idempotent)
 *   npm run postman:reset   drop and rebuild ONLY maristay_postman_db (fresh data for a re-run)
 *   npm run postman:start   build into dist-postman/ and start the API on port 3001
 *   npm run postman:env     write a Postman environment for port 3001 to exports/tmp/ (no secrets)
 *   npm run postman:newman  optional: run the collection with Newman against port 3001
 *
 * The database name and port are fixed here and passed to child processes as
 * environment variables, which take precedence over .env. The .env file is
 * never modified, and maristay_db / maristay_test_db are never touched.
 * No secret is printed or written to disk by this script.
 */
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const ROOT = path.resolve(__dirname, '..');
const POSTMAN_DB = 'maristay_postman_db';
const PORT = '3001';
const BASE_URL = `http://localhost:${PORT}/api/v1`;
const TMP_DIR = path.join(ROOT, 'exports', 'tmp'); // git-ignored

dotenv.config({ path: path.join(ROOT, '.env'), quiet: true });

// Never let this script point at the demo or e2e database.
if (POSTMAN_DB === process.env.DB_DATABASE || POSTMAN_DB === process.env.TEST_DB_DATABASE) {
  fail(`${POSTMAN_DB} must be different from DB_DATABASE and TEST_DB_DATABASE in .env.`);
}

const childEnv = {
  ...process.env,
  DB_DATABASE: POSTMAN_DB,
  PORT,
  NODE_ENV: 'development',
  // Pinned so the collection's expectations hold even if .env changes them:
  // the rate-limit request sends 12 logins and expects a 429 after 10.
  LOGIN_RATE_LIMIT: '10',
  API_RATE_LIMIT: '300',
};

function fail(message) {
  console.error(`postman-instance: ${message}`);
  process.exit(1);
}

function run(command) {
  console.log(`\n> ${command}   [DB_DATABASE=${POSTMAN_DB}]`);
  const result = spawnSync(command, { cwd: ROOT, env: childEnv, stdio: 'inherit', shell: true });
  if (result.status !== 0) fail(`"${command}" failed (exit code ${result.status}).`);
}

function setup() {
  run('npm run db:setup');
  console.log(`\n${POSTMAN_DB} is ready (same demo accounts and password as maristay_db).`);
}

async function reset() {
  const mysql = require('mysql2/promise');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD ?? '',
  });
  try {
    // The name is the constant above, never user input.
    await connection.query(`DROP DATABASE IF EXISTS \`${POSTMAN_DB}\``);
    console.log(`Dropped ${POSTMAN_DB} (no other database was touched).`);
  } finally {
    await connection.end();
  }
  setup();
}

function start() {
  run('npx nest build -p tsconfig.postman.json');
  console.log(`\nStarting MariStay for Postman on ${BASE_URL} (database ${POSTMAN_DB}). Stop it with Ctrl+C.`);
  run('node dist-postman/main.js');
}

/** Builds a Postman v2.1 environment object from the committed environment (YAML or JSON). */
function loadEnvironment() {
  const json = path.join(ROOT, 'exports', 'MariStay.postman_environment.json');
  if (!fs.existsSync(json)) fail('exports/MariStay.postman_environment.json not found.');
  const { values } = JSON.parse(fs.readFileSync(json, 'utf8'));
  const secret = (key) => key === 'demoPassword' || /Token$/.test(key);
  return {
    name: 'MariStay Postman 3001',
    values: values.map(({ key }) => ({
      key,
      value: key === 'baseUrl' ? BASE_URL : '',
      type: secret(key) ? 'secret' : 'default',
      enabled: true,
    })),
    _postman_variable_scope: 'environment',
  };
}

function writeEnvironment() {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const file = path.join(TMP_DIR, 'MariStay Postman 3001.postman_environment.json');
  fs.writeFileSync(file, JSON.stringify(loadEnvironment(), null, 2) + '\n');
  console.log(`Wrote ${path.relative(ROOT, file)} (baseUrl ${BASE_URL}; demoPassword left empty).`);
}

/** The submitted Postman v2.1 export is the collection that Newman runs. */
const COLLECTION = path.join(ROOT, 'exports', 'MariStay.postman_collection.json');

function runNewman() {
  let newman;
  try {
    newman = require('newman');
  } catch {
    fail('Newman is not installed. Install it without changing package.json:  npm install --no-save newman');
  }
  const password = process.env.SEED_DEMO_PASSWORD;
  if (!password || password.startsWith('replace_with')) fail('SEED_DEMO_PASSWORD is not set in .env.');

  if (!fs.existsSync(COLLECTION)) fail('exports/MariStay.postman_collection.json not found.');
  const collection = JSON.parse(fs.readFileSync(COLLECTION, 'utf8'));
  const count = collection.item.reduce((n, folder) => n + folder.item.length, 0);
  console.log(`Collection: exports/MariStay.postman_collection.json (${collection.item.length} folders, ${count} requests)\nTarget:     ${BASE_URL}\n`);
  newman.run(
    {
      collection,
      environment: loadEnvironment(),
      // Passed in memory: the password never appears in a command line, file, or report.
      envVar: [
        { key: 'baseUrl', value: BASE_URL },
        { key: 'demoPassword', value: password },
      ],
      reporters: ['cli'],
      timeoutRequest: 30000,
    },
    (error, summary) => {
      if (error) fail(error.message);
      const { stats, failures } = summary.run;
      const report = {
        finishedAt: new Date().toISOString(),
        target: BASE_URL,
        database: POSTMAN_DB,
        requests: stats.requests,
        assertions: stats.assertions,
        testScripts: stats.testScripts,
        failures: failures.map((f) => ({ request: f.source && f.source.name, test: f.error.test, message: f.error.message })),
      };
      fs.mkdirSync(TMP_DIR, { recursive: true });
      const out = path.join(TMP_DIR, 'newman-summary.json');
      fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
      console.log(`\nSummary (no tokens or passwords) written to ${path.relative(ROOT, out)}`);
      process.exitCode = failures.length ? 1 : 0;
    },
  );
}

const commands = { setup, reset, start, env: writeEnvironment, newman: runNewman };
const command = commands[process.argv[2]];
if (!command) fail(`usage: node scripts/postman-instance.js <${Object.keys(commands).join('|')}>`);
Promise.resolve(command()).catch((error) => fail(error.message));
