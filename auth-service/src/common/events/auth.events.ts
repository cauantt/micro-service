import { User } from '../../modules/users/entities/user.entity';

/** Emitido pelo AuthService após JWT assinado com sucesso. */
export interface AuthLoginSuccessEvent {
  user: Omit<User, 'password'>;
  startedAt: number;
}

/**
 * Emitido pela LocalStrategy quando a validação de credenciais falha.
 *
 * `reason` diferencia os cenários para detecção de ameaças no SIEM:
 *   - USER_NOT_FOUND  → e-mail inexistente (enumeração de usuários / bots)
 *   - INVALID_PASSWORD → senha errada (força bruta / credential stuffing)
 *
 * SEGURANÇA: a mensagem de erro retornada ao cliente é SEMPRE genérica
 * ("E-mail ou senha incorretos"). O `reason` existe APENAS nos logs internos.
 */
export interface AuthLoginFailureEvent {
  email: string;
  reason: 'USER_NOT_FOUND' | 'INVALID_PASSWORD';
  userId?: string; // Presente apenas quando reason === 'INVALID_PASSWORD'
}

/** Emitido pelo AuthService quando a geração do JWT falha (ex: chave inválida). */
export interface AuthLoginErrorEvent {
  user: Omit<User, 'password'>;
  error: Error;
  startedAt: number;
}

/** Emitido pela GoogleStrategy após autenticação OAuth concluída. */
export interface AuthGoogleEvent {
  user: Omit<User, 'password'>;
  isNewUser: boolean;
}
