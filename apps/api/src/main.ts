import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { devHeaderMode } from './common/auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
  app.enableCors();
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  const mode = devHeaderMode()
    ? 'DEV-HEADERS (x-tenant-id/x-actor-id) — NODE_ENV=development and CLERK_SECRET_KEY unset'
    : 'CLERK-JWT (Authorization: Bearer, org claim -> tenant, sub -> staff)';
  // eslint-disable-next-line no-console
  console.log(`insurimple api listening on :${port}`);
  // eslint-disable-next-line no-console
  console.log(`AUTH MODE: ${mode}`);
}
bootstrap();
