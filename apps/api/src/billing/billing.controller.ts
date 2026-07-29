import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { getCtx } from '../common/ctx';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get()
  overview(@Req() req: Request) {
    return this.billing.overview(getCtx(req));
  }
}
