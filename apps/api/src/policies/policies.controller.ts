import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { getCtx } from '../common/ctx';
import { PoliciesService } from './policies.service';

@Controller('policies')
export class PoliciesController {
  constructor(private readonly policies: PoliciesService) {}

  @Get()
  list(@Req() req: Request) {
    return this.policies.list(getCtx(req));
  }
}
