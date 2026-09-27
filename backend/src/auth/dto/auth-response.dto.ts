import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT Bearer Access Token for MyCalendar API',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Authenticated User Details',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}

export class GoogleAuthUrlResponseDto {
  @ApiProperty({
    description: 'Google OAuth Consent Screen URL',
    example: 'https://accounts.google.com/o/oauth2/v2/auth?...',
  })
  url: string;
}
