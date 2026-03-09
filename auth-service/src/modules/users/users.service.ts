import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateUserDto } from './dto/create-user.dto';
import { OAuthUserDto } from '../auth/dto/auth-user.dto';
import { User } from './entities/user.entity';
import type { IUsersRepository } from './repositories/users.repository.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @Inject('IUsersRepository')
    private readonly usersRepository: IUsersRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private sanitizeUser(user: User): Omit<User, 'password'> {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async create(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const userExists = await this.usersRepository.findByEmail(dto.email);

    if (userExists) {
      this.eventEmitter.emit('users.conflict', { email: dto.email });
      throw new ConflictException('Este email já existe');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const createdUser = await this.usersRepository.create({
      ...dto,
      password: hashedPassword,
    });
    const sanitized = this.sanitizeUser(createdUser);

    this.eventEmitter.emit('users.created', {
      userId: sanitized.id,
      email: sanitized.email,
      provider: 'local',
    });

    return sanitized;
  }

  // ATENÇÃO: A LocalStrategy usa ESTE método para ter acesso à senha
  async findByEmailForAuth(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findByEmail(email: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) return null;
    return this.sanitizeUser(user);
  }

  async findById(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      this.eventEmitter.emit('users.not_found', { userId: id });
      throw new NotFoundException('Usuário não encontrado!');
    }

    return this.sanitizeUser(user);
  }

  async findByEmailOrFail(email: string): Promise<Omit<User, 'password'>> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado!');
    }
    return user;
  }

  async createOAuthUser(data: OAuthUserDto): Promise<Omit<User, 'password'>> {
    const newUser = await this.usersRepository.create({
      email: data.email,
      name: data.name,
      provider: data.provider,
      providerId: data.providerId,
    });
    const sanitized = this.sanitizeUser(newUser);

    this.eventEmitter.emit('users.created', {
      userId: sanitized.id,
      email: sanitized.email ?? '',
      provider: data.provider,
    });

    return sanitized;
  }
}
