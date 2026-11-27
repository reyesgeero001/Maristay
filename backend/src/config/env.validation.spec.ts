import 'reflect-metadata';
import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const base = {
    NODE_ENV: 'development',
    PORT: '3000',
    DB_HOST: 'localhost',
    DB_PORT: '3306',
    DB_USERNAME: 'root',
    DB_PASSWORD: '',
    DB_DATABASE: 'maristay_db',
    JWT_SECRET: 'a'.repeat(48),
    JWT_EXPIRES_IN: '1h',
  };

  it('accepts a complete configuration', () => {
    expect(() => validateEnv(base)).not.toThrow();
  });

  it('refuses to start without a JWT secret (no insecure fallback)', () => {
    const { JWT_SECRET: _omit, ...rest } = base;
    expect(() => validateEnv(rest)).toThrow(/JWT_SECRET/);
  });

  it('refuses the placeholder or a short secret', () => {
    expect(() => validateEnv({ ...base, JWT_SECRET: 'replace_with_a_secure_random_secret_xxxxxxxx' })).toThrow();
    expect(() => validateEnv({ ...base, JWT_SECRET: 'short' })).toThrow();
  });

  it('rejects an unsafe database name', () => {
    expect(() => validateEnv({ ...base, DB_DATABASE: 'maristay; DROP DATABASE x' })).toThrow(/DB_DATABASE/);
  });
});
