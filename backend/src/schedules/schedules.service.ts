import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto, UpdateScheduleStageDto } from './dto/update-schedule.dto';
import { FilterScheduleDto } from './dto/filter-schedule.dto';
import { ScheduleScope, ScheduleStatus, Prisma } from '@prisma/client';

const DEFAULT_MAIN_CATEGORY_ID = '00000000-0000-0000-0000-000000000001';
const DEFAULT_SUB_CATEGORY_ID = '00000000-0000-0000-0000-000000000002';

const SCHEDULE_INCLUDE = {
  mainCategory: true,
  subCategory: true,
  stage: true,
  attendees: true,
  reminders: true,
};

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new Schedule.
   * Automatically resolves category fallbacks and stage defaulting rules.
   */
  async create(userId: string, dto: CreateScheduleDto) {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (startTime > endTime) {
      throw new BadRequestException('startTime cannot be after endTime');
    }

    const mainCategoryId = dto.mainCategoryId || DEFAULT_MAIN_CATEGORY_ID;
    const subCategoryId = dto.subCategoryId || DEFAULT_SUB_CATEGORY_ID;

    // Automatically resolve Stage if not explicitly provided
    let stageId = dto.stageId;
    if (!stageId && subCategoryId) {
      const defaultStage = await this.prisma.categoryStage.findFirst({
        where: { subCategoryId },
        orderBy: [{ isDefault: 'desc' }, { sequence: 'asc' }],
      });
      if (defaultStage) {
        stageId = defaultStage.id;
      }
    }

    return this.prisma.schedule.create({
      data: {
        creatorId: userId,
        title: dto.title,
        mainCategoryId,
        subCategoryId,
        stageId,
        scopeType: dto.scopeType || ScheduleScope.USER,
        teamId: dto.teamId,
        status: dto.status || ScheduleStatus.PLANNED,
        startTime,
        endTime,
        isAllDay: dto.isAllDay ?? false,
        isTask: dto.isTask ?? false,
        location: dto.location,
        description: dto.description,
        colorId: dto.colorId,
        busyStatus: dto.busyStatus,
        rrule: dto.rrule,
        attendees: dto.attendees
          ? {
              create: dto.attendees.map((a) => ({
                email: a.email,
                displayName: a.displayName,
              })),
            }
          : undefined,
        reminders: dto.reminders
          ? {
              create: dto.reminders.map((r) => ({
                method: r.method,
                minutes: r.minutes,
              })),
            }
          : undefined,
      },
      include: SCHEDULE_INCLUDE,
    });
  }

  /**
   * Retrieves schedules matching filters and date ranges accessible to the user.
   */
  async findAll(userId: string, filter: FilterScheduleDto) {
    const teamIds = await this.getUserTeamIds(userId);
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });

    const where: Prisma.ScheduleWhereInput = {
      OR: [
        { creatorId: userId },
        { scopeType: ScheduleScope.TEAM, teamId: { in: teamIds } },
        ...(user?.email ? [{ attendees: { some: { email: user.email } } }] : []),
      ],
    };

    // Date range overlapping filter:
    // schedule starts before filter's endDate AND ends after filter's startDate
    if (filter.startDate || filter.endDate) {
      const conditions: Prisma.ScheduleWhereInput[] = [];
      if (filter.startDate) {
        conditions.push({ endTime: { gte: new Date(filter.startDate) } });
      }
      if (filter.endDate) {
        conditions.push({ startTime: { lte: new Date(filter.endDate) } });
      }
      where.AND = conditions;
    }

    if (filter.mainCategoryId) where.mainCategoryId = filter.mainCategoryId;
    if (filter.subCategoryId) where.subCategoryId = filter.subCategoryId;
    if (filter.stageId) where.stageId = filter.stageId;
    if (filter.status) where.status = filter.status;
    if (filter.scopeType) where.scopeType = filter.scopeType;
    if (filter.teamId) where.teamId = filter.teamId;

    return this.prisma.schedule.findMany({
      where,
      include: SCHEDULE_INCLUDE,
      orderBy: { startTime: 'asc' },
    });
  }

  /**
   * Retrieves single schedule details.
   */
  async findById(userId: string, id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: SCHEDULE_INCLUDE,
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    await this.verifyAccess(userId, schedule);
    return schedule;
  }

  /**
   * Updates existing schedule.
   */
  async update(userId: string, id: string, dto: UpdateScheduleDto) {
    const schedule = await this.findById(userId, id);

    let startTime = schedule.startTime;
    let endTime = schedule.endTime;

    if (dto.startTime) startTime = new Date(dto.startTime);
    if (dto.endTime) endTime = new Date(dto.endTime);

    if (startTime > endTime) {
      throw new BadRequestException('startTime cannot be after endTime');
    }

    // If subCategory changed and stageId is not specified, resolve new default stage
    let stageId = dto.stageId !== undefined ? dto.stageId : schedule.stageId;
    if (dto.subCategoryId && dto.subCategoryId !== schedule.subCategoryId && dto.stageId === undefined) {
      const defaultStage = await this.prisma.categoryStage.findFirst({
        where: { subCategoryId: dto.subCategoryId },
        orderBy: [{ isDefault: 'desc' }, { sequence: 'asc' }],
      });
      stageId = defaultStage ? defaultStage.id : null;
    }

    return this.prisma.schedule.update({
      where: { id },
      data: {
        title: dto.title,
        mainCategoryId: dto.mainCategoryId,
        subCategoryId: dto.subCategoryId,
        stageId,
        scopeType: dto.scopeType,
        teamId: dto.teamId,
        status: dto.status,
        startTime,
        endTime,
        isAllDay: dto.isAllDay,
        isTask: dto.isTask,
        location: dto.location,
        description: dto.description,
        colorId: dto.colorId,
        busyStatus: dto.busyStatus,
        rrule: dto.rrule,
        version: { increment: 1 },
        // If attendees passed, replace attendees
        ...(dto.attendees
          ? {
              attendees: {
                deleteMany: {},
                create: dto.attendees.map((a) => ({
                  email: a.email,
                  displayName: a.displayName,
                })),
              },
            }
          : {}),
        // If reminders passed, replace reminders
        ...(dto.reminders
          ? {
              reminders: {
                deleteMany: {},
                create: dto.reminders.map((r) => ({
                  method: r.method,
                  minutes: r.minutes,
                })),
              },
            }
          : {}),
      },
      include: SCHEDULE_INCLUDE,
    });
  }

  /**
   * Lightweight Stage Transition API (e.g. Kanban board drag & drop)
   */
  async updateStage(userId: string, id: string, dto: UpdateScheduleStageDto) {
    await this.findById(userId, id);

    return this.prisma.schedule.update({
      where: { id },
      data: {
        stageId: dto.stageId || null,
        version: { increment: 1 },
      },
      include: SCHEDULE_INCLUDE,
    });
  }

  /**
   * Deletes a schedule.
   */
  async delete(userId: string, id: string) {
    const schedule = await this.findById(userId, id);

    // Only creator or team admin/owner can delete
    if (schedule.creatorId !== userId) {
      const hasAdminRights = await this.isTeamAdminOrOwner(userId, schedule.teamId);
      if (!hasAdminRights) {
        throw new ForbiddenException('You do not have permission to delete this schedule');
      }
    }

    return this.prisma.schedule.delete({
      where: { id },
    });
  }

  // ==========================================
  // Private Helper Methods
  // ==========================================

  private async verifyAccess(userId: string, schedule: any) {
    if (schedule.creatorId === userId) return;

    if (schedule.teamId) {
      const isMember = await this.prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: schedule.teamId, userId } },
      });
      if (isMember) return;
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (user?.email && schedule.attendees?.some((a: any) => a.email === user.email)) {
      return;
    }

    throw new ForbiddenException('You do not have permission to access this schedule');
  }

  private async isTeamAdminOrOwner(userId: string, teamId?: string | null): Promise<boolean> {
    if (!teamId) return false;
    const member = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    return member?.role === 'OWNER' || member?.role === 'ADMIN';
  }

  private async getUserTeamIds(userId: string): Promise<string[]> {
    const memberships = await this.prisma.teamMember.findMany({
      where: { userId },
      select: { teamId: true },
    });
    return memberships.map((m) => m.teamId);
  }
}
