import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import type { IAuthUserProvider } from '../interfaces/auth-user-provider.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject('IAuthUserProvider')
    private readonly userProvider: IAuthUserProvider,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,   // Não logado — é um segredo de sessão
    refreshToken: string,  // Não logado — é um segredo de sessão
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const email = profile.emails[0].value;
    const name = profile.displayName;

    let user = await this.userProvider.findByEmail(email);
    let isNewUser = false;

    if (!user) {
      user = await this.userProvider.createOAuthUser({
        email,
        name,
        provider: 'google' as const,
        providerId: profile.id,
      });
      isNewUser = true;
    }

    // Wildcarded: o listener captura com @OnEvent('auth.google.*')
    const eventSuffix = isNewUser ? 'user_created' : 'user_found';
    this.eventEmitter.emit(`auth.google.${eventSuffix}`, { user, isNewUser });

    done(null, user);
  }
}
