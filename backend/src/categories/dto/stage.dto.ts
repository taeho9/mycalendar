import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt, IsBoolean, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStageDto {
  @ApiProperty({ description: 'Stage Name (e.g. 기획중, 개발중, 완료)', example: '기획중' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Display sequence order (1, 2, 3...)', example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  sequence?: number;

  @ApiPropertyOptional({ description: 'Stage Badge Color Hex', example: '#3B82F6' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Whether this stage is selected by default for new schedules', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateStageDto {
  @ApiPropertyOptional({ description: 'Stage Name', example: '개발완료' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Display sequence order', example: 2 })
  @IsOptional()
  @IsInt()
  sequence?: number;

  @ApiPropertyOptional({ description: 'Stage Badge Color Hex', example: '#10B981' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Whether this stage is selected by default' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class StageOrderDto {
  @ApiProperty({ description: 'Stage UUID', example: 'c1f7a8b0-...' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'New sequence order', example: 1 })
  @IsInt()
  sequence: number;
}

export class ReorderStagesDto {
  @ApiProperty({ description: 'Array of stage IDs and their new sequence', type: [StageOrderDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StageOrderDto)
  stages: StageOrderDto[];
}
