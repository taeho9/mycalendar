import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OwnerType } from '@prisma/client';

export class StageResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-...' })
  id: string;

  @ApiProperty({ example: 'd2e8b9c1-...' })
  subCategoryId: string;

  @ApiProperty({ example: '개발중' })
  name: string;

  @ApiProperty({ example: 1 })
  sequence: number;

  @ApiPropertyOptional({ example: '#3B82F6' })
  color?: string | null;

  @ApiProperty({ example: false })
  isDefault: boolean;

  @ApiProperty({ example: '2026-09-27T00:00:00.000Z' })
  createdAt: Date;
}

export class CategorySubResponseDto {
  @ApiProperty({ example: 'd2e8b9c1-...' })
  id: string;

  @ApiProperty({ enum: OwnerType, example: OwnerType.USER })
  ownerType: OwnerType;

  @ApiProperty({ example: 'u1v2w3x4-...' })
  ownerId: string;

  @ApiProperty({ example: '프로젝트 A1' })
  name: string;

  @ApiProperty({ example: '2026-03-01T00:00:00.000Z' })
  startDate: Date;

  @ApiProperty({ example: '2026-12-31T23:59:59.000Z' })
  endDate: Date;

  @ApiProperty({ example: false })
  isDefault: boolean;

  @ApiProperty({ example: '2026-09-27T00:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ type: [StageResponseDto] })
  stages?: StageResponseDto[];
}

export class CategoryMainResponseDto {
  @ApiProperty({ example: 'c1f7a8b0-...' })
  id: string;

  @ApiProperty({ enum: OwnerType, example: OwnerType.USER })
  ownerType: OwnerType;

  @ApiProperty({ example: 'u1v2w3x4-...' })
  ownerId: string;

  @ApiProperty({ example: '고객사 A' })
  name: string;

  @ApiPropertyOptional({ example: '#1A73E8' })
  color?: string | null;

  @ApiProperty({ example: false })
  isDefault: boolean;

  @ApiProperty({ example: '2026-09-27T00:00:00.000Z' })
  createdAt: Date;
}

export class CategoryTreeItemDto extends CategoryMainResponseDto {
  @ApiProperty({
    description: 'Sub categories mapped to this main category, including their stages',
    type: [CategorySubResponseDto],
  })
  subCategories: CategorySubResponseDto[];
}
