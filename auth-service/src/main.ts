import './tracing'; // DEVE ser o 1º import — inicializa o SDK OTel antes de tudo
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { ValidationPipe } from '@nestjs/common';
import { winstonConfig } from './common/logger/winston.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Bootstrap logger: captura logs de inicialização do NestJS (antes de DI estar pronto).
    // Usa a mesma config de produção para que NENHUM log de boot escape sem redact/OTel.
    logger: WinstonModule.createLogger(winstonConfig),
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Remove campos não declarados no DTO
      forbidNonWhitelisted: true, // Retorna erro se campos extras forem enviados
      transform: true,           // Converte tipos automaticamente
    }),
  );

  await app.listen(3001);
}
bootstrap();
