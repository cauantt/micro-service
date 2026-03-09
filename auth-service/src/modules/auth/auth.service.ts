import { Injectable } from "@nestjs/common";
import { User } from '../users/entities/user.entity';
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService {
    constructor(private readonly jwt: JwtService) {}
    
    async login(user: Omit<User, 'password'>) {
        const payload = { 
            sub: user.id, 
            name: user.name, 
            email: user.email 
        };

        return {
            access_token: await this.jwt.signAsync(payload),
            user
        };
    }
}