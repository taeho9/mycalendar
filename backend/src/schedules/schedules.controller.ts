import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto, UpdateScheduleStageDto } from './dto/update-schedule.dto';
import { FilterScheduleDto } from './dto/filter-schedule.dto';
import { ScheduleResponseDto } from './dto/schedule-response.dto';

@ApiTags('Schedules')
@Controller('schedules')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new schedule',
    description:
      'Creates a schedule linked to categories and stage. If category/stage is omitted, auto-assigns default [미분류] and default workflow stage.',
  })
  @ApiResponse({ status: 201, type: ScheduleResponseDto })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateScheduleDto,
  ): Promise<ScheduleResponseDto> {
    return this.schedulesService.create(user.id, dto) as any;
  }

  @Get()
  @ApiOperation({
    summary: 'List and filter schedules',
    description: 'Supports date range overlapping (startDate/endDate), category filters, and workflow stage filters',
  })
  @ApiResponse({ status: 200, type: [ScheduleResponseDto] })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filter: FilterScheduleDto,
  ): Promise<ScheduleResponseDto[]> {
    return this.schedulesService.findAll(user.id, filter) as any;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get schedule details by ID' })
  @ApiResponse({ status: 200, type: ScheduleResponseDto })
  async findById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ScheduleResponseDto> {
    return this.schedulesService.findById(user.id, id) as any;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update schedule details' })
  @ApiResponse({ status: 200, type: ScheduleResponseDto })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScheduleDto,
  ): Promise<ScheduleResponseDto> {
    return this.schedulesService.update(user.id, id, dto) as any;
  }

  @Patch(':id/stage')
  @ApiOperation({
    summary: 'Transition schedule workflow stage (Kanban drag-and-drop)',
    description: 'Lightweight endpoint to move schedule across stages (e.g. 기획중 -> 개발중 -> 시험중 -> 배포중 -> 완료)',
  })
  @ApiResponse({ status: 200, type: ScheduleResponseDto })
  async updateStage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScheduleStageDto,
  ): Promise<ScheduleResponseDto> {
    return this.schedulesService.updateStage(user.id, id, dto) as any;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a schedule' })
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.schedulesService.delete(user.id, id);
  }
}
