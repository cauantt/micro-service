import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async login(user: Omit<User, 'password'>) {
    const startedAt = Date.now();

    try {
      const payload = { sub: user.id, name: user.name, email: user.email };
      const access_token = await this.jwt.signAsync(payload);

      // O service apenas anuncia o fato — QUEM observa não é problema dele.
      this.eventEmitter.emit('auth.login.success', { user, startedAt });

      return { access_token, user };
    } catch (error) {
      this.eventEmitter.emit('auth.login.error', { user, error, startedAt });
      throw error;
    }
  }
}
