import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service'; // Importamos a classe concreta
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy'; 
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.stategy';

@Module({
  imports: [
    UsersModule, // Necessário porque vamos usar o UsersService
    PassportModule,
    JwtModule.register({
      global: true,
      secret: 'SUA_CHAVE_SECRETA', // Substitua por variáveis de ambiente depois
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    GoogleStrategy, // Registre a estratégia JWT aqui!
    { provide: 'IAuthUserProvider', useExisting: UsersService },
    {
      provide: 'IAuthUserProvider', // O Token definido no @Inject
      useExisting: UsersService,    // Usa a instância do UsersService que já existe
    },
  ],
  controllers: [AuthController],
})
export class AuthModule {}