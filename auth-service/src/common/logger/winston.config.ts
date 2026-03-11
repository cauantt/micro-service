import * as winston from 'winston';
import { OpenTelemetryTransportV3 } from '@opentelemetry/winston-transport';
import { redactFormat, dropNestStartupNoise } from './redact.format';

/**
 * Configuração Winston compartilhada.
 */
export const winstonConfig: winston.LoggerOptions = {
  level: process.env.LOG_LEVEL ?? 'info',
  
  // O formato agora fica na raiz, limpando tudo ANTES de ir para os transportes
  format: winston.format.combine(
    dropNestStartupNoise, // 1º: Joga fora fofocas de inicialização (protege o OTel)
    redactFormat,         // 2º: Remove dados sensíveis ANTES da serialização
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  
  transports: [
    new winston.transports.Console(),
    // Injeta trace_id/span_id e encaminha para o OTLP Log Exporter
    new OpenTelemetryTransportV3(),
  ],
};