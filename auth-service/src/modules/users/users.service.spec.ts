import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({ hash: jest.fn() }));

describe('UsersService', () => {
  let service: UsersService;

  const mockUsersRepository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };
  const mockEventEmitter = { emit: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: 'IUsersRepository', useValue: mockUsersRepository },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  create
  // ══════════════════════════════════════════════════════════════════════════
  describe('Método create', () => {
    it('1. Deve criar usuário, retornar sem senha e emitir "users.created"', async () => {
      const dto = { name: 'Dyyogo', email: 'teste@email.com', password: '123' };
      const hashedPassword = 'hashed_123';

      mockUsersRepository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUsersRepository.create.mockResolvedValue({
        id: 'uuid-123',
        name: 'Dyyogo',
        email: 'teste@email.com',
        password: hashedPassword,
        createdAt: new Date(),
      });

      const result = await service.create(dto);

      expect(result.password).toBeUndefined();
      expect(result.email).toBe(dto.email);
      expect(mockUsersRepository.create).toHaveBeenCalledWith({
        ...dto,
        password: hashedPassword,
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('users.created', {
        userId: 'uuid-123',
        email: 'teste@email.com',
        provider: 'local',
      });
    });

    it('2. Deve lançar ConflictException e emitir "users.conflict" se e-mail já existe', async () => {
      const dto = { name: 'Dyyogo', email: 'teste@email.com', password: '123' };
      mockUsersRepository.findByEmail.mockResolvedValue({ id: 'uuid-123' });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('users.conflict', {
        email: dto.email,
      });
      expect(mockUsersRepository.create).not.toHaveBeenCalled();
    });

    it('3. Deve repassar erros do banco de dados', async () => {
      const dto = { name: 'Dyyogo', email: 'teste@email.com', password: '123' };
      mockUsersRepository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
      mockUsersRepository.create.mockRejectedValue(new Error('Database goes boom!'));

      await expect(service.create(dto)).rejects.toThrow('Database goes boom!');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  findByEmail
  // ══════════════════════════════════════════════════════════════════════════
  describe('Método findByEmail', () => {
    it('1. Deve achar e retornar o user', async () => {
      const mockUser = { id: '123', email: 'teste@teste.com', name: 'Dyyogo' };
      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.findByEmail('teste@teste.com');

      expect(result).toEqual(mockUser);
    });

    it('2. Deve retornar null quando não encontrar', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail('naoexiste@teste.com');

      expect(result).toBeNull();
    });

    it('3. Deve repassar erros do banco', async () => {
      mockUsersRepository.findByEmail.mockRejectedValue(new Error('Falha de conexão'));

      await expect(service.findByEmail('teste@teste.com')).rejects.toThrow('Falha de conexão');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  findByEmailOrFail
  // ══════════════════════════════════════════════════════════════════════════
  describe('Método findByEmailOrFail', () => {
    it('1. Deve achar e retornar o user', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue({ id: '123', email: 'teste@teste.com' });

      const result = await service.findByEmailOrFail('teste@teste.com');

      expect(result).toBeDefined();
    });

    it('2. Deve lançar NotFoundException quando não encontrar', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(null);

      await expect(service.findByEmailOrFail('ghost@teste.com')).rejects.toThrow(NotFoundException);
      await expect(service.findByEmailOrFail('ghost@teste.com')).rejects.toThrow('Usuário não encontrado!');
    });

    it('3. Deve repassar erros do banco', async () => {
      mockUsersRepository.findByEmail.mockRejectedValue(new Error('Timeout no banco'));

      await expect(service.findByEmailOrFail('teste@teste.com')).rejects.toThrow('Timeout no banco');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  findById
  // ══════════════════════════════════════════════════════════════════════════
  describe('Método findById', () => {
    it('1. Deve achar e retornar o user', async () => {
      mockUsersRepository.findById.mockResolvedValue({ id: '123', email: 'teste@teste.com' });

      const result = await service.findById('123');

      expect(result).toBeDefined();
    });

    it('2. Deve lançar NotFoundException e emitir "users.not_found" quando não achar', async () => {
      mockUsersRepository.findById.mockResolvedValue(null);

      await expect(service.findById('999')).rejects.toThrow(NotFoundException);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('users.not_found', { userId: '999' });
    });

    it('3. Deve repassar erros do banco', async () => {
      mockUsersRepository.findById.mockRejectedValue(new Error('Falha catastrófica'));

      await expect(service.findById('123')).rejects.toThrow('Falha catastrófica');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  createOAuthUser
  // ══════════════════════════════════════════════════════════════════════════
  describe('Método createOAuthUser', () => {
    it('1. Deve criar usuário OAuth, retornar sem senha e emitir "users.created"', async () => {
      const oauthData = {
        email: 'google@gmail.com',
        name: 'Dyyogo Google',
        provider: 'google' as const,
        providerId: '123456789',
      };
      const savedUser = { id: 'uuid-999', ...oauthData, createdAt: new Date() };
      mockUsersRepository.create.mockResolvedValue(savedUser);

      const result = await service.createOAuthUser(oauthData);

      expect(result).toEqual(savedUser);
      expect(mockUsersRepository.create).toHaveBeenCalledWith(oauthData);
      expect(mockUsersRepository.create).not.toHaveBeenCalledWith(
        expect.objectContaining({ password: expect.anything() }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('users.created', {
        userId: 'uuid-999',
        email: 'google@gmail.com',
        provider: 'google',
      });
    });

    it('2. Deve repassar erros do banco', async () => {
      const oauthData = {
        email: 'google@gmail.com',
        name: 'Dyyogo',
        provider: 'google' as const,
        providerId: '123456789',
      };
      mockUsersRepository.create.mockRejectedValue(new Error('Erro ao salvar OAuth user'));

      await expect(service.createOAuthUser(oauthData)).rejects.toThrow('Erro ao salvar OAuth user');
    });
  });
});
