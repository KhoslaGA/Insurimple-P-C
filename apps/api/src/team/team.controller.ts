import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { getCtx } from '../common/ctx';
import { GrantRoleDto, RecordLicenceDto, TeamService } from './team.service';

@Controller('team')
export class TeamController {
  constructor(private readonly team: TeamService) {}

  @Get()
  list(@Req() req: Request) {
    return this.team.list(getCtx(req));
  }

  @Post('licences')
  recordLicence(@Req() req: Request, @Body() dto: RecordLicenceDto) {
    return this.team.recordLicence(getCtx(req), dto);
  }

  @Post('grants')
  grantRole(@Req() req: Request, @Body() dto: GrantRoleDto) {
    return this.team.grantRole(getCtx(req), dto);
  }

  @Delete('grants/:id')
  revokeGrant(@Req() req: Request, @Param('id') id: string) {
    return this.team.revokeGrant(getCtx(req), id);
  }
}
