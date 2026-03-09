import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeAll(() => {
    // Enganamos a classe para ela não estourar erro ao procurar a chave secreta no construtor
    process.env.JWT_SECRET = 'chave-falsa-para-testes';
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtStrategy],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('Método validate', () => {
    it('1. Deve extrair os dados do payload do JWT e formatar para o req.user', async () => {
      // Simulamos o payload puro que o Passport extraiu de dentro do Token
      const mockPayload = {
        sub: 'uuid-123456',
        email: 'teste@teste.com',
        name: 'Dyyogo',
        iat: 1700000000, // Data de criação que o JWT embute
        exp: 1700003600, // Data de expiração
      };

      // Chamamos o método
      const result = await strategy.validate(mockPayload);

      // A BORDA: Garantimos que ele transformou o 'sub' em 'id' e ignorou o resto (iat, exp)
      expect(result).toEqual({
        id: 'uuid-123456',
        email: 'teste@teste.com',
        name: 'Dyyogo',
      });
    });
  });
});