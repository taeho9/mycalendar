import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'User Display Name', example: '홍길동' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'User Profile Image URL', example: 'https://...' })
  @IsOptional()
  @IsString()
  profileImage?: string;
}
