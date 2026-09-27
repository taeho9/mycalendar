import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

export interface GoogleUserProfile {
  id: string; // google sub
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number;
}

@Injectable()
export class GoogleService {
  private readonly oauth2Client;

  constructor(private readonly configService: ConfigService) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri =
      this.configService.get<string>('GOOGLE_CALLBACK_URL') ||
      this.configService.get<string>('GOOGLE_REDIRECT_URI') ||
      'http://localhost:3000/api/v1/auth/google/callback';

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  /**
   * Generates Google OAuth Consent Screen URL.
   */
  getAuthUrl(state?: string): string {
    const scopes = [
      'openid',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/calendar',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state,
    });
  }

  /**
   * Exchanges authorization code for access & refresh tokens.
   */
  async getTokens(code: string): Promise<GoogleTokens> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return {
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token || undefined,
        expiryDate: tokens.expiry_date || undefined,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to exchange Google authorization code: ${error.message}`,
      );
    }
  }

  /**
   * Fetches user profile information using the access token.
   */
  async getUserProfile(accessToken: string): Promise<GoogleUserProfile> {
    try {
      const client = new google.auth.OAuth2();
      client.setCredentials({ access_token: accessToken });

      const oauth2 = google.oauth2({ version: 'v2', auth: client });
      const { data } = await oauth2.userinfo.get();

      if (!data.id || !data.email) {
        throw new InternalServerErrorException('Google user profile is missing id or email');
      }

      return {
        id: data.id,
        email: data.email,
        name: data.name || data.email.split('@')[0],
        picture: data.picture || undefined,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to fetch Google user profile: ${error.message}`,
      );
    }
  }
}
