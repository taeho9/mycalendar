import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsUUID, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { OwnerType } from '@prisma/client';
import { CreateStageDto } from './stage.dto';

export class CreateCategorySubDto {
  @ApiProperty({ description: 'Category Sub Name (e.g. 프로젝트 A1, 월말결산)', example: '프로젝트 A1' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Project Start Date (ISO String). Defaults to 0001-01-01 (No limit) if omitted',
    example: '2026-03-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Project End Date (ISO String). Defaults to 9999-12-31 (No limit) if omitted',
    example: '2026-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Custom Workflow Stages. If omitted, default 3 stages [예정, 진행중, 완료] will be created automatically',
    type: [CreateStageDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStageDto)
  stages?: CreateStageDto[];

  @ApiPropertyOptional({
    description: 'Array of Main Category UUIDs to immediately link this SubCategory to',
    example: ['00000000-0000-0000-0000-000000000001'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  mainCategoryIds?: string[];

  @ApiPropertyOptional({ description: 'Owner Type (USER or TEAM)', enum: OwnerType, default: OwnerType.USER })
  @IsOptional()
  @IsEnum(OwnerType)
  ownerType?: OwnerType;

  @ApiPropertyOptional({ description: 'Team ID if ownerType is TEAM', example: 'a1b2c3d4-...' })
  @IsOptional()
  @IsUUID()
  teamId?: string;
}

export class UpdateCategorySubDto {
  @ApiPropertyOptional({ description: 'Category Sub Name', example: '프로젝트 A1 (스마트 캘린더)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Project Start Date', example: '2026-04-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Project End Date', example: '2027-01-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CategoryMappingDto {
  @ApiProperty({ description: 'Main Category UUID', example: 'c1f7a8b0-...' })
  @IsNotEmpty()
  @IsUUID()
  mainCategoryId: string;

  @ApiProperty({ description: 'Sub Category UUID', example: 'd2e8b9c1-...' })
  @IsNotEmpty()
  @IsUUID()
  subCategoryId: string;
}
