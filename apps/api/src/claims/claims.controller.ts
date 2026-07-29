import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { getCtx } from '../common/ctx';
import { ClaimsService, FnolDto } from './claims.service';

@Controller('claims')
export class ClaimsController {
  constructor(private readonly claims: ClaimsService) {}

  @Get()
  list(@Req() req: Request) {
    return this.claims.list(getCtx(req));
  }

  @Post()
  report(@Req() req: Request, @Body() dto: FnolDto) {
    return this.claims.report(getCtx(req), dto);
  }
}
