import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByGoogleSub(googleSub: string) {
    return this.prisma.user.findUnique({
      where: { googleSub },
    });
  }

  async upsertGoogleUser(profile: {
    googleSub: string;
    email: string;
    name: string;
    profileImage?: string;
  }) {
    // 1. First attempt to find user by googleSub or email
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { googleSub: profile.googleSub },
          { email: profile.email },
        ],
      },
    });

    if (existingUser) {
      return this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          googleSub: profile.googleSub,
          name: profile.name || existingUser.name,
          profileImage: profile.profileImage || existingUser.profileImage,
        },
      });
    }

    return this.prisma.user.create({
      data: {
        googleSub: profile.googleSub,
        email: profile.email,
        name: profile.name || profile.email.split('@')[0],
        profileImage: profile.profileImage,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findById(id);
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }
}
