import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import * as bcrypt from 'bcrypt';
import type { IAuthUserProvider } from '../interfaces/auth-user-provider.interface';
import { User } from 'src/modules/users/entities/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy){

    constructor(

        @Inject('IAuthUserProvider')
        private readonly UserProvider : IAuthUserProvider
    ){

        super ({usernameField : 'email'})
    }

    async validate(email:string, password : string) : Promise<Omit<User, 'password'>>{ 

        const user = await this.UserProvider.findByEmail(email);

        if(!user || !bcrypt.compare(password, user.password)){

            throw new UnauthorizedException("E-mail ou senha incorretos");
        }

        const {password : _,...userWhithoutPassword} = user;

        return userWhithoutPassword
    }


}