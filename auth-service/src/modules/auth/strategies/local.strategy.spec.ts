import { Test, TestingModule } from '@nestjs/testing';
import { LocalStrategy } from './local.strategy';
import { UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({ compare: jest.fn() }));

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;

  const mockUserProvider = { findByEmail: jest.fn() };
  const mockEventEmitter = { emit: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        { provide: 'IAuthUserProvider', useValue: mockUserProvider },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    jest.clearAllMocks();
  });

  describe('Método validate', () => {
    it('1. Deve validar credenciais e retornar usuário sem senha', async () => {
      const mockUser = {
        id: '123',
        name: 'Dyyogo',
        email: 'teste@teste.com',
        password: 'senha_hasheada',
      };
      mockUserProvider.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await strategy.validate('teste@teste.com', '123456');

      expect(result.password).toBeUndefined();
      expect(result.email).toBe('teste@teste.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('123456', 'senha_hasheada');
    });

    it('2. Deve lançar UnauthorizedException e emitir "auth.login.failure" com reason USER_NOT_FOUND', async () => {
      mockUserProvider.findByEmail.mockResolvedValue(null);

      await expect(strategy.validate('ghost@teste.com', '123')).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate('ghost@teste.com', '123')).rejects.toThrow('E-mail ou senha incorretos');

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('auth.login.failure', {
        email: 'ghost@teste.com',
        reason: 'USER_NOT_FOUND',
      });
      // Não deve nem tentar o bcrypt quando o usuário não existe
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('3. Deve lançar UnauthorizedException e emitir reason INVALID_PASSWORD com userId', async () => {
      const mockUser = { id: '123', email: 'teste@teste.com', password: 'senha_hasheada' };
      mockUserProvider.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(strategy.validate('teste@teste.com', 'senha_errada')).rejects.toThrow(UnauthorizedException);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('auth.login.failure', {
        email: 'teste@teste.com',
        reason: 'INVALID_PASSWORD',
        userId: '123',
      });
    });

    it('4. Conta OAuth (sem senha) deve emitir USER_NOT_FOUND e lançar UnauthorizedException', async () => {
      const mockUser = { id: '123', email: 'google@teste.com', password: null, provider: 'google' };
      mockUserProvider.findByEmail.mockResolvedValue(mockUser);

      await expect(strategy.validate('google@teste.com', '123')).rejects.toThrow(UnauthorizedException);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('auth.login.failure', {
        email: 'google@teste.com',
        reason: 'USER_NOT_FOUND',
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });
});
