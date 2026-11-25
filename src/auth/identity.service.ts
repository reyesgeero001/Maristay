import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Guest } from '../guests/entities/guest.entity';
import { Staff } from '../staff/entities/staff.entity';

/**
 * Guests and staff live in separate tables (Lab 04), but they log in through
 * the same endpoint. To keep logins unambiguous, an email address may belong
 * to only ONE account across both tables. Each table additionally has its own
 * UNIQUE index on email.
 */
@Injectable()
export class IdentityService {
  constructor(
    @InjectRepository(Guest) private readonly guests: Repository<Guest>,
    @InjectRepository(Staff) private readonly staff: Repository<Staff>,
  ) {}

  /**
   * Throws 409 Conflict if the email is used by any guest or staff account,
   * optionally ignoring the account currently being updated.
   */
  async assertEmailAvailable(
    email: string,
    exclude?: { guestId?: number; staffId?: number },
  ): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const guest = await this.guests.findOne({ where: { email: normalized }, select: { guestId: true } });
    const staff = await this.staff.findOne({ where: { email: normalized }, select: { staffId: true } });
    const takenByGuest = guest && guest.guestId !== exclude?.guestId;
    const takenByStaff = staff && staff.staffId !== exclude?.staffId;
    if (takenByGuest || takenByStaff) {
      throw new ConflictException('Email already exists');
    }
  }
}
