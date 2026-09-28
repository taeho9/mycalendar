import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GoogleService } from './google.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { encryptToken } from '../common/utils/crypto.util';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly googleService: GoogleService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generates Google OAuth Consent URL
   */
  getGoogleAuthUrl(state?: string): { url: string } {
    return { url: this.googleService.getAuthUrl(state) };
  }

  /**
   * Handles Google OAuth callback:
   * 1. Exchanges code for tokens
   * 2. Fetches user profile
   * 3. Upserts User in DB
   * 4. Encrypts and stores Google OAuth tokens in GoogleSyncAccount
   * 5. Issues application JWT Bearer Token
   */
  async handleGoogleCallback(code: string): Promise<AuthResponseDto> {
    const tokens = await this.googleService.getTokens(code);
    const profile = await this.googleService.getUserProfile(tokens.accessToken);

    // 1. Upsert User
    const user = await this.usersService.upsertGoogleUser({
      googleSub: profile.id,
      email: profile.email,
      name: profile.name,
      profileImage: profile.picture,
    });

    // 2. Encrypt & Store Google Sync Account credentials
    const secretKey =
      this.configService.get<string>('ENCRYPTION_KEY') ||
      this.configService.get<string>('JWT_SECRET') ||
      'fallback-secret-key-32-chars-long!';

    const accessTokenEnc = encryptToken(tokens.accessToken, secretKey);
    const refreshTokenEnc = tokens.refreshToken
      ? encryptToken(tokens.refreshToken, secretKey)
      : undefined;

    const existingAccount = await this.prisma.googleSyncAccount.findFirst({
      where: {
        userId: user.id,
        googleEmail: profile.email,
      },
    });

    if (existingAccount) {
      await this.prisma.googleSyncAccount.update({
        where: { id: existingAccount.id },
        data: {
          accessTokenEnc,
          ...(refreshTokenEnc ? { refreshTokenEnc } : {}),
        },
      });
    } else {
      await this.prisma.googleSyncAccount.create({
        data: {
          userId: user.id,
          googleEmail: profile.email,
          accessTokenEnc,
          refreshTokenEnc,
        },
      });
    }

    // 3. Issue Application JWT
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`User ${user.email} (${user.id}) logged in successfully via Google OAuth`);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}
