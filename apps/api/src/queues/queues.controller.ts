import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { getCtx } from '../common/ctx';
import { QueuesService } from './queues.service';

@Controller('queues')
export class QueuesController {
  constructor(private readonly queues: QueuesService) {}

  @Get()
  book(@Req() req: Request) {
    return this.queues.book(getCtx(req));
  }
}
