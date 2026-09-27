import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsUUID, IsEnum } from 'class-validator';
import { ScheduleScope, ScheduleStatus } from '@prisma/client';

export class FilterScheduleDto {
  @ApiPropertyOptional({
    description: 'Filter schedules overlapping from this timestamp (ISO 8601)',
    example: '2026-09-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter schedules overlapping up to this timestamp (ISO 8601)',
    example: '2026-09-30T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by Main Category ID (e.g. 고객사 A)' })
  @IsOptional()
  @IsUUID()
  mainCategoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by Sub Category ID (e.g. 프로젝트 A1)' })
  @IsOptional()
  @IsUUID()
  subCategoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by Workflow Stage ID (e.g. 개발중)' })
  @IsOptional()
  @IsUUID()
  stageId?: string;

  @ApiPropertyOptional({ description: 'Filter by Team ID' })
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @ApiPropertyOptional({ enum: ScheduleStatus, description: 'PLANNED or COMPLETED' })
  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;

  @ApiPropertyOptional({ enum: ScheduleScope, description: 'USER or TEAM' })
  @IsOptional()
  @IsEnum(ScheduleScope)
  scopeType?: ScheduleScope;
}
