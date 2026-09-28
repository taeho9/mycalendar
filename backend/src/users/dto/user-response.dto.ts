import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: 'User Unique ID (UUID)', example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiProperty({ description: 'User Email Address', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'User Display Name', example: '홍길동' })
  name: string;

  @ApiPropertyOptional({ description: 'Google Profile Image URL', example: 'https://lh3.googleusercontent.com/...' })
  profileImage?: string | null;

  @ApiProperty({ description: 'Account Created Timestamp', example: '2026-09-27T05:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Account Last Updated Timestamp', example: '2026-09-27T05:00:00.000Z' })
  updatedAt: Date;
}
