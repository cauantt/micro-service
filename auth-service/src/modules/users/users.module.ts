import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmUsersRepository } from './repositories/typeorm/typeorm-users.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: 'IUsersRepository', // O Token usado no @Inject do Service
      useClass: TypeOrmUsersRepository, // A classe real que será instanciada
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}