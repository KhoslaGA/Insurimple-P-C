import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DbModule } from './db/db.module';
import { HealthController } from './health/health.controller';
import { TxnsController } from './txns/txns.controller';
import { TxnsService } from './txns/txns.service';
import { AccountsController } from './accounts/accounts.controller';
import { AccountsService } from './accounts/accounts.service';
import { MetricsController } from './metrics/metrics.controller';
import { MetricsService } from './metrics/metrics.service';
import { QueuesController } from './queues/queues.controller';
import { QueuesService } from './queues/queues.service';
import { AuthGuard } from './common/auth.guard';

@Module({
  imports: [DbModule],
  controllers: [HealthController, TxnsController, AccountsController, MetricsController, QueuesController],
  providers: [
    TxnsService,
    AccountsService,
    MetricsService,
    QueuesService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
