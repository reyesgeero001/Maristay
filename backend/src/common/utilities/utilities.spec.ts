import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AccountType, Role } from '../enums';
import { ParseIdPipe } from '../pipes/parse-id.pipe';
import { checkOutDeadline, isValidDateString, nightsBetween } from './date.util';
import { fromCents, sumMoney, toCents } from './money.util';
import { assertGuestOwnerOrStaff } from './ownership.util';
import { generateDigitalKeyCode, hashDigitalKeyCode, PASSWORD_REGEX } from './security.util';

describe('date utilities', () => {
  it('counts nights in a half-open stay range', () => {
    expect(nightsBetween('2026-12-20', '2026-12-22')).toBe(2);
    expect(nightsBetween('2026-12-31', '2027-01-01')).toBe(1);
    expect(nightsBetween('2028-02-28', '2028-03-01')).toBe(2); // leap year
  });

  it('accepts only real YYYY-MM-DD dates', () => {
    expect(isValidDateString('2026-12-20')).toBe(true);
    expect(isValidDateString('2026-02-30')).toBe(false);
    expect(isValidDateString('20-12-2026')).toBe(false);
    expect(isValidDateString('2026-12-20T00:00:00Z')).toBe(false);
  });

  it('sets key expiry to 12:00 local time on the check-out date', () => {
    const deadline = checkOutDeadline('2026-12-22');
    expect([deadline.getFullYear(), deadline.getMonth(), deadline.getDate(), deadline.getHours()]).toEqual([
      2026, 11, 22, 12,
    ]);
  });
});

describe('money utilities', () => {
  it('avoids floating point errors by working in centavos', () => {
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(sumMoney([0.1, 0.2])).toBe(0.3);
    expect(fromCents(toCents(1800) * 3)).toBe(5400);
    expect(toCents(19.99)).toBe(1999);
  });
});

describe('ParseIdPipe', () => {
  const pipe = new ParseIdPipe();
  it('accepts positive integers', () => expect(pipe.transform('42')).toBe(42));
  it.each(['0', '-1', 'abc', '1.5', '1 OR 1=1', ''])('rejects %p with 400', (value) => {
    expect(() => pipe.transform(value)).toThrow(BadRequestException);
  });
});

describe('ownership checks', () => {
  const guest = { id: 7, accountType: AccountType.GUEST, role: Role.GUEST, email: 'g@example.com' };
  const frontDesk = { id: 2, accountType: AccountType.STAFF, role: Role.FRONT_DESK, email: 'f@maristay.test' };
  const housekeeper = { id: 3, accountType: AccountType.STAFF, role: Role.HOUSEKEEPING, email: 'h@maristay.test' };

  it('lets a guest access their own record', () => expect(() => assertGuestOwnerOrStaff(guest, 7)).not.toThrow());
  it("blocks a guest from another guest's record", () =>
    expect(() => assertGuestOwnerOrStaff(guest, 8)).toThrow(ForbiddenException));
  it('lets operations staff through', () => expect(() => assertGuestOwnerOrStaff(frontDesk, 8)).not.toThrow());
  it('blocks staff roles that are not allowed', () =>
    expect(() => assertGuestOwnerOrStaff(housekeeper, 8)).toThrow(ForbiddenException));
  it('honours a custom staff role list', () =>
    expect(() => assertGuestOwnerOrStaff(frontDesk, 8, [Role.MANAGER])).toThrow(ForbiddenException));
});

describe('security utilities', () => {
  it('generates unique, high-entropy digital key codes', () => {
    const a = generateDigitalKeyCode();
    const b = generateDigitalKeyCode();
    expect(a).toMatch(/^MSK-[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(b);
  });

  it('hashes key codes deterministically without revealing them', () => {
    const code = generateDigitalKeyCode();
    expect(hashDigitalKeyCode(code)).toBe(hashDigitalKeyCode(code));
    expect(hashDigitalKeyCode(code)).toHaveLength(64);
    expect(hashDigitalKeyCode(code)).not.toContain(code);
  });

  it('enforces the password policy', () => {
    expect(PASSWORD_REGEX.test('SecurePass123')).toBe(true);
    expect(PASSWORD_REGEX.test('short1')).toBe(false);
    expect(PASSWORD_REGEX.test('nodigitshere')).toBe(false);
    expect(PASSWORD_REGEX.test('12345678')).toBe(false);
  });
});
