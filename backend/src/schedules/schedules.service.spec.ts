import { Test, TestingModule } from '@nestjs/testing';
import { SchedulesService } from './schedules.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { ScheduleScope, ScheduleStatus } from '@prisma/client';

describe('SchedulesService', () => {
  let service: SchedulesService;
  let prisma: PrismaService;

  const mockPrisma = {
    schedule: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    categoryStage: {
      findFirst: jest.fn(),
    },
    teamMember: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: 'u-1', email: 'test@example.com' }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<SchedulesService>(SchedulesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw BadRequestException if startTime is after endTime', async () => {
      await expect(
        service.create('u-1', {
          title: '잘못된 시간 일정',
          startTime: '2026-09-28T18:00:00.000Z',
          endTime: '2026-09-28T09:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should automatically assign default stage if stageId is omitted', async () => {
      const mockDefaultStage = { id: 'st-default-1', name: '예정', isDefault: true, sequence: 1 };
      mockPrisma.categoryStage.findFirst.mockResolvedValue(mockDefaultStage);

      const mockCreated = {
        id: 'sch-1',
        title: '신규 일정',
        stageId: 'st-default-1',
      };
      mockPrisma.schedule.create.mockResolvedValue(mockCreated);

      const result = await service.create('u-1', {
        title: '신규 일정',
        startTime: '2026-09-28T09:00:00.000Z',
        endTime: '2026-09-28T18:00:00.000Z',
        subCategoryId: 'sub-project-a',
      });

      expect(mockPrisma.categoryStage.findFirst).toHaveBeenCalledWith({
        where: { subCategoryId: 'sub-project-a' },
        orderBy: [{ isDefault: 'desc' }, { sequence: 'asc' }],
      });
      expect(mockPrisma.schedule.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stageId: 'st-default-1',
            creatorId: 'u-1',
          }),
        }),
      );
      expect(result.id).toBe('sch-1');
    });
  });

  describe('updateStage', () => {
    it('should transition schedule workflow stage and increment version', async () => {
      const existingSchedule = {
        id: 'sch-1',
        creatorId: 'u-1',
        stageId: 'st-1',
      };
      mockPrisma.schedule.findUnique.mockResolvedValue(existingSchedule);
      mockPrisma.schedule.update.mockResolvedValue({ ...existingSchedule, stageId: 'st-2', version: 2 });

      const updated = await service.updateStage('u-1', 'sch-1', { stageId: 'st-2' });

      expect(mockPrisma.schedule.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sch-1' },
          data: expect.objectContaining({
            stageId: 'st-2',
            version: { increment: 1 },
          }),
        }),
      );
      expect(updated.stageId).toBe('st-2');
    });
  });
});
