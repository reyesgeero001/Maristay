import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { DigitalKeyStatus } from '../common/enums';
import { checkOutDeadline } from '../common/utilities/date.util';
import { generateDigitalKeyCode, hashDigitalKeyCode } from '../common/utilities/security.util';
import { Reservation } from '../reservations/entities/reservation.entity';
import { DigitalKey } from './entities/digital-key.entity';

export interface IssuedKey {
  keyId: number;
  reservationId: number;
  /** Plaintext credential — returned ONLY at issue/reissue time, never stored. */
  keyCode: string;
  issuedAt: Date;
  expiresAt: Date;
  status: DigitalKeyStatus;
}

/**
 * Digital room key lifecycle (Lab 03 "keyless room access").
 * Workflow-facing methods take an EntityManager so they run inside the
 * check-in / check-out transactions.
 */
@Injectable()
export class DigitalKeysService {
  /**
   * Issues a fresh key for a checked-in reservation. Any previous ACTIVE key for
   * the same reservation is revoked first, so only one key works at a time.
   * Default expiry: 12:00 on the check-out date.
   */
  async issueKey(em: EntityManager, reservation: Reservation, expiresAt?: Date): Promise<IssuedKey> {
    await this.revokeActiveKeys(em, reservation.reservationId);

    const keyCode = generateDigitalKeyCode();
    const issuedAt = new Date();
    issuedAt.setMilliseconds(0);
    const key = em.create(DigitalKey, {
      reservationId: reservation.reservationId,
      keyCodeHash: hashDigitalKeyCode(keyCode), // only the SHA-256 hash is stored
      issuedAt,
      expiresAt: expiresAt ?? checkOutDeadline(reservation.checkOutDate),
      status: DigitalKeyStatus.ACTIVE,
    });
    const saved = await em.save(key);
    return {
      keyId: saved.keyId,
      reservationId: saved.reservationId,
      keyCode,
      issuedAt: saved.issuedAt,
      expiresAt: saved.expiresAt,
      status: saved.status,
    };
  }

  /** Revokes every ACTIVE key of a reservation; returns how many were revoked. */
  async revokeActiveKeys(em: EntityManager, reservationId: number): Promise<number> {
    const result = await em.update(
      DigitalKey,
      { reservationId, status: DigitalKeyStatus.ACTIVE },
      { status: DigitalKeyStatus.REVOKED },
    );
    return result.affected ?? 0;
  }
}
