import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { In, Repository } from 'typeorm';
import { IdentityService } from '../auth/identity.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { paginate, Paginated } from '../common/dto/pagination-query.dto';
import { AccountStatus, Role, StaffRole } from '../common/enums';
import { BCRYPT_ROUNDS } from '../common/utilities/security.util';
import { Housekeeping } from '../housekeeping/entities/housekeeping.entity';
import { OPEN_TASK_STATUSES } from '../housekeeping/housekeeping-assignment.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { StaffQueryDto } from './dto/staff-query.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Staff } from './entities/staff.entity';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff) private readonly staff: Repository<Staff>,
    @InjectRepository(Housekeeping) private readonly tasks: Repository<Housekeeping>,
    private readonly identity: IdentityService,
  ) {}

  async create(dto: CreateStaffDto): Promise<Staff> {
    await this.identity.assertEmailAvailable(dto.email);
    const member = this.staff.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      role: dto.role,
      passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
      accountStatus: AccountStatus.ACTIVE,
    });
    const saved = await this.staff.save(member);
    return this.findOne(saved.staffId);
  }

  async findAll(query: StaffQueryDto): Promise<Paginated<Staff>> {
    const qb = this.staff.createQueryBuilder('s').orderBy('s.staffId', 'ASC');
    if (query.role) qb.andWhere('s.role = :role', { role: query.role });
    if (query.accountStatus) qb.andWhere('s.accountStatus = :status', { status: query.accountStatus });
    if (query.search) {
      qb.andWhere('(s.firstName LIKE :q OR s.lastName LIKE :q OR s.email LIKE :q)', { q: `%${query.search}%` });
    }
    const [data, total] = await qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(staffId: number): Promise<Staff> {
    const member = await this.staff.findOneBy({ staffId });
    if (!member) throw new NotFoundException('Staff member not found');
    return member;
  }

  async update(staffId: number, dto: UpdateStaffDto, user: AuthUser): Promise<Staff> {
    const member = await this.findOne(staffId);
    const isSelf = user.role === Role.MANAGER && user.id === staffId;

    // Guard against a manager locking themself out of the system.
    if (isSelf && dto.role !== undefined && dto.role !== StaffRole.MANAGER) {
      throw new ForbiddenException('You cannot remove your own manager role');
    }
    if (isSelf && dto.accountStatus === AccountStatus.INACTIVE) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    const leavingHousekeeping =
      member.role === StaffRole.HOUSEKEEPING &&
      ((dto.role !== undefined && dto.role !== StaffRole.HOUSEKEEPING) || dto.accountStatus === AccountStatus.INACTIVE);
    if (leavingHousekeeping) await this.assertNoOpenTasks(staffId);

    if (dto.email !== undefined && dto.email !== member.email) {
      await this.identity.assertEmailAvailable(dto.email, { staffId });
      member.email = dto.email;
    }
    if (dto.firstName !== undefined) member.firstName = dto.firstName;
    if (dto.lastName !== undefined) member.lastName = dto.lastName;
    if (dto.role !== undefined) member.role = dto.role;
    if (dto.accountStatus !== undefined) member.accountStatus = dto.accountStatus;
    if (dto.newPassword !== undefined) member.passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.staff.save(member);
    return this.findOne(staffId);
  }

  /** DELETE /staff/:id — deactivates the account (history in housekeeping is kept). */
  async deactivate(staffId: number, user: AuthUser): Promise<void> {
    const member = await this.findOne(staffId);
    if (user.id === staffId) throw new ForbiddenException('You cannot deactivate your own account');
    if (member.accountStatus === AccountStatus.INACTIVE) return;
    if (member.role === StaffRole.HOUSEKEEPING) await this.assertNoOpenTasks(staffId);
    await this.staff.update({ staffId }, { accountStatus: AccountStatus.INACTIVE });
  }

  private async assertNoOpenTasks(staffId: number): Promise<void> {
    const open = await this.tasks.countBy({ staffId, status: In(OPEN_TASK_STATUSES) });
    if (open > 0) {
      throw new ConflictException(`Staff member still has ${open} open housekeeping task(s); reassign them first`);
    }
  }
}
