import * as winston from 'winston';
import { OpenTelemetryTransportV3 } from '@opentelemetry/winston-transport';
import { redactFormat } from './redact.format';

/**
 * Configuração Winston compartilhada.
 * Usada tanto no bootstrap do NestJS (main.ts) quanto no WinstonModule.forRoot()
 * para garantir que TODOS os logs — de inicialização e de negócio — sejam idênticos.
 *
 * Cadeia de formatos (ordem importa):
 *   1. redactFormat    → remove dados sensíveis ANTES de qualquer serialização
 *   2. timestamp       → adiciona ISO 8601 para correlação temporal
 *   3. errors          → inclui stack trace completo em caso de Error
 *   4. json            → serialização final (ideal para Loki/Elasticsearch)
 *
 * Transportes:
 *   - Console          → capturado por qualquer coletor de logs (Loki, Fluentd, Datadog)
 *   - OpenTelemetry    → encaminha logs para o LogProvider do SDK (→ LGTM/Tempo)
 *                        e injeta trace_id + span_id automaticamente em cada entry
 *                        (Pillar 3: correlação Log ↔ Trace no Grafana)
 */
export const winstonConfig: winston.LoggerOptions = {
  level: process.env.LOG_LEVEL ?? 'info',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        redactFormat,
        winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
    }),
    // Injeta trace_id/span_id e encaminha para o OTLP Log Exporter (tracing.ts)
    new OpenTelemetryTransportV3(),
  ],
};
