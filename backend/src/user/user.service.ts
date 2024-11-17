import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  async getUser(data: { id: string }) {
    return await this.prismaService.user.findUnique({
      where: {
        id: data.id,
      },
    });
  }

  async createUser(data: { id: string; name: string; username: string }) {
    await this.prismaService.user.create({
      data: {
        id: data.id,
        name: data.name,
        username: data.username,
      },
    });
  }

  async updateUser(data: {
    id: string;
    name?: string;
    username?: string;
    score?: number;
    walletAddress?: string;
  }) {
    let payload: Prisma.UserUpdateInput = {
      name: data.name,
      username: data.username,
      walletAddress: data.walletAddress,
    };

    if (data.score) {
      payload = {
        ...payload,
        score: {
          increment: data.score,
        },
      };
    }

    await this.prismaService.user.update({
      data: {
        ...payload,
      },
      where: {
        id: data.id,
      },
    });
  }

  constructor(private readonly prismaService: PrismaService) {}
}
