import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return user if found', async () => {
      const mockUser = { id: 'uuid-1', email: 'test@example.com', name: 'Test' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('uuid-1');
      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('upsertGoogleUser', () => {
    it('should update user if already exists', async () => {
      const existing = { id: 'uuid-1', email: 'test@example.com', name: 'Old' };
      mockPrisma.user.findFirst.mockResolvedValue(existing);
      mockPrisma.user.update.mockResolvedValue({ ...existing, name: 'New' });

      const result = await service.upsertGoogleUser({
        googleSub: 'g-123',
        email: 'test@example.com',
        name: 'New',
      });

      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(result.name).toBe('New');
    });

    it('should create new user if not exists', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'uuid-2',
        email: 'new@example.com',
        name: 'New User',
      });

      const result = await service.upsertGoogleUser({
        googleSub: 'g-999',
        email: 'new@example.com',
        name: 'New User',
      });

      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(result.id).toBe('uuid-2');
    });
  });
});
