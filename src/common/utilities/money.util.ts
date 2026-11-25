import { ValueTransformer } from 'typeorm';

/**
 * MySQL DECIMAL columns come back from mysql2 as strings ("2500.00").
 * This transformer exposes them as numbers in the entity and API.
 */
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) => (value === null || value === undefined ? value : Number(value)),
};

/**
 * All money arithmetic is done in integer centavos to avoid floating point
 * rounding errors (e.g. 0.1 + 0.2), then converted back to pesos.
 */
export const toCents = (amount: number): number => Math.round(Number(amount) * 100);
export const fromCents = (cents: number): number => Math.round(cents) / 100;
export const sumMoney = (values: number[]): number =>
  fromCents(values.reduce((total, v) => total + toCents(v), 0));
