import { User } from '../entities/user.entity';

export interface IUsersRepository {
  // Usamos Partial<User> para permitir qualquer campo da entidade
  create(data: Partial<User>): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}