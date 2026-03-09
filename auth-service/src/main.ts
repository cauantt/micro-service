import './tracing'; 
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(), // JSON é melhor para o Grafana/Loki ler
          ),
        }),
      ],
    }),
  });

  // --- A MÁGICA DA VALIDAÇÃO ---
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,            // Remove campos do JSON que não estão no DTO
    forbidNonWhitelisted: true,  // Retorna erro se tentarem enviar campos extras
    transform: true,            // Converte os tipos automaticamente
  }));

  await app.listen(3001);
  console.log(`🚀 Auth Service rodando na porta 3001`);
}
bootstrap();