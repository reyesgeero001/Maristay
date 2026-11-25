import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { DigitalKeyAccessService } from './digital-key-access.service';
import { CreateDigitalKeyDto } from './dto/create-digital-key.dto';
import { DigitalKeyQueryDto } from './dto/digital-key-query.dto';
import { ValidateDigitalKeyDto } from './dto/validate-digital-key.dto';

@ApiTags('Digital Keys')
@ApiBearerAuth()
@Roles(Role.GUEST, Role.FRONT_DESK, Role.MANAGER)
@Controller('digital-keys')
export class DigitalKeysController {
  constructor(private readonly keyService: DigitalKeyAccessService) {}

  @Post()
  @ApiOperation({ summary: 'Issue / reissue a digital key for a checked-in reservation (revokes the old one)' })
  @ApiResponse({ status: 201, description: 'New key — keyCode is shown only in this response' })
  @ApiResponse({ status: 400, description: 'Invalid expiresAt' })
  @ApiResponse({ status: 403, description: "Another guest's reservation, or guest set expiresAt" })
  @ApiResponse({ status: 409, description: 'Reservation is not checked in' })
  issue(@Body() dto: CreateDigitalKeyDto, @CurrentUser() user: AuthUser) {
    return this.keyService.issue(dto, user);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a key at a room door (SIMULATED smart lock)' })
  @ApiResponse({ status: 200, description: 'accessGranted: true' })
  @ApiResponse({ status: 400, description: 'Malformed keyCode' })
  @ApiResponse({ status: 403, description: 'Access denied: invalid, revoked, expired or wrong room' })
  validate(@Body() dto: ValidateDigitalKeyDto, @CurrentUser() user: AuthUser) {
    return this.keyService.validate(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List digital key metadata (guests: own keys only)' })
  @ApiResponse({ status: 200, description: 'Paginated keys (no credentials or hashes)' })
  findAll(@Query() query: DigitalKeyQueryDto, @CurrentUser() user: AuthUser) {
    return this.keyService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'View digital key metadata (owner or Front Desk / Manager)' })
  @ApiResponse({ status: 200, description: 'Key metadata with reservation and room' })
  @ApiResponse({ status: 403, description: "Another guest's key" })
  @ApiResponse({ status: 404, description: 'Key not found' })
  findOne(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.keyService.findOne(id, user);
  }

  @Roles(Role.FRONT_DESK, Role.MANAGER)
  @Patch(':id/revoke')
  @ApiOperation({ summary: 'Revoke a digital key (Front Desk, Manager)' })
  @ApiResponse({ status: 200, description: 'Key REVOKED' })
  @ApiResponse({ status: 404, description: 'Key not found' })
  @ApiResponse({ status: 409, description: 'Key is not ACTIVE' })
  revoke(@Param('id', ParseIdPipe) id: number) {
    return this.keyService.revoke(id);
  }
}
