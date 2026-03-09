import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import type { IAuthUserProvider } from '../interfaces/auth-user-provider.interface';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject('IAuthUserProvider')
    private readonly userProvider: IAuthUserProvider,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<Omit<User, 'password'>> {
    const user = await this.userProvider.findByEmail(email);

    if (!user || !user.password) {
      // reason: USER_NOT_FOUND — e-mail não existe ou é conta OAuth (sem senha)
      this.eventEmitter.emit('auth.login.failure', {
        email,
        reason: 'USER_NOT_FOUND',
      });
      // Mesma mensagem genérica ao cliente — não revela se o e-mail existe
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // reason: INVALID_PASSWORD — usuário existe mas senha está errada (força bruta)
      this.eventEmitter.emit('auth.login.failure', {
        email,
        reason: 'INVALID_PASSWORD',
        userId: user.id, // Disponível porque o usuário foi encontrado
      });
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
