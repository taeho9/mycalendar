import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GoogleCallbackDto {
  @ApiProperty({
    description: 'Authorization code returned from Google OAuth',
    example: '4/0AbUR2VO...',
  })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiPropertyOptional({
    description: 'Optional state parameter sent during OAuth initiation',
    example: 'xyz123',
  })
  @IsOptional()
  @IsString()
  state?: string;
}
