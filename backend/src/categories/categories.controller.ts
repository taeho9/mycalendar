import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { CreateCategoryMainDto, UpdateCategoryMainDto } from './dto/category-main.dto';
import { CreateCategorySubDto, UpdateCategorySubDto, CategoryMappingDto } from './dto/category-sub.dto';
import { CreateStageDto, UpdateStageDto, ReorderStagesDto } from './dto/stage.dto';
import {
  CategoryMainResponseDto,
  CategorySubResponseDto,
  StageResponseDto,
  CategoryTreeItemDto,
} from './dto/category-response.dto';

@ApiTags('Categories')
@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // ==========================================
  // Tree View (Main -> Sub -> Stages)
  // ==========================================

  @Get('tree')
  @ApiOperation({
    summary: 'Get 2-level category tree with stages',
    description: 'Retrieves hierarchical tree (Main Category -> Sub Categories -> Stages) for sidebar and filters',
  })
  @ApiResponse({ status: 200, type: [CategoryTreeItemDto] })
  async getCategoryTree(@CurrentUser() user: AuthenticatedUser): Promise<CategoryTreeItemDto[]> {
    return this.categoriesService.getCategoryTree(user.id) as any;
  }

  // ==========================================
  // Category Main (대분류) Endpoints
  // ==========================================

  @Post('main')
  @ApiOperation({ summary: 'Create Main Category (e.g. 고객사 A, 경리)' })
  @ApiResponse({ status: 201, type: CategoryMainResponseDto })
  async createMain(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCategoryMainDto,
  ): Promise<CategoryMainResponseDto> {
    return this.categoriesService.createMain(user.id, dto) as any;
  }

  @Get('main')
  @ApiOperation({ summary: 'List all Main Categories accessible to user' })
  @ApiResponse({ status: 200, type: [CategoryMainResponseDto] })
  async findAllMain(@CurrentUser() user: AuthenticatedUser): Promise<CategoryMainResponseDto[]> {
    return this.categoriesService.findAllMain(user.id) as any;
  }

  @Get('main/:id')
  @ApiOperation({ summary: 'Get Main Category details by ID' })
  @ApiResponse({ status: 200, type: CategoryMainResponseDto })
  async findMainById(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findMainById(id);
  }

  @Patch('main/:id')
  @ApiOperation({ summary: 'Update Main Category' })
  @ApiResponse({ status: 200, type: CategoryMainResponseDto })
  async updateMain(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryMainDto,
  ): Promise<CategoryMainResponseDto> {
    return this.categoriesService.updateMain(id, dto) as any;
  }

  @Delete('main/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete Main Category' })
  async deleteMain(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.categoriesService.deleteMain(id);
  }

  // ==========================================
  // Category Sub (소분류) Endpoints
  // ==========================================

  @Post('sub')
  @ApiOperation({
    summary: 'Create Sub Category (e.g. 프로젝트 A1, 월말결산)',
    description: 'Supports project start/end dates (default 0001~9999) and custom or default 3 workflow stages',
  })
  @ApiResponse({ status: 201, type: CategorySubResponseDto })
  async createSub(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCategorySubDto,
  ): Promise<CategorySubResponseDto> {
    return this.categoriesService.createSub(user.id, dto) as any;
  }

  @Get('sub')
  @ApiOperation({ summary: 'List all Sub Categories with their workflow stages' })
  @ApiResponse({ status: 200, type: [CategorySubResponseDto] })
  async findAllSub(@CurrentUser() user: AuthenticatedUser): Promise<CategorySubResponseDto[]> {
    return this.categoriesService.findAllSub(user.id) as any;
  }

  @Get('sub/:id')
  @ApiOperation({ summary: 'Get Sub Category details by ID' })
  @ApiResponse({ status: 200, type: CategorySubResponseDto })
  async findSubById(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findSubById(id);
  }

  @Patch('sub/:id')
  @ApiOperation({ summary: 'Update Sub Category (name, project start/end dates)' })
  @ApiResponse({ status: 200, type: CategorySubResponseDto })
  async updateSub(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategorySubDto,
  ): Promise<CategorySubResponseDto> {
    return this.categoriesService.updateSub(id, dto) as any;
  }

  @Delete('sub/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete Sub Category' })
  async deleteSub(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.categoriesService.deleteSub(id);
  }

  // ==========================================
  // Workflow Stages Endpoints
  // ==========================================

  @Post('sub/:id/stages')
  @ApiOperation({ summary: 'Add a new workflow stage to a Sub Category' })
  @ApiResponse({ status: 201, type: StageResponseDto })
  async addStage(
    @Param('id', ParseUUIDPipe) subCategoryId: string,
    @Body() dto: CreateStageDto,
  ): Promise<StageResponseDto> {
    return this.categoriesService.addStage(subCategoryId, dto) as any;
  }

  @Patch('stages/:stageId')
  @ApiOperation({ summary: 'Update workflow stage' })
  @ApiResponse({ status: 200, type: StageResponseDto })
  async updateStage(
    @Param('stageId', ParseUUIDPipe) stageId: string,
    @Body() dto: UpdateStageDto,
  ): Promise<StageResponseDto> {
    return this.categoriesService.updateStage(stageId, dto) as any;
  }

  @Delete('stages/:stageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete workflow stage' })
  async deleteStage(@Param('stageId', ParseUUIDPipe) stageId: string): Promise<void> {
    await this.categoriesService.deleteStage(stageId);
  }

  @Put('sub/:id/stages/reorder')
  @ApiOperation({ summary: 'Reorder workflow stages of a Sub Category' })
  async reorderStages(
    @Param('id', ParseUUIDPipe) subCategoryId: string,
    @Body() dto: ReorderStagesDto,
  ) {
    return this.categoriesService.reorderStages(subCategoryId, dto);
  }

  // ==========================================
  // M:N Hierarchy Mapping Endpoints
  // ==========================================

  @Post('mappings')
  @ApiOperation({ summary: 'Link Main Category and Sub Category (M:N)' })
  async createMapping(@Body() dto: CategoryMappingDto) {
    return this.categoriesService.createMapping(dto.mainCategoryId, dto.subCategoryId);
  }

  @Delete('mappings')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unlink Main Category and Sub Category' })
  async deleteMapping(@Body() dto: CategoryMappingDto): Promise<void> {
    await this.categoriesService.deleteMapping(dto.mainCategoryId, dto.subCategoryId);
  }
}
