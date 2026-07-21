import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DbModule } from './db/db.module';
import { HealthController } from './health/health.controller';
import { TxnsController } from './txns/txns.controller';
import { TxnsService } from './txns/txns.service';
import { AccountsController } from './accounts/accounts.controller';
import { AccountsService } from './accounts/accounts.service';
import { AuthGuard } from './common/auth.guard';

@Module({
  imports: [DbModule],
  controllers: [HealthController, TxnsController, AccountsController],
  providers: [
    TxnsService,
    AccountsService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
