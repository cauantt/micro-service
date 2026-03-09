import { Controller, Post, Body, Get, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    // O Service já devolve o usuário sem a senha
    return await this.usersService.create(createUserDto);
  }

  @Get('email/:email')
  async findByEmail(@Param('email') email: string) {
    return await this.usersService.findByEmailOrFail(email);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return await this.usersService.findById(id);
  }
}