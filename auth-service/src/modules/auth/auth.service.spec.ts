import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('AuthService', () => {
  let service: AuthService;

  const mockJwtService = { signAsync: jest.fn() };
  const mockEventEmitter = { emit: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('Método login', () => {
    const mockUser = {
      id: '123-uuid',
      name: 'Dyyogo',
      email: 'teste@teste.com',
      provider: 'local',
      createdAt: new Date(),
    };

    it('1. Deve retornar access_token e garantir a estrutura do payload JWT', async () => {
      const expectedToken = 'ey-token-jwt-falso';
      mockJwtService.signAsync.mockResolvedValue(expectedToken);

      const result = await service.login(mockUser as any);

      expect(result).toEqual({ access_token: expectedToken, user: mockUser });
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
      });
    });

    it('2. Deve emitir "auth.login.success" com user e startedAt após login OK', async () => {
      mockJwtService.signAsync.mockResolvedValue('token');

      await service.login(mockUser as any);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'auth.login.success',
        expect.objectContaining({
          user: mockUser,
          startedAt: expect.any(Number),
        }),
      );
    });

    it('3. Deve emitir "auth.login.error" e re-lançar o erro quando o JWT falha', async () => {
      const jwtError = new Error('JWT Secret missing');
      mockJwtService.signAsync.mockRejectedValue(jwtError);

      await expect(service.login(mockUser as any)).rejects.toThrow(jwtError);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'auth.login.error',
        expect.objectContaining({
          user: mockUser,
          error: jwtError,
          startedAt: expect.any(Number),
        }),
      );
    });

    it('4. NÃO deve emitir "auth.login.success" quando o JWT falha', async () => {
      mockJwtService.signAsync.mockRejectedValue(new Error('fail'));

      await expect(service.login(mockUser as any)).rejects.toThrow();

      expect(mockEventEmitter.emit).not.toHaveBeenCalledWith(
        'auth.login.success',
        expect.anything(),
      );
    });
  });
});
