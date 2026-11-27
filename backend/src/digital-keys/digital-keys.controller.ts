import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { DigitalKeyAccessService } from './digital-key-access.service';
import { CreateDigitalKeyDto } from './dto/create-digital-key.dto';
import { DigitalKeyQueryDto } from './dto/digital-key-query.dto';
import { ValidateDigitalKeyDto } from './dto/validate-digital-key.dto';

@Roles(Role.GUEST, Role.FRONT_DESK, Role.MANAGER)
@Controller('digital-keys')
export class DigitalKeysController {
  constructor(private readonly keyService: DigitalKeyAccessService) {}

  /** Issue / reissue a digital key for a checked-in reservation (revokes the old one) */
  @Post()
  issue(@Body() dto: CreateDigitalKeyDto, @CurrentUser() user: AuthUser) {
    return this.keyService.issue(dto, user);
  }

  /** Validate a key at a room door (SIMULATED smart lock) */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validate(@Body() dto: ValidateDigitalKeyDto, @CurrentUser() user: AuthUser) {
    return this.keyService.validate(dto, user);
  }

  /** List digital key metadata (guests: own keys only) */
  @Get()
  findAll(@Query() query: DigitalKeyQueryDto, @CurrentUser() user: AuthUser) {
    return this.keyService.findAll(query, user);
  }

  /** View digital key metadata (owner or Front Desk / Manager) */
  @Get(':id')
  findOne(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.keyService.findOne(id, user);
  }

  /** Revoke a digital key (Front Desk, Manager) */
  @Roles(Role.FRONT_DESK, Role.MANAGER)
  @Patch(':id/revoke')
  revoke(@Param('id', ParseIdPipe) id: number) {
    return this.keyService.revoke(id);
  }
}
