
import { User } from '../../users/entities/user.entity';
import { OAuthUserDto } from '../dto/auth-user.dto';

export interface IAuthUserProvider {
  findByEmail(email: string): Promise<User | null>;
  createOAuthUser(data: OAuthUserDto): Promise<Omit<User, 'password'>>; // Faz UMA coisa
}
