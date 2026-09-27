import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { OwnerType } from '@prisma/client';

export class CreateCategoryMainDto {
  @ApiProperty({ description: 'Category Main Name (e.g. 고객사 A, 경리, 업무)', example: '고객사 A' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Category Main Badge Color Hex', example: '#1A73E8', default: '#4285F4' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Owner Type (USER or TEAM)', enum: OwnerType, default: OwnerType.USER })
  @IsOptional()
  @IsEnum(OwnerType)
  ownerType?: OwnerType;

  @ApiPropertyOptional({ description: 'Team ID if ownerType is TEAM', example: 'a1b2c3d4-...' })
  @IsOptional()
  @IsUUID()
  teamId?: string;
}

export class UpdateCategoryMainDto {
  @ApiPropertyOptional({ description: 'Category Main Name', example: '고객사 B' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Category Main Badge Color Hex', example: '#FBBC04' })
  @IsOptional()
  @IsString()
  color?: string;
}
