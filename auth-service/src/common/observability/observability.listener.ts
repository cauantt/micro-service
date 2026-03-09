import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { MetricsService } from '../metrics/metrics.service';
import { maskEmail } from '../logger/mask.util';
import {
  AuthLoginSuccessEvent,
  AuthLoginFailureEvent,
  AuthLoginErrorEvent,
  AuthGoogleEvent,
} from '../events/auth.events';
import {
  UserCreatedEvent,
  UserConflictEvent,
  UserNotFoundEvent,
} from '../events/users.events';

/**
 * Listener centralizado de observabilidade.
 *
 * Princípio: os serviços de negócio (AuthService, UsersService, Strategies)
 * apenas EMITEM eventos — eles não conhecem logs, métricas ou traces.
 * Este listener é o único responsável pelos 3 pilares de observabilidade.
 *
 * Benefícios:
 *   ✔ Single Responsibility: negócio separado de instrumentação
 *   ✔ Open/Closed: adicionar nova observabilidade = adicionar handler aqui
 *   ✔ Testabilidade: basta verificar que o evento foi emitido nos testes de negócio
 */
@Injectable()
export class ObservabilityListener {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: WinstonLogger,
    private readonly metrics: MetricsService,
  ) {}

  // ══════════════════════════════════════════════════════════════════════════
  //  AUTH EVENTS
  // ══════════════════════════════════════════════════════════════════════════

  @OnEvent('auth.login.success')
  handleLoginSuccess({ user, startedAt }: AuthLoginSuccessEvent): void {
    const duration = Date.now() - startedAt;
    const provider = user.provider ?? 'local';

    // Pillar 1 — Log de Auditoria
    this.logger.info('AUTH_LOGIN_SUCCESS', {
      event: 'AUTH_LOGIN_SUCCESS',
      userId: user.id,
      email: maskEmail(user.email),   // Mascarado: conformidade LGPD/GDPR
      provider,
      context: ObservabilityListener.name,
    });

    // Pillar 2 — Métricas
    this.metrics.loginAttempts.add(1, { provider, status: 'success' });
    this.metrics.loginDurationMs.record(duration, { provider, status: 'success' });

    // Pillar 3 — Enriquecimento de Span (o OTel auto-instrumena o HTTP, nós enriquecemos)
    const span = trace.getActiveSpan();
    span?.setAttribute('enduser.id', user.id);
    span?.setAttribute('auth.event', 'login_success');
    span?.setAttribute('auth.provider', provider);
  }

  /**
   * Falhas de credenciais — base para alertas de força bruta no Grafana.
   *
   * O `reason` no log é DIFERENCIADO (USER_NOT_FOUND vs INVALID_PASSWORD),
   * mas a mensagem de erro retornada ao cliente é sempre genérica.
   * Isso permite que o time de segurança monitore ataques sem vazar informação.
   */
  @OnEvent('auth.login.failure')
  handleLoginFailure({ email, reason, userId }: AuthLoginFailureEvent): void {
    // Pillar 1 — Security Audit Log
    this.logger.warn('AUTH_LOGIN_FAILURE', {
      event: 'AUTH_LOGIN_FAILURE',
      reason,                         // Diferencia USER_NOT_FOUND de INVALID_PASSWORD
      ...(userId && { userId }),       // Inclui userId apenas quando disponível
      email: maskEmail(email),
      context: ObservabilityListener.name,
    });

    // Pillar 2 — Counter separado para alertas de força bruta (reason é a dimensão)
    this.metrics.loginFailures.add(1, { reason });
    this.metrics.loginAttempts.add(1, { provider: 'local', status: 'failure' });

    // Pillar 3 — Marca o span como falha de autenticação
    const span = trace.getActiveSpan();
    span?.setStatus({ code: SpanStatusCode.ERROR, message: reason });
    span?.setAttribute('auth.failure_reason', reason);
    if (userId) span?.setAttribute('enduser.id', userId);
  }

  @OnEvent('auth.login.error')
  handleLoginError({ user, error, startedAt }: AuthLoginErrorEvent): void {
    const duration = Date.now() - startedAt;
    const provider = user.provider ?? 'local';

    // Pillar 1 — Log de Erro de Sistema (não é falha de credenciais)
    this.logger.error('AUTH_LOGIN_ERROR', {
      event: 'AUTH_LOGIN_ERROR',
      userId: user.id,
      email: maskEmail(user.email),
      provider,
      errorMessage: error.message,   // Mensagem do erro (stack vai como campo separado pelo winston.errors format)
      context: ObservabilityListener.name,
    });

    // Pillar 2 — Registra duração mesmo em erro (detecta timeouts em JWT/bcrypt)
    this.metrics.loginAttempts.add(1, { provider, status: 'error' });
    this.metrics.loginDurationMs.record(duration, { provider, status: 'error' });

    // Pillar 3 — Span de erro de sistema
    const span = trace.getActiveSpan();
    span?.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    span?.setAttribute('auth.event', 'login_error');
  }

  /** Wildcard: captura 'auth.google.user_found' E 'auth.google.user_created'. */
  @OnEvent('auth.google.*')
  handleGoogleAuth({ user, isNewUser }: AuthGoogleEvent): void {
    const eventName = isNewUser ? 'GOOGLE_AUTH_NEW_USER' : 'GOOGLE_AUTH_EXISTING_USER';

    // Pillar 1 — Log de Auditoria OAuth
    this.logger.info(eventName, {
      event: eventName,
      userId: user.id,
      email: maskEmail(user.email ?? ''),
      provider: 'google',
      isNewUser,
      context: ObservabilityListener.name,
    });

    // Pillar 3 — Span enriquecido com contexto OAuth
    const span = trace.getActiveSpan();
    span?.setAttribute('enduser.id', user.id);
    span?.setAttribute('auth.google.new_user', isNewUser);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  USERS EVENTS
  // ══════════════════════════════════════════════════════════════════════════

  @OnEvent('users.created')
  handleUserCreated({ userId, email, provider }: UserCreatedEvent): void {
    // Pillar 1 — Log de Auditoria de Criação de Conta
    this.logger.info('USER_CREATED', {
      event: 'USER_CREATED',
      userId,
      email: maskEmail(email),
      provider,
      context: ObservabilityListener.name,
    });

    // Pillar 2 — Métrica segmentada por provider (local vs google vs ...)
    this.metrics.userRegistrations.add(1, { provider });

    // Pillar 3 — Span enriquecido
    const span = trace.getActiveSpan();
    span?.setAttribute('enduser.id', userId);
    span?.setAttribute('users.provider', provider);
  }

  @OnEvent('users.conflict')
  handleUserConflict({ email }: UserConflictEvent): void {
    // Pillar 1 — Log de Conflito (warn, não error — é comportamento esperado)
    this.logger.warn('USER_REGISTRATION_CONFLICT', {
      event: 'USER_REGISTRATION_CONFLICT',
      email: maskEmail(email),
      context: ObservabilityListener.name,
    });

    // Pillar 3 — Marca o span para rastreabilidade
    trace.getActiveSpan()?.setAttribute('users.registration_conflict', true);
  }

  @OnEvent('users.not_found')
  handleUserNotFound({ userId }: UserNotFoundEvent): void {
    // Pillar 1 — Log para auditoria de acesso a recursos inexistentes
    this.logger.warn('USER_NOT_FOUND', {
      event: 'USER_NOT_FOUND',
      userId,
      context: ObservabilityListener.name,
    });
  }
}
