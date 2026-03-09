import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      // Ensina o Passport a procurar o Token no formato "Bearer <TOKEN>" no Header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Rejeita tokens expirados automaticamente
      secretOrKey: 'SUA_CHAVE_SECRETA', // DEVE ser a mesma chave usada no AuthModule
    });
  }

  // Se o token for válido e não estiver expirado, o Passport chama essa função
  async validate(payload: any) {
    // O que retornarmos aqui será injetado no req.user nas rotas protegidas
    return { id: payload.sub, email: payload.email, name: payload.name };
  }
}