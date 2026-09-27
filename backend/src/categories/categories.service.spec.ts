import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';
import { OwnerType } from '@prisma/client';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: PrismaService;

  const mockPrisma = {
    categoryMain: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    categorySub: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    categoryStage: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    categoryHierarchyMapping: {
      create: jest.fn(),
      createMany: jest.fn(),
      delete: jest.fn(),
    },
    teamMember: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createMain', () => {
    it('should create a main category with USER owner by default', async () => {
      const mockResult = { id: 'm-1', name: '고객사 A', color: '#1A73E8', ownerType: OwnerType.USER, ownerId: 'u-1' };
      mockPrisma.categoryMain.create.mockResolvedValue(mockResult);

      const result = await service.createMain('u-1', { name: '고객사 A', color: '#1A73E8' });
      expect(result).toEqual(mockResult);
      expect(mockPrisma.categoryMain.create).toHaveBeenCalledWith({
        data: {
          name: '고객사 A',
          color: '#1A73E8',
          ownerType: OwnerType.USER,
          ownerId: 'u-1',
        },
      });
    });
  });

  describe('createSub', () => {
    it('should automatically attach default 3 stages if stages are omitted', async () => {
      const mockSub = {
        id: 's-1',
        name: '월말결산',
        ownerType: OwnerType.USER,
        ownerId: 'u-1',
        stages: [
          { id: 'st-1', name: '예정', sequence: 1 },
          { id: 'st-2', name: '진행중', sequence: 2 },
          { id: 'st-3', name: '완료', sequence: 3 },
        ],
      };
      mockPrisma.categorySub.create.mockResolvedValue(mockSub);

      const result = await service.createSub('u-1', { name: '월말결산' });
      expect(result).toEqual(mockSub);
      expect(mockPrisma.categorySub.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: '월말결산',
            stages: {
              create: expect.arrayContaining([
                expect.objectContaining({ name: '예정' }),
                expect.objectContaining({ name: '진행중' }),
                expect.objectContaining({ name: '완료' }),
              ]),
            },
          }),
        }),
      );
    });

    it('should attach custom workflow stages if provided', async () => {
      const customStages = [
        { name: '기획중', sequence: 1 },
        { name: '개발중', sequence: 2 },
        { name: '완료', sequence: 3 },
      ];
      mockPrisma.categorySub.create.mockResolvedValue({ id: 's-2', name: '프로젝트 A1' });

      await service.createSub('u-1', {
        name: '프로젝트 A1',
        startDate: '2026-03-01T00:00:00.000Z',
        endDate: '2026-12-31T23:59:59.000Z',
        stages: customStages,
      });

      expect(mockPrisma.categorySub.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: '프로젝트 A1',
            startDate: new Date('2026-03-01T00:00:00.000Z'),
            endDate: new Date('2026-12-31T23:59:59.000Z'),
            stages: {
              create: expect.arrayContaining([
                expect.objectContaining({ name: '기획중' }),
                expect.objectContaining({ name: '개발중' }),
              ]),
            },
          }),
        }),
      );
    });
  });

  describe('getCategoryTree', () => {
    it('should structure categories into a 2-level hierarchy with stages', async () => {
      const mockMainCategories = [
        {
          id: 'm-1',
          name: '고객사 A',
          color: '#1A73E8',
          ownerType: OwnerType.USER,
          ownerId: 'u-1',
          isDefault: false,
          createdAt: new Date(),
          subMappings: [
            {
              subCategory: {
                id: 's-1',
                name: '프로젝트 A1',
                startDate: new Date('2026-03-01'),
                endDate: new Date('2026-12-31'),
                ownerType: OwnerType.USER,
                ownerId: 'u-1',
                isDefault: false,
                createdAt: new Date(),
                stages: [
                  { id: 'st-1', name: '기획중', sequence: 1 },
                  { id: 'st-2', name: '개발중', sequence: 2 },
                ],
              },
            },
          ],
        },
      ];

      mockPrisma.categoryMain.findMany.mockResolvedValue(mockMainCategories);

      const tree = await service.getCategoryTree('u-1');
      expect(tree).toHaveLength(1);
      expect(tree[0].name).toBe('고객사 A');
      expect(tree[0].subCategories).toHaveLength(1);
      expect(tree[0].subCategories[0].name).toBe('프로젝트 A1');
      expect(tree[0].subCategories[0].stages).toHaveLength(2);
    });
  });
});
