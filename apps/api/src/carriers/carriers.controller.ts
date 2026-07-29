import { Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { getCtx } from '../common/ctx';
import { CarriersService } from './carriers.service';

@Controller()
export class CarriersController {
  constructor(private readonly carriers: CarriersService) {}

  @Get('markets')
  markets(@Req() req: Request) {
    return this.carriers.markets(getCtx(req));
  }

  /** Indicative rating across every market that writes this line. */
  @Post('rating/policies/:id/quote')
  quote(@Req() req: Request, @Param('id') id: string) {
    return this.carriers.quoteForPolicy(getCtx(req), id);
  }
}
