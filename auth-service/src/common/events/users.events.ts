/** Emitido pelo UsersService após criação bem-sucedida (local ou OAuth). */
export interface UserCreatedEvent {
  userId: string;
  email: string;
  provider: string;
}

/** Emitido pelo UsersService quando o e-mail já está cadastrado. */
export interface UserConflictEvent {
  email: string;
}

/** Emitido pelo UsersService quando um recurso não é encontrado pelo ID. */
export interface UserNotFoundEvent {
  userId: string;
}
