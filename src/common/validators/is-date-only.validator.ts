import { registerDecorator, ValidationOptions } from 'class-validator';
import { isValidDateString } from '../utilities/date.util';

/** Accepts only real calendar dates in YYYY-MM-DD format (e.g. rejects 2026-02-30). */
export function IsDateOnly(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isDateOnly',
      target: object.constructor,
      propertyName,
      options: { message: `${propertyName} must be a valid date in YYYY-MM-DD format`, ...options },
      validator: {
        validate: (value: unknown) => typeof value === 'string' && isValidDateString(value),
      },
    });
}
