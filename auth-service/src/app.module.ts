import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// 1. Importe os MÓDULOS que criamos, não os controllers!
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'admin',
      password: 'password',
      database: 'db_auth',
      synchronize: true,
      autoLoadEntities: true,
    }),
    
    // 2. Registre os módulos aqui. Isso conecta toda a sua arquitetura!
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController], // 3. O UsersController sai daqui!
  providers: [AppService],
})
export class AppModule {}