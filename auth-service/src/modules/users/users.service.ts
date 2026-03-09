import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { TypeOrmUsersRepository } from "./repositories/typeorm/typeorm-users.repository";
import type { IUsersRepository } from './repositories/users.repository.interface';
import { CreateUserDto } from "./dto/create-user.dto";
import * as bcrypt from 'bcrypt';
import { OAuthUserDto } from "../auth/dto/auth-user.dto";
import { User } from "./entities/user.entity";

@Injectable()
export class UsersService {

    constructor
    ( 
    @Inject('IUsersRepository') // Injeta a interface via Token
    private readonly usersRepository: IUsersRepository
    ){}


    async create(dto : CreateUserDto) {

       const user = await this.usersRepository.findByEmail(dto.email);
       
       if(user){

        throw new ConflictException("Este email já existe");
        
       }

       const hashedPassword = await bcrypt.hash(dto.password,10);

       return await this.usersRepository.create({
        ...dto, password : hashedPassword

       })

    }

    // Diga explicitamente o que ele retorna para ajudar o TypeScript
    async findByEmail(email: string): Promise<User | null> { 
        // Apenas repassa o que o repositório devolveu
        return await this.usersRepository.findByEmail(email); 
    }

    async findById(id: string){

        const user = await this.usersRepository.findById(id);
        if(!user){

            throw new NotFoundException("Usuário não encontrado!")
        }

        return user;
  }
   async findByEmailOrFail(email: string): Promise<User> {
        const user = await this.findByEmail(email);
        
        if (!user) {
            throw new NotFoundException("Usuário não encontrado!");
        }

        return user;
    }
    async createOAuthUser(data: OAuthUserDto): Promise<Omit<User, 'password'>> {
    
    // Usamos o SEU método create do repositório, que já lida com o TypeORM lá dentro
    const newUser = await this.usersRepository.create({
      email: data.email,
      name: data.name,
      provider: data.provider,
      providerId: data.providerId,
    });

    return newUser;
  }
}