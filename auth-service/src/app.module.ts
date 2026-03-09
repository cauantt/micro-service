import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { MetricsModule } from './common/metrics/metrics.module';
import { ObservabilityModule } from './common/observability/observability.module';
import { winstonConfig } from './common/logger/winston.config';

@Module({
  imports: [
    // Pillar 1 — Logs: Winston global, injetável via WINSTON_MODULE_PROVIDER
    WinstonModule.forRoot(winstonConfig),

    // Pillar 2 — Métricas: MetricsService disponível globalmente
    MetricsModule,

    // Event Bus: wildcard=true habilita @OnEvent('auth.google.*') no listener
    EventEmitterModule.forRoot({ wildcard: true }),

    // Listener centralizado de observabilidade (logs + métricas + traces)
    ObservabilityModule,

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER ?? 'admin',
      password: process.env.DB_PASS ?? 'password',
      database: process.env.DB_NAME ?? 'db_auth',
      synchronize: process.env.NODE_ENV !== 'production',
      autoLoadEntities: true,
    }),

    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
