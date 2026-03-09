import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

// 1. IMPORTAÇÕES NOVAS PARA MÉTRICAS
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

process.env.OTEL_SERVICE_NAME = 'auth-service';

const traceExporter = new OTLPTraceExporter({
  url: 'http://localhost:4318/v1/traces',
});

const logExporter = new OTLPLogExporter({
  url: 'http://localhost:4318/v1/logs',
});

// 2. CONFIGURAÇÃO DO EXPORTADOR DE MÉTRICAS (Vai pro LGTM)
const metricExporter = new OTLPMetricExporter({
  url: 'http://localhost:4318/v1/metrics',
});

// 3. LEITOR DE MÉTRICAS (Configurado para enviar a cada 5 segundos no ambiente local)
const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 5000, 
});

export const otelSDK = new NodeSDK({
  traceExporter,
  logRecordProcessors: [new SimpleLogRecordProcessor(logExporter)],
  metricReader, // <-- Adicionamos o leitor de métricas aqui no SDK
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-winston': {
        disableLogSending: false,
      },
    }),
  ],
});

otelSDK.start();