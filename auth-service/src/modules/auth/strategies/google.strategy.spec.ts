import { Test, TestingModule } from '@nestjs/testing';
import { GoogleStrategy } from './google.strategy';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;

  const mockUserProvider = {
    findByEmail: jest.fn(),
    createOAuthUser: jest.fn(),
  };
  const mockEventEmitter = { emit: jest.fn() };
  const mockDone = jest.fn();

  beforeAll(() => {
    process.env.GOOGLE_CLIENT_ID = 'fake-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'fake-client-secret';
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost/callback';
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        { provide: 'IAuthUserProvider', useValue: mockUserProvider },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
    jest.clearAllMocks();
  });

  const mockProfile: any = {
    id: 'google-123456',
    displayName: 'Dyyogo Andrade',
    emails: [{ value: 'dyyogo@gmail.com' }],
  };

  describe('Método validate', () => {
    it('1. Usuário existente: entrega ao Passport e emite "auth.google.user_found"', async () => {
      const existingUser = { id: 'uuid-123', name: 'Dyyogo Andrade', email: 'dyyogo@gmail.com' };
      mockUserProvider.findByEmail.mockResolvedValue(existingUser);

      await strategy.validate('access-token', 'refresh-token', mockProfile, mockDone);

      expect(mockUserProvider.createOAuthUser).not.toHaveBeenCalled();
      expect(mockDone).toHaveBeenCalledWith(null, existingUser);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'auth.google.user_found',
        { user: existingUser, isNewUser: false },
      );
    });

    it('2. Novo usuário: cria, entrega ao Passport e emite "auth.google.user_created"', async () => {
      mockUserProvider.findByEmail.mockResolvedValue(null);
      const newUser = {
        id: 'uuid-999',
        name: 'Dyyogo Andrade',
        email: 'dyyogo@gmail.com',
        provider: 'google',
        providerId: 'google-123456',
      };
      mockUserProvider.createOAuthUser.mockResolvedValue(newUser);

      await strategy.validate('access-token', 'refresh-token', mockProfile, mockDone);

      expect(mockUserProvider.createOAuthUser).toHaveBeenCalledWith({
        email: 'dyyogo@gmail.com',
        name: 'Dyyogo Andrade',
        provider: 'google',
        providerId: 'google-123456',
      });
      expect(mockDone).toHaveBeenCalledWith(null, newUser);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'auth.google.user_created',
        { user: newUser, isNewUser: true },
      );
    });
  });
});
