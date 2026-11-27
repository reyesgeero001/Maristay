import type { IssuedKey } from '../api/types';

/**
 * Plaintext digital key codes are returned by the API only once (at check-in or
 * re-issue). They are kept in memory for this browser tab only — never written
 * to localStorage/sessionStorage — so the guest can try them on the simulated
 * door lock. After a page reload the guest re-issues a key (POST /digital-keys).
 */
const wallet = new Map<number, IssuedKey>();

export const keyWallet = {
  save: (key: IssuedKey) => wallet.set(key.keyId, key),
  all: () => [...wallet.values()].sort((a, b) => b.keyId - a.keyId),
  forget: (keyId: number) => wallet.delete(keyId),
  clear: () => wallet.clear(),
};
