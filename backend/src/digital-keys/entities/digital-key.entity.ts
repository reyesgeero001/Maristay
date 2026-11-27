import { Exclude } from 'class-transformer';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DigitalKeyStatus } from '../../common/enums';
import { Reservation } from '../../reservations/entities/reservation.entity';

/** Lab 04 Table 5 — digital room access credentials for checked-in guests. */
@Entity({ name: 'digital_keys' })
export class DigitalKey {
  @PrimaryGeneratedColumn({ name: 'keyId', type: 'int' })
  keyId!: number;

  @Index('IDX_digital_keys_reservation')
  @Column({ type: 'int' })
  reservationId!: number;

  /** SHA-256 hash of the credential. The plaintext is never stored or serialized. */
  @Exclude()
  @Index('UQ_digital_keys_keyCodeHash', { unique: true })
  @Column({ type: 'varchar', length: 255 })
  keyCodeHash!: string;

  @Column({ type: 'datetime' })
  issuedAt!: Date;

  @Column({ type: 'datetime' })
  expiresAt!: Date;

  @Column({ type: 'varchar', length: 20, default: DigitalKeyStatus.ACTIVE })
  status!: DigitalKeyStatus;

  @ManyToOne(() => Reservation, (reservation) => reservation.digitalKeys, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'reservationId', foreignKeyConstraintName: 'FK_digital_keys_reservation' })
  reservation?: Reservation;
}
