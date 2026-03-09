import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  // Mockamos o AuthService, pois a lógica dele já foi testada em outro arquivo!
  const mockAuthService = {
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  describe('Rota POST /login', () => {
    it('1. Deve receber o req.user do Guard e repassar para o AuthService.login', async () => {
      // Fingimos o objeto de requisição (req) que o NestJS/Passport monta
      const mockReq = {
        user: { id: '123', email: 'teste@teste.com', name: 'Dyyogo' },
      };
      const mockTokenResponse = { access_token: 'jwt-token-falso', user: mockReq.user };

      // O nosso mock do service vai devolver o token
      mockAuthService.login.mockResolvedValue(mockTokenResponse);

      const result = await controller.login(mockReq);

      // Verificamos se o Controller retornou o que o Service gerou
      expect(result).toEqual(mockTokenResponse);
      
      // A BORDA: Garantimos que o Controller NÃO tentou alterar o usuário antes de mandar pro Service
      expect(mockAuthService.login).toHaveBeenCalledWith(mockReq.user);
    });
  });

  describe('Rota GET /google', () => {
    it('1. Deve apenas existir para o Guard interceptar', async () => {
      // Essa rota é vazia de propósito, pois o GoogleAuthGuard toma o controle antes.
      // Nós apenas garantimos que chamar o método não quebra o sistema.
      const result = await controller.googleAuth();
      expect(result).toBeUndefined();
    });
  });

  describe('Rota GET /google/callback', () => {
    it('1. Deve receber o perfil do Google formatado e repassar para o AuthService gerar o JWT', async () => {
      const mockReq = {
        user: { id: 'uuid-google', email: 'dyyogo@gmail.com', name: 'Dyyogo Andrade' },
      };
      const mockTokenResponse = { access_token: 'jwt-google-falso', user: mockReq.user };

      mockAuthService.login.mockResolvedValue(mockTokenResponse);

      const result = await controller.googleAuthRedirect(mockReq);

      // Exatamente a mesma validação da rota de login normal!
      expect(result).toEqual(mockTokenResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(mockReq.user);
    });
  });
});