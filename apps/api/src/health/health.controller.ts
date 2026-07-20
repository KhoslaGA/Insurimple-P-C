import { Controller, Get } from '@nestjs/common';
import { DbService } from '../db/db.module';

@Controller('health')
export class HealthController {
  constructor(private readonly db: DbService) {}

  @Get()
  async health() {
    const dbUp = await this.db.ping().catch(() => false);
    return { ok: dbUp, service: 'insurimple-api', db: dbUp ? 'up' : 'down' };
  }
}
