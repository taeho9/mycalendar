import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OwnerType } from '@prisma/client';
import { CreateCategoryMainDto, UpdateCategoryMainDto } from './dto/category-main.dto';
import { CreateCategorySubDto, UpdateCategorySubDto } from './dto/category-sub.dto';
import { CreateStageDto, UpdateStageDto, ReorderStagesDto } from './dto/stage.dto';

const DEFAULT_STAGES = [
  { name: '예정', sequence: 1, isDefault: true, color: '#6B7280' },
  { name: '진행중', sequence: 2, isDefault: false, color: '#3B82F6' },
  { name: '완료', sequence: 3, isDefault: false, color: '#10B981' },
];

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // 1. Category Main (대분류) CRUD
  // ==========================================

  async createMain(userId: string, dto: CreateCategoryMainDto) {
    const ownerType = dto.ownerType || OwnerType.USER;
    const ownerId = ownerType === OwnerType.TEAM ? (dto.teamId as string) : userId;

    if (ownerType === OwnerType.TEAM && !dto.teamId) {
      throw new BadRequestException('teamId is required when ownerType is TEAM');
    }

    return this.prisma.categoryMain.create({
      data: {
        name: dto.name,
        color: dto.color || '#4285F4',
        ownerType,
        ownerId,
      },
    });
  }

  async findAllMain(userId: string) {
    // Finds user's personal main categories, team categories, and global default '미분류'
    return this.prisma.categoryMain.findMany({
      where: {
        OR: [
          { ownerType: OwnerType.USER, ownerId: userId },
          { isDefault: true },
          {
            ownerType: OwnerType.TEAM,
            ownerId: {
              in: await this.getUserTeamIds(userId),
            },
          },
        ],
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async findMainById(id: string) {
    const main = await this.prisma.categoryMain.findUnique({
      where: { id },
      include: {
        subMappings: {
          include: {
            subCategory: {
              include: { stages: { orderBy: { sequence: 'asc' } } },
            },
          },
        },
      },
    });
    if (!main) {
      throw new NotFoundException(`Main category with ID ${id} not found`);
    }
    return main;
  }

  async updateMain(id: string, dto: UpdateCategoryMainDto) {
    await this.findMainById(id);
    return this.prisma.categoryMain.update({
      where: { id },
      data: dto,
    });
  }

  async deleteMain(id: string) {
    const main = await this.findMainById(id);
    if (main.isDefault) {
      throw new BadRequestException('Default uncategorized category cannot be deleted.');
    }
    return this.prisma.categoryMain.delete({
      where: { id },
    });
  }

  // ==========================================
  // 2. Category Sub (소분류) & Stages CRUD
  // ==========================================

  async createSub(userId: string, dto: CreateCategorySubDto) {
    const ownerType = dto.ownerType || OwnerType.USER;
    const ownerId = ownerType === OwnerType.TEAM ? (dto.teamId as string) : userId;

    if (ownerType === OwnerType.TEAM && !dto.teamId) {
      throw new BadRequestException('teamId is required when ownerType is TEAM');
    }

    // Prepare stages: custom or default 3 stages
    const stageDefs =
      dto.stages && dto.stages.length > 0
        ? dto.stages.map((s, idx) => ({
            name: s.name,
            sequence: s.sequence ?? idx + 1,
            color: s.color || '#3B82F6',
            isDefault: s.isDefault ?? idx === 0,
          }))
        : DEFAULT_STAGES;

    const sub = await this.prisma.categorySub.create({
      data: {
        name: dto.name,
        ownerType,
        ownerId,
        ...(dto.startDate ? { startDate: new Date(dto.startDate) } : {}),
        ...(dto.endDate ? { endDate: new Date(dto.endDate) } : {}),
        stages: {
          create: stageDefs,
        },
      },
      include: {
        stages: { orderBy: { sequence: 'asc' } },
      },
    });

    // Optionally map to main categories immediately
    if (dto.mainCategoryIds && dto.mainCategoryIds.length > 0) {
      await this.prisma.categoryHierarchyMapping.createMany({
        data: dto.mainCategoryIds.map((mainId) => ({
          mainCategoryId: mainId,
          subCategoryId: sub.id,
        })),
        skipDuplicates: true,
      });
    }

    return sub;
  }

  async findAllSub(userId: string) {
    return this.prisma.categorySub.findMany({
      where: {
        OR: [
          { ownerType: OwnerType.USER, ownerId: userId },
          { isDefault: true },
          {
            ownerType: OwnerType.TEAM,
            ownerId: { in: await this.getUserTeamIds(userId) },
          },
        ],
      },
      include: {
        stages: { orderBy: { sequence: 'asc' } },
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async findSubById(id: string) {
    const sub = await this.prisma.categorySub.findUnique({
      where: { id },
      include: {
        stages: { orderBy: { sequence: 'asc' } },
        mainMappings: { include: { mainCategory: true } },
      },
    });
    if (!sub) {
      throw new NotFoundException(`Sub category with ID ${id} not found`);
    }
    return sub;
  }

  async updateSub(id: string, dto: UpdateCategorySubDto) {
    await this.findSubById(id);
    return this.prisma.categorySub.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.startDate ? { startDate: new Date(dto.startDate) } : {}),
        ...(dto.endDate ? { endDate: new Date(dto.endDate) } : {}),
      },
      include: {
        stages: { orderBy: { sequence: 'asc' } },
      },
    });
  }

  async deleteSub(id: string) {
    const sub = await this.findSubById(id);
    if (sub.isDefault) {
      throw new BadRequestException('Default uncategorized sub-category cannot be deleted.');
    }
    return this.prisma.categorySub.delete({
      where: { id },
    });
  }

  // ==========================================
  // 3. Workflow Stages Management
  // ==========================================

  async addStage(subCategoryId: string, dto: CreateStageDto) {
    await this.findSubById(subCategoryId);
    return this.prisma.categoryStage.create({
      data: {
        subCategoryId,
        name: dto.name,
        sequence: dto.sequence ?? 1,
        color: dto.color || '#3B82F6',
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async updateStage(stageId: string, dto: UpdateStageDto) {
    const stage = await this.prisma.categoryStage.findUnique({ where: { id: stageId } });
    if (!stage) {
      throw new NotFoundException(`Stage with ID ${stageId} not found`);
    }
    return this.prisma.categoryStage.update({
      where: { id: stageId },
      data: dto,
    });
  }

  async deleteStage(stageId: string) {
    const stage = await this.prisma.categoryStage.findUnique({ where: { id: stageId } });
    if (!stage) {
      throw new NotFoundException(`Stage with ID ${stageId} not found`);
    }
    return this.prisma.categoryStage.delete({ where: { id: stageId } });
  }

  async reorderStages(subCategoryId: string, dto: ReorderStagesDto) {
    await this.findSubById(subCategoryId);
    return this.prisma.$transaction(
      dto.stages.map((item) =>
        this.prisma.categoryStage.update({
          where: { id: item.id },
          data: { sequence: item.sequence },
        }),
      ),
    );
  }

  // ==========================================
  // 4. M:N Hierarchy Mapping & Tree View
  // ==========================================

  async createMapping(mainCategoryId: string, subCategoryId: string) {
    try {
      return await this.prisma.categoryHierarchyMapping.create({
        data: {
          mainCategoryId,
          subCategoryId,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('This category mapping already exists.');
      }
      throw error;
    }
  }

  async deleteMapping(mainCategoryId: string, subCategoryId: string) {
    return this.prisma.categoryHierarchyMapping.delete({
      where: {
        mainCategoryId_subCategoryId: {
          mainCategoryId,
          subCategoryId,
        },
      },
    });
  }

  /**
   * Retrieves the full 2-level hierarchical category tree (Main -> Sub -> Stages)
   * Designed for the calendar application sidebar and schedule filters.
   */
  async getCategoryTree(userId: string) {
    const teamIds = await this.getUserTeamIds(userId);

    const mainCategories = await this.prisma.categoryMain.findMany({
      where: {
        OR: [
          { ownerType: OwnerType.USER, ownerId: userId },
          { isDefault: true },
          { ownerType: OwnerType.TEAM, ownerId: { in: teamIds } },
        ],
      },
      include: {
        subMappings: {
          include: {
            subCategory: {
              include: {
                stages: {
                  orderBy: { sequence: 'asc' },
                },
              },
            },
          },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return mainCategories.map((main) => ({
      id: main.id,
      name: main.name,
      color: main.color,
      ownerType: main.ownerType,
      ownerId: main.ownerId,
      isDefault: main.isDefault,
      createdAt: main.createdAt,
      subCategories: main.subMappings.map((mapping) => ({
        id: mapping.subCategory.id,
        name: mapping.subCategory.name,
        startDate: mapping.subCategory.startDate,
        endDate: mapping.subCategory.endDate,
        ownerType: mapping.subCategory.ownerType,
        ownerId: mapping.subCategory.ownerId,
        isDefault: mapping.subCategory.isDefault,
        createdAt: mapping.subCategory.createdAt,
        stages: mapping.subCategory.stages,
      })),
    }));
  }

  private async getUserTeamIds(userId: string): Promise<string[]> {
    const memberships = await this.prisma.teamMember.findMany({
      where: { userId },
      select: { teamId: true },
    });
    return memberships.map((m) => m.teamId);
  }
}
