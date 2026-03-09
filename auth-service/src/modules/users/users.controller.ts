import { Controller, Post, Body, Get, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED) // Retorna 201 explicitamente
  async create(@Body() createUserDto: CreateUserDto) {
    
    const user = await this.usersService.create(createUserDto);
    
    
    const { password, ...result } = user;
    return result;
  }

  @Get('email/:email')
  async findByEmail(@Param('email') email: string) {
    const user = await this.usersService.findByEmailOrFail(email);
    const { password, ...result } = user;
    return result;
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    const { password, ...result } = user;
    return result;
  }
}