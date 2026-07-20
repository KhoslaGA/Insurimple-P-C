import { Module } from '@nestjs/common';
import { DbModule } from './db/db.module';
import { HealthController } from './health/health.controller';
import { TxnsController } from './txns/txns.controller';
import { TxnsService } from './txns/txns.service';
import { AccountsController } from './accounts/accounts.controller';
import { AccountsService } from './accounts/accounts.service';

@Module({
  imports: [DbModule],
  controllers: [HealthController, TxnsController, AccountsController],
  providers: [TxnsService, AccountsService],
})
export class AppModule {}
