import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmUsersRepository } from '../typeorm-users.repository'; 
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../../entities/user.entity'; 

describe('TypeOrmUsersRepository', () => {
  let repository: TypeOrmUsersRepository;

  // Mockamos apenas os métodos do TypeORM que realmente usamos
  const mockTypeOrmRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmUsersRepository,
        {
          // É assim que enganamos o @InjectRepository(User)
          provide: getRepositoryToken(User),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmUsersRepository>(TypeOrmUsersRepository);
    jest.clearAllMocks();
  });

  // ====================================================================
  // TESTES DO MÉTODO: create
  // ====================================================================
  describe('Método create', () => {
    it('1. Deve instanciar a entidade, salvar no banco e retornar o usuário', async () => {
      const mockData = { name: 'Dyyogo', email: 'teste@teste.com' };
      const mockUserEntity = { id: '123', ...mockData };
      const mockSavedUser = { ...mockUserEntity, createdAt: new Date() };

      // O .create() do TypeORM geralmente é síncrono e apenas monta o objeto
      mockTypeOrmRepository.create.mockReturnValue(mockUserEntity);
      // O .save() é quem realmente vai no banco (assíncrono)
      mockTypeOrmRepository.save.mockResolvedValue(mockSavedUser);

      const result = await repository.create(mockData);

      expect(result).toEqual(mockSavedUser);
      expect(mockTypeOrmRepository.create).toHaveBeenCalledWith(mockData);
      expect(mockTypeOrmRepository.save).toHaveBeenCalledWith(mockUserEntity);
    });

    it('2. Deve repassar erros disparados pelo método save do banco', async () => {
      const mockData = { name: 'Dyyogo', email: 'teste@teste.com' };
      const dbError = new Error('Violação de constraint');
      
      mockTypeOrmRepository.create.mockReturnValue(mockData);
      mockTypeOrmRepository.save.mockRejectedValue(dbError);

      await expect(repository.create(mockData)).rejects.toThrow(dbError);
    });
  });

  // ====================================================================
  // TESTES DO MÉTODO: findByEmail
  // ====================================================================
  describe('Método findByEmail', () => {
    it('1. Deve buscar o e-mail passando a query EXATA e trazer a senha (Caminho Feliz)', async () => {
      const mockUser = { id: '123', email: 'teste@teste.com', password: 'hash' };
      mockTypeOrmRepository.findOne.mockResolvedValue(mockUser);

      const result = await repository.findByEmail('teste@teste.com');

      expect(result).toEqual(mockUser);
      // A BORDA: Se alguém alterar o select no arquivo original, este teste vai falhar e proteger o sistema
      expect(mockTypeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'teste@teste.com' },
        select: ['id', 'name', 'email', 'password', 'createdAt'],
      });
    });

    it('2. Deve retornar null pacificamente se o e-mail não existir', async () => {
      mockTypeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByEmail('ghost@teste.com');

      expect(result).toBeNull();
    });

    it('3. Deve estourar o erro se o banco cair na busca por e-mail', async () => {
      const dbError = new Error('Connection lost');
      mockTypeOrmRepository.findOne.mockRejectedValue(dbError);

      await expect(repository.findByEmail('teste@teste.com')).rejects.toThrow(dbError);
    });
  });

  // ====================================================================
  // TESTES DO MÉTODO: findById
  // ====================================================================
  describe('Método findById', () => {
    it('1. Deve buscar o ID passando o where correto e retornar o usuário', async () => {
      const mockUser = { id: '123', name: 'Dyyogo' };
      mockTypeOrmRepository.findOne.mockResolvedValue(mockUser);

      const result = await repository.findById('123');

      expect(result).toEqual(mockUser);
      expect(mockTypeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123' },
      });
    });

    it('2. Deve retornar null se o ID não existir no banco', async () => {
      mockTypeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('999');

      expect(result).toBeNull();
    });

    it('3. Deve estourar o erro se o banco cair na busca por ID', async () => {
      const dbError = new Error('Timeout');
      mockTypeOrmRepository.findOne.mockRejectedValue(dbError);

      await expect(repository.findById('123')).rejects.toThrow(dbError);
    });
  });
});