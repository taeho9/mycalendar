import { Controller, Get, Query, Res, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthResponseDto, GoogleAuthUrlResponseDto } from './dto/auth-response.dto';
import { GoogleCallbackDto } from './dto/google-callback.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthenticatedUser } from './interfaces/jwt-payload.interface';
import { UsersService } from '../users/users.service';
import { UserResponseDto } from '../users/dto/user-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Get('google')
  @ApiOperation({
    summary: 'Google OAuth login initiation',
    description: 'Returns the Google OAuth consent screen URL, or redirects directly if redirect=true',
  })
  @ApiQuery({ name: 'redirect', required: false, type: Boolean, description: 'If true, directly redirects browser to Google' })
  @ApiQuery({ name: 'state', required: false, type: String, description: 'Optional state string to pass to Google' })
  @ApiResponse({ status: 200, type: GoogleAuthUrlResponseDto, description: 'Consent screen URL generated' })
  getGoogleAuth(
    @Query('redirect') redirect?: string,
    @Query('state') state?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const { url } = this.authService.getGoogleAuthUrl(state);
    if (redirect === 'true' && res) {
      return res.redirect(HttpStatus.FOUND, url);
    }
    return { url };
  }

  @Get('google/callback')
  @ApiOperation({
    summary: 'Google OAuth callback handler',
    description: 'Exchanges authorization code for user credentials and returns JWT Bearer token',
  })
  @ApiResponse({ status: 200, type: AuthResponseDto, description: 'Login successful' })
  async googleCallback(@Query() query: GoogleCallbackDto): Promise<AuthResponseDto> {
    return this.authService.handleGoogleCallback(query.code);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get currently authenticated user info',
    description: 'Requires valid JWT Bearer token in Authorization header',
  })
  @ApiResponse({ status: 200, type: UserResponseDto, description: 'User profile retrieved successfully' })
  async getMe(@CurrentUser() currentUser: AuthenticatedUser): Promise<UserResponseDto> {
    return this.usersService.findById(currentUser.id);
  }
}
