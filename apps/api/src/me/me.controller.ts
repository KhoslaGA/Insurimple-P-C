import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { getCtx } from '../common/ctx';
import { MeService } from './me.service';

@Controller('me')
export class MeController {
  constructor(private readonly me: MeService) {}

  @Get()
  profile(@Req() req: Request) {
    return this.me.profile(getCtx(req));
  }
}
