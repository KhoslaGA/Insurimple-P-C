import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { getCtx } from '../common/ctx';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  book(@Req() req: Request) {
    return this.metrics.book(getCtx(req));
  }
}
