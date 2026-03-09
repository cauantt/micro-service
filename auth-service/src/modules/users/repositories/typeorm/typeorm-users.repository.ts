import { Injectable } from "@nestjs/common";
import { IUsersRepository } from "../users.repository.interface";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../../entities/user.entity";
import { Repository } from "typeorm";

@Injectable()
export class TypeOrmUsersRepository implements IUsersRepository {

  constructor(
    @InjectRepository(User)
    private readonly repository : Repository<User>
  ){}


  async create(data: Partial<User>): Promise<User> {
      const user = await this.repository.create(data);
      return await this.repository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.repository.findOne({ 
      where: { email },
      
      select: ['id', 'name', 'email', 'password', 'createdAt'] 
    });
  }

  async findById(id: string): Promise<User | null> {
    
      return await this.repository.findOne({where : {id}});
  }


}