import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import type { IAuthUserProvider } from '../interfaces/auth-user-provider.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject('IAuthUserProvider')
    private readonly userProvider: IAuthUserProvider,
  ) {
    // Configuração base de comunicação com a API do Google
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      scope: ['email', 'profile'], // Pedimos acesso ao e-mail e aos dados públicos
    });
  }

  // O Passport executa essa função automaticamente após o usuário autorizar lá no Google
  async validate(
    accessToken: string, 
    refreshToken: string, 
    profile: any, 
    done: VerifyCallback
  ): Promise<any> {
    
    // 1. Extraímos os dados que importam do JSON bagunçado do Google
    const email = profile.emails[0].value;
    const name = profile.displayName;

    // 2. QUERY (Consulta): Procuramos se o usuário já existe na nossa base
    let user = await this.userProvider.findByEmail(email);

    // 3. COMMAND (Ação): Orquestração caso seja o primeiro acesso da pessoa
    if (!user) {
      // Montamos o nosso DTO genérico (Adapter Pattern)
      const oauthData = { 
        email, 
        name, 
        provider: 'google' as const, 
        providerId: profile.id 
      };
      
      // Mandamos o banco salvar
      user = await this.userProvider.createOAuthUser(oauthData);
    }
    
    // 4. Conclusão: Entregamos o usuário para o Passport continuar o fluxo
    done(null, user); 
  }
}