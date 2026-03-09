import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  // Mockamos o Service
  const mockUsersService = {
    create: jest.fn(),
    findByEmailOrFail: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  describe('Rota POST /users', () => {
    it('1. Deve repassar o DTO para o service e retornar o usuário limpo', async () => {
      const mockDto = { name: 'Dyyogo', email: 'teste@teste.com', password: '123' };
      
      // O Service já retorna o usuário sem senha
      const mockServiceResult = { id: '123', name: 'Dyyogo', email: 'teste@teste.com' };
      mockUsersService.create.mockResolvedValue(mockServiceResult);

      const result = await controller.create(mockDto);

      expect(result).toEqual(mockServiceResult);
      expect(mockUsersService.create).toHaveBeenCalledWith(mockDto);
    });
  });

  describe('Rota GET /users/email/:email', () => {
    it('1. Deve repassar o e-mail para o service e retornar o usuário (que já vem limpo)', async () => {
      // AGORA: O mock do service já devolve o usuário sem a senha!
      const mockUserFromService = { 
        id: '123', 
        name: 'Dyyogo',
        email: 'teste@teste.com'
      };
      
      mockUsersService.findByEmailOrFail.mockResolvedValue(mockUserFromService);

      const result = await controller.findByEmail('teste@teste.com');

      // Garantimos apenas que o Controller devolveu EXATAMENTE o que o Service mandou
      expect(result).toEqual(mockUserFromService);
      expect(mockUsersService.findByEmailOrFail).toHaveBeenCalledWith('teste@teste.com');
    });
  });

  describe('Rota GET /users/:id', () => {
    it('1. Deve repassar o ID para o service e retornar o usuário (que já vem limpo)', async () => {
      // O mock do service sem a senha
      const mockUserFromService = { 
        id: 'uuid-123', 
        name: 'Dyyogo', 
        email: 'teste@teste.com'
      };
      
      mockUsersService.findById.mockResolvedValue(mockUserFromService);

      const result = await controller.findById('uuid-123');

      expect(result).toEqual(mockUserFromService);
      expect(mockUsersService.findById).toHaveBeenCalledWith('uuid-123');
    });
  });
});