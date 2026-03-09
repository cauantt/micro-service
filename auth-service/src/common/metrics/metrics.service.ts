import { Injectable } from '@nestjs/common';
import { Counter, Histogram, metrics } from '@opentelemetry/api';

/**
 * Pillar 2 — Métricas de negócio customizadas via OpenTelemetry.
 *
 * Nomenclatura segue o padrão Prometheus (snake_case, sufixo _total para counters).
 * Todos os instrumentos aceitam `attributes` para segmentar por dimensões:
 *   - provider: 'local' | 'google'
 *   - status:   'success' | 'error'
 *   - reason:   'USER_NOT_FOUND' | 'INVALID_PASSWORD' (só em failures)
 *
 * As métricas são exportadas via OTLP para o Grafana/Prometheus configurado em tracing.ts.
 */
@Injectable()
export class MetricsService {
  private readonly meter = metrics.getMeter('auth-service', '1.0.0');

  /** Todas as tentativas de login — base para taxa de sucesso (SLI). */
  readonly loginAttempts: Counter = this.meter.createCounter(
    'auth_login_attempts_total',
    { description: 'Total de tentativas de login' },
  );

  /** Apenas falhas de login — base para alertas de força bruta. */
  readonly loginFailures: Counter = this.meter.createCounter(
    'auth_login_failures_total',
    { description: 'Total de logins com falha, segmentado por razão' },
  );

  /** Novos usuários criados — base para growth e onboarding metrics. */
  readonly userRegistrations: Counter = this.meter.createCounter(
    'auth_user_registrations_total',
    { description: 'Total de usuários criados, segmentado por provider' },
  );

  /**
   * Duração do fluxo completo de login (validação bcrypt + assinatura JWT).
   * Histogram permite calcular p50/p95/p99 no Grafana.
   * Permite detectar degradação de performance no bcrypt ou no JWT.
   */
  readonly loginDurationMs: Histogram = this.meter.createHistogram(
    'auth_login_duration_ms',
    { description: 'Duração do login em milissegundos', unit: 'ms' },
  );
}
