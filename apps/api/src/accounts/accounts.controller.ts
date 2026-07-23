import { Controller, Get, Param, Req } from '@nestjs/common';
import type { Request } from 'express';
import { getCtx } from '../common/ctx';
import { AccountsService } from './accounts.service';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  list(@Req() req: Request) {
    return this.accounts.list(getCtx(req));
  }

  @Get(':id')
  detail(@Req() req: Request, @Param('id') id: string) {
    return this.accounts.detail(getCtx(req), id);
  }
}
